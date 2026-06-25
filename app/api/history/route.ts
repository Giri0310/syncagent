import { NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';

const syncService = new SyncService(storage);

export async function GET() {
  try {
    const history = await syncService.getSyncHistory();
    return NextResponse.json({ success: true, data: history });
  } catch (error) {
    console.error('History error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}