import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { getCompanyReviews } from '../../../lib/db';

const supportedOutputLanguages = {
  zh: 'Simplified Chinese (简体中文)',
  'zh-tw': 'Traditional Chinese (繁體中文)',
  en: 'English',
  ja: 'Japanese (日本語)',
  ar: 'Arabic (العربية)',
  hi: 'Hindi (हिन्दी)',
  tr: 'Turkish (Türkçe)',
  es: 'Spanish (Español)',
  bo: 'Tibetan (བོད་ཡིག)',
} as const;

type OutputLanguage = keyof typeof supportedOutputLanguages;

// Lazy initialization of Gemini Client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, companyName: passedCompanyName } = body;
    const language: OutputLanguage =
      typeof body.language === 'string' && body.language in supportedOutputLanguages
        ? (body.language as OutputLanguage)
        : 'en';
    const outputLanguage = supportedOutputLanguages[language];
    const relatedCompanyIds = Array.isArray(body.relatedCompanyIds)
      ? Array.from(
          new Set(
            body.relatedCompanyIds.filter(
              (value: unknown): value is string =>
                typeof value === 'string' && /^comp-[0-9a-z-]{8,64}$/i.test(value)
            )
          )
        ).slice(0, 10)
      : [];

    let companyName = passedCompanyName;
    let reviews: Awaited<ReturnType<typeof getCompanyReviews>> = [];
    const includedCompanies: { id: string; name: string; location: string }[] = [];

    if (companyId) {
      const { getCompanyById, getCompanyReviewsById } = require('../../../lib/db');
      const company = await getCompanyById(companyId);
      if (company) {
        companyName = company.name;
        includedCompanies.push({
          id: company.id,
          name: company.name,
          location: [company.province, company.city].filter(Boolean).join(' / '),
        });
      }
      reviews = await getCompanyReviewsById(companyId);
      const related = await Promise.all(
        relatedCompanyIds
          .filter((id) => id !== companyId)
          .map(async (id) => {
            const relatedCompany = await getCompanyById(id);
            if (!relatedCompany) return [];
            includedCompanies.push({
              id: relatedCompany.id,
              name: relatedCompany.name,
              location: [relatedCompany.province, relatedCompany.city]
                .filter(Boolean)
                .join(' / '),
            });
            return getCompanyReviewsById(id);
          })
      );
      reviews = reviews.concat(...related);
    } else if (companyName) {
      reviews = await getCompanyReviews(companyName);
    }

    if (!companyName) {
      return NextResponse.json(
        { success: false, error: '缺少公司标识或名称参数。' },
        { status: 400 }
      );
    }

    if (reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: `没有找到关于 ${companyName} 的评价记录，无法生成分析。` },
        { status: 404 }
      );
    }

    // Heuristically calculate scores from reviews for both fallback and as context
    const avgCareer = reviews.reduce((acc: number, r: any) => acc + r.rating_career, 0) / reviews.length;
    const avgBalance = reviews.reduce((acc: number, r: any) => acc + r.rating_balance, 0) / reviews.length;
    const avgMgmt = reviews.reduce((acc: number, r: any) => acc + r.rating_management, 0) / reviews.length;
    const avgComp = reviews.reduce((acc: number, r: any) => acc + r.rating_compensation, 0) / reviews.length;
    const avgCulture = reviews.reduce((acc: number, r: any) => acc + r.rating_culture, 0) / reviews.length;
    const avgSalary = reviews.reduce((acc: number, r: any) => acc + r.salary, 0) / reviews.length;
    const workScheduleRows = reviews.filter(
      (review) =>
        review.daily_work_hours !== null && review.weekly_work_days !== null
    );
    const avgDailyWorkHours =
      workScheduleRows.reduce(
        (sum, review) => sum + Number(review.daily_work_hours),
        0
      ) / Math.max(workScheduleRows.length, 1);
    const avgWeeklyWorkDays =
      workScheduleRows.reduce(
        (sum, review) => sum + Number(review.weekly_work_days),
        0
      ) / Math.max(workScheduleRows.length, 1);

    // Build default fallback data in case AI is not configured or fails
    const fallbackReport = {
      sentimentScore: Math.round(((avgCareer + avgBalance + avgMgmt + avgComp + avgCulture) / 25) * 100),
      overallSentiment: avgBalance >= 3.5 ? '积极' : avgBalance >= 2.5 ? '中立' : '消极',
      overallSummary: `基于该公司的 ${reviews.length} 份匿名员工评价，公司在薪资待遇、职业成长、企业文化等维度各具特点。职场环境的整体满意度评分适中，主要由于员工对于工作负荷 and 管理效率的态度存在一定分化。`,
      wlbScore: Math.round(avgBalance * 20),
      pressureScore: Math.round((6 - avgBalance) * 20), // More pressure if balance is lower
      collabScore: Math.round(avgCulture * 20),
      trustScore: Math.round(avgMgmt * 20),
      compScore: Math.round(avgComp * 20),
      pros: [
        avgComp >= 4 ? '薪酬福利在行业内具有竞争力' : '底薪及各项补贴保障较为完善',
        avgCareer >= 4 ? '核心业务成长迅速，锻炼价值大' : '工作流程规范，能积累大厂化经验',
        '办公硬件设施优质，节日关怀到位'
      ],
      cons: [
        avgBalance <= 3 ? '加班文化盛行，WLB（工作平衡）较难保证' : '工作节奏快，沟通成本略高',
        avgMgmt <= 3 ? '考评考核（如OKR）指标严苛，竞争压力大' : '部门层级较多，审批及推进较慢',
        '汇报及文档撰写工作较多，存在形式主义'
      ],
      cultureCharacteristics: [
        avgBalance <= 3 ? '快节奏/抗压' : '注重规范',
        avgCareer >= 4 ? '技术/成长导向' : '稳定/福利',
        '数据/结果导向'
      ],
      careerAdvice: `建议求职者在面试时充分沟通该组别的具体加班情况。若看重职业成长速度与薪资包，且对高强度工作节奏适应力强，该公司是极佳选择；若更重视生活平衡，需慎重选择高压业务线。`,
      salaryAnalysis: `平均月薪约为 ${(avgSalary / 1000).toFixed(1)}K，其中年终奖平均在 ${(reviews.reduce((acc: number, r: any) => acc + r.bonus, 0) / reviews.length / 10000).toFixed(1)} 万左右。薪资分布符合行业大厂常态，高级岗位溢价明显，且普遍具有长期激励（股票）。`,
      workScheduleAnalysis:
        workScheduleRows.length > 0
          ? `基于 ${workScheduleRows.length} 条工时样本，平均每天工作 ${avgDailyWorkHours.toFixed(1)} 小时、每周工作 ${avgWeeklyWorkDays.toFixed(1)} 天。`
          : '暂时没有足够的工作时长样本。',
      analysisScope: includedCompanies,
    };

    const ai = getGeminiClient();
    if (!ai) {
      console.log('Gemini API key is not configured, returning fully structured heuristic report.');
      return NextResponse.json({ success: true, isMock: true, data: fallbackReport });
    }

    try {
      // Compile reviews context for Gemini
      const reviewsContext = reviews.map((r: any, i: number) => {
        return `评价 ${i + 1} (${r.position} - ${r.branch_location}):
- 月薪: ${r.salary}元, 年终奖: ${r.bonus}元
- 工作安排: 每天 ${r.daily_work_hours ?? '未提供'} 小时, 每周 ${r.weekly_work_days ?? '未提供'} 天
- 评分: 职业发展 ${r.rating_career}/5, WLB ${r.rating_balance}/5, 管理层 ${r.rating_management}/5, 薪酬福利 ${r.rating_compensation}/5, 团队文化 ${r.rating_culture}/5
- 内容: "${r.review_text}"`;
      }).join('\n\n');

      const prompt = `你是一个资深的职场咨询与企业文化分析专家。请根据以下关于 ${companyName} 及用户主动选择的相关分区/相似名称企业的真实匿名员工评价（共 ${reviews.length} 条），进行深度的语义分析和综合评估。
本次分析范围：${includedCompanies.map((item) => `${item.name}（${item.location || '地区未提供'}）`).join('、')}
请注意：评价数据完全匿名，绝对不能在报告中泄露个人隐私。

输出语言要求：所有面向用户的字符串字段必须使用 ${outputLanguage}。即使原始评价使用其他语言，也必须将分析结论翻译为 ${outputLanguage}。公司名称、专有名词和数值可以保留原文。JSON 属性名必须保持 Schema 中定义的英文名称，不得翻译。

员工评价数据：
${reviewsContext}

请仔细分析，并严格按照 JSON Schema 的要求返回结构化分析报告：
1. 提取整体情绪倾向和情感分（0-100分）。
2. 生成 2-3 句的精炼综合总结。
3. 对五个文化/环境维度打分（0-100分，包括工作平衡 WLB、抗压等级 Pressure、团队协作 Collaboration、管理层信任 Trust、薪酬满意度 Compensation）。
4. 归纳关键优点（Pros）与槽点（Cons）（各 2-3 条）。
5. 提取 3 个代表公司文化特点的词汇/标签。
6. 为求职者提供实用的职业发展建议。
7. 提供详细的薪资水平与性价比分析报告。
8. 根据每天工作时长与每周工作天数分析工作强度。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sentimentScore: { type: Type.INTEGER, description: '整体满意度/情感得分 (0-100)' },
              overallSentiment: { type: Type.STRING, description: '整体情感倾向 (积极 / 中立 / 消极)' },
              overallSummary: { type: Type.STRING, description: '2-3句综合报告总结' },
              wlbScore: { type: Type.INTEGER, description: '工作生活平衡得分 (0-100)' },
              pressureScore: { type: Type.INTEGER, description: '抗压等级压力值得分 (0-100，越高压力越大)' },
              collabScore: { type: Type.INTEGER, description: '团队协作协作效率得分 (0-100)' },
              trustScore: { type: Type.INTEGER, description: '管理层信任与领导力得分 (0-100)' },
              compScore: { type: Type.INTEGER, description: '薪酬福利满意度得分 (0-100)' },
              pros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '提取的2-3个核心优势点'
              },
              cons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '提取的2-3个核心不足/槽点'
              },
              cultureCharacteristics: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3个高频文化特征关键词/标签'
              },
              careerAdvice: { type: Type.STRING, description: '给要求职该公司的候选人的建议' },
              salaryAnalysis: { type: Type.STRING, description: '基于披露数据的薪资水平和性价比分析' },
              workScheduleAnalysis: { type: Type.STRING, description: '基于每天工作时长和每周工作天数的工作强度分析' }
            },
            required: [
              'sentimentScore',
              'overallSentiment',
              'overallSummary',
              'wlbScore',
              'pressureScore',
              'collabScore',
              'trustScore',
              'compScore',
              'pros',
              'cons',
              'cultureCharacteristics',
              'careerAdvice',
              'salaryAnalysis',
              'workScheduleAnalysis'
            ]
          }
        }
      });

      const responseText = response.text;
      if (responseText) {
        const reportData = JSON.parse(responseText.trim());
        return NextResponse.json({
          success: true,
          isMock: false,
          data: { ...reportData, analysisScope: includedCompanies },
        });
      } else {
        throw new Error('Empty text response from Gemini API');
      }
    } catch (apiError) {
      console.error('Gemini API call failed, using high-fidelity fallback:', apiError);
      return NextResponse.json({ success: true, isMock: true, data: fallbackReport });
    }
  } catch (error: any) {
    console.error('API Error in Gemini semantic analysis:', error);
    return NextResponse.json(
      { success: false, error: 'AI 语义分析失败，请稍后重试。' },
      { status: 500 }
    );
  }
}
