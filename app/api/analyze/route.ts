import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';
import { isValidUrl } from '@/lib/utils';

const syncService = new SyncService(storage);

export async function POST(request: NextRequest) {
  try {
    const { sourceUrl } = await request.json();

    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { success: false, error: 'A valid source URL is required.' },
        { status: 400 }
      );
    }

    const analysis = await syncService.analyze(sourceUrl);

    return NextResponse.json({ success: true, data: analysis });
  } catch (error) {
    console.error('Analyze error:', error);
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