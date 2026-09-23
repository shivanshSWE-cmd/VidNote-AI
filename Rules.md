# Engineering Guidelines & AI System Constraints

**Document Version:** 1.0.0  
**Author:** Principal Software Architect & Lead Systems Engineer  
**Status:** Enforced Policy  

---

## 1. Approved Technology Stack & Tooling

To ensure maintainability, extreme performance, and small dependency footprints, all codebase contributions must strictly align with the following approved technology stack:

- **Frontend:**
  - Framework: Next.js 14+ (App Router architecture with React Server & Client Components).
  - Language: TypeScript 5.0+ (Strict mode enabled, `noImplicitAny: true`).
  - Styling: Tailwind CSS (Utility-first styling, zero custom CSS files except for CSS variable primitives in `globals.css`).
  - Icons: Lucide React (Lightweight SVG icon components).
  - PDF Generation: `jsPDF` (Client-side browser rendering engine).
- **Backend:**
  - Framework: FastAPI (Python 3.10+ async event loop).
  - Web Server: Uvicorn (ASGI worker).
  - Media Resolver: `yt-dlp` (PyPI library / CLI wrapper for stream URL extraction).
  - Video Processor: FFmpeg (System CLI binary executed via non-blocking async subprocesses).
  - Data Validation: Pydantic v2 (Strict type definitions and request/response serialization).

---

## 2. Banned Libraries & Architectural Patterns

To maintain sub-second response times, zero memory leaks, and lightweight bundle sizes, the following libraries and architectural anti-patterns are **STRICTLY BANNED**:

### 🚫 Banned Pattern 1: Downloading Full `.mp4` Video Files
- **PROHIBITED:** Never issue `yt-dlp` commands that download full `.mp4`, `.mkv`, or `.webm` video binaries to server disk prior to frame extraction (e.g., `yt-dlp -f bestvideo video_url`).
- **REQUIRED PATTERN:** Extract raw direct HLS/HTTPS stream manifest URLs via `yt-dlp -g -f "bestvideo[height<=1080]"` and pipe the stream URL directly into FFmpeg (`ffmpeg -ss ... -i <stream_url>`).

### 🚫 Banned Pattern 2: Bloated UI Component Frameworks
- **PROHIBITED:** Do not import Material UI (`@mui/material`), Ant Design (`antd`), Bootstrap, Semantic UI, or Chakra UI.
- **REQUIRED PATTERN:** Build modular UI components exclusively with Tailwind CSS utilities and headless primitives (e.g., native HTML checkboxes, custom styled Tailwind buttons, and simple modal portals).

### 🚫 Banned Pattern 3: Legacy React & Untyped Code
- **PROHIBITED:** No legacy React class components (`React.Component`), `PropTypes`, `any` types in TypeScript, or un-typed `.js` / `.jsx` files.
- **REQUIRED PATTERN:** Pure functional components with React Hooks (`useState`, `useCallback`, `useMemo`, `useEffect`) and explicit TypeScript interfaces.

### 🚫 Banned Pattern 4: Synchronous Blocking Subprocesses
- **PROHIBITED:** Never execute synchronous Python subprocess calls (`subprocess.run(...)` or `os.system(...)`) inside FastAPI endpoint handlers, as this blocks the Uvicorn asyncio event loop.
- **REQUIRED PATTERN:** Always utilize async subprocess execution via `asyncio.create_subprocess_exec(...)`.

---

## 3. Error Handling & Validation Directives

### 3.1 YouTube URL Validation
- All URL inputs must pass strict regular expression validation before reaching `yt-dlp`:
  ```regex
  ^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S+)?$
  ```
- Reject invalid hostnames, missing video IDs, or malformed queries immediately with an HTTP 400 response.

### 3.2 Subprocess & Stream Failure Directives
- **FFmpeg Execution Timeout:** Every FFmpeg subprocess must execute with a hard 60-second asyncio timeout. If a remote YouTube media server throttles or drops the connection, kill the subprocess tree and raise HTTP 504 Gateway Timeout.
- **yt-dlp Extraction Safeguards:** Catch `yt-dlp.utils.DownloadError` explicitly. Map age-restrictions, video deletions, and private video errors to clear, user-facing HTTP 422 error messages.

### 3.3 Ephemeral Disk Purge Policy
- Extracted JPEG frame files stored in `/backend/static/frames/{job_id}/` must be ephemeral.
- An automatic background cleanup daemon (`APScheduler` or FastAPI background task loop) must inspect directory creation times (`ctime`) every 15 minutes and permanently delete frame directories older than 3600 seconds (1 hour).

---

## 4. AI Boundaries & Code Quality Standards

When writing, refactoring, or generating code for this repository, AI agents and human developers must strictly adhere to the following rules:

1. **No Production Placeholders or Stubs:** Never commit files containing `TODO`, `FIXME`, `// mock data goes here`, `pass # to be implemented`, or truncated function implementations.
2. **Modular Architecture:** Keep files under 250 lines of code. Split logic across dedicated services (`stream_resolver.py`, `frame_extractor.py`, `pdfGenerator.ts`).
3. **Self-Documenting Code:** Write clear inline comments for non-obvious operations (e.g., FFmpeg flag ordering, jsPDF coordinate calculations).
4. **Strict Schema Synchronization:** Any change to backend Pydantic models in `schemas.py` must immediately be mirrored in frontend TypeScript interfaces in `types/index.ts`.
5. **Clean Git Hygiene:** Ensure all auto-generated temporary test images, python bytecode (`__pycache__`), `.next` build outputs, and `.env` files are ignored via `.gitignore`.
