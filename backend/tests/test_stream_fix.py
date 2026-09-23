import sys
import asyncio
import shutil
import imageio_ffmpeg
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.stream_resolver import resolve_video_stream

async def test_fixed_ffmpeg_stream():
    # Test with a longer video (e.g. 5 minute video)
    url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    print(f"Resolving stream URL for {url}...")
    info = resolve_video_stream(url)
    stream_url = info["stream_url"]
    print(f"Stream URL obtained (length: {len(stream_url)})")

    ffmpeg_bin = shutil.which("ffmpeg") or imageio_ffmpeg.get_ffmpeg_exe()
    out_dir = Path("test_out")
    out_dir.mkdir(exist_ok=True)
    out_pattern = str(out_dir / "frame_%04d.jpg")

    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

    cmd = [
        ffmpeg_bin,
        "-hide_banner",
        "-loglevel", "error",
        "-y",
        "-reconnect", "1",
        "-reconnect_at_eof", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
        "-user_agent", user_agent,
        "-ss", "00:00:00",
        "-i", stream_url,
        "-vf", "fps=1/60",
        "-q:v", "2",
        "-f", "image2",
        out_pattern
    ]

    print("Running FFmpeg with reconnect flags and user_agent...")
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )

    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
        print("FFmpeg return code:", proc.returncode)
        if stderr:
            print("FFmpeg stderr:", stderr.decode()[:300])
        frames = list(out_dir.glob("*.jpg"))
        print(f"Extracted {len(frames)} frames successfully!")
    except asyncio.TimeoutError:
        print("ERROR: FFmpeg still timed out!")
        proc.kill()
    finally:
        shutil.rmtree(out_dir, ignore_errors=True)

if __name__ == "__main__":
    asyncio.run(test_fixed_ffmpeg_stream())
