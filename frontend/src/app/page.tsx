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
  Globe,
  Database,
} from 'lucide-react';
import { extractOsintMediaData, VideoOsintData } from '@/lib/osintEngine';
import { generateDualNotes } from '@/lib/aiNoteSynthesizer';

export default function Home() {
  const [urlInput, setUrlInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [detectedPlatform, setDetectedPlatform] = useState<'youtube' | 'instagram' | 'unknown'>('unknown');

  const [osintData, setOsintData] = useState<VideoOsintData | null>(null);
  const [notesData, setNotesData] = useState<{ englishNotes: string; hinglishNotes: string } | null>(null);

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
    setOsintData(null);
    setNotesData(null);
    setStep(1); // Step 1: Open API & OSINT Extraction

    try {
      // 1. Fetch Video OSINT & Open API Data
      const mediaData = await extractOsintMediaData(urlToUse.trim());
      setOsintData(mediaData);

      setStep(2); // Step 2: Generating Dual AI Notes & Wikipedia Context

      // 2. Synthesize Dual Notes (English & Hinglish)
      const dualNotes = await generateDualNotes(mediaData, apiKey);
      setNotesData(dualNotes);

      setStep(3); // Completed
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during processing.');
      setStep(0);
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (exampleUrl: string) => {
    setUrlInput(exampleUrl);
    handleProcessVideo(exampleUrl);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-[#F8FAFC] selection:bg-[#3B82F6] selection:text-white">
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(false)}
        hasApiKey={Boolean(apiKey)}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#60A5FA] text-xs font-semibold backdrop-blur-md">
            <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Open API & OSINT Video Intelligence Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#F8FAFC] to-[#60A5FA]">
            Transcribe, Enrich & Summarize Any Video URL
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Extract transcripts, Wikipedia Open API intelligence, executive summaries, and timed breakdowns in <strong className="text-[#F8FAFC]">English</strong> & <strong className="text-[#60A5FA]">Hinglish</strong>. Download as formatted Word documents directly in your browser.
          </p>
        </section>

        {/* Hero Input Bar */}
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
                className="w-full pl-14 pr-36 py-4 rounded-2xl bg-[#131B2E] border border-[#232F48] focus:border-[#3B82F6] text-sm sm:text-base text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 shadow-2xl transition-all"
              />

              {/* Platform Detection Badge */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {detectedPlatform === 'youtube' && (
                  <Youtube className="w-5 h-5 text-[#EF4444] scale-110 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-all" />
                )}
                {detectedPlatform === 'instagram' && (
                  <Instagram className="w-5 h-5 text-[#E1306C] scale-110 drop-shadow-[0_0_8px_rgba(225,48,108,0.6)] transition-all" />
                )}
                {detectedPlatform === 'unknown' && (
                  <Search className="w-5 h-5 text-[#94A3B8]" />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold text-sm transition-all shadow-lg shadow-blue-500/20 active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Analyze & Summarize</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Examples */}
          <div className="flex items-center justify-center gap-2 text-xs text-[#94A3B8] flex-wrap">
            <span className="font-medium text-[#94A3B8]">Try a public video:</span>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.youtube.com/watch?v=dQw4w9WgXcQ')}
              className="px-2.5 py-1 rounded-lg bg-[#131B2E] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] transition"
            >
              YouTube Video
            </button>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.youtube.com/shorts/3004_d6n_5k')}
              className="px-2.5 py-1 rounded-lg bg-[#131B2E] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] transition"
            >
              YouTube Short
            </button>
            <button
              type="button"
              onClick={() => handleExampleClick('https://www.instagram.com/reel/C3_sample/')}
              className="px-2.5 py-1 rounded-lg bg-[#131B2E] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] transition"
            >
              Instagram Reel
            </button>
          </div>
        </section>

        {/* Processing Pipeline Stepper */}
        {loading && (
          <section className="max-w-xl mx-auto p-6 rounded-2xl bg-[#131B2E] border border-[#232F48] shadow-2xl text-center space-y-4">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin" />
              <h3 className="font-bold text-[#F8FAFC] text-sm">Processing Open API & OSINT Pipeline</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-left">
              <div
                className={`p-3 rounded-xl border transition-all ${
                  step >= 1
                    ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#60A5FA]'
                    : 'bg-[#0B0F17] border-[#232F48] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {step > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                  )}
                  <span>1. Fetch Media & OSINT Data</span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition-all ${
                  step >= 2
                    ? 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#60A5FA]'
                    : 'bg-[#0B0F17] border-[#232F48] text-[#94A3B8]'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold">
                  {step >= 2 ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#3B82F6]" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-[#232F48] flex items-center justify-center text-[10px]">
                      2
                    </span>
                  )}
                  <span>2. Synthesize Dual Notes</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Error Alert Banner */}
        {errorMessage && (
          <section className="max-w-2xl mx-auto p-4 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] flex items-start gap-3 shadow-lg">
            <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-200">Processing Error</h4>
              <p className="text-xs text-red-300 leading-relaxed">{errorMessage}</p>
            </div>
          </section>
        )}

        {/* Results Workspace */}
        {osintData && notesData && !loading && (
          <section className="space-y-6">
            <ExportToolbar
              osintData={osintData}
              englishNotes={notesData.englishNotes}
              hinglishNotes={notesData.hinglishNotes}
            />

            <TabbedResults
              englishNotes={notesData.englishNotes}
              hinglishNotes={notesData.hinglishNotes}
              transcriptItems={osintData.transcriptItems}
              transcriptText={osintData.transcriptText}
            />
          </section>
        )}

        {/* Feature Grid */}
        {!osintData && !loading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl bg-[#131B2E] border border-[#232F48] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-[#EF4444]">
                <Youtube className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#F8FAFC] text-base">YouTube & Instagram OSINT</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Extracts media metadata, channel details, and open web intelligence from YouTube & Instagram.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#131B2E] border border-[#232F48] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[#3B82F6]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#F8FAFC] text-base">English & Hinglish AI</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Generates executive summaries, Wikipedia open knowledge context, and dual-language study notes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#131B2E] border border-[#232F48] space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-[#10B981]">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-[#F8FAFC] text-base">Client-Side Word Export</h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Downloads pre-formatted `.docx` documents directly in your browser with zero server latency.
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-[#1E293B] py-6 text-center text-xs text-[#94A3B8]">
        VidNote AI • Open API & OSINT Intelligence Engine
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
