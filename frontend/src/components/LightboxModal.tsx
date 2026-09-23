'use client';

import React, { useEffect } from 'react';
import { FrameMetadata } from '@/types';
import { X, ChevronLeft, ChevronRight, Check, Clock } from 'lucide-react';

interface LightboxModalProps {
  frame: FrameMetadata | null;
  framesList: FrameMetadata[];
  isSelected: boolean;
  onClose: () => void;
  onToggleSelect: (frameId: number) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export default function LightboxModal({
  frame,
  framesList,
  isSelected,
  onClose,
  onToggleSelect,
  onNavigate,
}: LightboxModalProps) {
  useEffect(() => {
    if (!frame) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        onNavigate('next');
      } else if (e.key === ' ') {
        e.preventDefault();
        onToggleSelect(frame.frame_id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [frame, onClose, onNavigate, onToggleSelect]);

  if (!frame) return null;

  const currentIndex = framesList.findIndex((f) => f.frame_id === frame.frame_id);
  const totalFrames = framesList.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 md:p-6 animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-slate-800 text-slate-200 text-xs font-mono font-bold rounded-lg border border-slate-700">
            Frame #{currentIndex + 1} of {totalFrames}
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 bg-black/60 text-slate-100 text-xs font-mono font-bold rounded-lg border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            {frame.timestamp_formatted}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle Selection Button */}
          <button
            type="button"
            onClick={() => onToggleSelect(frame.frame_id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all ${
              isSelected
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            <Check className={`w-4 h-4 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-40'}`} />
            <span>{isSelected ? 'Selected' : 'Select Frame'}</span>
          </button>

          {/* Close Modal Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Display Container */}
      <div className="relative flex-1 flex items-center justify-center my-4 overflow-hidden min-h-0">
        {/* Previous Button */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => onNavigate('prev')}
            className="absolute left-2 md:left-6 z-20 p-3 bg-black/60 hover:bg-indigo-600 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white rounded-full transition-all shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* High Resolution Frame Image */}
        <img
          src={frame.url}
          alt={`Full frame preview ${frame.timestamp_formatted}`}
          className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-800"
        />

        {/* Next Button */}
        {currentIndex < totalFrames - 1 && (
          <button
            type="button"
            onClick={() => onNavigate('next')}
            className="absolute right-2 md:right-6 z-20 p-3 bg-black/60 hover:bg-indigo-600 backdrop-blur-md border border-slate-700/60 text-slate-200 hover:text-white rounded-full transition-all shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Keyboard Hint Bar */}
      <div className="flex items-center justify-center gap-6 text-xs text-slate-500 border-t border-slate-900 pt-3">
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">→</kbd> to navigate</span>
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">Space</kbd> to toggle selection</span>
        <span>Press <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-mono">Esc</kbd> to close</span>
      </div>
    </div>
  );
}
