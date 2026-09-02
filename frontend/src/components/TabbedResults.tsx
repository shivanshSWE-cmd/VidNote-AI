'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { BookOpen, Languages, FileText, Search, Copy, Check, Clock } from 'lucide-react';

interface TranscriptItem {
  start: number;
  duration: number;
  text: string;
}

interface TabbedResultsProps {
  englishNotes: string;
  hinglishNotes: string;
  transcriptItems: TranscriptItem[];
  transcriptText: string;
}

export const TabbedResults: React.FC<TabbedResultsProps> = ({
  englishNotes,
  hinglishNotes,
  transcriptItems,
  transcriptText,
}) => {
  const [activeTab, setActiveTab] = useState<'english' | 'hinglish' | 'transcript'>('english');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  const handleCopy = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const filteredTranscript = transcriptItems.filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (seconds: number) => {
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}]`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 border-b border-slate-800 bg-slate-950/40 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('english')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'english'
                ? 'border-teal-400 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>English Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('hinglish')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'hinglish'
                ? 'border-teal-400 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>Hinglish Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'transcript'
                ? 'border-teal-400 text-teal-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Original Transcript</span>
          </button>
        </div>

        {/* Copy Button */}
        <div className="pb-3">
          {activeTab === 'english' && (
            <button
              onClick={() => handleCopy(englishNotes, 'english')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copiedTab === 'english' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy English</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'hinglish' && (
            <button
              onClick={() => handleCopy(hinglishNotes, 'hinglish')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copiedTab === 'hinglish' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Hinglish</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'transcript' && (
            <button
              onClick={() => handleCopy(transcriptText, 'transcript')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
            >
              {copiedTab === 'transcript' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Transcript</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Body Content */}
      <div className="p-6 sm:p-8">
        {activeTab === 'english' && (
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-h1:text-xl prose-h1:text-teal-400 prose-h2:text-lg prose-h2:text-indigo-400 prose-p:text-slate-300 prose-li:text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {englishNotes}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === 'hinglish' && (
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-slate-100 prose-h1:text-xl prose-h1:text-teal-400 prose-h2:text-lg prose-h2:text-indigo-400 prose-p:text-slate-300 prose-li:text-slate-300">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {hinglishNotes}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords in verbatim transcript..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
              {filteredTranscript.length > 0 ? (
                filteredTranscript.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 font-mono text-xs font-semibold shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(item.start)}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No transcript lines match your search criteria.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
