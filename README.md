# 🎬 VidNote AI — YouTube Frame Extractor & PDF Note Compiler

> High-performance web application that extracts minute-by-minute visual frames from YouTube videos and compiles user-selected slides into exportable PDF study notes.

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-blue?logo=github)](https://shivanshSWE-cmd.github.io/VidNote-AI/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 14](https://img.shields.io/badge/Next.js-14%20(App%20Router)-black?logo=next.js)](https://nextjs.org)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Hardware%20Accelerated-green?logo=ffmpeg)](https://ffmpeg.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com)

---

## 🚀 Key Features

1. **Non-Download Stream Sampling (Zero Disk Overhead):**
   - Resolves direct raw HLS stream manifests (`m3u8_native`) via `yt-dlp`.
   - Streams directly into hardware-accelerated `ffmpeg` pipe—**never downloads full `.mp4` video files to disk**.
   - Multi-threaded decoding (`-threads 0`) with audio/subtitle stripping for sub-minute processing.

2. **Configurable Frame Sampling Intervals:**
   - Extract 1 frame every **15s**, **30s**, **1 min (default)**, **2 min**, or **5 min**.
   - Enforces 10-second minimum and 4-hour maximum video constraints.

3. **Interactive Curation Gallery (WCAG AAA Dark Mode):**
   - 16:9 aspect ratio thumbnails with high-contrast JetBrains Mono timecode badges (`HH:MM:SS`).
   - Range selection support (**Shift + Click**), batch controls (**Select All**, **Clear**, **Invert**), and live selection counter.

4. **Full-Screen Lightbox Preview:**
   - Modal inspection with keyboard shortcuts:
     - `←` / `→` : Previous / Next frame
     - `Space` : Toggle selection
     - `Esc` : Close preview

5. **Client-Side PDF Document Assembly (`jsPDF`):**
   - Renders landscape A4 document directly in browser memory without server CPU/RAM load.
   - Configurable layouts:
     - **1 Frame / Page:** Full-page slide view with video title, URL, date header, and timestamp footer.
     - **2 Frames / Page:** Compact two-column study notes layout.

6. **Ephemeral Storage Cleanup Daemon:**
   - Background daemon purges temporary frame folders older than 1 hour (3600s TTL).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router, TypeScript) | Responsive UI, client-side PDF generation, gallery state |
| **Styling** | Tailwind CSS + Lucide React | Minimalist, utility-first design system (`#0B0F17`) |
| **PDF Engine** | jsPDF | Zero-server-load browser document compilation |
| **Backend API** | FastAPI (Python 3.12, Uvicorn) | Async non-blocking endpoints, OpenAPI docs |
| **Stream Engine** | `yt-dlp` + FFmpeg 7.1 | Manifest resolution, fast keyframe seeking, JPEG extraction |
| **Orchestration**| Docker & Docker Compose | Multi-container setup with shared volume & health checks |

---

## ⚡ Quick Start Guide

### Option 1: Docker Compose (Recommended)

Run both the frontend and backend in production-ready isolated containers:

```bash
docker compose up --build -d
```

- **Frontend Web App:** [http://localhost:3000](http://localhost:3000)
- **Backend API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check:** [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

### Option 2: Local Development

#### 1. Backend Service (FastAPI)
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
python -m uvicorn app.main:app --reload --port 8000
```
*Backend runs on `http://localhost:8000`.*

#### 2. Frontend Application (Next.js)
```bash
cd frontend

# Install dependencies
npm install

# Run dev server
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 🌐 Live GitHub Pages & Remote Backend

When accessing the frontend on **GitHub Pages** ([https://shivanshSWE-cmd.github.io/VidNote-AI/](https://shivanshSWE-cmd.github.io/VidNote-AI/)):

1. Click the **Backend Status** button in the top navbar.
2. Enter your backend URL:
   - For local use: `http://localhost:8000`
   - For cloud deployment: your deployed HTTPS FastAPI URL (e.g. on Render, Railway, or Hugging Face Spaces).
3. Click **Test & Apply** to connect.

---

## 📚 Architectural Documentation

Complete production-grade architectural specifications are provided in the repository root:

- [PRD.md](PRD.md) — Product Requirements Document (Personas, Functional & Non-Functional Requirements)
- [Architecture.md](Architecture.md) — System Architecture, Flow Sequence Diagram & API Contracts
- [Design.md](Design.md) — Design System, Tokens, Typography & Component Specs
- [Rules.md](Rules.md) — Engineering Guidelines, Anti-patterns & AI Constraints
- [Phases.md](Phases.md) — Implementation Roadmap & Verification Milestones
- [why.md](why.md) — Architectural Justifications & Technical Rationales

---

## 🧪 Running Automated Tests

```bash
cd backend
python -m pytest tests
```

---

## 📄 License

MIT License © 2026 Shivansh. All rights reserved.
