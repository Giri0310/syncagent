'use client';

import { useState, useEffect } from 'react';
import SourceInput from './SourceInput';
import ArticlesViewer from './ArticlesViewer';
import HistoryViewer from './HistoryViewer';
import LogsViewer from './LogsViewer';
import ScheduleSettings from './ScheduleSettings';
import { WebsiteAnalysis, SyncResult, Article, SyncHistoryEntry, LogEntry, ScheduleConfig } from '@/lib/types';

type Tab = 'dashboard' | 'articles' | 'history' | 'logs' | 'schedule';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const refreshData = async () => {
    try {
      const [articlesRes, historyRes, logsRes, schedulesRes] = await Promise.all([
        fetch('/api/articles').then((r) => r.json()),
        fetch('/api/history').then((r) => r.json()),
        fetch('/api/logs').then((r) => r.json()),
        fetch('/api/schedule').then((r) => r.json()),
      ]);

      if (articlesRes.success) setArticles(articlesRes.data);
      if (historyRes.success) setHistory(historyRes.data);
      if (logsRes.success) setLogs(logsRes.data);
      if (schedulesRes.success) setSchedules(schedulesRes.data);
    } catch (error) {
      console.error('Refresh failed:', error);
    }
  };

  const handleAnalyze = async (url: string) => {
    setLoading(true);
    setAnalysis(null);
    setSyncResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: url }),
      });
      const json = await res.json();
      if (json.success) {
        setAnalysis(json.data);
      } else {
        alert(json.error || 'Analysis failed');
      }
    } catch (error) {
      alert('Analysis failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (url: string, maxArticles: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: url, maxArticles }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncResult(json.data);
        await refreshData();
      } else {
        alert(json.error || 'Sync failed');
      }
    } catch (error) {
      alert('Sync failed: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    try {
      const res = await fetch('/api/articles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        await refreshData();
      } else {
        alert(json.error || 'Delete failed');
      }
    } catch (error) {
      alert('Delete failed: ' + (error as Error).message);
    }
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'articles', label: 'Articles', count: articles.length },
    { key: 'history', label: 'History', count: history.length },
    { key: 'logs', label: 'Logs', count: logs.length },
    { key: 'schedule', label: 'Schedule', count: schedules.length },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Generic Content Sync Agent</h1>
              <p className="text-sm text-slate-500 mt-1">
                Analyze websites, extract articles, and sync content automatically.
              </p>
            </div>
            {loading && (
              <div className="flex items-center text-primary-600">
                <svg
                  className="animate-spin -ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Working...
              </div>
            )}
          </div>

          {/* Tabs */}
          <nav className="flex space-x-1 mt-4 -mb-px overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-2 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                {typeof tab.count === 'number' && (
                  <span className="ml-2 bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <SourceInput onAnalyze={handleAnalyze} onSync={handleSync} loading={loading} />

            {analysis && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Website Analysis</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <StatCard label="Website Type" value={analysis.websiteType} />
                  <StatCard label="Site Title" value={analysis.title || 'N/A'} />
                  <StatCard label="Articles Detected" value={analysis.totalArticleUrls.toString()} />
                  <StatCard label="Sample URLs" value={analysis.sampleArticleUrls.length.toString()} />
                </div>
                {analysis.description && (
                  <p className="text-slate-600 text-sm mb-4">{analysis.description}</p>
                )}
                {analysis.sampleArticleUrls.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-2">Sample Article URLs</h3>
                    <ul className="space-y-1 max-h-40 overflow-y-auto">
                      {analysis.sampleArticleUrls.map((url, idx) => (
                        <li key={idx} className="text-xs text-slate-500 truncate">
                          {url}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {syncResult && (
              <div
                className={`rounded-lg shadow-sm border p-6 ${
                  syncResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Sync Result: {syncResult.success ? 'Success' : 'Failed'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <StatCard label="Articles Found" value={syncResult.articlesFound.toString()} />
                  <StatCard label="Imported" value={syncResult.articlesImported.toString()} />
                  <StatCard label="Skipped" value={syncResult.articlesSkipped.toString()} />
                  <StatCard label="Errors" value={syncResult.errors.length.toString()} />
                </div>
                {syncResult.errors.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-red-700 mb-2">Errors</h3>
                    <ul className="space-y-1">
                      {syncResult.errors.map((err, idx) => (
                        <li key={idx} className="text-xs text-red-600">
                          {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'articles' && (
          <ArticlesViewer articles={articles} onDelete={handleDeleteArticle} />
        )}
        {activeTab === 'history' && <HistoryViewer history={history} />}
        {activeTab === 'logs' && <LogsViewer logs={logs} />}
        {activeTab === 'schedule' && (
          <ScheduleSettings schedules={schedules} onUpdate={refreshData} />
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 truncate" title={value}>
        {value}
      </p>
    </div>
  );
}