import { NextRequest, NextResponse } from 'next/server';
import { getBackupPublicUrl } from '../../../../lib/backups';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format');
    if (!id || !format) {
      return NextResponse.json(
        { success: false, error: '缺少必需的参数 id 或 format。' },
        { status: 400 }
      );
    }
    if (format !== 'csv' && format !== 'xlsx' && format !== 'sql') {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式，仅支持 csv、xlsx、sql。' },
        { status: 400 }
      );
    }

    const publicUrl = await getBackupPublicUrl(id, format);
    if (!publicUrl) {
      return NextResponse.json(
        { success: false, error: '未找到该公开快照，文件可能已经过期。' },
        { status: 404 }
      );
    }
    return NextResponse.redirect(publicUrl, 307);
  } catch (error) {
    console.error('Error during snapshot download:', error);
    return NextResponse.json(
      { success: false, error: '下载公开快照时发生错误。' },
      { status: 500 }
    );
  }
}
