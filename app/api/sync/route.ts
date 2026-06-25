import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';
import { isValidUrl } from '@/lib/utils';

const syncService = new SyncService(storage, './public/images');

export async function POST(request: NextRequest) {
  try {
    const { sourceUrl, maxArticles = 20 } = await request.json();

    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { success: false, error: 'A valid source URL is required.' },
        { status: 400 }
      );
    }

    const result = await syncService.sync(sourceUrl, Number(maxArticles) || 20);

    return NextResponse.json({ success: result.success, data: result });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}