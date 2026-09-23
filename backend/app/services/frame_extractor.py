import os
import shutil
import uuid
import asyncio
import logging
from pathlib import Path
from typing import List, Dict, Any, Tuple
from fastapi import HTTPException

from app.config import FRAMES_DIR, get_ffmpeg_binary, FFMPEG_TIMEOUT_SECONDS
from app.utils.validators import format_timestamp

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


async def extract_frames_from_stream(
    stream_url: str,
    interval_seconds: int,
    request_base_url: str,
    duration_seconds: int = 0,
    job_id: str = None,
    user_agent: str = DEFAULT_USER_AGENT
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Executes non-blocking multi-threaded FFmpeg async subprocess to sample frames from a stream.
    Optimized with fastseek, multi-threading, 720p scaling, and low-latency buffer flags.
    
    Returns (job_id, frames_metadata_list).
    """
    if not job_id:
        job_id = str(uuid.uuid4())

    job_dir = FRAMES_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    output_pattern = str(job_dir / "frame_%04d.jpg")
    ffmpeg_bin = get_ffmpeg_binary()

    # Dynamic timeout calculation
    estimated_frames = (duration_seconds // interval_seconds) if (duration_seconds and interval_seconds) else 30
    timeout_seconds = max(180, min(900, estimated_frames * 3 + 120))

    headers_str = f"User-Agent: {user_agent}\r\nReferer: https://www.youtube.com/\r\n"

    # Ultra-Performance FFmpeg Flags:
    # -threads 0: Uses all available CPU cores for parallel decoding
    # -fflags +nobuffer+fastseek -flags low_delay: Cuts HTTP network seek latency
    # -vf fps=1/N,scale=1280:-2: Downscales to 720p HD for 4x faster JPEG disk writing
    # -q:v 3: Fast, high-quality JPEG output
    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-threads", "0",
        "-fflags", "+nobuffer+fastseek",
        "-flags", "low_delay",
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-headers", headers_str,
        "-user_agent", user_agent,
        "-ss", "00:00:00",
        "-i", stream_url,
        "-vf", f"fps=1/{interval_seconds},scale=1280:-2",
        "-q:v", "3",
        "-f", "image2",
        output_pattern
    ]

    logger.info(f"Executing Fast FFmpeg extraction job '{job_id}' (threads=0, scale=720p, interval={interval_seconds}s)")

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=timeout_seconds
            )
        except asyncio.TimeoutError:
            process.kill()
            await process.wait()
            shutil.rmtree(job_dir, ignore_errors=True)
            logger.error(f"FFmpeg stream extraction job '{job_id}' timed out after {timeout_seconds} seconds.")
            raise HTTPException(
                status_code=504,
                detail="Stream extraction timed out while connecting to YouTube media server. Try selecting a larger interval or a shorter video."
            )

        if process.returncode != 0:
            stderr_str = stderr.decode().strip()
            shutil.rmtree(job_dir, ignore_errors=True)
            logger.error(f"FFmpeg process returned error code {process.returncode}: {stderr_str}")
            raise HTTPException(
                status_code=500,
                detail=f"FFmpeg frame extraction failed: {stderr_str or 'Unknown stream error'}"
            )

    except Exception as err:
        if job_dir.exists():
            shutil.rmtree(job_dir, ignore_errors=True)
        if isinstance(err, HTTPException):
            raise err
        logger.error(f"Failed executing FFmpeg extraction for job '{job_id}': {str(err)}")
        raise HTTPException(
            status_code=500,
            detail=f"Frame extraction pipeline error: {str(err)}"
        ) from err

    # Read extracted JPEG files from job_dir
    extracted_files = sorted([f for f in job_dir.iterdir() if f.suffix.lower() in ('.jpg', '.jpeg')])

    if not extracted_files:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise HTTPException(
            status_code=422,
            detail="No visual frames could be extracted from the video stream."
        )

    frames_metadata: List[Dict[str, Any]] = []
    base_url_clean = request_base_url.rstrip('/')

    for idx, frame_file in enumerate(extracted_files):
        timestamp_sec = idx * interval_seconds
        filename = frame_file.name
        frame_http_url = f"{base_url_clean}/static/frames/{job_id}/{filename}"

        frames_metadata.append({
            "frame_id": idx,
            "filename": filename,
            "url": frame_http_url,
            "timestamp_seconds": timestamp_sec,
            "timestamp_formatted": format_timestamp(timestamp_sec)
        })

    return job_id, frames_metadata
