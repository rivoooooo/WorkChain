import { NextRequest, NextResponse } from 'next/server';
import {
  cleanExpiredSnapshotFiles,
  createBackupForDate,
  loadBackupMetadata,
} from '../../../lib/backups';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      backups: await loadBackupMetadata(),
    });
  } catch (error) {
    console.error('Error fetching public snapshots:', error);
    return NextResponse.json(
      { success: false, error: '获取公开数据快照失败，请稍后重试。' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized snapshot trigger.' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => ({}))) as { date?: unknown };
    const date =
      typeof body.date === 'string'
        ? body.date
        : new Date().toISOString().slice(0, 10);
    const snapshot = await createBackupForDate(date);
    const cleanup = await cleanExpiredSnapshotFiles();
    return NextResponse.json({ success: true, backup: snapshot, cleanup });
  } catch (error) {
    console.error('Error creating public snapshot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '生成公开数据快照失败。',
      },
      { status: 500 }
    );
  }
}
