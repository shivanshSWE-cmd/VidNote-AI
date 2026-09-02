'use client';

import React, { useState } from 'react';
import { Download, Youtube, Instagram, Clock, User, FileSpreadsheet, Loader2, Globe } from 'lucide-react';
import { VideoOsintData } from '@/lib/osintEngine';
import { generateClientDocx } from '@/lib/docxGenerator';

interface ExportToolbarProps {
  osintData: VideoOsintData;
  englishNotes: string;
  hinglishNotes: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  osintData,
  englishNotes,
  hinglishNotes,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadDocx = async () => {
    setDownloading(true);
    setError(null);
    try {
      await generateClientDocx(osintData, englishNotes, hinglishNotes);
    } catch (err: any) {
      setError(err.message || 'Error generating .docx document.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#131B2E] border border-[#232F48] rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Metadata & OSINT Info Header */}
        <div className="flex items-start sm:items-center gap-4">
          {osintData.thumbnail ? (
            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-[#0B0F17] shrink-0 border border-[#232F48]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={osintData.thumbnail}
                alt={osintData.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#0B0F17] flex items-center gap-1 border border-[#232F48]">
                {osintData.platform === 'youtube' ? (
                  <>
                    <Youtube className="w-3 h-3 text-[#EF4444]" />
                    <span className="text-[#EF4444]">YouTube</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-3 h-3 text-[#E1306C]" />
                    <span className="text-[#E1306C]">Instagram</span>
                  </>
                )}
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>OSINT Open Data</span>
              </span>

              <span className="text-[#94A3B8] text-xs">•</span>
              <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                <User className="w-3 h-3" /> {osintData.uploader}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F8FAFC] line-clamp-1">
              {osintData.title}
            </h2>
          </div>
        </div>

        {/* Emerald Green Conversion Action */}
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating .docx...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Word Document (.docx)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-xs text-[#DC2626] bg-[#DC2626]/10 border border-[#DC2626]/20 rounded-xl p-3">
          {error}
        </div>
      )}
    </div>
  );
};
