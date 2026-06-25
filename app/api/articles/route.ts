import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';

const syncService = new SyncService(storage);

export async function GET() {
  try {
    const articles = await syncService.getArticles();
    return NextResponse.json({ success: true, data: articles });
  } catch (error) {
    console.error('Articles error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required.' },
        { status: 400 }
      );
    }

    const deleted = await syncService.deleteArticle(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Article not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete article error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}