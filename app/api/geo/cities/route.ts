import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { geoCities } from '@/drizzle/schema';
import { eq, like, or, and, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryCode = (searchParams.get('country') || 'CN').toUpperCase();
    const query = searchParams.get('q')?.trim() || '';

    let filterCondition;

    if (query) {
      filterCondition = and(
        eq(geoCities.country_code, countryCode),
        or(
          like(geoCities.chinese_name, `%${query}%`),
          like(geoCities.name, `%${query}%`),
          like(geoCities.ascii_name, `%${query}%`),
          like(geoCities.alternate_names, `%${query}%`)
        )
      );
    } else {
      filterCondition = eq(geoCities.country_code, countryCode);
    }

    const cities = await db
      .select({
        id: geoCities.id,
        name: geoCities.name,
        ascii_name: geoCities.ascii_name,
        chinese_name: geoCities.chinese_name,
        country_code: geoCities.country_code,
        admin1_code: geoCities.admin1_code,
      })
      .from(geoCities)
      .where(filterCondition)
      .limit(50);

    // 常用中文大城市名称映射格式化
    const formattedCities = cities.map((c) => ({
      id: c.id,
      displayName: c.chinese_name || c.name,
      englishName: c.name,
      adminCode: c.admin1_code,
    }));

    return NextResponse.json({ success: true, data: formattedCities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cities' }, { status: 500 });
  }
}
