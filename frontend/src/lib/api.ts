import { ExtractResponse } from '@/types';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('vidnote_backend_url');
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      localStorage.setItem('vidnote_backend_url', url.trim().replace(/\/+$/, ''));
    } else {
      localStorage.removeItem('vidnote_backend_url');
    }
  }
}

export async function extractFrames(
  url: string,
  intervalSeconds: number = 60
): Promise<ExtractResponse> {
  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}/api/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url.trim(),
        interval_seconds: intervalSeconds,
      }),
    });
  } catch (netErr: any) {
    throw new Error(
      `Cannot connect to backend at ${baseUrl}. Ensure the FastAPI service is running (e.g. 'docker compose up' or 'python -m uvicorn app.main:app') or configure your backend URL in Settings.`
    );
  }

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
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/health`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Backend health check failed (${response.status})`);
  }
  return response.json();
}
