import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';

export const dynamic = 'force-dynamic';

const syncService = new SyncService(storage);
const cronSecret = process.env.CRON_SECRET;

/**
 * Vercel Cron Jobs compatible endpoint.
 * Trigger via Vercel cron config or manually with CRON_SECRET header.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional protection
    if (cronSecret) {
      const authHeader = request.headers.get('authorization');
      const secretParam = new URL(request.url).searchParams.get('secret');
      if (authHeader !== `Bearer ${cronSecret}` && secretParam !== cronSecret) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const schedules = await syncService.getSchedules();
    const now = new Date();
    const results: Array<{ sourceUrl: string; status: string; error?: string }> = [];

    for (const schedule of schedules) {
      if (!schedule.enabled || schedule.frequency === 'manual') continue;
      if (schedule.nextRunAt && new Date(schedule.nextRunAt) > now) continue;

      try {
        const result = await syncService.sync(schedule.sourceUrl);
        results.push({
          sourceUrl: schedule.sourceUrl,
          status: result.success ? 'completed' : 'failed',
        });
      } catch (error) {
        results.push({
          sourceUrl: schedule.sourceUrl,
          status: 'failed',
          error: (error as Error).message,
        });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}