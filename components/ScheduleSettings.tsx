'use client';

import { useState } from 'react';
import { ScheduleConfig } from '@/lib/types';

interface ScheduleSettingsProps {
  schedules: ScheduleConfig[];
  onUpdate: () => void;
}

export default function ScheduleSettings({ schedules, onUpdate }: ScheduleSettingsProps) {
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState<ScheduleConfig['frequency']>('manual');
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: url,
          frequency,
          time,
          enabled: true,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setUrl('');
        onUpdate();
      } else {
        alert(json.error || 'Failed to set schedule');
      }
    } catch (error) {
      alert('Failed to set schedule: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setToggling(id);
    try {
      const res = await fetch('/api/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate();
      } else {
        alert(json.error || 'Failed to update schedule');
      }
    } catch (error) {
      alert('Failed to update schedule: ' + (error as Error).message);
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return;
    setDeleting(id);
    try {
      const res = await fetch('/api/schedule', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        onUpdate();
      } else {
        alert(json.error || 'Failed to delete schedule');
      }
    } catch (error) {
      alert('Failed to delete schedule: ' + (error as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Schedule Sync</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Source Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/blog"
              required
              className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ScheduleConfig['frequency'])}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
              >
                <option value="manual">Manual</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time (HH:mm)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full rounded-lg border-slate-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 px-4 py-2 border"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !url}
            className="bg-primary-600 text-white hover:bg-primary-700 font-medium py-2.5 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Schedule'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Active Schedules</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {schedules.length === 0 && (
            <div className="p-8 text-center text-slate-500">No schedules configured.</div>
          )}
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-900">{schedule.sourceUrl}</p>
                  <p className="text-sm text-slate-500">
                    {schedule.frequency} at {schedule.time}
                    {schedule.nextRunAt && ` · Next: ${new Date(schedule.nextRunAt).toLocaleString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <button
                    onClick={() => handleToggle(schedule.id, !schedule.enabled)}
                    disabled={toggling === schedule.id}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      schedule.enabled
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    } disabled:opacity-50`}
                  >
                    {toggling === schedule.id
                      ? 'Saving...'
                      : schedule.enabled
                      ? 'Enabled'
                      : 'Disabled'}
                  </button>
                  <button
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleting === schedule.id}
                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    {deleting === schedule.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}