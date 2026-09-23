# Product Requirements Document (PRD)

## Project Title: YouTube Minute-by-Minute Frame Extractor & PDF Note Compiler
**Document Version:** 1.0.0  
**Author:** Principal Software Architect & Lead Systems Engineer  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Problem Statement

### 1.1 Executive Summary
Video content—specifically educational lectures, technical slide presentations, coding tutorials, webinar recordings, and architecture breakdowns—contains valuable visual data (diagrams, code snippets, formulas, slides). However, consumers of technical content face a friction-filled process when attempting to convert video streams into referenceable text/visual notes. Currently, users must manually play, pause, take OS-level screenshots, crop image bounds, and paste them into note-taking tools or word processors.

The **YouTube Minute-by-Minute Frame Extractor & PDF Note Compiler** automates visual note generation. By accepting a public or unlisted YouTube video URL, the system dynamically inspects video metadata, accesses high-resolution direct media stream manifests without downloading full `.mp4` video files to local storage, extracts frame snapshots at configurable time intervals (default: 1 frame per minute), presents an interactive curation gallery, and compiles user-selected visual frames into a production-quality exportable PDF document complete with timestamp metadata.

### 1.2 Problem Statement
- **Time Inefficiency:** Taking manual screenshots during a 2-hour lecture consumes approximately 20 to 30 minutes of manual friction per video.
- **Storage Exhaustion:** Downloading raw high-definition video files (1080p/4K) to extract static frames requires gigabytes of bandwidth and disk space per session.
- **Lack of Structure:** Unorganized screenshots stored in general download directories lack linear video context, timestamp cross-referencing, and consolidated pagination.

---

## 2. Target Audience & User Personas

### 2.1 Persona 1: University Student / Academic Researcher ("Alex")
- **Role:** Undergraduate / Graduate Student in Computer Science & Engineering.
- **Pain Point:** Attends 90-minute online lectures recorded on YouTube. Spent hours manually pausing videos to copy whiteboard diagrams and slide content into PDF revision guides.
- **Goals:** Needs to paste a lecture link, quickly review all visual slides generated every 60 seconds, discard redundant transition frames, and export a clean PDF document for offline exam preparation.

### 2.2 Persona 2: Technical Researcher / Solution Architect ("Devon")
- **Role:** Lead Cloud Architect.
- **Pain Point:** Watches tech conference talks (e.g., AWS re:Invent, Google I/O) containing architectural block diagrams and benchmark slides.
- **Goals:** Desires high-resolution slide extraction without installing desktop video editing utilities or executing CLI tools manually. Wants 2-up PDF layouts with accurate timecode badges (`HH:MM:SS`) to archive slide decks.

### 2.3 Persona 3: Online Content Creator & Educator ("Sam")
- **Role:** Developer Relations Specialist.
- **Pain Point:** Needs storyboard previews and visual cheatsheets for long-form video tutorials.
- **Goals:** Quick visual auditing of video timeline, batch selection/deselection, and instant export without backend render delays.

---

## 3. Core Functional Requirements

### 3.1 Input Handling & URL Validation
- **FR-1.1 YouTube URL Syntax Verification:**
  - The application must accept and validate standard YouTube URLs (`https://www.youtube.com/watch?v=VIDEO_ID`), short URLs (`https://youtu.be/VIDEO_ID`), embedded URLs (`https://www.youtube.com/embed/VIDEO_ID`), and Shorts URLs (`https://www.youtube.com/shorts/VIDEO_ID`).
  - Regex validation must enforce valid 11-character video ID parameters before triggering backend jobs.
- **FR-1.2 Pre-flight Metadata Checks:**
  - Retrieve video duration, title, channel name, thumbnail, and live-stream status prior to frame extraction.
- **FR-1.3 Video Constraint Limits:**
  - Enforce a maximum duration limit of 4 hours (240 minutes) per single processing job to prevent server memory saturation.
  - Video streams under 10 seconds must throw a user-friendly validation error.
- **FR-1.4 Error Feedback for Restricted Media:**
  - Detect and display targeted error messages for private videos, deleted videos, geo-restricted content, age-gated videos requiring authentication, and active live streams.

### 3.2 Non-Download Frame Extraction Engine
- **FR-2.1 Stream Manifest Resolution:**
  - Utilize `yt-dlp` to query raw direct stream URLs (HLS `.m3u8` or HTTPS direct video streams) without downloading complete `.mp4` video files to server disk.
- **FR-2.2 Interval-Based Sampling:**
  - Default extraction rate: 1 frame per minute (60 seconds).
  - Configurable sampling intervals: 15 seconds, 30 seconds, 1 minute (default), 2 minutes, 5 minutes.
- **FR-2.3 FFmpeg Pipeline Execution:**
  - Process direct stream URLs via fast-seeking FFmpeg pipe commands using `-ss` pre-input seeking and `-vf fps=1/N` video filtering.
  - Store extracted images as high-quality JPEGs (`-q:v 2`) in temporary session directories.
- **FR-2.4 Session Asset Metadata Generation:**
  - Produce a JSON metadata catalog mapping each frame index to: `frame_id`, `filename`, `timestamp_seconds`, `timestamp_formatted` (`HH:MM:SS`), `resolution`, and `file_size`.

