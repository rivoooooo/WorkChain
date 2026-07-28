import { NextRequest, NextResponse } from 'next/server';
import { getCompanies } from '../../../lib/db';
import { getCachedCompanyById } from '../../../lib/cached-db';
import { createCompany } from '@/lib/company-governance';
import { guardPublicWrite } from '@/lib/security/public-write';
import {
  publicWriteFailure,
  publicWriteSuccess,
} from '@/lib/api/public-write-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (id) {
      const company = await getCachedCompanyById(id);
      if (!company) {
        return NextResponse.json(
          { success: false, error: '未找到该企业。' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: true, data: company },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
          },
        }
      );
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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const humanVerificationToken =
      typeof body.humanVerificationToken === 'string'
        ? body.humanVerificationToken
        : undefined;
    const profile =
      body.profile && typeof body.profile === 'object' && !Array.isArray(body.profile)
        ? (body.profile as Record<string, unknown>)
        : Object.fromEntries(
            Object.entries(body).filter(([key]) => key !== 'humanVerificationToken')
          );

    const identity = await guardPublicWrite(
      req,
      'company-create',
      humanVerificationToken
    );
    const result = await createCompany(profile);
    return publicWriteSuccess(identity, result, result.created ? 201 : 200);
  } catch (error) {
    return publicWriteFailure(error);
  }
}
