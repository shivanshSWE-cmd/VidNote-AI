import time
import logging
from typing import Dict, Any, Tuple
from fastapi import HTTPException
import yt_dlp

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# In-memory short-term stream cache: url -> (timestamp, stream_info)
_STREAM_CACHE: Dict[str, Tuple[float, Dict[str, Any]]] = {}
CACHE_TTL_SECONDS = 600  # 10 minute TTL for cached stream URLs


def resolve_video_stream(url: str) -> Dict[str, Any]:
    """
    Extracts raw direct HLS stream manifest URL and video metadata from YouTube using yt-dlp.
    Prefers 720p HLS streams for 4x faster network decoding and frame sampling.
    Includes in-memory cache to skip yt-dlp latency on repeated requests.
    """
    now = time.time()
    clean_url = url.strip()

    # Check cache first
    if clean_url in _STREAM_CACHE:
        cached_time, cached_info = _STREAM_CACHE[clean_url]
        if now - cached_time < CACHE_TTL_SECONDS:
            logger.info(f"Returning cached stream info for URL: {clean_url}")
            return cached_info

    # Format string: Prefer 720p HLS streams for ultra-fast decoding speed
    ydl_opts = {
        'format': 'bestvideo[height<=720][protocol=m3u8_native]/best[height<=720][protocol=m3u8_native]/best[protocol=m3u8_native]/best[height<=1080]/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'skip_download': True,
        'nocheckcertificate': True,
        'cachedir': False,
        'http_headers': {
            'User-Agent': DEFAULT_USER_AGENT,
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://www.youtube.com/',
        }
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(clean_url, download=False)
    except yt_dlp.utils.DownloadError as err:
        error_msg = str(err)
        logger.error(f"yt-dlp extraction failed for URL '{clean_url}': {error_msg}")

        if "Private video" in error_msg:
            raise HTTPException(status_code=422, detail="This YouTube video is private.") from err
        elif "Sign in to confirm your age" in error_msg or "age-restricted" in error_msg.lower():
            raise HTTPException(
                status_code=422,
                detail="This YouTube video is age-restricted and requires authentication."
            ) from err
        elif "Video unavailable" in error_msg:
            raise HTTPException(
                status_code=422,
                detail="YouTube video is unavailable or has been deleted."
            ) from err
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Could not extract video stream: {error_msg}"
            ) from err
    except Exception as err:
        logger.error(f"Unexpected error resolving video stream for URL '{clean_url}': {str(err)}")
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while resolving video stream: {str(err)}"
        ) from err

    if not info_dict:
        raise HTTPException(status_code=422, detail="Failed to retrieve video stream metadata from YouTube.")

    # Check for live stream status
    is_live = info_dict.get("is_live") or (info_dict.get("was_live") and info_dict.get("duration") is None)
    if is_live:
        raise HTTPException(
            status_code=400,
            detail="Live streams are not supported until the broadcast finishes and duration is available."
        )

    # Prefer HLS m3u8_native manifest URL (avoids YouTube GET throttling)
    stream_url = None
    formats = info_dict.get("formats", [])
    for f in reversed(formats):
        if f.get("protocol") == "m3u8_native" and f.get("url") and f.get("vcodec") != "none":
            stream_url = f["url"]
            break

    if not stream_url:
        stream_url = info_dict.get("url")

    if not stream_url:
        for f in reversed(formats):
            if f.get("url") and f.get("vcodec") != "none":
                stream_url = f["url"]
                break

    if not stream_url:
        raise HTTPException(
            status_code=422,
            detail="No valid video stream URL could be resolved for this YouTube video."
        )

    title = info_dict.get("title", "YouTube Video")
    duration = int(info_dict.get("duration") or 0)
    video_id = info_dict.get("id", "")
    uploader = info_dict.get("uploader", "Unknown Uploader")
    thumbnail = info_dict.get("thumbnail", "")

    result = {
        "video_id": video_id,
        "title": title,
        "duration_seconds": duration,
        "stream_url": stream_url,
        "uploader": uploader,
        "thumbnail": thumbnail,
        "user_agent": DEFAULT_USER_AGENT
    }

    # Store in cache
    _STREAM_CACHE[clean_url] = (now, result)
    return result