### 3.3 Interactive Curation UI & Gallery
- **FR-3.1 Responsive Grid Display:**
  - Display extracted frames in a responsive 16:9 aspect ratio thumbnail grid (1 column on mobile, 2 on tablet, 3-4 on desktop).
  - Display timestamp overlays (e.g., `00:01:00`, `00:02:00`) on each frame card.
- **FR-3.2 Batch & Individual Selection Controls:**
  - Provide multi-selection controls: "Select All", "Deselect All", and "Invert Selection".
  - Toggle individual frame selection by clicking anywhere on the frame card or checking the selection badge.
  - Display real-time active counter (e.g., "14 of 45 frames selected").
- **FR-3.3 Full-Size Preview Modal:**
  - Clicking an expand icon on any frame opens a high-resolution full-screen modal preview.
  - Support modal keyboard navigation (Left/Right arrow keys to cycle frames, Spacebar to toggle selection, Esc to dismiss).

### 3.4 PDF Compilation & Export Engine
- **FR-4.1 Client-Side PDF Generation (jsPDF):**
  - Render PDF documents entirely within the client's web browser using `jsPDF`, transferring frame JPEG data via canvas/blob elements to avoid server rendering CPU loads.
- **FR-4.2 Configurable Page Layouts:**
  - **1 Frame Per Page (Single Layout):** High-detail mode with centered 16:9 image, header (Video Title, Channel), and footer (Timestamp, Page N of M).
  - **2 Frames Per Page (Stacked Layout):** Compact study notes layout with two vertically stacked frames per A4/Letter page.
- **FR-4.3 PDF Metadata & Formatting Standards:**
  - Header: Video Title, Source URL, Generation Date.
  - Footer: Monospaced timecode badge (`Timestamp: [01:14:00]`), page numbering (`Page X of Y`).
  - Margins: 12mm standard margins; images scaled proportionally to maintain 16:9 aspect ratios without distortion.
- **FR-4.4 Export Workflow:**
  - Direct file download triggered upon clicking "Generate PDF" with dynamic naming convention: `[Video_Title]_[Interval]_Notes.pdf`.

---

## 4. Non-Functional Requirements (NFRs)

### 4.1 Performance Targets
- **NFR-1.1 Processing Throughput:** Frame extraction for a 60-minute video (60 frames extracted at 1 frame/min) must complete within 15 seconds on standard backend hardware.
- **NFR-1.2 UI Responsiveness:** Initial URL validation and metadata fetch response time must be under 1.5 seconds.
- **NFR-1.3 PDF Assembly Speed:** Client-side compilation of a 30-frame PDF document must take less than 3 seconds on standard desktop hardware.

### 4.2 Reliability & Availability
- **NFR-2.1 Subprocess Resilience:** FFmpeg execution timeouts must be set to 60 seconds per job. If a stream stalls, the backend must return a structured HTTP 504 Gateway Timeout error without crashing the server application.
- **NFR-2.2 Memory Safety:** The backend process memory usage must remain under 512 MB per active job by utilizing streaming pipes instead of buffering video content in RAM.

### 4.3 Scalability
- **NFR-3.1 Stateless Backend Architecture:** FastAPI backend endpoints must remain fully stateless. Session state (selected frames, PDF layout preferences) resides entirely in client React state.
- **NFR-3.2 Ephemeral File Lifecycle:** Extracted frame images on the backend file system must be treated as temporary cache assets subject to automatic 1-hour expiration purge routines.

### 4.4 Security Bounds
- **NFR-4.1 Input Sanitization:** Prevent command injection attacks by strictly validating video ID parameters and enforcing array arguments in Python `subprocess.Popen` (avoiding `shell=True`).
- **NFR-4.2 CORS Policy:** Enforce explicit origin matching between Next.js frontend and FastAPI backend.

---

## 5. Edge Cases & Failure Modes

| Failure Scenario | Root Cause | System Behavior / Mitigation |
| :--- | :--- | :--- |
| **YouTube Livestream URL** | Video has no fixed duration or end time. | Backend detects `is_live=True` via `yt-dlp` pre-flight check, rejects job with HTTP 400 ("Live streams are not supported until broadcast ends"). |
| **Age-Restricted / Private Video** | Stream URLs inaccessible without user login cookies. | Catch extraction exception, return HTTP 422 ("Video is private or age-restricted"). |
| **Throttled Stream Rate by YouTube** | YouTube throttles HTTP GET requests on raw `.googlevideo.com` stream URLs. | Configure `yt-dlp` with `--concurrent-fragments` and `-reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1` flags in FFmpeg. |
| **High Frame Count (e.g. 240 frames)** | Large image payload causing browser memory browser slowdown during PDF creation. | Implement canvas image compression (`jpeg` quality `0.85`), chunked `jsPDF.addImage` insertion, and progress indication. |
| **Disk Space Exhaustion** | Accumulation of extracted frame files across multiple concurrent sessions. | Background daemon process runs every 15 minutes, deleting session directories older than 60 minutes (`ctime > 3600s`). |
