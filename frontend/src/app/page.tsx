'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SettingsModal } from '@/components/SettingsModal';
import { TabbedResults } from '@/components/TabbedResults';
import { ExportToolbar } from '@/components/ExportToolbar';
import {
  Sparkles,
  Search,
  Youtube,
  Instagram,
  CheckCircle2,
  Loader2,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Zap,
} from 'lucide-react';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function Home() {
  const [urlInput, setUrlInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0); // 0: Idle, 1: Extracting, 2: AI Generating, 3: Completed
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Real-time Platform Detection State
  const [detectedPlatform, setDetectedPlatform] = useState<'youtube' | 'instagram' | 'unknown'>('unknown');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    const trimmed = urlInput.trim().toLowerCase();
    if (trimmed.includes('instagram.com/reel') || trimmed.includes('instagram.com/p')) {
      setDetectedPlatform('instagram');
    } else if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
      setDetectedPlatform('youtube');
    } else {
      setDetectedPlatform('unknown');
    }
  }, [urlInput]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleProcessVideo = async (targetUrl?: string) => {
    const urlToUse = targetUrl || urlInput;
    if (!urlToUse || !urlToUse.trim()) {
      setErrorMessage('Please enter a valid YouTube or Instagram URL.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResultData(null);
    setStep(1); // Step 1: Extracting Audio/Transcript

    try {
      const processRes = await fetch(`${BACKEND_URL}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToUse.trim(), gemini_api_key: apiKey }),
      });

      const processJson = await processRes.json();

      if (!processRes.ok || !processJson.success) {
        throw new Error(processJson.detail || processJson.error || 'Failed to process video link.');
      }

      setStep(2); // Step 2: Generating AI Notes

      const notesRes = await fetch(`${BACKEND_URL}/api/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: processJson.title,
          transcript_text: processJson.transcript_text,
          gemini_api_key: apiKey,
        }),
      });

      const notesJson = await notesRes.json();

      if (!notesRes.ok || !notesJson.success) {
        throw new Error(notesJson.detail || 'Failed to generate AI notes.');
      }

      setStep(3); // Completed

      setResultData({
        title: processJson.title,
        url: processJson.clean_url || urlToUse,
        platform: processJson.platform,
        durationStr: processJson.duration_str,
        uploader: processJson.uploader,
        thumbnail: processJson.thumbnail,
        transcriptItems: processJson.transcript_items,
        transcriptText: processJson.transcript_text,
        englishNotes: notesJson.english_notes,
        hinglishNotes: notesJson.hinglish_notes,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during processing.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const [resultData, setResultData] = useState<{
    title: string;
    url: string;
    platform: string;
    durationStr: string;
    uploader: string;
    thumbnail: string;
    transcriptItems: any[];
    transcriptText: string;
    englishNotes: string;
    hinglishNotes: string;
  } | null>(null);

  const handleExampleClick = (exampleUrl: string) => {
    setUrlInput(exampleUrl);
    handleProcessVideo(exampleUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-white">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Productivity Engine • Glassmorphism Edition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-teal-300">
            Transcribe & Summarize YouTube & Instagram Media
          </h1>

          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Extract verbatim transcripts, executive summaries, timed breakdowns, and takeaways in both <strong className="text-slate-200">English</strong> and <strong className="text-teal-400">Hinglish</strong>. Download as pre-formatted Word documents with one click.
          </p>
        </section>

        {/* Hero Input Bar with Auto Platform Detection */}
        <section className="max-w-3xl mx-auto space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleProcessVideo();
            }}
            className="relative flex items-center"
          >
            <div className="relative w-full">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Paste YouTube video/Shorts or Instagram Reel link here..."
                disabled={loading}
                className="w-full pl-14 pr-36 py-4 rounded-2xl bg-slate-900/80 border border-slate-800 focus:border-teal-500 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 backdrop-blur-xl shadow-2xl transition-all"
              />
              
              {/* Platform Detection Icons */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {detectedPlatform === 'youtube' && (
                  <Youtube className="w-5 h-5 text-red-500 scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all" />
                )}
                {detectedPlatform === 'instagram' && (
                  <Instagram className="w-5 h-5 text-pink-500 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)] transition-all" />
                )}
                {detectedPlatform === 'unknown' && (
                  <Search className="w-5 h-5 text-slate-500" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Generate Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 flex-wrap">
            <span className="font-medium text-slate-500">Try an example:</span>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              YouTube Video
            </button>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.youtube.com/shorts/3004_d6n_5k')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              YouTube Short
            </button>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.instagram.com/reel/C3_sample/')}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
            >
              Instagram Reel
            </button>
          </div>
        </section>

        {/* Processing Pipeline Skeleton / Progress State */}
        {loading && (
          <section className="max-w-xl mx-auto p-6 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
              <h3 className="font-bold text-slate-200 text-sm">Processing Media Stream & AI Notes</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  step >= 1
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {step > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  )}
                  <span>1. Extract Media Audio</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  step >= 2
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {step >= 2 ? (
                    <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                      2
                    </span>
                  )}
                  <span>2. Synthesize Dual Notes</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Explicit Error Banner */}
        {errorMessage && (
          <section className="max-w-2xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3 shadow-lg backdrop-blur-xl">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-rose-200">Processing Failed</h4>
              <p className="text-xs text-rose-300/90 leading-relaxed">{errorMessage}</p>
            </div>
          </section>
        )}

        {/* Results Workspace */}
        {resultData && !loading && (
          <section className="space-y-6">
            <ExportToolbar
              title={resultData.title}
              url={resultData.url}
              platform={resultData.platform}
              durationStr={resultData.durationStr}
              uploader={resultData.uploader}
              thumbnail={resultData.thumbnail}
              englishNotes={resultData.englishNotes}
              hinglishNotes={resultData.hinglishNotes}
              transcriptText={resultData.transcriptText}
              backendUrl={BACKEND_URL}
            />

            <TabbedResults
              englishNotes={resultData.englishNotes}
              hinglishNotes={resultData.hinglishNotes}
              transcriptItems={resultData.transcriptItems}
              transcriptText={resultData.transcriptText}
            />
          </section>
        )}

        {/* Feature Highlights Grid */}
        {!resultData && !loading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <Youtube className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">YouTube & Instagram</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Full support for YouTube standard videos, Shorts, and Instagram Reels/Videos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">English & Hinglish AI</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Get executive summaries, key concepts, timed bullet breakdowns, and actionable takeaways in both languages.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-100 text-base">One-Click Word Export</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export pre-formatted `.docx` documents complete with styled headings, metadata tables, and transcripts.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        VidNote AI • Modern Minimalist Design System Edition
      </footer>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
