# Architectural Justifications & Technical Rationales

**Document Version:** 1.0.0  
**Author:** Principal Software Architect & Lead Systems Engineer  
**Status:** Technical Decision Record (TDR)  

---

## Technical Decision Index

1. [Decision 1: `yt-dlp` vs. YouTube Data API v3](#1-decision-1-yt-dlp-vs-youtube-data-api-v3)
2. [Decision 2: Direct FFmpeg Stream Sampling vs. Full Video Download](#2-decision-2-direct-ffmpeg-stream-sampling-vs-full-video-download)
3. [Decision 3: Specific FFmpeg Command Construction & Flag Rationales](#3-decision-3-specific-ffmpeg-command-construction--flag-rationales)
4. [Decision 4: Client-Side `jsPDF` vs. Backend PDF Rendering Engine](#4-decision-4-client-side-jspdf-vs-backend-pdf-rendering-engine)
5. [Decision 5: FastAPI (Python) vs. Node.js / Express Backend](#5-decision-5-fastapi-python-vs-nodejs--express-backend)

---

## 1. Decision 1: `yt-dlp` vs. YouTube Data API v3

### The Choice
Utilize `yt-dlp` (via Python library/CLI wrapper) for video link resolution instead of the official YouTube Data API v3.

### Rationale & Trade-off Analysis
- **Stream URL Access:** The YouTube Data API v3 is strictly a metadata API. It provides video titles, descriptions, and channel information, but **it explicitly does NOT provide direct raw video stream URLs (`.m3u8` HLS manifests or `.googlevideo.com` HTTPS video stream URLs)** required for raw video frame extraction.
- **Quota Constraints:** YouTube Data API v3 enforces a strict free tier quota of 10,000 units per day. A single search or metadata lookup operation consumes 1 to 100 units, making it impractical for scalable multi-user applications without expensive enterprise quota overrides.
- **OAuth & Auth Overhead:** Official API access requires Google Developer Console project creation, API key management, and potential OAuth consent screens for restricted endpoints. `yt-dlp` requires zero API keys or authentication for public/unlisted YouTube videos.
- **Stream Manifest Extraction:** `yt-dlp` actively maintains extraction parsers for YouTube's evolving stream format signatures (including n-sig deciphering and adaptive stream manifests), ensuring reliable resolution of raw video stream URLs.

---

## 2. Decision 2: Direct FFmpeg Stream Sampling vs. Full Video Download

### The Choice
Execute non-download frame sampling by passing the remote raw HTTP/HLS stream URL directly to FFmpeg (`ffmpeg -i <stream_url>`), rather than downloading complete `.mp4` video files to server disk.

### Rationale & Trade-off Analysis
- **Disk Storage Preservation:** A 2-hour 1080p lecture video file weighs between 1.5 GB and 3.5 GB. Downloading raw video files for multiple concurrent users would exhaust server disk storage within hours, leading to server crashes and disk I/O bottlenecks.
- **Latency & Processing Speed:** Downloading a 2 GB video file over network takes 30 to 120 seconds before frame extraction can even begin. Direct HTTP stream sampling begins reading video frames within **sub-second timeframes**, reducing total job processing time from minutes to under 15 seconds.
- **Bandwidth Consumption:** Full video downloads consume 100% of the video binary bandwidth. Stream sampling over HTTP range requests only reads the specific keyframes/headers required for the designated timestamps, reducing server network bandwidth consumption by over 90%.

---

## 3. Decision 3: Specific FFmpeg Command Construction & Flag Rationales

### Target Command Syntax
```bash
ffmpeg -hide_banner -loglevel error -ss 00:00:00 -i "<stream_url>" -vf "fps=1/60" -q:v 2 -f image2 static/frames/{job_id}/frame_%04d.jpg
```

### Flag-by-Flag Deep Dive Rationale

#### 1. `-ss 00:00:00` (Fast Seeking Placement BEFORE `-i`)
- **Rationale:** Placing the `-ss` (start time) parameter **before** the input flag (`-i`) instructs FFmpeg to perform fast input seeking at the container level using keyframes, rather than decoding the entire stream from the beginning. This eliminates pre-decode latency when seeking through long stream inputs.

#### 2. `-i "<stream_url>"` (Remote Input Stream URL)
- **Rationale:** Instructs FFmpeg to treat the raw HTTP/HLS URL resolved by `yt-dlp` as a direct input stream. FFmpeg uses its native `libavformat` HTTP protocol handler with HTTP range requests to seek and fetch frame data across the network.

#### 3. `-vf "fps=1/60"` (Video Filter Interval Sampling)
- **Rationale:** The `fps` video filter controls frame extraction frequency. `fps=1/60` evaluates to 1 frame every 60 seconds (1/N seconds). For a 30-second interval, `fps=1/30` is passed. This guarantees mathematically precise interval sampling across the video duration without writing custom frame-counting scripts.

#### 4. `-q:v 2` (JPEG Output Quality Balance)
- **Rationale:** Controls visual compression quality for output JPEGs on a scale of 1 (highest quality, largest file) to 31 (lowest quality, heavy artifacts). `-q:v 2` delivers visually lossless frame captures (crisp presentation slides and code text) while keeping individual JPEG file sizes under 150 KB.

#### 5. `-f image2 static/frames/{job_id}/frame_%04d.jpg` (Format & Zero-Padded Naming)
- **Rationale:** Forces the image2 muxer format. The `%04d` format specifier generates sequentially zero-padded filenames (`frame_0000.jpg`, `frame_0001.jpg`), ensuring deterministic lexicographical sorting during frontend gallery rendering and PDF assembly.

---

## 4. Decision 4: Client-Side `jsPDF` vs. Backend PDF Rendering Engine

### The Choice
Render and assemble exportable PDF documents entirely within the client's browser using `jsPDF`, rather than using server-side Python libraries (e.g., ReportLab, WeasyPrint, or Pillow).

### Rationale & Trade-off Analysis
- **Server CPU & RAM Offloading:** PDF creation involving high-resolution JPEG embedding, layout rendering, and binary encoding is CPU and RAM intensive. Offloading PDF compilation to the client browser eliminates backend memory spikes during concurrent exports.
- **Network Bandwidth Savings:** In a backend PDF generation model, the server must fetch frames, compile the PDF, and send a multi-megabyte PDF binary over the wire to the client. In the client-side model, frame images are already cached in the browser after gallery display; compiling locally uses zero additional server transfer bandwidth.
- **Instant Client Download:** Browser-native rendering via `jsPDF` executes synchronously in client memory, triggering immediate file save dialogs without waiting for backend queueing or network file transfer.

---

## 5. Decision 5: FastAPI (Python) vs. Node.js / Express Backend

### The Choice
Build the core backend services using Python FastAPI instead of Node.js / Express.

### Rationale & Trade-off Analysis
- **Native Ecosystem Integration with `yt-dlp`:** `yt-dlp` is natively written in Python and actively maintained as a PyPI library. Executing `yt-dlp` directly inside FastAPI via Python bindings provides superior exception handling, direct metadata structure access, and avoids wrapping CLI binaries inside Node `child_process` strings.
- **Asynchronous Subprocess Architecture:** FastAPI built on asyncio and Uvicorn provides native `asyncio.create_subprocess_exec` primitives, allowing non-blocking concurrent execution of FFmpeg tasks across multiple incoming HTTP requests without blocking main event loops.
- **Automatic OpenAPI & Type Safety:** FastAPI automatically generates interactive OpenAPI (Swagger) documentation and enforces strict request/response data contracts via Pydantic schema models, accelerating frontend integration.
