# LoopFusion - AI-Powered Video Synchronizer

Turn Any Audio Into Stunning Loop Videos Automatically.

LoopFusion is a modern, creator-focused web tool designed to automatically generate long-form aesthetic videos. It seamlessly loops your background visual to perfectly match the duration of your audio, extracts and processes the audio automatically, and produces an export-ready MP4. 

## Features

- **Infinite Seamless Looping:** Duplicates and trims background visual precisely to audio length.
- **Smart Audio Extraction:** Upload an audio file or a video to automatically extract its audio/music/voice.
- **Speed Adjustment:** Increase audio playback speed (e.g., 1.2x) natively with FFmpeg.
- **AI Subtitles (Mocked):** Designed to integrate with OpenAI Whisper, whisper.cpp, or AssemblyAI.
- **Premium UI/UX:** Responsive, dark-themed, glassmorphic UI built with Framer Motion and Tailwind CSS.
- **Robust Local Processing:** Built entirely on Node.js, Express, Multer, and fluent-ffmpeg for powerful server-side video manipulation.

## Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Framer Motion
- Axios
- Lucide React Icons

**Backend:**
- Node.js
- Express.js
- Multer (File Handling)
- fluent-ffmpeg (Video/Audio processing wrapper)
- FFmpeg (Required system dependency)

## Prerequisites

- **Node.js** (v18+)
- **FFmpeg**: You must have FFmpeg installed on your system and available in your system's PATH.
  - Windows: [Download FFmpeg](https://ffmpeg.org/download.html) and add to Environment Variables.
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

## How to Run Locally

1. **Install Dependencies:**
   From the root folder, run:
   ```bash
   npm run install:all
   ```

2. **Start Development Servers:**
   ```bash
   npm start
   ```
   This will simultaneously start:
   - The React Frontend on `http://localhost:5173`
   - The Express Backend on `http://localhost:5000`

## How it Works (Under the Hood)
1. **Upload:** User drops `video1.mp4` (Visual) and `video2.mp4` (Audio source).
2. **Backend Processing (`/api/process`):**
   - Multer saves the incoming files locally.
   - `fluent-ffmpeg` extracts the audio from `video2.mp4` into a temporary `.mp3` and applies speed adjustments.
   - The duration of the new `.mp3` is read via `ffprobe`.
   - `fluent-ffmpeg` takes `video1.mp4`, applies an infinite `-stream_loop`, merges it with the new `.mp3`, and applies the `-shortest` flag to cut the visual stream precisely when the audio ends.
   - Temporary files are deleted, and a `/api/download/:filename` link is served to the frontend.

## Roadmap
- Whisper API subtitle generation and SRT rendering onto the video stream.
- Advanced background dimming and dynamic visual effects.
- Render queuing via BullMQ for production scaling.
