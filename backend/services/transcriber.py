import os
from typing import List, Dict, Any
import whisper

_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model("base")
    return _whisper_model

def transcribe_audio_file(audio_path: str) -> List[Dict[str, Any]]:
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")
        
    model = get_whisper_model()
    result = model.transcribe(audio_path, verbose=False)
    
    formatted_transcript = []
    for segment in result.get("segments", []):
        formatted_transcript.append({
            "start": round(segment["start"], 2),
            "duration": round(segment["end"] - segment["start"], 2),
            "text": segment["text"].strip()
        })
        
    return formatted_transcript

def format_transcript_text(transcript_items: List[Dict[str, Any]]) -> str:
    lines = []
    for item in transcript_items:
        start_secs = int(item.get("start", 0))
        mins = start_secs // 60
        secs = start_secs % 60
        timestamp_str = f"[{mins:02d}:{secs:02d}]"
        lines.append(f"{timestamp_str} {item.get('text', '')}")
    return "\n".join(lines)
