import os
import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types

ENGLISH_PROMPT_TEMPLATE = """You are an elite academic AI assistant and study notes creator. 
Given the following transcript from a video titled "{title}", generate comprehensive, well-structured study notes in Markdown format.

Required Sections:
# 📌 Executive Summary
(Provide a clear 3-4 sentence overview of the core topic, main argument, and context.)

# 💡 Key Concepts & Terminology
(List 3-6 main terms or core ideas introduced in the video with clear definitions.)

# 📜 Detailed Timed Breakdown
(Group the content into chronological logical sections using timestamps formatted like `[MM:SS]`. Write detailed bullet points explaining the concepts discussed.)

# 🎯 Actionable Takeaways & Summary
(List 3-5 concrete takeaways, practical applications, or key recommendations.)

Transcript with Timestamps:
{transcript_text}
"""

HINGLISH_PROMPT_TEMPLATE = """You are an elite bilingual AI assistant fluent in conversational Hinglish (Hindi written using the Roman/Latin alphabet).
Given the following transcript from a video titled "{title}", generate detailed study notes in natural, smooth, professional Hinglish in Markdown format.

RULES FOR HINGLISH:
- Use Roman script (Latin alphabet). Do NOT use Devanagari script.
- Maintain identical structure and technical depth as the English version.
- Use natural Hinglish phrasing (e.g., "Is video mein main focus...", "Key concept yeh hai ki...", "Timestamps ke according breakdown...").

Required Sections:
# 📌 Executive Summary (Hinglish)
(3-4 sentences mein video ka core topic aur summary explain karein.)

# 💡 Key Concepts & Terminology (Hinglish)
(Main concepts aur terms ko simple Hinglish definitions ke saath explain karein.)

# 📜 Detailed Timed Breakdown (Hinglish)
(`[MM:SS]` timestamps ke saath step-by-step complete breakdown aur detailed bullet points Likhein.)

# 🎯 Actionable Takeaways & Summary (Hinglish)
(Key learnings aur actionable points point-wise highlight karein.)

Transcript with Timestamps:
{transcript_text}
"""

def generate_notes_with_gemini(transcript_text: str, title: str, api_key: str) -> Dict[str, str]:
    client = genai.Client(api_key=api_key)
    
    eng_prompt = ENGLISH_PROMPT_TEMPLATE.format(title=title, transcript_text=transcript_text)
    hing_prompt = HINGLISH_PROMPT_TEMPLATE.format(title=title, transcript_text=transcript_text)
    
    try:
        # Generate English Notes
        eng_response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=eng_prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
            )
        )
        english_notes = eng_response.text.strip()
        
        # Generate Hinglish Notes
        hing_response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=hing_prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
            )
        )
        hinglish_notes = hing_response.text.strip()
        
        return {
            "english_notes": english_notes,
            "hinglish_notes": hinglish_notes
        }
    except Exception as e:
        raise Exception(f"Gemini API Error: {str(e)}")

def generate_fallback_notes(transcript_text: str, title: str) -> Dict[str, str]:
    """Generates structured notes from transcript when no API key is supplied."""
    lines = [line for line in transcript_text.split('\n') if line.strip()]
    sample_lines = lines[:15]
    sample_text = "\n".join(sample_lines) if sample_lines else transcript_text[:500]
    
    english_notes = f"""# 📌 Executive Summary
This video titled **"{title}"** provides essential insights into key topics covered in the transcript. The content discusses fundamental strategies, main observations, and key explanations.

> **Note**: Provide a valid Gemini API Key in Settings for deeper AI synthesis.

# 💡 Key Concepts & Terminology
- **Core Topic**: Primary domain explored in "{title}".
- **Key Insight**: Highlights from spoken transcript timestamps.
- **Implementation Strategy**: Key action items discussed by the speaker.

# 📜 Detailed Timed Breakdown
{sample_text}

# 🎯 Actionable Takeaways & Summary
1. Understand the core principles demonstrated in the video.
2. Review specific timestamps for targeted section re-watching.
3. Apply key takeaways directly to your study workflow.
"""

    hinglish_notes = f"""# 📌 Executive Summary (Hinglish)
Is video **"{title}"** mein main topic aur core points ko explain kiya gaya hai. Spoken transcript ke basis par yeh summary tayyar ki gayi hai.

> **Note**: Gemini API Key add karke aur bhi deep AI notes generate kar sakte hain.

# 💡 Key Concepts & Terminology (Hinglish)
- **Main Topic**: Video ka central theme.
- **Important Concept**: Video ke mukhya points aur insights.
- **Practical Application**: Key steps jo sikhe gaye hain.

# 📜 Detailed Timed Breakdown (Hinglish)
{sample_text}

# 🎯 Actionable Takeaways & Summary (Hinglish)
1. Video ke main concepts ko achhe se samjhein.
2. Important timestamps check karke specific topics revise karein.
3. Key learnings ko practically apply karein.
"""

    return {
        "english_notes": english_notes,
        "hinglish_notes": hinglish_notes
    }

def generate_ai_notes(transcript_text: str, title: str, api_key: Optional[str] = None) -> Dict[str, str]:
    if api_key and api_key.strip():
        return generate_notes_with_gemini(transcript_text, title, api_key.strip())
    else:
        return generate_fallback_notes(transcript_text, title)
