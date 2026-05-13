require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const ffprobeStatic = require('ffprobe-static');

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Set up storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'));
  }
});
const upload = multer({ storage });

// Helper: Get media duration
const getDuration = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration);
    });
  });
};

const jobs = {};

async function processVideoBackground(req, jobId) {
  const bgFile = req.files['bgVideo'][0];
  const audioFile = req.files['audioVideo'][0];
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);
  
  const outputFilename = `final-${Date.now()}.mp4`;
  const outputPath = path.join(outputDir, outputFilename);
  const tempWavPath = path.join(outputDir, `temp-audio-${Date.now()}.wav`);

  const speed = req.body.speed ? parseFloat(req.body.speed) : 1.2;

  try {
    jobs[jobId].progress = 5;
    console.log(`[Job ${jobId}] Processing started...`);

    // 1. Extract and speed up audio
    await new Promise((resolve, reject) => {
      ffmpeg(audioFile.path)
        .noVideo()
        .audioFilters(`atempo=${speed}`)
        .audioFrequency(16000)
        .audioChannels(1)
        .toFormat('wav')
        .save(tempWavPath)
        .on('end', resolve)
        .on('error', reject);
    });

    jobs[jobId].progress = 15;
    const audioDuration = await getDuration(tempWavPath);
    console.log(`[Job ${jobId}] Audio duration: ${audioDuration} seconds`);

    // 2. Generate exact subtitles using Local AI Whisper (No API Key needed)
    const dummySrtPath = path.join(__dirname, `dummy-${jobId}.srt`);
    
    const { pipeline } = require('@xenova/transformers');
    const { WaveFile } = require('wavefile');

    jobs[jobId].progress = 20;
    console.log(`[Job ${jobId}] Loading local Whisper AI model...`);
    const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
    
    jobs[jobId].progress = 30;
    console.log(`[Job ${jobId}] Reading audio file for AI transcription...`);
    const buffer = fs.readFileSync(tempWavPath);
    const wav = new WaveFile(buffer);
    wav.toBitDepth('32f');
    const audioData = wav.getSamples(false, Float32Array);
    
    jobs[jobId].progress = 40;
    console.log(`[Job ${jobId}] Generating exact subtitles locally...`);
    const output = await transcriber(audioData, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });

    function formatTime(seconds) {
      const date = new Date(0);
      date.setMilliseconds(seconds * 1000);
      return date.toISOString().substr(11, 12).replace('.', ',');
    }

    let srtContent = '';
    output.chunks.forEach((chunk, index) => {
      const start = formatTime(chunk.timestamp[0]);
      const end = formatTime(chunk.timestamp[1] || chunk.timestamp[0] + 2);
      srtContent += `${index + 1}\n${start} --> ${end}\n${chunk.text.trim()}\n\n`;
    });
    fs.writeFileSync(dummySrtPath, srtContent);
    console.log(`[Job ${jobId}] Subtitles generated perfectly.`);

    // 3. Loop background video to match audio duration and burn in subtitles
    const fontStyle = "FontName=Arial Bold,FontSize=22,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginV=25";

    jobs[jobId].progress = 60;
    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(bgFile.path)
        .inputOptions(['-stream_loop -1']) // infinite loop
        .input(tempWavPath)
        .outputOptions([
          '-map 0:v:0',      // Take video from first input
          '-map 1:a:0',      // Take audio from second input
          '-c:v libx264',
          '-preset ultrafast',
          '-c:a aac',
          '-b:a 192k',
          `-t ${audioDuration}`, // hard stop at audio length
          '-pix_fmt yuv420p',
          '-vf', `subtitles=dummy-${jobId}.srt:force_style='${fontStyle}'` // Burn in accurate subtitles with nice styling
        ])
        .on('start', (cmdLine) => console.log(`[Job ${jobId}] FFmpeg spawned`))
        .on('progress', (p) => {
          const percent = Math.floor(p.percent || 0);
          console.log(`[Job ${jobId}] Processing: ${percent}% done`);
          // scale ffmpeg progress (0-100) to our remaining 60-95%
          jobs[jobId].progress = 60 + Math.floor(percent * 0.35);
        })
        .save(outputPath)
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`[Job ${jobId}] Processing completed: `, outputPath);

    // Clean up temporary files
    try {
      if (fs.existsSync(bgFile.path)) fs.unlinkSync(bgFile.path);
      if (fs.existsSync(audioFile.path)) fs.unlinkSync(audioFile.path);
      if (fs.existsSync(tempWavPath)) fs.unlinkSync(tempWavPath);
      if (fs.existsSync(dummySrtPath)) fs.unlinkSync(dummySrtPath);
    } catch (e) {
      console.error(`[Job ${jobId}] Cleanup error:`, e);
    }

    jobs[jobId].progress = 100;
    jobs[jobId].status = 'completed';
    jobs[jobId].downloadUrl = `/api/download/${outputFilename}`;

  } catch (error) {
    console.error(`[Job ${jobId}] Error processing video:`, error);
    jobs[jobId].status = 'error';
    jobs[jobId].error = 'Failed to process video';
  }
}

app.post('/api/process', upload.fields([{ name: 'bgVideo', maxCount: 1 }, { name: 'audioVideo', maxCount: 1 }]), (req, res) => {
  try {
    const jobId = Date.now().toString();
    jobs[jobId] = { status: 'processing', progress: 0 };

    // Start background processing
    processVideoBackground(req, jobId);

    res.json({
      success: true,
      message: 'Processing started',
      jobId
    });

  } catch (error) {
    console.error('Error initiating video processing:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate processing' });
  }
});

app.get('/api/status/:jobId', (req, res) => {
  const job = jobs[req.params.jobId];
  if (!job) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  res.json({ success: true, ...job });
});

app.get('/api/download/:filename', (req, res) => {
  const file = path.join(__dirname, 'output', req.params.filename);
  if (fs.existsSync(file)) {
    res.download(file);
  } else {
    res.status(404).send('File not found');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
