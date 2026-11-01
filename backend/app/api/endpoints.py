import shutil
import yt_dlp
from fastapi import APIRouter, HTTPException, Request

from app.config import get_ffmpeg_binary, APP_TITLE
from app.api.schemas import (
    ExtractRequest,
    ExtractResponse,
    HealthResponse,
    FrameMetadata,
)
from app.utils.validators import (
    validate_youtube_url,
    validate_duration,
    sanitize_interval,
    format_timestamp,
)
from app.services.stream_resolver import resolve_video_stream
from app.services.frame_extractor import extract_frames_from_stream

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check endpoint returning system FFmpeg status and yt-dlp version.
    """
    ffmpeg_available = False
    ffmpeg_path = "Not Found"
    try:
        ffmpeg_path = get_ffmpeg_binary()
        ffmpeg_available = True
    except Exception:
        pass

    yt_dlp_ver = getattr(yt_dlp.version, "__version__", "Unknown")

    return HealthResponse(
        status="healthy",
        service=APP_TITLE,
        ffmpeg_available=ffmpeg_available,
        ffmpeg_path=ffmpeg_path,
        yt_dlp_version=yt_dlp_ver,
    )


@router.post("/extract", response_model=ExtractResponse)
async def extract_frames(payload: ExtractRequest, request: Request):
    """
    Main endpoint accepting YouTube URL and interval to extract frames as static JPEG assets.
    """
    raw_url = payload.url.strip() if payload.url else ""

    # 1. Validate YouTube URL format & extract video ID
    is_valid, video_id, url_err = validate_youtube_url(raw_url)
    if not is_valid:
        raise HTTPException(status_code=400, detail=url_err)

    # 2. Sanitize sampling interval
    interval = sanitize_interval(payload.interval_seconds)

    # 3. Resolve stream manifest & video metadata via yt-dlp
    stream_info = resolve_video_stream(raw_url)
    duration_secs = stream_info["duration_seconds"]

    # 4. Enforce duration constraints (10s to 240 mins)
    duration_valid, duration_err = validate_duration(duration_secs)
    if not duration_valid:
        raise HTTPException(status_code=422, detail=duration_err)

    # 5. Determine base HTTP request URL for constructing static image asset URLs
    base_url = str(request.base_url)

    # 6. Execute FFmpeg frame extraction pipeline with reconnect flags & dynamic timeout
    job_id, frames_data = await extract_frames_from_stream(
        stream_url=stream_info["stream_url"],
        interval_seconds=interval,
        request_base_url=base_url,
        duration_seconds=duration_secs,
        user_agent=stream_info.get("user_agent")
    )

    frames_metadata = [FrameMetadata(**item) for item in frames_data]

    return ExtractResponse(
        job_id=job_id,
        video_id=video_id,
        video_title=stream_info["title"],
        duration_seconds=duration_secs,
        duration_formatted=format_timestamp(duration_secs),
        total_frames=len(frames_metadata),
        interval_seconds=interval,
        frames=frames_metadata,
    )
