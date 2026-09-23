import { ExtractResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function extractFrames(
  url: string,
  intervalSeconds: number = 60
): Promise<ExtractResponse> {
  const response = await fetch(`${API_BASE_URL}/api/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: url.trim(),
      interval_seconds: intervalSeconds,
    }),
  });

  if (!response.ok) {
    let errorMessage = 'Failed to extract frames from video.';
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      }
    } catch {
      errorMessage = `Server error (${response.status}): ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function checkHealth(): Promise<{
  status: string;
  ffmpeg_available: boolean;
  service: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return response.json();
}
