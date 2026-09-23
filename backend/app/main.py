import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import APP_TITLE, APP_VERSION, CORS_ORIGINS, FRAMES_DIR
from app.api.endpoints import router as api_router
from app.services.cleanup_service import cleanup_daemon_loop

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan context manager.
    Launches background cleanup daemon on startup and cancels on shutdown.
    """
    logger.info("Starting VidNote AI Backend Application...")
    cleanup_task = asyncio.create_task(cleanup_daemon_loop())
    yield
    logger.info("Shutting down VidNote AI Backend Application...")
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        logger.info("Cleanup daemon task successfully cancelled.")


app = FastAPI(
    title=APP_TITLE,
    description="High-performance video stream frame extraction backend API for YouTube video visual notes.",
    version=APP_VERSION,
    lifespan=lifespan
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Asset Server for Frame Images
app.mount("/static/frames", StaticFiles(directory=str(FRAMES_DIR)), name="frames")

# Include Core API Router
app.include_router(api_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "healthy",
        "service": APP_TITLE,
        "version": APP_VERSION,
        "documentation": "/docs"
    }
