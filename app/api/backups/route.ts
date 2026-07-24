import { NextRequest, NextResponse } from 'next/server';
import { loadBackupMetadata, createBackupForDate, initBackupScheduler } from '../../../lib/backups';

export async function GET(req: NextRequest) {
  try {
    // Safely initialize backup scheduler daemon at runtime
    try {
      initBackupScheduler();
    } catch (schedError) {
      console.warn('Failed to lazily initialize backup scheduler:', schedError);
    }

    const list = await loadBackupMetadata();
    return NextResponse.json({ success: true, backups: list });
  } catch (error: any) {
    console.error('Error fetching backups list:', error);
    return NextResponse.json(
      { success: false, error: '获取备份列表失败，请稍后重试。' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Safely initialize backup scheduler daemon at runtime
    try {
      initBackupScheduler();
    } catch (schedError) {
      console.warn('Failed to lazily initialize backup scheduler:', schedError);
    }

    const body = await req.json().catch(() => ({}));
    const { date } = body;

    // Use current date if not specified
    let targetDate = date;
    if (!targetDate) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    const metadata = await createBackupForDate(targetDate);
    if (!metadata) {
      return NextResponse.json(
        { success: false, error: '备份生成失败。' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, backup: metadata });
  } catch (error: any) {
    console.error('Error triggering manual backup:', error);
    return NextResponse.json(
      { success: false, error: '触发备份任务失败，请检查网络或配置。' },
      { status: 500 }
    );
  }
}
