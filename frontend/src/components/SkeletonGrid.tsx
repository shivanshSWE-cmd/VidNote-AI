'use client';

import React from 'react';

export default function SkeletonGrid() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      {/* Skeleton Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-2">
          <div className="h-6 w-64 bg-slate-800 rounded-md" />
          <div className="h-4 w-40 bg-slate-800/60 rounded-md" />
        </div>
        <div className="h-10 w-48 bg-slate-800 rounded-xl" />
      </div>

      {/* Skeleton Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video bg-[#161E2E] border border-slate-800/80 rounded-xl p-2 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-16 bg-slate-800 rounded" />
              <div className="h-5 w-5 bg-slate-800 rounded-full" />
            </div>
            <div className="flex justify-between items-end">
              <div className="h-5 w-20 bg-slate-800 rounded-md" />
              <div className="h-4 w-12 bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
