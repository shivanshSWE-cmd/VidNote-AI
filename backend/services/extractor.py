import re
import os
import shutil
import tempfile
from typing import Dict, Any, List, Optional
from youtube_transcript_api import YouTubeTranscriptApi
import yt_dlp
import imageio_ffmpeg

def get_ffmpeg_path() -> Optional[str]:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg:
        return ffmpeg
    try:
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return None

def parse_url(url: str) -> Dict[str, Any]:
    url = url.strip()
    
    # YouTube patterns
    yt_patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtu\.be/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/shorts/([a-zA-Z0-9_-]{11})',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([a-zA-Z0-9_-]{11})',
    ]
    
    for pattern in yt_patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            is_short = "/shorts/" in url
            return {
                "platform": "youtube",
                "video_id": video_id,
                "is_short": is_short,
                "clean_url": f"https://www.youtube.com/watch?v={video_id}",
                "valid": True
            }
            
    # Instagram patterns
    ig_patterns = [
        r'(?:https?://)?(?:www\.)?instagram\.com/(?:reel|reels|p)/([a-zA-Z0-9_-]+)',
    ]
    
    for pattern in ig_patterns:
        match = re.search(pattern, url)
        if match:
            shortcode = match.group(1)
            return {
                "platform": "instagram",
                "video_id": shortcode,
                "is_short": True,
                "clean_url": f"https://www.instagram.com/reel/{shortcode}/",
                "valid": True
            }
            
    return {"valid": False, "error": "Invalid or unsupported video URL. Please provide a valid YouTube or Instagram link."}

def extract_youtube_native_transcript(video_id: str) -> Optional[List[Dict[str, Any]]]:
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id, languages=['en', 'hi', 'en-US', 'hi-IN'])
        formatted = []
        for item in transcript_list:
            formatted.append({
                "start": round(item['start'], 2),
                "duration": round(item['duration'], 2),
                "text": item['text'].replace('\n', ' ')
            })
        return formatted
    except Exception:
        return None

def fetch_video_metadata_and_audio(url: str) -> Dict[str, Any]:
    ffmpeg_exe = get_ffmpeg_path()
    
    temp_dir = tempfile.mkdtemp()
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'outtmpl': os.path.join(temp_dir, 'downloaded_audio.%(ext)s'),
    }
    
    if ffmpeg_exe:
        ydl_opts['ffmpeg_location'] = ffmpeg_exe
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            title = info.get('title', 'Untitled Video')
            duration = info.get('duration', 0)
            thumbnail = info.get('thumbnail', '')
            uploader = info.get('uploader', 'Unknown Creator')
            
            actual_audio_path = os.path.join(temp_dir, "downloaded_audio.mp3")
            if not os.path.exists(actual_audio_path):
                files = os.listdir(temp_dir)
                for f in files:
                    if f.endswith(('.mp3', '.m4a', '.wav', '.opus', '.webm', '.mp4')):
                        actual_audio_path = os.path.join(temp_dir, f)
                        break
                        
            return {
                "success": True,
                "title": title,
                "duration": duration,
                "thumbnail": thumbnail,
                "uploader": uploader,
                "audio_path": actual_audio_path if os.path.exists(actual_audio_path) else None,
                "temp_dir": temp_dir
            }
    except yt_dlp.utils.DownloadError as e:
        err_msg = str(e)
        if "Private video" in err_msg:
            return {"success": False, "error": "This video is private and cannot be accessed."}
        elif "Sign in if you've been granted access" in err_msg or "login" in err_msg.lower():
            return {"success": False, "error": "This video requires login or age verification."}
        elif "Video unavailable" in err_msg or "404" in err_msg:
            return {"success": False, "error": "This video is unavailable or has been removed."}
        else:
            return {"success": False, "error": f"Failed to extract video details: {err_msg[:200]}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error during media processing: {str(e)}"}
