import { NextRequest, NextResponse } from 'next/server';
import { sqlClient } from '@/drizzle/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id') || searchParams.get('id');

    if (!companyId) {
      return NextResponse.json({ success: false, error: 'Missing company_id parameter' }, { status: 400 });
    }

    const companyRows = await sqlClient`
      select
        c.*,
        coalesce(p.profile_data ->> 'name', c.name) as name,
        coalesce(p.profile_data ->> 'creditCode', c.credit_code) as credit_code,
        coalesce(p.profile_data ->> 'countryCode', c.country_code) as country_code,
        coalesce(p.profile_data ->> 'countryName', c.country_name) as country_name,
        coalesce(p.profile_data ->> 'province', c.province) as province,
        coalesce(p.profile_data ->> 'city', c.city) as city
      from companies c
      left join current_company_profiles p on p.company_id = c.id
      where c.id = ${companyId}
      limit 1
    `;
    const company = companyRows[0] || null;

    const detailRows = await sqlClient`
      select
        coalesce(p.profile_data ->> 'legalRepresentative', d.legal_representative) as legal_representative,
        coalesce(p.profile_data ->> 'registeredCapital', d.registered_capital) as registered_capital,
        coalesce(p.profile_data ->> 'businessScope', d.business_scope) as business_scope,
        coalesce(p.profile_data ->> 'registeredAddress', d.registered_address) as registered_address,
        coalesce(p.profile_data ->> 'establishmentDate', d.establishment_date) as establishment_date,
        coalesce(p.profile_data ->> 'companyType', d.company_type) as company_type,
        p.profile_data ->> 'website' as website
      from companies c
      left join current_company_profiles p on p.company_id = c.id
      left join company_details d on d.company_id = c.id
      where c.id = ${companyId}
      limit 1
    `;
    const details = detailRows[0] || null;

    const links = await sqlClient`
      select *
      from company_links
      where company_id = ${companyId}
      order by created_at desc
    `;

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
