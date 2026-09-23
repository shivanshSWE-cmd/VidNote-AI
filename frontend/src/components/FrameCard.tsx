'use client';

import React from 'react';
import { FrameMetadata } from '@/types';
import { Check, Maximize2 } from 'lucide-react';

interface FrameCardProps {
  frame: FrameMetadata;
  isSelected: boolean;
  onToggleSelect: (frameId: number, e: React.MouseEvent) => void;
  onOpenPreview: (frame: FrameMetadata) => void;
}

export default function FrameCard({
  frame,
  isSelected,
  onToggleSelect,
  onOpenPreview,
}: FrameCardProps) {
  return (
    <div
      onClick={(e) => onToggleSelect(frame.frame_id, e)}
      className={`group relative aspect-video rounded-xl overflow-hidden cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-indigo-950/50 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/40'
          : 'bg-[#161E2E] border-slate-800 hover:border-slate-700 hover:shadow-md'
      }`}
    >
      {/* Frame Image */}
      <img
        src={frame.url}
        alt={`Frame at ${frame.timestamp_formatted}`}
        loading="lazy"
        className="w-full h-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Dark overlay gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40 opacity-80 group-hover:opacity-100 transition-opacity" />

      {/* Top-Right Selection Checkbox Badge */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect(frame.frame_id, e);
        }}
        className={`absolute top-2.5 right-2.5 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200 z-10 ${
          isSelected
            ? 'bg-indigo-600 text-white border border-indigo-400 shadow-sm'
            : 'bg-black/60 backdrop-blur-md border border-slate-600 text-transparent hover:border-indigo-400'
        }`}
      >
        <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
      </button>

      {/* Bottom-Left Monospace Timecode Badge */}
      <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 bg-black/80 backdrop-blur-md rounded-md border border-slate-700/60 flex items-center gap-1.5 z-10">
        <span className="font-mono text-xs font-bold text-slate-100 tracking-wider">
          {frame.timestamp_formatted}
        </span>
      </div>

      {/* Bottom-Right Full-Screen Lightbox Preview Trigger */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenPreview(frame);
        }}
        title="Open full resolution preview"
        className="absolute bottom-2.5 right-2.5 p-1.5 bg-black/70 hover:bg-indigo-600 backdrop-blur-md border border-slate-700/60 rounded-md text-slate-300 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-10"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
