import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Music, Settings, Download, Play, Repeat, Type, Sliders, ChevronDown } from 'lucide-react';
import axios from 'axios';

function App() {
  const [bgVideo, setBgVideo] = useState(null);
  const [audioVideo, setAudioVideo] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [speed, setSpeed] = useState('1.2');

  const handleDrop = (e, setter) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      setter(file);
      setDownloadUrl(null); // Reset when new files are added
    }
  };

  const handleGenerate = async () => {
    if (!bgVideo || !audioVideo) return;
    
    setIsProcessing(true);
    setProgress(0);
    setDownloadUrl(null);

    const formData = new FormData();
    formData.append('bgVideo', bgVideo);
    formData.append('audioVideo', audioVideo);
    formData.append('speed', speed);

    try {
      const response = await axios.post('http://localhost:5000/api/process', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        const jobId = response.data.jobId;
        
        const checkStatus = async () => {
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/status/${jobId}`);
            if (statusRes.data.status === 'processing') {
              setProgress(statusRes.data.progress || 0);
              setTimeout(checkStatus, 2000);
            } else if (statusRes.data.status === 'completed') {
              setDownloadUrl(`http://localhost:5000${statusRes.data.downloadUrl}`);
              setProgress(100);
              setIsProcessing(false);
              setTimeout(() => setProgress(0), 3000);
            } else {
              alert('Error processing video: ' + (statusRes.data.error || 'Unknown error'));
              setIsProcessing(false);
              setProgress(0);
            }
          } catch (e) {
            console.error('Polling error', e);
            setTimeout(checkStatus, 2000); // keep trying
          }
        };
        
        checkStatus();
      } else {
        alert('Failed to start processing');
        setIsProcessing(false);
        setProgress(0);
      }
    } catch (error) {
      console.error('Processing request failed', error);
      alert('Error connecting to server. Check console for details.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-panel border-b border-border/50 rounded-none shadow-none bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Repeat className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">LoopFusion</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#examples" className="hover:text-white transition-colors">Examples</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <button className="bg-white text-black px-6 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition-colors">
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 relative">
        <div className="absolute inset-0 top-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-background to-background -z-10 h-screen"></div>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/20 blur-[120px] rounded-full -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 pt-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 text-primary mb-8 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              V1.0 is now live — Experience AI Video Syncing
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-balance leading-tight text-white">
              Turn Any Audio Into <br/>
              <span className="text-gradient">Stunning Loop Videos</span> <br/>
              Automatically.
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-12 text-balance">
              Upload a background visual and an audio source. We'll automatically loop the visual, transcribe subtitles, perfectly sync everything, and export an aesthetic masterpiece.
            </p>
          </motion.div>

          {/* Upload Section */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="max-w-5xl mx-auto glass-panel p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Dropzone 1 - Background */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${bgVideo ? 'border-primary bg-primary/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, setBgVideo)}
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                  <Video className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">1. Background Visual</h3>
                <p className="text-gray-400 text-sm mb-4">Drag & drop your aesthetic looping video (MP4, WEBM)</p>
                <input type="file" id="bg-upload" className="hidden" accept="video/*" onChange={(e) => { setBgVideo(e.target.files[0]); setDownloadUrl(null); }} />
                <label htmlFor="bg-upload" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm font-medium transition-colors max-w-full truncate overflow-hidden">
                  {bgVideo ? bgVideo.name : 'Browse Files'}
                </label>
              </div>

              {/* Dropzone 2 - Audio */}
              <div 
                className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${audioVideo ? 'border-primary bg-primary/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, setAudioVideo)}
              >
                <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
                  <Music className="w-8 h-8 text-fuchsia-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">2. Audio / Voiceover</h3>
                <p className="text-gray-400 text-sm mb-4">Drag & drop the video/audio you want to extract audio from</p>
                <input type="file" id="audio-upload" className="hidden" accept="video/*,audio/*" onChange={(e) => { setAudioVideo(e.target.files[0]); setDownloadUrl(null); }} />
                <label htmlFor="audio-upload" className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer text-sm font-medium transition-colors max-w-full truncate overflow-hidden">
                  {audioVideo ? audioVideo.name : 'Browse Files'}
                </label>
              </div>
            </div>

            {/* Quick Settings Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-black/40 border border-white/5 mb-8">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer">
                  <Type className="w-4 h-4 text-violet-400" /> AI Subtitles: 
                  <select className="bg-transparent text-white outline-none ml-1 appearance-none cursor-pointer">
                    <option className="bg-gray-900">TikTok Style</option>
                    <option className="bg-gray-900">Minimal</option>
                    <option className="bg-gray-900">YouTube</option>
                  </select>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300 hover:text-white cursor-pointer">
                  <Sliders className="w-4 h-4 text-fuchsia-400" /> Speed: 
                  <select 
                    className="bg-transparent text-white outline-none ml-1 appearance-none cursor-pointer"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                  >
                    <option value="1.0" className="bg-gray-900">1.0x</option>
                    <option value="1.2" className="bg-gray-900">1.2x</option>
                    <option value="1.5" className="bg-gray-900">1.5x</option>
                    <option value="2.0" className="bg-gray-900">2.0x</option>
                  </select>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <button className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2">
                <Settings className="w-4 h-4" /> Advanced Settings
              </button>
            </div>

            {/* Progress Bar (Visible when processing) */}
            {isProcessing && (
              <div className="w-full bg-gray-800 rounded-full h-2 mb-6 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-2 rounded-full" 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Action Area */}
            {downloadUrl ? (
              <a 
                href={downloadUrl} 
                className="w-full py-4 rounded-xl text-lg font-bold transition-all relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.01] shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                download
              >
                <Download className="w-5 h-5" /> Download Synced Video
              </a>
            ) : (
              <button 
                onClick={handleGenerate}
                className={`w-full py-4 rounded-xl text-lg font-bold transition-all relative overflow-hidden group ${(!bgVideo || !audioVideo) ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:scale-[1.01]'}`}
                disabled={!bgVideo || !audioVideo || isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Generating Magic... {progress}%
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Upload className="w-5 h-5" /> Start Auto-Sync & Create
                  </span>
                )}
              </button>
            )}
          </motion.div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-24 bg-black/50 border-t border-border" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Creator-Focused Workflows</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Everything you need to produce viral faceless content and aesthetic loops in seconds.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Repeat, title: "Infinite Seamless Looping", desc: "Automatically duplicates and perfectly cuts your background visual to match the precise duration of your audio." },
              { icon: Type, title: "AI Speech-to-Text", desc: "Generates highly accurate, word-level timed subtitles supporting English, Hindi, and Bengali using Whisper AI." },
              { icon: Settings, title: "Customizable Captions", desc: "Choose from viral subtitle presets like TikTok-style, minimal cinematic, or YouTube shorts styling with dynamic colors." },
              { icon: Play, title: "Intelligent Audio Sync", desc: "Extracts audio, adjusts playback speed, and aligns perfectly with visuals and text for a seamless final render." },
              { icon: Video, title: "Any Format Support", desc: "Upload MP4, WEBM, or MP3. We automatically process, format, and render a mobile-friendly H.264 MP4." },
              { icon: Download, title: "Lightning Fast Export", desc: "Cloud-powered FFmpeg rendering ensures your final video is processed quickly and ready for one-click download." },
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-8 hover:bg-gray-800/50 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-500 text-sm border-t border-border bg-background">
        <p>© 2026 LoopFusion. “Create endless aesthetic videos from any audio automatically.”</p>
      </footer>
    </div>
  );
}

export default App;
