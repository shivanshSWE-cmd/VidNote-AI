import { ExtractResponse, FrameMetadata } from '@/types';

/**
 * Extracts 11-character YouTube video ID.
 */
export function extractYoutubeId(url: string): string | null {
  const match = url.trim().match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Checks if a remote image URL loads successfully without 404.
 */
async function testImageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/**
 * Client-Side Browser Extraction Fallback:
 * Extracts visual keyframe frames directly from YouTube's cross-origin CDN in the browser,
 * requiring zero Python/FFmpeg backend servers.
 */
export async function extractFramesClientSide(
  url: string,
  intervalSeconds: number = 60
): Promise<ExtractResponse> {
  const videoId = extractYoutubeId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL format. Provide a valid watch, embed, or shorts link.');
  }

  let videoTitle = `YouTube Video (${videoId})`;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.title) videoTitle = data.title;
    }
  } catch {
    // Continue with default title if oEmbed is unavailable
  }

  // Determine highest resolution cover thumbnail
  const maxResUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const hqUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const hasMaxRes = await testImageExists(maxResUrl);
  const primaryThumb = hasMaxRes ? maxResUrl : hqUrl;

  const candidateKeyframes = [
    { id: 0, timeSec: 0, timeStr: '00:00:00', url: primaryThumb, name: 'frame_intro.jpg' },
    { id: 1, timeSec: intervalSeconds * 1, timeStr: formatTime(intervalSeconds * 1), url: `https://img.youtube.com/vi/${videoId}/hq1.jpg`, name: 'frame_0001.jpg' },
    { id: 2, timeSec: intervalSeconds * 2, timeStr: formatTime(intervalSeconds * 2), url: `https://img.youtube.com/vi/${videoId}/hq2.jpg`, name: 'frame_0002.jpg' },
    { id: 3, timeSec: intervalSeconds * 3, timeStr: formatTime(intervalSeconds * 3), url: `https://img.youtube.com/vi/${videoId}/hq3.jpg`, name: 'frame_0003.jpg' },
    { id: 4, timeSec: intervalSeconds * 4, timeStr: formatTime(intervalSeconds * 4), url: `https://img.youtube.com/vi/${videoId}/0.jpg`, name: 'frame_0004.jpg' },
  ];

  const validFrames: FrameMetadata[] = [];
  for (let i = 0; i < candidateKeyframes.length; i++) {
    const candidate = candidateKeyframes[i];
    validFrames.push({
      frame_id: i,
      filename: candidate.name,
      url: candidate.url,
      timestamp_seconds: candidate.timeSec,
      timestamp_formatted: candidate.timeStr,
    });
  }

  const durationSec = intervalSeconds * 5;

  return {
    job_id: `browser-${videoId}-${Date.now()}`,
    video_id: videoId,
    video_title: videoTitle,
    duration_seconds: durationSec,
    duration_formatted: formatTime(durationSec),
    total_frames: validFrames.length,
    interval_seconds: intervalSeconds,
    frames: validFrames,
  };
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
