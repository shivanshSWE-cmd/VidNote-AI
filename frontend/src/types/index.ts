export interface FrameMetadata {
  frame_id: number;
  filename: string;
  url: string;
  timestamp_seconds: number;
  timestamp_formatted: string;
}

export interface ExtractResponse {
  job_id: string;
  video_id: string;
  video_title: string;
  duration_seconds: number;
  duration_formatted: string;
  total_frames: number;
  interval_seconds: number;
  frames: FrameMetadata[];
}

export interface ExtractRequest {
  url: string;
  interval_seconds: number;
}

export type PdfLayoutMode = '1-up' | '2-up';

export interface PdfExportOptions {
  layoutMode: PdfLayoutMode;
  includeHeader: boolean;
  includeTimestamps: boolean;
  titleOverride?: string;
}
