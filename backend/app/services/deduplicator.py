from pathlib import Path
from typing import List, Dict, Any, Tuple
from PIL import Image, ImageChops, ImageStat
import logging

logger = logging.getLogger(__name__)


def calculate_similarity(img_path1: Path, img_path2: Path, sample_size: Tuple[int, int] = (64, 36)) -> float:
    """
    Computes visual similarity between two image files on a scale of 0.0 to 1.0.
    1.0 means identical, values >= 0.92 indicate identical presentation slides
    with minor compression artifacts, video noise, or speaker webcam movement.
    """
    try:
        with Image.open(img_path1) as im1, Image.open(img_path2) as im2:
            t1 = im1.convert('L').resize(sample_size, Image.Resampling.BILINEAR)
            t2 = im2.convert('L').resize(sample_size, Image.Resampling.BILINEAR)
            diff = ImageChops.difference(t1, t2)
            stat = ImageStat.Stat(diff)
            mean_diff = stat.mean[0]  # average pixel difference (0 to 255)
            similarity = max(0.0, 1.0 - (mean_diff / 255.0))
            return similarity
    except Exception as err:
        logger.error(f"Error comparing images {img_path1} and {img_path2}: {err}")
        return 0.0


def deduplicate_frames(
    job_dir: Path,
    frames_metadata: List[Dict[str, Any]],
    similarity_threshold: float = 0.92,
    delete_duplicates: bool = True
) -> Tuple[List[Dict[str, Any]], int]:
    """
    Filters out consecutive duplicate slide frames based on visual similarity.
    Returns (unique_frames_metadata, count_of_removed_duplicates).
    """
    if len(frames_metadata) <= 1:
        return frames_metadata, 0

    unique_frames = [frames_metadata[0]]
    last_kept_path = job_dir / frames_metadata[0]["filename"]
    removed_count = 0

    for item in frames_metadata[1:]:
        current_path = job_dir / item["filename"]
        if not current_path.exists():
            continue

        sim = calculate_similarity(last_kept_path, current_path)
        if sim >= similarity_threshold:
            # Duplicate slide detected!
            removed_count += 1
            if delete_duplicates:
                try:
                    current_path.unlink(missing_ok=True)
                except Exception as e:
                    logger.warning(f"Could not delete duplicate frame file {current_path}: {e}")
        else:
            # Distinct new slide!
            unique_frames.append(item)
            last_kept_path = current_path

    # Re-index frame_id sequentially
    for idx, f in enumerate(unique_frames):
        f["frame_id"] = idx

    logger.info(f"Deduplication completed: {len(unique_frames)} unique slides kept, {removed_count} duplicates removed.")
    return unique_frames, removed_count
