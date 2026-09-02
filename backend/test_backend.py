import sys
import os

from services.extractor import parse_url, extract_youtube_native_transcript
from services.ai_generator import generate_ai_notes
from services.docx_exporter import create_docx_document

def test_url_parser():
    yt_test = parse_url("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    assert yt_test["valid"] == True
    assert yt_test["platform"] == "youtube"
    assert yt_test["video_id"] == "dQw4w9WgXcQ"
    
    shorts_test = parse_url("https://www.youtube.com/shorts/3004_d6n_5k")
    assert shorts_test["valid"] == True
    assert shorts_test["platform"] == "youtube"
    assert shorts_test["is_short"] == True
    
    ig_test = parse_url("https://www.instagram.com/reel/C3_sample_id/")
    assert ig_test["valid"] == True
    assert ig_test["platform"] == "instagram"
    
    invalid_test = parse_url("https://example.com/not-video")
    assert invalid_test["valid"] == False
    
    print("[PASSED] test_url_parser")

def test_ai_notes_fallback():
    title = "Sample Tech Tutorial"
    transcript = "[00:00] Welcome to this tutorial on AI.\n[00:15] Today we discuss transformers and LLMs."
    notes = generate_ai_notes(transcript, title, api_key=None)
    assert "english_notes" in notes
    assert "hinglish_notes" in notes
    assert "Executive Summary" in notes["english_notes"]
    assert "Hinglish" in notes["hinglish_notes"]
    print("[PASSED] test_ai_notes_fallback")

def test_docx_export():
    buffer = create_docx_document(
        title="Test Document",
        url="https://youtube.com/watch?v=dQw4w9WgXcQ",
        platform="youtube",
        duration_str="03:32",
        uploader="Rick Astley",
        english_notes="# Executive Summary\nTest english note.",
        hinglish_notes="# Executive Summary (Hinglish)\nTest hinglish note.",
        transcript_text="[00:00] Test transcript text"
    )
    content = buffer.getvalue()
    assert len(content) > 1000  # Valid docx binary file generated
    print("[PASSED] test_docx_export")

if __name__ == "__main__":
    test_url_parser()
    test_ai_notes_fallback()
    test_docx_export()
    print("ALL BACKEND SERVICE TESTS PASSED SUCCESSFULLY!")
