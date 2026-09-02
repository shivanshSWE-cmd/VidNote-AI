# 🚀 VidNote AI - Video Notes & Transcript Generator

A web-based tool built with **Next.js 14**, **FastAPI**, **yt-dlp**, **OpenAI Whisper**, and **Google Gemini** that processes video links from **YouTube** (Videos & Shorts) and **Instagram** (Reels & Videos) to generate verbatim transcripts, detailed dual-language study notes (**English** & **Hinglish**), and downloadable Word documents (`.docx`).

---

## 🛠️ Features

1. **Input Handling & Platform Detection**:
   - Supports YouTube Standard videos (`youtube.com/watch?v=...`), Shorts (`youtube.com/shorts/...`), and Instagram Reels (`instagram.com/reel/...`).
   - Instant URL validation and metadata retrieval.

2. **Audio & Verbatim Transcript Extraction**:
   - Primary retrieval of YouTube native captions via `youtube-transcript-api`.
   - Fallback audio downloading via `yt-dlp` + `imageio-ffmpeg` with automatic Whisper speech-to-text transcription.
   - Clean, accurate timestamps (`[MM:SS]`).

3. **Dual-Language AI Study Notes**:
   - **English Notes**: Executive summary, key concepts, detailed timed bullet points, and actionable takeaways.
   - **Hinglish Notes**: Natural, conversational Hinglish (Roman script) retaining exact technical accuracy and structure.

4. **Interactive UI & Export**:
   - Tabbed output for **English Notes**, **Hinglish Notes**, and **Original Verbatim Transcript** (with keyword search).
   - **One-click Word (.docx) Export** styled with metadata table, blue timestamps, custom headers, and transcript appendix.
   - Settings modal for optional custom Gemini API Key entry.

---

## 💻 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide React, React Markdown.
- **Backend**: Python FastAPI, Uvicorn, yt-dlp, youtube-transcript-api, openai-whisper, python-docx, google-genai.

---

## ⚡ Quick Start Guide

### 1. Start Backend Service
```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```
Backend API runs at `http://localhost:8000`.

### 2. Start Frontend Application
```bash
cd frontend
npm run dev
```
Frontend Web App runs at `http://localhost:3000`.

---

## 🧪 Running Automated Backend Tests
```bash
cd backend
python test_backend.py
```
