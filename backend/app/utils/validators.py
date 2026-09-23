import re
from typing import Optional, Tuple
from app.config import (
    MAX_VIDEO_DURATION_SECONDS,
    MIN_VIDEO_DURATION_SECONDS,
    ALLOWED_INTERVAL_SECONDS,
    DEFAULT_INTERVAL_SECONDS,
)

YOUTUBE_URL_REGEX = re.compile(
    r"^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S+)?$"
)


def extract_youtube_id(url: str) -> Optional[str]:
    """
    Extracts 11-character YouTube Video ID from standard, short, embed, or shorts URLs.
    Returns None if URL syntax is invalid.
    """
    if not url:
        return None

    cleaned_url = url.strip()
    match = YOUTUBE_URL_REGEX.match(cleaned_url)
    if match:
        return match.group(5)
    return None


def validate_youtube_url(url: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Validates YouTube URL structure and returns (is_valid, video_id, error_message).
    """
    if not url or not url.strip():
        return False, None, "URL parameter cannot be empty."

    cleaned_url = url.strip()
    video_id = extract_youtube_id(cleaned_url)

    if not video_id:
        return (
            False,
            None,
            "Invalid YouTube URL format. Provide a valid watch, embed, shorts, or youtu.be link.",
        )

    return True, video_id, None


def validate_duration(duration_seconds: int) -> Tuple[bool, Optional[str]]:
    """
    Ensures video duration falls within operational limits (10s to 240 mins).
    """
    if duration_seconds < MIN_VIDEO_DURATION_SECONDS:
        return (
            False,
            f"Video duration ({duration_seconds}s) is too short. Minimum required duration is {MIN_VIDEO_DURATION_SECONDS} seconds.",
        )

    if duration_seconds > MAX_VIDEO_DURATION_SECONDS:
        max_mins = MAX_VIDEO_DURATION_SECONDS // 60
        actual_mins = duration_seconds // 60
        return (
            False,
            f"Video duration ({actual_mins} minutes) exceeds maximum allowed limit of {max_mins} minutes.",
        )

    return True, None


def sanitize_interval(interval_seconds: Optional[int]) -> int:
    """
    Returns valid sampling interval in seconds, defaulting to 60 if invalid or omitted.
    """
    if not interval_seconds or interval_seconds not in ALLOWED_INTERVAL_SECONDS:
        return DEFAULT_INTERVAL_SECONDS
    return interval_seconds


def format_timestamp(seconds: int) -> str:
    """
    Formats total seconds into HH:MM:SS or MM:SS timecode string.
    """
    secs = max(0, int(seconds))
    hours = secs // 3600
    minutes = (secs % 3600) // 60
    remaining_secs = secs % 60

    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{remaining_secs:02d}"
    return f"{minutes:02d}:{remaining_secs:02d}"
