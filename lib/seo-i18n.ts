import type { Language } from './i18n';

export interface SeoMessages {
  title: string;
  description: string;
  keywords: string[];
  ogLocale: string;
}

export const seoI18n: Record<Language, SeoMessages> = {
  zh: {
    title: 'WorkChain｜匿名企业评价、薪资与企业文化分析',
    description: '匿名查看和分享企业评价、薪资、工作强度与企业文化信息，通过社区协作、哈希存证和 AI 分析了解真实职场。',
    keywords: ['企业评价', '匿名评价', '薪资查询', '企业文化', '职场体验'],
    ogLocale: 'zh_CN',
  },
  'zh-tw': {
    title: 'WorkChain｜匿名企業評價、薪資與企業文化分析',
    description: '匿名查看及分享企業評價、薪資、工作強度與企業文化資訊，透過社群協作、雜湊存證和 AI 分析了解真實職場。',
    keywords: ['企業評價', '匿名評價', '薪資查詢', '企業文化', '職場經驗'],
    ogLocale: 'zh_TW',
  },
  en: {
    title: 'WorkChain | Anonymous Company Reviews, Salaries & Culture',
    description: 'Explore and share anonymous company reviews, salaries, working hours, and workplace culture with community-maintained data, hash verification, and AI analysis.',
    keywords: ['company reviews', 'anonymous reviews', 'salary insights', 'workplace culture', 'employee experience'],
    ogLocale: 'en_US',
  },
  ja: {
    title: 'WorkChain｜匿名企業レビュー・給与・企業文化分析',
    description: '匿名の企業レビュー、給与、労働時間、職場文化を確認・共有し、コミュニティ情報、ハッシュ検証、AI分析からリアルな職場を理解できます。',
    keywords: ['企業レビュー', '匿名レビュー', '給与情報', '企業文化', '職場環境'],
    ogLocale: 'ja_JP',
  },
  ar: {
    title: 'WorkChain | تقييمات الشركات والرواتب وثقافة العمل',
    description: 'استكشف وشارك تقييمات مجهولة للشركات والرواتب وساعات العمل وثقافة مكان العمل مع بيانات مجتمعية وتحقق بالتجزئة وتحليل بالذكاء الاصطناعي.',
    keywords: ['تقييمات الشركات', 'تقييمات مجهولة', 'الرواتب', 'ثقافة العمل', 'تجربة الموظفين'],
    ogLocale: 'ar',
  },
  hi: {
    title: 'WorkChain | गुमनाम कंपनी समीक्षाएँ, वेतन और संस्कृति',
    description: 'समुदाय-संचालित डेटा, हैश सत्यापन और AI विश्लेषण के साथ गुमनाम कंपनी समीक्षाएँ, वेतन, कार्य घंटे और कार्यस्थल संस्कृति देखें और साझा करें।',
    keywords: ['कंपनी समीक्षाएँ', 'गुमनाम समीक्षा', 'वेतन', 'कार्य संस्कृति', 'कर्मचारी अनुभव'],
    ogLocale: 'hi_IN',
  },
  tr: {
    title: 'WorkChain | Anonim Şirket Yorumları, Maaşlar ve Kültür',
    description: 'Topluluk verileri, karma doğrulaması ve yapay zekâ analiziyle anonim şirket yorumlarını, maaşları, çalışma saatlerini ve işyeri kültürünü keşfedin.',
    keywords: ['şirket yorumları', 'anonim yorumlar', 'maaş bilgileri', 'şirket kültürü', 'çalışan deneyimi'],
    ogLocale: 'tr_TR',
  },
  es: {
    title: 'WorkChain | Opiniones anónimas, salarios y cultura empresarial',
    description: 'Consulta y comparte opiniones anónimas de empresas, salarios, jornadas y cultura laboral con datos comunitarios, verificación hash y análisis con IA.',
    keywords: ['opiniones de empresas', 'opiniones anónimas', 'salarios', 'cultura empresarial', 'experiencia laboral'],
    ogLocale: 'es_ES',
  },
  bo: {
    title: 'WorkChain｜མིང་མེད་ཚོང་ལས་དཔྱད་བརྗོད་དང་གླ་ཕོགས།',
    description: 'མིང་མེད་ཚོང་ལས་དཔྱད་བརྗོད། གླ་ཕོགས། ལས་དུས་དང་ཚོང་ལས་རིག་གནས་ལ་གཟིགས་ཞིབ་དང་མཉམ་སྤྱོད།',
    keywords: ['ཚོང་ལས་དཔྱད་བརྗོད།', 'མིང་མེད་དཔྱད་བརྗོད།', 'གླ་ཕོགས།', 'ཚོང་ལས་རིག་གནས།'],
    ogLocale: 'bo',
  },
};
