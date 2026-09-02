'use client';

import React, { useState } from 'react';
import { Download, Youtube, Instagram, Clock, User, Sparkles, FileSpreadsheet, Loader2 } from 'lucide-react';

interface ExportToolbarProps {
  title: string;
  url: string;
  platform: string;
  durationStr: string;
  uploader: string;
  thumbnail: string;
  englishNotes: string;
  hinglishNotes: string;
  transcriptText: string;
  backendUrl: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  title,
  url,
  platform,
  durationStr,
  uploader,
  thumbnail,
  englishNotes,
  hinglishNotes,
  transcriptText,
  backendUrl,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadDocx = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`${backendUrl}/api/export-docx`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          url,
          platform,
          duration_str: durationStr,
          uploader,
          english_notes: englishNotes,
          hinglish_notes: hinglishNotes,
          transcript_text: transcriptText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document.');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeTitle = title.replace(/[^a-zA-Z0-9_\-]/g, '_').substring(0, 30);
      a.download = `VidNote_${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Error downloading docx file.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Video Metadata Card */}
        <div className="flex items-start sm:items-center gap-4">
          {thumbnail ? (
            <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700">
                {platform.toLowerCase() === 'youtube' ? (
                  <>
                    <Youtube className="w-3 h-3 text-red-500" />
                    <span>YouTube</span>
                  </>
                ) : (
                  <>
                    <Instagram className="w-3 h-3 text-pink-500" />
                    <span>Instagram</span>
                  </>
                )}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {durationStr}
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3" /> {uploader}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100 line-clamp-1">
              {title}
            </h2>
          </div>
        </div>

        {/* Download Word Document Action */}
        <div className="shrink-0 w-full md:w-auto">
          <button
            onClick={handleDownloadDocx}
            disabled={downloading}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 transition-all transform active:scale-95 disabled:opacity-50"
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
        <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
          {error}
        </div>
      )}
    </div>
  );
};
