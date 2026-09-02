import os
import shutil
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Response, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, HttpUrl

from services.extractor import parse_url, extract_youtube_native_transcript, fetch_video_metadata_and_audio
from services.transcriber import transcribe_audio_file, format_transcript_text
from services.ai_generator import generate_ai_notes
from services.docx_exporter import create_docx_document

app = FastAPI(
    title="AI Video Notes Generator API",
    description="Backend service processing YouTube & Instagram links to generate transcripts, dual-language study notes (English & Hinglish), and formatted .docx files.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProcessRequest(BaseModel):
    url: str
    gemini_api_key: Optional[str] = None

class GenerateNotesRequest(BaseModel):
    title: str
    transcript_text: str
    gemini_api_key: Optional[str] = None

class DocxExportRequest(BaseModel):
    title: str
    url: str
    platform: str
    duration_str: str
    uploader: str
    english_notes: str
    hinglish_notes: str
    transcript_text: str

@app.get("/")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "AI Video Notes Generator API",
        "supported_platforms": ["YouTube (Videos, Shorts)", "Instagram (Reels, Videos)"]
    }

@app.post("/api/process")
def process_video(payload: ProcessRequest):
    url = payload.url.strip()
    parsed = parse_url(url)
    
    if not parsed.get("valid"):
        raise HTTPException(status_code=400, detail=parsed.get("error", "Invalid URL provided."))
        
    platform = parsed["platform"]
    video_id = parsed.get("video_id")
    clean_url = parsed.get("clean_url", url)
    
    transcript_items = None
    extraction_method = "audio_whisper"
    
    # 1. Try YouTube Native Transcript first if YouTube
    if platform == "youtube" and video_id:
        transcript_items = extract_youtube_native_transcript(video_id)
        if transcript_items:
            extraction_method = "native_youtube_captions"
            
    # 2. If no native captions or if Instagram, fetch audio via yt-dlp & transcribe with Whisper
    meta_audio = None
    if not transcript_items:
        meta_audio = fetch_video_metadata_and_audio(clean_url)
        if not meta_audio.get("success"):
            raise HTTPException(status_code=422, detail=meta_audio.get("error", "Could not extract video audio."))
            
        audio_path = meta_audio.get("audio_path")
        if not audio_path or not os.path.exists(audio_path):
            if meta_audio.get("temp_dir") and os.path.exists(meta_audio["temp_dir"]):
                shutil.rmtree(meta_audio["temp_dir"], ignore_errors=True)
            raise HTTPException(status_code=422, detail="Audio file could not be extracted from this video.")
            
        try:
            transcript_items = transcribe_audio_file(audio_path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Speech-to-Text transcription failed: {str(e)}")
        finally:
            if meta_audio.get("temp_dir") and os.path.exists(meta_audio["temp_dir"]):
                shutil.rmtree(meta_audio["temp_dir"], ignore_errors=True)
                
    # If we got native captions, we still need basic metadata (title, duration)
    title = f"{platform.capitalize()} Video ({video_id})"
    duration = 0
    thumbnail = ""
    uploader = "Creator"
    
    if meta_audio and meta_audio.get("success"):
        title = meta_audio.get("title", title)
        duration = meta_audio.get("duration", 0)
        thumbnail = meta_audio.get("thumbnail", "")
        uploader = meta_audio.get("uploader", uploader)
    else:
        # Quick fallback metadata for YouTube native captions
        if platform == "youtube" and video_id:
            thumbnail = f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"
            title = f"YouTube Video ({video_id})"
            
    if not transcript_items:
        raise HTTPException(status_code=422, detail="No extractable spoken audio or captions found in this video.")
        
    formatted_transcript_text = format_transcript_text(transcript_items)
    
    mins = int(duration) // 60
    secs = int(duration) % 60
    duration_str = f"{mins:02d}:{secs:02d}" if duration > 0 else "N/A"
    
    return {
        "success": True,
        "platform": platform,
        "video_id": video_id,
        "clean_url": clean_url,
        "title": title,
        "duration_seconds": duration,
        "duration_str": duration_str,
        "thumbnail": thumbnail,
        "uploader": uploader,
        "extraction_method": extraction_method,
        "transcript_items": transcript_items,
        "transcript_text": formatted_transcript_text
    }

@app.post("/api/generate-notes")
def generate_notes(payload: GenerateNotesRequest):
    if not payload.transcript_text or not payload.transcript_text.strip():
        raise HTTPException(status_code=400, detail="Transcript text cannot be empty.")
        
    try:
        notes = generate_ai_notes(
            transcript_text=payload.transcript_text,
            title=payload.title,
            api_key=payload.gemini_api_key
        )
        return {
            "success": True,
            "english_notes": notes["english_notes"],
            "hinglish_notes": notes["hinglish_notes"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Note Generation failed: {str(e)}")

@app.post("/api/export-docx")
def export_docx(payload: DocxExportRequest):
    try:
        buffer = create_docx_document(
            title=payload.title,
            url=payload.url,
            platform=payload.platform,
            duration_str=payload.duration_str,
            uploader=payload.uploader,
            english_notes=payload.english_notes,
            hinglish_notes=payload.hinglish_notes,
            transcript_text=payload.transcript_text
        )
        
        safe_title = "".join(c for c in payload.title if c.isalnum() or c in (' ', '_', '-')).strip()
        filename = f"Study_Notes_{safe_title[:30]}.docx"
        
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"'
        }
        
        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Docx export failed: {str(e)}")
