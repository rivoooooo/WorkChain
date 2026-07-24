import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { companies, companyDetails, companyLinks } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || searchParams.get('id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Missing company_id parameter' }, { status: 400 });
    }

    // 1. 获取 companies 基础数据
    const companyRows = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const company = companyRows[0] || null;

    // 2. 获取 company_details 扩展详细属性
    const detailRows = await db
      .select()
      .from(companyDetails)
      .where(eq(companyDetails.company_id, companyId))
      .limit(1);

    const details = detailRows[0] || null;

    // 3. 获取 company_links 媒体与链接
    const links = await db
      .select()
      .from(companyLinks)
      .where(eq(companyLinks.company_id, companyId));

    return NextResponse.json({
      success: true,
      data: {
        company,
        details,
        links,
      },
    });
  } catch (error: any) {
    console.error('Error fetching company details API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch company detailed info' },
      { status: 500 }
    );
  }
}
