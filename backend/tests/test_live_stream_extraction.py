import sys
import asyncio
from pathlib import Path

# Add parent directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.stream_resolver import resolve_video_stream
from app.services.frame_extractor import extract_frames_from_stream


async def test_live_youtube_extraction():
    url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # Me at the zoo (19s video)
    print(f"Resolving stream for URL: {url}...")
    stream_info = resolve_video_stream(url)
    
    print("Stream metadata resolved:")
    print(f" - Title: {stream_info['title']}")
    print(f" - Duration: {stream_info['duration_seconds']}s")
    print(f" - Uploader: {stream_info['uploader']}")
    print(f" - Stream URL found: {bool(stream_info['stream_url'])}")

    print("\nExtracting frames at 15s interval...")
    job_id, frames = await extract_frames_from_stream(
        stream_url=stream_info["stream_url"],
        interval_seconds=15,
        request_base_url="http://localhost:8000"
    )

    print(f"Job completed: {job_id}")
    print(f"Total frames extracted: {len(frames)}")
    for f in frames:
        print(f" Frame #{f['frame_id']} | Time: {f['timestamp_formatted']} | URL: {f['url']}")

    assert len(frames) > 0, "Frames array should not be empty"
    print("\n[SUCCESS] LIVE YOUTUBE EXTRACTION TEST PASSED PERFECTLY!")


if __name__ == "__main__":
    asyncio.run(test_live_youtube_extraction())
