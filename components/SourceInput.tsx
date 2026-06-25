'use client';

import { useState } from 'react';

interface SourceInputProps {
  onAnalyze: (url: string) => void;
  onSync: (url: string, maxArticles: number) => void;
  loading: boolean;
}

export default function SourceInput({ onAnalyze, onSync, loading }: SourceInputProps) {
  const [url, setUrl] = useState('');
  const [maxArticles, setMaxArticles] = useState(10);

  const isValid = url.trim().length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <label htmlFor="sourceUrl" className="block text-sm font-medium text-slate-700 mb-2">
        Source Website URL
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="sourceUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/blog"
          className="flex-1 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2.5 border"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600 whitespace-nowrap">Max:</label>
          <input
            type="number"
            min={1}
            max={100}
            value={maxArticles}
            onChange={(e) => setMaxArticles(Number(e.target.value))}
            className="w-20 rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-3 py-2.5 border"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          onClick={() => onAnalyze(url)}
          disabled={!isValid || loading}
          className="flex-1 bg-white text-primary-700 border border-primary-300 hover:bg-primary-50 font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Analyze Website
        </button>
        <button
          onClick={() => onSync(url, maxArticles)}
          disabled={!isValid || loading}
          className="flex-1 bg-primary-600 text-white hover:bg-primary-700 font-medium py-2.5 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start Sync
        </button>
      </div>
    </div>
  );
}