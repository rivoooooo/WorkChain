// Multi-language translation dictionaries and helpers for ZH and EN
export type Language = 'zh' | 'en';

export const i18n = {
  zh: {
    // Top banner & general
    topBanner: '完全匿名评价系统：采用密码学哈希区块链链式存证，永不收集与存储个人隐私信息。',
    blockchainSecured: '区块链存证',
    brandName: '职场口碑网',
    viewRankings: '浏览公司龙虎榜',
    addReview: '提供新评价',
    allReviewsCount: '已入网口碑公司数',
    
    // Home Hero
    heroBadge: '基于区块链技术的防篡改职场口碑网',
    heroSub: '一键检索匿名评价、多维度打分与职场文化报告，所有评价记录均链式关联，确保真实不可篡改。',
    searchPlaceholder: '输入公司名称（如：阿里巴巴、腾讯、字节跳动、特斯拉、微软等）',
    searchBtn: '检索口碑',
    trendingSearch: '大家都在搜：',
    
    // Quick Stats
    totalReviews: '全网总评价量',
    companiesCount: '已覆盖企业数',
    averageSatisfaction: '平均满意度分',
    reviewsCountLabel: '笔匿名评价',
    
    // Suggestion Headers
    dropdownTitle: '推荐存在的公司名称 (回车或点击直接检索)',
    dropdownFormTitle: '推荐选择已有公司名（防止拼写不一）',

    // Company view details
    backToHome: '返回主页',
    aggregateStats: '综合口碑看板',
    tabReviews: '匿名点评',
    tabAiReport: 'AI 文化透视',
    tabLedger: '哈希存证链',
    reviewsFor: '的匿名评价',
    
    // Metrics
    metricOverall: '综合评分',
    metricSalary: '平均薪资',
    metricWlb: '工作生活平衡(WLB)',
    metricCareer: '职业成长空间',
    metricManagement: '管理层作风',
    metricBenefits: '福利与待遇',
    metricCulture: '企业文化氛围',
    avgMonthSalary: '平均月薪',
    yearEndBonus: '年终奖',
    expYears: '工作年限',
    yearsUnit: '年',
    anonymousEmployee: '匿名员工',
    currentEmployee: '在职',
    formerEmployee: '已离职',
    salaryUnit: 'K',
    
    // Filter controls
    sortBy: '排序方式：',
    sortLatest: '最新发布',
    sortSalary: '月薪最高',
    sortRating: '好评优先',
    allPositions: '全部职位',
    allStatus: '全部状态',
    
    // Ledger Tab
    ledgerTitle: '哈希区块链存证账本 (去中心化验证)',
    ledgerDesc: '所有点评数据一经提交，即在本地计算 SHA-256 哈希值，并与前一区块哈希链接。后台会对每条记录签名以确保链的防篡改完整性。您可以通过下方对任意评价内容进行一键哈希对齐校验。',
    ledgerBlockHeight: '区块高度',
    ledgerHash: '区块哈希',
    ledgerPrevHash: '前置区块哈希',
    ledgerValidator: '签名节点',
    ledgerVerifyBtn: '本地存证核验',
    ledgerVerifySuccess: '哈希对齐成功！该条评价在去中心化账本中未经过任何篡改，前置指针一致。',
    ledgerVerifyFail: '哈希检验不匹配！',
    ledgerIntegrityPassed: '账本数据完整性自检通过！',
    ledgerNodeVerified: '由验证器节点完成签名存证',
    
    // AI Report Tab
    aiTitle: 'AI 企业深度文化透视',
    aiDisclaimer: '系统自动聚合全量匿名文本，基于情感倾向分析计算出的企业宏观画像与发展性价比报告。',
    aiCacheAlert: '已从本地缓存加载 (24小时内有效，点击右侧刷新可强制重新生成)',
    aiRegenTooltip: '重新生成并更新AI缓存',
    aiStartBtn: '开始生成深度文化分析报告',
    aiGenerating: '正在通过 Gemini 智能聚合大量员工评价...',
    aiNoReviews: '目前还没有评价，快来提交第一个评价吧！',
    
    aiCatVibe: '企业文化调性',
    aiCatPainPoints: '核心痛点与风险',
    aiCatStrengths: '优势与吸引力',
    aiCatSalary: '薪酬晋升合理度',
    aiCatAdvice: '建议人群',

    // Form modal
    formTitle: '提交真实的职场匿名评价',
    formSubtitle: '一经提交，将通过区块链存证技术不可篡改地记录。请客观、真实地填写。',
    formLabelCompany: '公司名称',
    formLabelLocation: '分部/地区',
    formLabelPosition: '职位名称',
    formLabelStatus: '在职状态',
    formLabelSalary: '基本月薪 (K)',
    formLabelBonus: '年终奖 (K)',
    formLabelYears: '工作年限 (年)',
    formPlaceholderCompany: '如: 阿里巴巴',
    formPlaceholderLocation: '如: 杭州/北京',
    formPlaceholderPosition: '如: 高级技术专家',
    formRatingTitle: '评分指标 (0 - 5 星)',
    formReviewTextLabel: '写下你的真实体验',
    formReviewTextPlaceholder: '可以分享你在这里的工作强度、组内氛围、日常福利、学长建议等（字数不少于10字，内容将绝对保密）',
    formCancel: '取消',
    formSubmit: '提交评价',
    formSubmitting: '提交中...',
    
    // Directory Page
    dirTitle: '大厂口碑龙虎榜 (支持多维度自主排序)',
    dirMainHeader: '公司口碑一览表',
    dirSub: '多维度、全方位的匿名企业评价对比，帮助每一位职场人选择最适合自己的下一站。',
    dirSearchPlaceholder: '搜索已入网的公司名称...',
    dirSortModeLabel: '当前排序：',
    dirSortFieldLabel: '选择排序维度:',
    dirNoResults: '未找到匹配的公司',
    dirNoResultsDesc: '目前还没有该公司下的评价，或者搜索拼写不准确。您可以返回主页提交该公司下的第一笔匿名评价！',
    dirRowReviewCount: '笔评价',
    dirRowOverall: '综合分',

    // Download page
    downloadTitle: '数据备份与归档下载中心',
    downloadSub: '系统于每天凌晨 00:00 自动生成完整的匿名口碑数据集备份，包含 CSV、XLSX、SQL 三种格式，方便进行数据迁移、研究或本地备份。数据采用离线二进制存储，无须动态查询。',
    downloadColDate: '备份日期',
    downloadColRecords: '记录数',
    downloadColFiles: '可用文件下载',
    downloadTriggerBtn: '手动触发备份',
    downloadTriggering: '备份生成中...',
    downloadTriggerSuccess: '手动备份成功！已记录至独立数据归档表。',
    downloadTriggerFail: '备份触发失败，请稍后重试。',
    downloadSize: '大小',
    downloadBtnCsv: '下载 CSV',
    downloadBtnXlsx: '下载 Excel (XLSX)',
    downloadBtnSql: '下载 SQL Dump',
    downloadNoData: '暂无备份数据。',
    downloadBackBtn: '返回主页',
    downloadNavLabel: '数据备份下载'
  },
  en: {
    // Top banner & general
    topBanner: 'Completely anonymous review system: Secured by cryptographic hash chain ledger, never collecting or storing personal privacy data.',
    blockchainSecured: 'Blockchain Secured',
    brandName: 'JobTrust Index',
    viewRankings: 'View Company Rankings',
    addReview: 'Add Review',
    allReviewsCount: 'Companies Listed',
    
    // Home Hero
    heroBadge: 'Tamper-Proof Job Review Ledger Secured by Blockchain',
    heroSub: 'Instantly retrieve anonymous reviews, multi-dimensional ratings, and cultural analysis reports. All records are chain-linked to ensure absolute authenticity.',
    searchPlaceholder: 'Enter company name (e.g., Google, Apple, Microsoft, Tesla, ByteDance)',
    searchBtn: 'Search Reviews',
    trendingSearch: 'Trending:',
    
    // Quick Stats
    totalReviews: 'Total Reviews',
    companiesCount: 'Companies Covered',
    averageSatisfaction: 'Avg Satisfaction',
    reviewsCountLabel: 'reviews',
    
    // Suggestion Headers
    dropdownTitle: 'Suggested Companies (Press Enter or Click to search)',
    dropdownFormTitle: 'Select an existing company (prevents spelling duplicates)',

    // Company view details
    backToHome: 'Back to Home',
    aggregateStats: 'Aggregate Reputation Dashboard',
    tabReviews: 'Reviews',
    tabAiReport: 'AI Cultural Insight',
    tabLedger: 'Ledger Audit',
    reviewsFor: 'reviews for',
    
    // Metrics
    metricOverall: 'Overall Score',
    metricSalary: 'Average Salary',
    metricWlb: 'Work-Life Balance (WLB)',
    metricCareer: 'Career Growth',
    metricManagement: 'Management Style',
    metricBenefits: 'Benefits & Perks',
    metricCulture: 'Company Culture',
    avgMonthSalary: 'Avg Monthly Salary',
    yearEndBonus: 'Annual Bonus',
    expYears: 'Experience',
    yearsUnit: 'yrs',
    anonymousEmployee: 'Anonymous Employee',
    currentEmployee: 'Current',
    formerEmployee: 'Former',
    salaryUnit: 'K',
    
    // Filter controls
    sortBy: 'Sort By:',
    sortLatest: 'Latest',
    sortSalary: 'Salary',
    sortRating: 'Rating',
    allPositions: 'All Positions',
    allStatus: 'All Status',
    
    // Ledger Tab
    ledgerTitle: 'Blockchain Hash Ledger (Client-Side Verification)',
    ledgerDesc: 'Every review submitted is instantly hashed using SHA-256 on the client side, chaining it directly to the previous block. The system signs each record to guarantee ledger integrity. You can run immediate cryptographic audits on any review below.',
    ledgerBlockHeight: 'Block Height',
    ledgerHash: 'Block Hash',
    ledgerPrevHash: 'Prev Hash',
    ledgerValidator: 'Signature Node',
    ledgerVerifyBtn: 'Verify Cryptographic Receipt',
    ledgerVerifySuccess: 'Hash check alignment successful! This review is verified authentic and has not been tampered with.',
    ledgerVerifyFail: 'Hash signature validation mismatch!',
    ledgerIntegrityPassed: 'Ledger integrity self-test passed!',
    ledgerNodeVerified: 'Signed and archived by Ledger Verification Node',
    
    // AI Report Tab
    aiTitle: 'AI Deep Corporate Culture Profiler',
    aiDisclaimer: 'The system automatically aggregates anonymous evaluations to generate objective cultural insights and workplace wellness analyses using LLMs.',
    aiCacheAlert: 'Loaded from local cache (Valid for 24h. Click refresh to force regenerate)',
    aiRegenTooltip: 'Regenerate and update cache',
    aiStartBtn: 'Generate Deep Culture Report',
    aiGenerating: 'Aggregating employee feedback using Gemini AI...',
    aiNoReviews: 'No reviews found yet. Be the first to add one!',
    
    aiCatVibe: 'Culture & Vibe',
    aiCatPainPoints: 'Friction Points & Risks',
    aiCatStrengths: 'Strengths & Advantages',
    aiCatSalary: 'Pay & Promotion Alignment',
    aiCatAdvice: 'Ideal Candidates',

    // Form modal
    formTitle: 'Submit Anonymous Workplace Review',
    formSubtitle: 'Once submitted, your review is permanently written into the immutable ledger. Please be honest and objective.',
    formLabelCompany: 'Company Name',
    formLabelLocation: 'Branch/Location',
    formLabelPosition: 'Job Position',
    formLabelStatus: 'Employment Status',
    formLabelSalary: 'Base Monthly Salary (K)',
    formLabelBonus: 'Annual Bonus (K)',
    formLabelYears: 'Years of Experience',
    formPlaceholderCompany: 'e.g. Google',
    formPlaceholderLocation: 'e.g. Mountain View, CA',
    formPlaceholderPosition: 'e.g. Senior Software Engineer',
    formRatingTitle: 'Performance Ratings (0 - 5 Stars)',
    formReviewTextLabel: 'Write Your Genuine Experience',
    formReviewTextPlaceholder: 'Feel free to share details about WLB, work culture, team management, perks, and learning opportunities (Min. 10 chars. Absolute anonymity guaranteed).',
    formCancel: 'Cancel',
    formSubmit: 'Submit Review',
    formSubmitting: 'Submitting...',
    
    // Directory Page
    dirTitle: 'Leaderboard Directory (Sort by multiple metrics)',
    dirMainHeader: 'Company Directory & Stats',
    dirSub: 'Compare verified employee ratings, compensation, and work-life balance scores side-by-side to find your next destination.',
    dirSearchPlaceholder: 'Search company directory...',
    dirSortModeLabel: 'Sorting by:',
    dirSortFieldLabel: 'Choose Metric:',
    dirNoResults: 'No Companies Matched',
    dirNoResultsDesc: 'We couldn\'t find any reviews under this name. Return to home to submit the first review for this company!',
    dirRowReviewCount: 'Reviews',
    dirRowOverall: 'Score',

    // Download page
    downloadTitle: 'Data Backup & Archive Center',
    downloadSub: 'The system automatically generates a comprehensive review dataset backup daily at 00:00, available in CSV, XLSX, and SQL formats for secure off-site archiving, data migration, or research. Storage is isolated to binary tables, eliminating dynamic processing overhead.',
    downloadColDate: 'Backup Date',
    downloadColRecords: 'Records',
    downloadColFiles: 'Available Formats',
    downloadTriggerBtn: 'Trigger Manual Backup',
    downloadTriggering: 'Generating Backup...',
    downloadTriggerSuccess: 'Manual backup succeeded! Saved to the isolated ledger database.',
    downloadTriggerFail: 'Failed to trigger backup. Try again later.',
    downloadSize: 'Size',
    downloadBtnCsv: 'Download CSV',
    downloadBtnXlsx: 'Download Excel (XLSX)',
    downloadBtnSql: 'Download SQL Dump',
    downloadNoData: 'No backups available.',
    downloadBackBtn: 'Back to Home',
    downloadNavLabel: 'Backups Center'
  }
};
