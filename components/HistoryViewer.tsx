'use client';

import { SyncHistoryEntry } from '@/lib/types';

interface HistoryViewerProps {
  history: SyncHistoryEntry[];
}

export default function HistoryViewer({ history }: HistoryViewerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Sync History</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Source URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Found
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Imported
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Skipped
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Started
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No sync history yet.
                </td>
              </tr>
            )}
            {history.map((entry) => (
              <tr key={entry.id}>
                <td className="px-6 py-4 text-sm text-slate-900 truncate max-w-xs">
                  {entry.sourceUrl}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={entry.status} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{entry.articlesFound}</td>
                <td className="px-6 py-4 text-sm text-green-600">{entry.articlesImported}</td>
                <td className="px-6 py-4 text-sm text-amber-600">{entry.articlesSkipped}</td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(entry.startedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: SyncHistoryEntry['status'] }) {
  const styles = {
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}