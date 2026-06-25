'use client';

import { useState } from 'react';
import { LogEntry } from '@/lib/types';

interface LogsViewerProps {
  logs: LogEntry[];
}

export default function LogsViewer({ logs }: LogsViewerProps) {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filtered = filter === 'all' ? logs : logs.filter((l) => l.level === filter);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'warn':
        return 'text-amber-600 bg-amber-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Sync Logs</h2>
        <div className="flex gap-2">
          {(['all', 'info', 'warn', 'error'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === level
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      <div className="max-h-[600px] overflow-y-auto font-mono text-sm">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">No logs found.</div>
        )}
        {filtered.map((log) => (
          <div
            key={log.id}
            className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
          >
            <div className="flex items-start gap-3">
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getLevelColor(
                  log.level
                )}`}
              >
                {log.level}
              </span>
              <div className="flex-1">
                <p className="text-slate-800">{log.message}</p>
                <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                  {log.sourceUrl && <span>Source: {log.sourceUrl}</span>}
                  {log.syncId && <span>Sync: {log.syncId.slice(0, 8)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}