import os
import shutil
from pathlib import Path

# Base Directory Paths
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = BASE_DIR / "static"
FRAMES_DIR = STATIC_DIR / "frames"

# Ensure static directories exist
FRAMES_DIR.mkdir(parents=True, exist_ok=True)

# Application Metadata & Constants
APP_TITLE = "YouTube Frame Extractor & PDF Compiler API"
APP_VERSION = "1.0.0"
CORS_ORIGINS = ["*"]

# Validation Limits
MAX_VIDEO_DURATION_MINUTES = 240  # 4 hours
MAX_VIDEO_DURATION_SECONDS = MAX_VIDEO_DURATION_MINUTES * 60
MIN_VIDEO_DURATION_SECONDS = 10

DEFAULT_INTERVAL_SECONDS = 60
ALLOWED_INTERVAL_SECONDS = [15, 30, 60, 120, 300]

# FFmpeg & Execution Timeout Constraints (Dynamic scaling with 300s baseline)
FFMPEG_TIMEOUT_SECONDS = 300
FRAME_CLEANUP_TTL_SECONDS = 3600  # 1 hour TTL for ephemeral frame cache
CLEANUP_INTERVAL_SECONDS = 900    # Run cleanup daemon every 15 minutes


def get_ffmpeg_binary() -> str:
    """
    Locates FFmpeg executable dynamically.
    Checks system PATH first, falling back to imageio_ffmpeg if installed.
    Raises RuntimeError if FFmpeg binary cannot be found.
    """
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg

    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception as err:
        raise RuntimeError(
            "FFmpeg executable not found. Ensure FFmpeg is installed on system PATH or imageio-ffmpeg is installed."
        ) from err
