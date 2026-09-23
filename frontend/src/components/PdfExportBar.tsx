'use client';

import React from 'react';
import { PdfLayoutMode } from '@/types';
import { Download, LayoutGrid, FileText, CheckCircle2 } from 'lucide-react';

interface PdfExportBarProps {
  selectedCount: number;
  totalCount: number;
  layoutMode: PdfLayoutMode;
  onChangeLayoutMode: (mode: PdfLayoutMode) => void;
  onExportPdf: () => void;
  isGeneratingPdf: boolean;
}

export default function PdfExportBar({
  selectedCount,
  totalCount,
  layoutMode,
  onChangeLayoutMode,
  onExportPdf,
  isGeneratingPdf,
}: PdfExportBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#161E2E]/95 backdrop-blur-xl border-t border-slate-800 py-4 px-4 md:px-8 shadow-2xl transition-all animate-in slide-in-from-bottom-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left: Selection Counter Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">
              {selectedCount} {selectedCount === 1 ? 'Frame' : 'Frames'} Selected
            </div>
            <div className="text-xs text-slate-400">
              Ready to compile into PDF note deck
            </div>
          </div>
        </div>

        {/* Center: Layout Toggle Selector */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => onChangeLayoutMode('1-up')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === '1-up'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1 Frame / Page</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeLayoutMode('2-up')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              layoutMode === '2-up'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2 Frames / Page</span>
          </button>
        </div>

        {/* Right: Export PDF CTA Button */}
        <button
          type="button"
          onClick={onExportPdf}
          disabled={isGeneratingPdf || selectedCount === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950 disabled:text-slate-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          {isGeneratingPdf ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Compiling PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export PDF ({selectedCount})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
