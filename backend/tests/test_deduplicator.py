import shutil
from pathlib import Path
from PIL import Image, ImageDraw
from app.services.deduplicator import deduplicate_frames, calculate_similarity


def test_deduplication():
    test_dir = Path("test_dedup_tmp")
    test_dir.mkdir(exist_ok=True)

    try:
        # Create Slide 1
        img1 = Image.new("RGB", (640, 360), color=(20, 20, 30))
        d1 = ImageDraw.Draw(img1)
        d1.text((50, 50), "Slide 1: Introduction", fill=(255, 255, 255))
        img1.save(test_dir / "frame_0000.jpg")

        # Create Slide 1 Duplicate (minor color shift/compression noise)
        img1_dup = Image.new("RGB", (640, 360), color=(21, 21, 31))
        d1_dup = ImageDraw.Draw(img1_dup)
        d1_dup.text((50, 50), "Slide 1: Introduction", fill=(254, 254, 254))
        img1_dup.save(test_dir / "frame_0001.jpg")

        # Create Slide 2 (Completely new slide)
        img2 = Image.new("RGB", (640, 360), color=(240, 240, 240))
        d2 = ImageDraw.Draw(img2)
        d2.text((50, 50), "Slide 2: Architecture Blueprint", fill=(10, 10, 10))
        img2.save(test_dir / "frame_0002.jpg")

        # Create Slide 2 Duplicate
        img2_dup = Image.new("RGB", (640, 360), color=(239, 239, 239))
        d2_dup = ImageDraw.Draw(img2_dup)
        d2_dup.text((50, 50), "Slide 2: Architecture Blueprint", fill=(11, 11, 11))
        img2_dup.save(test_dir / "frame_0003.jpg")

        frames = [
            {"frame_id": 0, "filename": "frame_0000.jpg", "url": "url0", "timestamp_seconds": 0, "timestamp_formatted": "00:00:00"},
            {"frame_id": 1, "filename": "frame_0001.jpg", "url": "url1", "timestamp_seconds": 60, "timestamp_formatted": "00:01:00"},
            {"frame_id": 2, "filename": "frame_0002.jpg", "url": "url2", "timestamp_seconds": 120, "timestamp_formatted": "00:02:00"},
            {"frame_id": 3, "filename": "frame_0003.jpg", "url": "url3", "timestamp_seconds": 180, "timestamp_formatted": "00:03:00"},
        ]

        # Verify similarity calculations
        sim_dup = calculate_similarity(test_dir / "frame_0000.jpg", test_dir / "frame_0001.jpg")
        sim_diff = calculate_similarity(test_dir / "frame_0000.jpg", test_dir / "frame_0002.jpg")

        assert sim_dup > 0.95, f"Expected duplicate similarity > 0.95, got {sim_dup}"
        assert sim_diff < 0.60, f"Expected different slides similarity < 0.60, got {sim_diff}"

        # Run deduplication
        unique_frames, removed = deduplicate_frames(test_dir, frames, similarity_threshold=0.92, delete_duplicates=True)

        assert len(unique_frames) == 2, f"Expected 2 unique slides, got {len(unique_frames)}"
        assert removed == 2, f"Expected 2 duplicates removed, got {removed}"
        assert unique_frames[0]["filename"] == "frame_0000.jpg"
        assert unique_frames[1]["filename"] == "frame_0002.jpg"

        print("DEDUPLICATION TEST PASSED SUCCESSFULLY!")

    finally:
        shutil.rmtree(test_dir, ignore_errors=True)


if __name__ == "__main__":
    test_deduplication()
