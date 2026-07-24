import { NextRequest, NextResponse } from 'next/server';
import { getBackupBinary } from '../../../../lib/backups';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const format = searchParams.get('format');

    if (!id || !format) {
      return NextResponse.json(
        { success: false, error: '缺少必需的参数 id 或 format。' },
        { status: 400 }
      );
    }

    const binaryData = await getBackupBinary(id);
    if (!binaryData) {
      return NextResponse.json(
        { success: false, error: '未找到该备份的二进制数据，文件可能已被清理或尚未生成。' },
        { status: 404 }
      );
    }

    let buffer: Buffer;
    let contentType = 'application/octet-stream';

    if (format === 'csv') {
      if (!binaryData.csvBase64) {
        return NextResponse.json({ success: false, error: '未找到 CSV 备份数据。' }, { status: 404 });
      }
      buffer = Buffer.from(binaryData.csvBase64, 'base64');
      contentType = 'text/csv; charset=utf-8';
    } else if (format === 'xlsx') {
      if (!binaryData.xlsxBase64) {
        return NextResponse.json({ success: false, error: '未找到 Excel (XLSX) 备份数据。' }, { status: 404 });
      }
      buffer = Buffer.from(binaryData.xlsxBase64, 'base64');
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (format === 'sql') {
      if (!binaryData.sqlBase64) {
        return NextResponse.json({ success: false, error: '未找到 SQL 备份数据。' }, { status: 404 });
      }
      buffer = Buffer.from(binaryData.sqlBase64, 'base64');
      contentType = 'application/sql; charset=utf-8';
    } else {
      return NextResponse.json(
        { success: false, error: '不支持的文件格式，仅支持 csv、xlsx、sql。' },
        { status: 400 }
      );
    }

    // Set headers for download
    const filename = `${id}.${format}`;
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    headers.set('Content-Length', String(buffer.length));

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers
    });
  } catch (error: any) {
    console.error('Error during backup file download:', error);
    return NextResponse.json(
      { success: false, error: '下载备份文件时发生未知错误。' },
      { status: 500 }
    );
  }
}
