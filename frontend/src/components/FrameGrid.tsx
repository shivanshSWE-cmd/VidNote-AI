'use client';

import React, { useState } from 'react';
import { ExtractResponse, FrameMetadata } from '@/types';
import FrameCard from './FrameCard';
import { CheckSquare, Square, RefreshCw, Film, Clock } from 'lucide-react';

interface FrameGridProps {
  data: ExtractResponse;
  selectedIds: Set<number>;
  onToggleSelect: (frameId: number, isShiftKey: boolean) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onInvertSelection: () => void;
  onOpenPreview: (frame: FrameMetadata) => void;
}

export default function FrameGrid({
  data,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onDeselectAll,
  onInvertSelection,
  onOpenPreview,
}: FrameGridProps) {
  const selectedCount = selectedIds.size;
  const totalCount = data.frames.length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-32 space-y-6">
      {/* Video Title & Meta Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 py-4 border-b border-slate-800">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>Extracted Video Sequence</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-100 truncate">
            {data.video_title}
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Duration: <strong className="text-slate-200">{data.duration_formatted}</strong>
            </span>
            <span>•</span>
            <span>Interval: <strong className="text-slate-200">{data.interval_seconds}s</strong></span>
            <span>•</span>
            <span>Total Frames: <strong className="text-slate-200">{totalCount}</strong></span>
          </div>
        </div>

        {/* Selection Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-[#161E2E] border border-slate-800 p-1.5 rounded-xl">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select All</span>
          </button>

          <button
            type="button"
            onClick={onDeselectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <Square className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={onInvertSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Invert</span>
          </button>

          <div className="h-4 w-px bg-slate-700 mx-1" />

          {/* Selection Badge */}
          <div className="px-3 py-1.5 text-xs font-semibold text-indigo-300 bg-indigo-950/60 border border-indigo-800/40 rounded-lg">
            {selectedCount} of {totalCount} Selected
          </div>
        </div>
      </div>

      {/* Grid Display Container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.frames.map((frame) => (
          <FrameCard
            key={frame.frame_id}
            frame={frame}
            isSelected={selectedIds.has(frame.frame_id)}
            onToggleSelect={(id, e) => onToggleSelect(id, e.shiftKey)}
            onOpenPreview={onOpenPreview}
          />
        ))}
      </div>
    </div>
  );
}
