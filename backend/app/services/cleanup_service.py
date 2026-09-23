import os
import time
import shutil
import asyncio
import logging
from app.config import FRAMES_DIR, FRAME_CLEANUP_TTL_SECONDS, CLEANUP_INTERVAL_SECONDS

logger = logging.getLogger(__name__)


def purge_expired_frame_directories() -> int:
    """
    Scans the static frames directory and purges job directories
    whose creation time exceeds FRAME_CLEANUP_TTL_SECONDS (1 hour).
    
    Returns count of purged directories.
    """
    if not FRAMES_DIR.exists():
        return 0

    now = time.time()
    purged_count = 0

    for item in FRAMES_DIR.iterdir():
        if item.is_dir():
            try:
                # Determine folder age using creation/modification time
                folder_age = now - max(item.stat().st_ctime, item.stat().st_mtime)
                if folder_age > FRAME_CLEANUP_TTL_SECONDS:
                    shutil.rmtree(item, ignore_errors=True)
                    purged_count += 1
                    logger.info(f"Purged expired frame session directory '{item.name}' (Age: {int(folder_age)}s)")
            except Exception as err:
                logger.error(f"Error purging session directory '{item.name}': {str(err)}")

    return purged_count


async def cleanup_daemon_loop():
    """
    Continuous async background loop running cleanup purge task periodically.
    """
    logger.info("Starting Ephemeral Frame Storage Cleanup Daemon (1-hour TTL policy)")
    while True:
        try:
            purged = purge_expired_frame_directories()
            if purged > 0:
                logger.info(f"Cleanup daemon purged {purged} expired frame session(s).")
        except Exception as err:
            logger.error(f"Unhandled exception in cleanup daemon loop: {str(err)}")

        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)
