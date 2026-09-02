'use client';

import React from 'react';
import { Sparkles, Settings, Youtube, Instagram, BookOpen } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, hasApiKey }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-teal-400">
                VidNote AI
              </span>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                Pro
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              YouTube & Instagram Video Notes Generator
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Youtube className="w-4 h-4 text-red-500" />
            <span>YouTube</span>
            <span className="text-slate-600">•</span>
            <Instagram className="w-4 h-4 text-pink-500" />
            <span>Instagram</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium transition-all"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>API Settings</span>
            {hasApiKey && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
