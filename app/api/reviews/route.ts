import { NextRequest, NextResponse } from 'next/server';
import { getCompanyReviews, addReview, getReviews } from '../../../lib/db';
import { guardPublicWrite } from '../../../lib/security/public-write';
import {
  publicWriteFailure,
  publicWriteSuccess,
} from '../../../lib/api/public-write-response';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('company_id');
    const company = searchParams.get('company');

    if (companyId) {
      const { getCompanyReviewsById } = require('../../../lib/db');
      const reviews = await getCompanyReviewsById(companyId);
      return NextResponse.json({ success: true, data: reviews });
    }

    if (company) {
      const reviews = await getCompanyReviews(company);
      return NextResponse.json({ success: true, data: reviews });
    }

    const allReviews = await getReviews();
    
    // Also extract the list of distinct company names and IDs for autocomplete!
    const distinctCompanies = Array.from(new Set(allReviews.map(r => r.company_name)));

    return NextResponse.json({ success: true, data: allReviews, companies: distinctCompanies });
  } catch (error: any) {
    console.error('API Error in GET reviews:', error);
    return NextResponse.json(
      { success: false, error: '获取评价记录失败，请稍后重试。' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_name,
      country_code,
      country_name,
      branch_location,
      position,
      employment_status,
      salary,
      bonus,
      experience_years,
      daily_work_hours,
      weekly_work_days,
      rating_career,
      rating_balance,
      rating_management,
      rating_compensation,
      rating_culture,
      review_text,
      humanVerificationToken
    } = body;

    // Validate inputs
    if (
      !company_name ||
      !country_name ||
      !branch_location ||
      !position ||
      !review_text
    ) {
      return NextResponse.json(
        { success: false, error: '必填项未填写完整。' },
        { status: 400 }
      );
    }

    if (
      typeof rating_career !== 'number' ||
      typeof rating_balance !== 'number' ||
      typeof rating_management !== 'number' ||
      typeof rating_compensation !== 'number' ||
      typeof rating_culture !== 'number'
    ) {
      return NextResponse.json(
        { success: false, error: '评分信息不合法。' },
        { status: 400 }
      );
    }

    const dailyHours = Number(daily_work_hours);
    const weeklyDays = Number(weekly_work_days);
    if (
      !Number.isFinite(dailyHours) ||
      dailyHours <= 0 ||
      dailyHours > 24 ||
      !Number.isFinite(weeklyDays) ||
      weeklyDays <= 0 ||
      weeklyDays > 7
    ) {
      return NextResponse.json(
        { success: false, error: '每天工作时长或每周工作天数不合法。' },
        { status: 400 }
      );
    }

    const identity = await guardPublicWrite(
      req,
      'review-create',
      humanVerificationToken,
      company_name.trim().toLowerCase()
    );
    const newReview = await addReview(
      {
        company_name: company_name.trim(),
        branch_location: branch_location.trim(),
        position: position.trim(),
        employment_status: employment_status || 'current',
        salary: Number(salary) || 0,
        bonus: Number(bonus) || 0,
        experience_years: Number(experience_years) || 1,
        daily_work_hours: dailyHours,
        weekly_work_days: weeklyDays,
        rating_career: Number(rating_career),
        rating_balance: Number(rating_balance),
        rating_management: Number(rating_management),
        rating_compensation: Number(rating_compensation),
        rating_culture: Number(rating_culture),
        review_text: review_text.trim(),
      },
      {
        countryCode: typeof country_code === 'string' ? country_code.trim() : undefined,
        countryName:
          typeof country_name === 'string' ? country_name.trim() : undefined,
        city: branch_location.trim(),
      }
    );

    return publicWriteSuccess(identity, newReview);
  } catch (error: any) {
    console.error('API Error in POST reviews:', error);
    return publicWriteFailure(error);
  }
}
