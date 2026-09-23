from typing import List
from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    url: str = Field(
        ...,
        description="YouTube Video URL (watch, shorts, embed, or short link)",
        json_schema_extra={"example": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
    )
    interval_seconds: int = Field(
        default=60,
        description="Sampling interval in seconds between extracted frames (15, 30, 60, 120, 300)",
        json_schema_extra={"example": 60},
    )


class FrameMetadata(BaseModel):
    frame_id: int = Field(..., description="Zero-indexed frame sequence number", json_schema_extra={"example": 0})
    filename: str = Field(..., description="JPEG image filename", json_schema_extra={"example": "frame_0000.jpg"})
    url: str = Field(..., description="Direct static HTTP URL to frame image")
    timestamp_seconds: int = Field(..., description="Timestamp of frame in seconds from start", json_schema_extra={"example": 60})
    timestamp_formatted: str = Field(..., description="Formatted timecode string (HH:MM:SS)", json_schema_extra={"example": "00:01:00"})


class ExtractResponse(BaseModel):
    job_id: str = Field(..., description="Unique UUID job identifier")
    video_id: str = Field(..., description="11-character YouTube video ID")
    video_title: str = Field(..., description="Metadata title of YouTube video")
    duration_seconds: int = Field(..., description="Total video duration in seconds")
    duration_formatted: str = Field(..., description="Formatted total duration (HH:MM:SS)")
    total_frames: int = Field(..., description="Total number of extracted frames")
    interval_seconds: int = Field(..., description="Sampling interval in seconds used for extraction")
    frames: List[FrameMetadata] = Field(..., description="Sequential list of frame metadata objects")


class HealthResponse(BaseModel):
    status: str = Field(..., json_schema_extra={"example": "healthy"})
    service: str = Field(..., json_schema_extra={"example": "YouTube Frame Extractor & PDF Compiler API"})
    ffmpeg_available: bool = Field(..., json_schema_extra={"example": True})
    ffmpeg_path: str
    yt_dlp_version: str
