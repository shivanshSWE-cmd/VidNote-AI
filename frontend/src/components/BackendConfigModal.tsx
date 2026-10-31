'use client';

import React, { useState, useEffect } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, checkHealth } from '@/lib/api';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function BackendConfigModal({
  isOpen,
  onClose,
  onSaved,
}: BackendConfigModalProps) {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setApiBaseUrl(url);

    try {
      const data = await checkHealth();
      setTestResult({
        success: true,
        message: `Connected! FFmpeg: ${data.ffmpeg_available ? 'Available' : 'Missing'} | Service: ${data.service}`,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Failed to connect to backend server.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    onSaved();
    onClose();
  };

  const handleReset = () => {
    const defaultUrl = 'http://localhost:8000';
    setUrl(defaultUrl);
    setApiBaseUrl(defaultUrl);
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#161E2E] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Backend Service Settings</h3>
              <p className="text-xs text-slate-400">Configure FastAPI processing endpoint</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300">
            Backend API Base URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setTestResult(null);
              }}
              placeholder="http://localhost:8000"
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-semibold text-slate-200 rounded-xl border border-slate-700 transition"
            >
              {testing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Test</span>
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {testResult && (
          <div
            className={`flex items-start gap-2.5 p-3 rounded-xl text-xs border ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-300'
                : 'bg-red-950/40 border-red-800/50 text-red-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="font-medium">{testResult.message}</span>
              {!testResult.success && (
                <p className="text-[11px] text-slate-400">
                  Tip: If accessing from GitHub Pages, browsers block insecure HTTP requests. Host your backend with HTTPS (e.g. Render, Railway) or run locally via localhost.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Quick Guide Card */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
          <div className="font-semibold text-slate-300">How to run the backend:</div>
          <div className="space-y-1 font-mono text-[11px] text-slate-300 bg-black/40 p-2 rounded-lg">
            <div># Local Development</div>
            <div className="text-indigo-400">cd backend && python -m uvicorn app.main:app --port 8000</div>
            <div className="pt-1"># Docker Compose</div>
            <div className="text-indigo-400">docker compose up --build</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            Reset to default
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white rounded-xl shadow-lg shadow-indigo-600/30 transition"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
