'use client';

import React, { useState } from 'react';
import { Youtube, Sparkles, AlertCircle, Clock, CheckCircle2, CopyCheck } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string, intervalSeconds: number, removeDuplicates: boolean) => void;
  isLoading: boolean;
  error: string | null;
}

const INTERVAL_OPTIONS = [
  { label: '15 seconds (Rapid)', value: 15 },
  { label: '30 seconds (High Detail)', value: 30 },
  { label: '1 minute (Default Lecture)', value: 60 },
  { label: '2 minutes (Standard)', value: 120 },
  { label: '5 minutes (Overview)', value: 300 },
];

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S+)?$/;

export default function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [interval, setInterval] = useState<number>(60);
  const [removeDuplicates, setRemoveDuplicates] = useState<boolean>(true);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);

    if (val.trim() && !YOUTUBE_REGEX.test(val.trim())) {
      setValidationWarning('Please enter a valid YouTube video, shorts, or embed URL.');
    } else {
      setValidationWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setValidationWarning('YouTube URL cannot be empty.');
      return;
    }

    if (!YOUTUBE_REGEX.test(url.trim())) {
      setValidationWarning('Please enter a valid YouTube video URL before submitting.');
      return;
    }

    setValidationWarning(null);
    onSubmit(url.trim(), interval, removeDuplicates);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative flex flex-col md:flex-row items-stretch gap-3 p-2 bg-[#161E2E] border border-slate-800 rounded-2xl shadow-2xl focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300">
          
          {/* YouTube Icon & Input Field */}
          <div className="relative flex-1 flex items-center min-w-0">
            <div className="absolute left-4 text-red-500 pointer-events-none">
              <Youtube className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste YouTube Video URL (e.g. https://www.youtube.com/watch?v=...)"
              disabled={isLoading}
              className="w-full pl-13 pr-4 py-3 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base"
            />
          </div>

          {/* Interval Selector */}
          <div className="relative flex items-center border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-3 min-w-[210px]">
            <Clock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              disabled={isLoading}
              className="w-full pl-9 pr-8 py-3 bg-slate-900/80 border border-slate-700/60 rounded-xl text-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-500 cursor-pointer appearance-none"
            >
              {INTERVAL_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-950/60 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/20 shrink-0"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extract Frames</span>
              </>
            )}
          </button>
        </div>

        {/* Deduplication & Helper Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300 hover:text-white transition group">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={(e) => setRemoveDuplicates(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
            <span className="flex items-center gap-1.5 font-semibold text-indigo-300 group-hover:text-indigo-200">
              <CopyCheck className="w-3.5 h-3.5 text-indigo-400" />
              Auto-Remove Duplicate Slides
            </span>
            <span className="text-slate-500 hidden sm:inline">(Filters out identical slides held across multiple minutes)</span>
          </label>

          <div className="flex items-center gap-3 text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Non-download stream
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> PDF Ready
            </span>
          </div>
        </div>

        {/* Validation Warning */}
        {validationWarning && (
          <div className="flex items-center gap-2 text-amber-400 text-sm px-4 py-2 bg-amber-950/40 border border-amber-800/40 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationWarning}</span>
          </div>
        )}

        {/* Backend Error Alert */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm px-4 py-3 bg-red-950/60 border border-red-800/60 rounded-xl">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
