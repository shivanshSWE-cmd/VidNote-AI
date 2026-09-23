'use client';

import React, { useState } from 'react';
import { ExtractResponse, FrameMetadata, PdfLayoutMode } from '@/types';
import { extractFrames } from '@/lib/api';
import { generatePdf } from '@/lib/pdf-generator';
import UrlInput from '@/components/UrlInput';
import SkeletonGrid from '@/components/SkeletonGrid';
import FrameGrid from '@/components/FrameGrid';
import LightboxModal from '@/components/LightboxModal';
import PdfExportBar from '@/components/PdfExportBar';
import { Layers, Sparkles, Youtube, FileCheck } from 'lucide-react';

export default function HomePage() {
  const [extractData, setExtractData] = useState<ExtractResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedUrl, setSubmittedUrl] = useState<string>('');

  // Selection & Lightbox State
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<number | null>(null);
  const [previewFrame, setPreviewFrame] = useState<FrameMetadata | null>(null);

  // PDF Export Configuration
  const [layoutMode, setLayoutMode] = useState<PdfLayoutMode>('1-up');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  const handleExtractSubmit = async (url: string, intervalSeconds: number) => {
    setIsLoading(true);
    setError(null);
    setSubmittedUrl(url);

    try {
      const data = await extractFrames(url, intervalSeconds);
      setExtractData(data);
      // Select all extracted frames by default for immediate convenience
      const allIds = new Set(data.frames.map((f) => f.frame_id));
      setSelectedIds(allIds);
      setLastSelectedId(null);
    } catch (err: any) {
      console.error('Extraction error:', err);
      setError(err.message || 'An error occurred while processing the video.');
      setExtractData(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = (frameId: number, isShiftKey: boolean) => {
    if (!extractData) return;

    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (isShiftKey && lastSelectedId !== null) {
        const start = Math.min(lastSelectedId, frameId);
        const end = Math.max(lastSelectedId, frameId);
        // Check if target is already selected; if so, select range; else deselect range
        const shouldSelect = !prev.has(frameId);

        for (let i = start; i <= end; i++) {
          if (shouldSelect) {
            next.add(i);
          } else {
            next.delete(i);
          }
        }
      } else {
        if (next.has(frameId)) {
          next.delete(frameId);
        } else {
          next.add(frameId);
        }
      }

      return next;
    });

    setLastSelectedId(frameId);
  };

  const handleSelectAll = () => {
    if (!extractData) return;
    const allIds = new Set(extractData.frames.map((f) => f.frame_id));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleInvertSelection = () => {
    if (!extractData) return;
    setSelectedIds((prev) => {
      const next = new Set<number>();
      extractData.frames.forEach((f) => {
        if (!prev.has(f.frame_id)) {
          next.add(f.frame_id);
        }
      });
      return next;
    });
  };

  const handleNavigatePreview = (direction: 'prev' | 'next') => {
    if (!extractData || !previewFrame) return;
    const currentIndex = extractData.frames.findIndex((f) => f.frame_id === previewFrame.frame_id);
    if (direction === 'prev' && currentIndex > 0) {
      setPreviewFrame(extractData.frames[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < extractData.frames.length - 1) {
      setPreviewFrame(extractData.frames[currentIndex + 1]);
    }
  };

  const handleExportPdf = async () => {
    if (!extractData || selectedIds.size === 0) return;

    setIsGeneratingPdf(true);
    try {
      const selectedFramesList = extractData.frames.filter((f) => selectedIds.has(f.frame_id));
      await generatePdf({
        videoTitle: extractData.video_title,
        videoUrl: submittedUrl,
        frames: selectedFramesList,
        layoutMode: layoutMode,
      });
    } catch (err: any) {
      console.error('PDF generation error:', err);
      alert(`PDF Generation failed: ${err.message}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0F17] flex flex-col justify-between selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-800/80 bg-[#161E2E]/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                VidNote AI
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800/50">
                  v1.0
                </span>
              </h1>
              <p className="text-xs text-slate-400">YouTube Frame Extractor & PDF Compiler</p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Non-Download FFmpeg Pipe
            </span>
          </div>
        </div>
      </header>

      {/* Main Body Section */}
      <div className="flex-1 space-y-8 py-8">
        {/* Hero Banner */}
        <div className="max-w-4xl mx-auto text-center px-4 space-y-3">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-50">
            Transform YouTube Lectures into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">PDF Visual Notes</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
            Extract high-definition slides and key moments every minute without downloading video files. Select frames and export a clean PDF document instantly.
          </p>
        </div>

        {/* URL Form & Control Panel */}
        <UrlInput onSubmit={handleExtractSubmit} isLoading={isLoading} error={error} />

        {/* Loading Shimmer State */}
        {isLoading && <SkeletonGrid />}

        {/* Extracted Frame Gallery */}
        {!isLoading && extractData && (
          <FrameGrid
            data={extractData}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onInvertSelection={handleInvertSelection}
            onOpenPreview={(frame) => setPreviewFrame(frame)}
          />
        )}
      </div>

      {/* Full-Screen Lightbox Modal */}
      {previewFrame && extractData && (
        <LightboxModal
          frame={previewFrame}
          framesList={extractData.frames}
          isSelected={selectedIds.has(previewFrame.frame_id)}
          onClose={() => setPreviewFrame(null)}
          onToggleSelect={(id) => handleToggleSelect(id, false)}
          onNavigate={handleNavigatePreview}
        />
      )}

      {/* Sticky Bottom Export Control Bar */}
      {extractData && (
        <PdfExportBar
          selectedCount={selectedIds.size}
          totalCount={extractData.frames.length}
          layoutMode={layoutMode}
          onChangeLayoutMode={setLayoutMode}
          onExportPdf={handleExportPdf}
          isGeneratingPdf={isGeneratingPdf}
        />
      )}
    </main>
  );
}
