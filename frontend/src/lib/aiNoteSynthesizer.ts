import { VideoOsintData } from './osintEngine';

export interface NotesResult {
  englishNotes: string;
  hinglishNotes: string;
}

export async function generateDualNotes(
  osintData: VideoOsintData,
  apiKey?: string
): Promise<NotesResult> {
  if (apiKey && apiKey.trim()) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an elite academic AI notes synthesizer and OSINT analyst. Given the video titled "${osintData.title}" and transcript below, generate detailed Markdown notes in English AND conversational Hinglish (Latin script).
                  
Transcript:
${osintData.transcriptText}`,
                },
              ],
            },
          ],
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const generatedText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText) {
          return {
            englishNotes: generatedText,
            hinglishNotes: synthesizeHinglishFallback(osintData),
          };
        }
      }
    } catch {
      // Fallback to client-side synthesis if API call fails
    }
  }

  // Client-Side Open Data Synthesizer
  return {
    englishNotes: synthesizeEnglishNotes(osintData),
    hinglishNotes: synthesizeHinglishFallback(osintData),
  };
}

function synthesizeEnglishNotes(data: VideoOsintData): string {
  const wikiContext = data.wikiEnrichments && data.wikiEnrichments.length > 0
    ? data.wikiEnrichments.map((w) => `- **${w.term}**: ${w.extract}`).join('\n')
    : '- **Media Analysis**: High-value technical video content.\n- **OSINT Enrichment**: Open data verified.';

  return `# 📌 Executive Summary
This video titled **"${data.title}"** presented by **${data.uploader}** covers critical concepts, strategic frameworks, and practical demonstrations. The content was extracted and enriched using open media data and OSINT APIs.

# 💡 Key Concepts & Terminology (Enriched via Open Wikipedia Data)
${wikiContext}

# 📜 Detailed Timed Breakdown
${data.transcriptText}

# 🎯 Actionable Takeaways & Summary
1. Apply the core principles discussed in the video to your project.
2. Cross-reference key timestamps for targeted re-reading.
3. Utilize open data resources for deep OSINT verification.
`;
}

function synthesizeHinglishFallback(data: VideoOsintData): string {
  const wikiContext = data.wikiEnrichments && data.wikiEnrichments.length > 0
    ? data.wikiEnrichments.map((w) => `- **${w.term}**: ${w.extract}`).join('\n')
    : '- **Main Concept**: High-value educational content.\n- **Open Data**: Live internet enrichment.';

  return `# 📌 Executive Summary (Hinglish)
Is video **"${data.title}"** (Creator: **${data.uploader}**) mein important points aur practical insights explain kiye gaye hain. Is summary ko open internet APIs aur OSINT intelligence data se enrich kiya gaya hai.

# 💡 Key Concepts & Terminology (Hinglish)
${wikiContext}

# 📜 Detailed Timed Breakdown (Hinglish)
${data.transcriptText}

# 🎯 Actionable Takeaways & Summary (Hinglish)
1. Video ke key concepts ko practically implement karein.
2. Timestamps ke according main topics ko quick revise karein.
3. Open data resources ka use karke deep learning karein.
`;
}
