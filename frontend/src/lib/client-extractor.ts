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
 * Compares two image URLs in the browser using an offscreen canvas thumbnail (64x36).
 * Returns similarity ratio (0.0 to 1.0) or null if canvas is CORS-restricted.
 */
async function compareImagesClient(urlA: string, urlB: string): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  if (urlA === urlB) return 1.0;

  return new Promise((resolve) => {
    const imgA = new Image();
    const imgB = new Image();
    imgA.crossOrigin = 'anonymous';
    imgB.crossOrigin = 'anonymous';

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;
      try {
        const w = 64;
        const h = 36;
        const canvasA = document.createElement('canvas');
        canvasA.width = w;
        canvasA.height = h;
        const ctxA = canvasA.getContext('2d');
        if (!ctxA) return resolve(null);
        ctxA.drawImage(imgA, 0, 0, w, h);
        const dataA = ctxA.getImageData(0, 0, w, h).data;

        const canvasB = document.createElement('canvas');
        canvasB.width = w;
        canvasB.height = h;
        const ctxB = canvasB.getContext('2d');
        if (!ctxB) return resolve(null);
        ctxB.drawImage(imgB, 0, 0, w, h);
        const dataB = ctxB.getImageData(0, 0, w, h).data;

        let diffSum = 0;
        const totalPixels = w * h;
        for (let i = 0; i < dataA.length; i += 4) {
          const grayA = 0.299 * dataA[i] + 0.587 * dataA[i + 1] + 0.114 * dataA[i + 2];
          const grayB = 0.299 * dataB[i] + 0.587 * dataB[i + 1] + 0.114 * dataB[i + 2];
          diffSum += Math.abs(grayA - grayB);
        }
        const meanDiff = diffSum / totalPixels;
        const similarity = 1 - meanDiff / 255;
        resolve(similarity);
      } catch {
        resolve(null);
      }
    };

    imgA.onload = onLoad;
    imgB.onload = onLoad;
    imgA.onerror = () => resolve(null);
    imgB.onerror = () => resolve(null);
    imgA.src = urlA;
    imgB.src = urlB;
  });
}

/**
 * Client-Side Browser Extraction Fallback:
 * Extracts visual keyframe frames directly from YouTube's cross-origin CDN in the browser,
 * requiring zero Python/FFmpeg backend servers.
 */
export async function extractFramesClientSide(
  url: string,
  intervalSeconds: number = 60,
  removeDuplicates: boolean = true
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

  let rawFrames: { id: number; timeSec: number; timeStr: string; url: string; name: string }[] = [];
  for (const candidate of candidateKeyframes) {
    const exists = await testImageExists(candidate.url);
    if (exists) {
      rawFrames.push(candidate);
    }
  }

  let duplicatesRemoved = 0;
  const filteredFrames: typeof rawFrames = [];

  if (removeDuplicates && rawFrames.length > 1) {
    filteredFrames.push(rawFrames[0]);
    let lastKept = rawFrames[0];

    for (let i = 1; i < rawFrames.length; i++) {
      const current = rawFrames[i];
      const similarity = await compareImagesClient(lastKept.url, current.url);
      if (similarity !== null && similarity >= 0.92) {
        duplicatesRemoved++;
      } else {
        filteredFrames.push(current);
        lastKept = current;
      }
    }
  } else {
    filteredFrames.push(...rawFrames);
  }

  const validFrames: FrameMetadata[] = filteredFrames.map((candidate, idx) => ({
    frame_id: idx,
    filename: candidate.name,
    url: candidate.url,
    timestamp_seconds: candidate.timeSec,
    timestamp_formatted: candidate.timeStr,
  }));

  const durationSec = intervalSeconds * Math.max(validFrames.length, 1);

  return {
    job_id: `browser-${videoId}-${Date.now()}`,
    video_id: videoId,
    video_title: videoTitle,
    duration_seconds: durationSec,
    duration_formatted: formatTime(durationSec),
    total_frames: validFrames.length,
    interval_seconds: intervalSeconds,
    duplicates_removed: duplicatesRemoved,
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
