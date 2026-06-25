import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';

const syncService = new SyncService(storage);

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') || undefined;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 100;

    const logs = await syncService.getLogs(level, limit);
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    console.error('Logs error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}