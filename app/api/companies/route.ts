import { NextRequest, NextResponse } from 'next/server';
import { getCompanies, getCompanyById } from '../../../lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const company = await getCompanyById(id);
      if (!company) {
        return NextResponse.json(
          { success: false, error: '未找到该企业。' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, data: company });
    }

    const search = searchParams.get('search') || searchParams.get('q') || undefined;
    const limit = Number(searchParams.get('limit')) || 50;
    const companies = await getCompanies(search || undefined, limit);
    return NextResponse.json({ success: true, data: companies });
  } catch (error: any) {
    console.error('API Error in GET companies:', error);
    return NextResponse.json(
      { success: false, error: '获取企业目录失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
