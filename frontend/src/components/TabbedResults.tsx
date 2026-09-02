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
    <div className="bg-[#131B2E] border border-[#232F48] rounded-2xl overflow-hidden shadow-xl">
      {/* Tab Navigation Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 pt-4 border-b border-[#1E293B] bg-[#0B0F17]/50 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('english')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'english'
                ? 'border-[#3B82F6] text-[#3B82F6] bg-[#131B2E]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131B2E]/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>English Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('hinglish')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'hinglish'
                ? 'border-[#3B82F6] text-[#3B82F6] bg-[#131B2E]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131B2E]/50'
            }`}
          >
            <Languages className="w-4 h-4" />
            <span>Hinglish Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('transcript')}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold rounded-t-xl border-b-2 transition-all ${
              activeTab === 'transcript'
                ? 'border-[#3B82F6] text-[#3B82F6] bg-[#131B2E]'
                : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#131B2E]/50'
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] text-xs font-medium transition"
            >
              {copiedTab === 'english' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Copy English</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'hinglish' && (
            <button
              onClick={() => handleCopy(hinglishNotes, 'hinglish')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] text-xs font-medium transition"
            >
              {copiedTab === 'hinglish' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Copy Hinglish</span>
                </>
              )}
            </button>
          )}

          {activeTab === 'transcript' && (
            <button
              onClick={() => handleCopy(transcriptText, 'transcript')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-[#1E293B] border border-[#232F48] text-[#F8FAFC] text-xs font-medium transition"
            >
              {copiedTab === 'transcript' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[#10B981]">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />
                  <span>Copy Transcript</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Content Reading Zones (Strict Neutral Legibility Rules) */}
      <div className="p-6 sm:p-8">
        {activeTab === 'english' && (
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-[#F8FAFC] prose-h1:text-xl prose-h1:text-[#3B82F6] prose-h2:text-lg prose-h2:text-[#60A5FA] prose-p:text-[#F8FAFC] prose-p:leading-[1.75] prose-li:text-[#F8FAFC] prose-li:leading-[1.75]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {englishNotes}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === 'hinglish' && (
          <div className="prose prose-invert max-w-none prose-headings:font-bold prose-headings:text-[#F8FAFC] prose-h1:text-xl prose-h1:text-[#3B82F6] prose-h2:text-lg prose-h2:text-[#60A5FA] prose-p:text-[#F8FAFC] prose-p:leading-[1.75] prose-li:text-[#F8FAFC] prose-li:leading-[1.75]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {hinglishNotes}
            </ReactMarkdown>
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search keywords in verbatim transcript..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#0B0F17] border border-[#232F48] text-sm text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#3B82F6]"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2">
              {filteredTranscript.length > 0 ? (
                filteredTranscript.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#0B0F17]/60 border border-[#232F48]/80 hover:border-[#3B82F6]/50 transition"
                  >
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#3B82F6]/10 text-[#60A5FA] font-mono text-xs font-semibold shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(item.start)}
                    </span>
                    <p className="text-xs sm:text-sm text-[#F8FAFC] leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#94A3B8] text-sm">
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
