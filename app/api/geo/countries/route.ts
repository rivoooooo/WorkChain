import { NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { geoCountries } from '@/drizzle/schema';
import { asc } from 'drizzle-orm';

export async function GET() {
  try {
    const countries = await db
      .select({
        code: geoCountries.code,
        name: geoCountries.name,
        chinese_name: geoCountries.chinese_name,
      })
      .from(geoCountries)
      .orderBy(asc(geoCountries.code));

    if (!countries || countries.length === 0) {
      // 兜底常用国家列表
      return NextResponse.json({
        success: true,
        data: [
          { code: 'CN', name: 'China', chinese_name: '中国' },
          { code: 'US', name: 'United States', chinese_name: '美国' },
          { code: 'JP', name: 'Japan', chinese_name: '日本' },
          { code: 'GB', name: 'United Kingdom', chinese_name: '英国' },
          { code: 'SG', name: 'Singapore', chinese_name: '新加坡' },
          { code: 'HK', name: 'Hong Kong', chinese_name: '中国香港' },
        ],
      });
    }

    return NextResponse.json({ success: true, data: countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      {
        success: true,
        data: [
          { code: 'CN', name: 'China', chinese_name: '中国' },
          { code: 'US', name: 'United States', chinese_name: '美国' },
          { code: 'JP', name: 'Japan', chinese_name: '日本' },
        ],
      },
      { status: 200 }
    );
  }
}
