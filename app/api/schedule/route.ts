import { NextRequest, NextResponse } from 'next/server';
import { SyncService } from '@/lib/services/sync-service';
import { storage } from '@/lib/storage/storage-factory';
import { isValidUrl } from '@/lib/utils';
import { ScheduleFrequency } from '@/lib/types';

const syncService = new SyncService(storage);

export async function POST(request: NextRequest) {
  try {
    const { sourceUrl, frequency, time, enabled } = await request.json();

    if (!sourceUrl || !isValidUrl(sourceUrl)) {
      return NextResponse.json(
        { success: false, error: 'A valid source URL is required.' },
        { status: 400 }
      );
    }

    if (!['manual', 'daily', 'weekly'].includes(frequency)) {
      return NextResponse.json(
        { success: false, error: 'Frequency must be manual, daily, or weekly.' },
        { status: 400 }
      );
    }

    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      return NextResponse.json(
        { success: false, error: 'Time must be in HH:mm format.' },
        { status: 400 }
      );
    }

    const schedule = await syncService.setSchedule(
      sourceUrl,
      frequency as ScheduleFrequency,
      time,
      enabled !== false
    );

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Schedule error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const schedules = await syncService.getSchedules();
    return NextResponse.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Schedule GET error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, enabled } = await request.json();
    if (!id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Schedule ID and enabled boolean are required.' },
        { status: 400 }
      );
    }

    const schedule = await syncService.toggleSchedule(id, enabled);
    if (!schedule) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Schedule PATCH error:', error);
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
        { success: false, error: 'Schedule ID is required.' },
        { status: 400 }
      );
    }

    const deleted = await syncService.deleteSchedule(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Schedule not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Schedule DELETE error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}