import Link from 'next/link';
import { Language, localePath, resolveLanguage } from '../../../lib/i18n';

interface PrivacyCopy {
  title: string;
  intro: string;
  back: string;
  updated: string;
  sections: Array<{ title: string; body: string }>;
}

const privacyCopy: Record<Language, PrivacyCopy> = {
  zh: {
    title: '隐私政策',
    intro: 'WorkChain 是一个无需注册、面向公众的企业信息与工作体验共享社区。',
    back: '返回首页',
    updated: '更新日期：2026 年 7 月 29 日',
    sections: [
      { title: '我们不要求的信息', body: '使用本站无需账号，也无需提供姓名、手机号、电子邮箱或其他公开身份信息。请勿在企业资料、评价或其他提交内容中填写个人隐私、商业秘密或可识别具体个人的信息。' },
      { title: '公开提交的数据', body: '你提交的企业名称、地区、企业资料、工作体验、薪资、工时和评分等内容会公开展示，并可能包含在开放数据下载中。公开数据不可按普通社交平台的方式删除，请在提交前仔细确认。' },
      { title: '防止滥用', body: '为了限制刷票和恶意请求，服务器会短暂处理 IP 地址，将其转换为不可逆摘要用于限速，并使用匿名浏览器凭证区分采纳操作。匿名凭证 Cookie 最长保存一年，不包含姓名或联系方式。人机验证服务也会接收完成验证所需的网络信息。' },
      { title: 'AI 分析与第三方服务', body: '公开评价可能被发送给 AI 服务生成企业文化分析。网站托管、数据库、人机验证和 AI 服务提供商会在提供服务所需范围内处理相关数据。请不要提交不适合公开或交由这些服务处理的内容。' },
      { title: '你的选择', body: '你可以只浏览公开信息而不提交内容，也可以通过浏览器设置清除匿名凭证 Cookie。继续提交即表示你理解相关内容将用于公开共享、统计和分析。' },
    ],
  },
  'zh-tw': {
    title: '隱私政策', intro: 'WorkChain 是無需註冊、面向公眾的企業資訊與工作經驗共享社群。', back: '返回首頁', updated: '更新日期：2026 年 7 月 29 日',
    sections: [
      { title: '我們不要求的資訊', body: '使用本站無需帳號，也無需提供姓名、電話、電子郵件或公開身分。請勿提交個人隱私、商業機密或可識別特定個人的資訊。' },
      { title: '公開提交的資料', body: '企業名稱、地區、企業資料、工作經驗、薪資、工時與評分會公開顯示，也可能納入開放資料下載。提交前請仔細確認。' },
      { title: '防止濫用', body: '為限制刷票與惡意請求，伺服器會短暫處理 IP，轉換成不可逆摘要用於限速，並以匿名 Cookie 區分採納操作。Cookie 最長保存一年；人機驗證服務也會接收驗證所需的網路資訊。' },
      { title: 'AI 分析與第三方服務', body: '公開評價可能傳送給 AI 服務生成企業文化分析。託管、資料庫、人機驗證與 AI 供應商會在提供服務所需範圍內處理資料。' },
      { title: '你的選擇', body: '你可以只瀏覽而不提交，也能在瀏覽器中清除匿名憑證 Cookie。提交代表你理解內容將用於公開分享、統計與分析。' },
    ],
  },
  en: {
    title: 'Privacy Policy', intro: 'WorkChain is a public community for sharing company information and workplace experiences without registration.', back: 'Back to home', updated: 'Last updated: July 29, 2026',
    sections: [
      { title: 'Information we do not require', body: 'You do not need an account or need to provide your name, phone number, email address, or public identity. Do not submit personal data, trade secrets, or information that identifies a specific person.' },
      { title: 'Public submissions', body: 'Company names, locations, company details, workplace experiences, salaries, schedules, and ratings you submit are public and may be included in open-data downloads. Review your submission carefully before publishing.' },
      { title: 'Abuse prevention', body: 'To limit vote manipulation and abusive requests, the server briefly processes an IP address and converts it into a one-way digest for rate limiting. An anonymous browser credential distinguishes approval actions and its cookie may remain for up to one year. The human-verification provider also receives network information needed to perform verification.' },
      { title: 'AI analysis and service providers', body: 'Public reviews may be sent to an AI service to generate culture insights. Hosting, database, human-verification, and AI providers process data only as needed to provide their services. Do not submit content that should not be public or processed by these services.' },
      { title: 'Your choices', body: 'You may browse without submitting anything and can clear the anonymous credential cookie in your browser. By submitting, you understand that the content will be publicly shared, aggregated, and analyzed.' },
    ],
  },
  ja: {
    title: 'プライバシーポリシー', intro: 'WorkChain は登録不要で企業情報と職場体験を共有する公開コミュニティです。', back: 'ホームに戻る', updated: '更新日：2026年7月29日',
    sections: [
      { title: '求めない情報', body: 'アカウント、氏名、電話番号、メールアドレス、公開プロフィールは不要です。個人情報、営業秘密、個人を特定できる情報を投稿しないでください。' },
      { title: '公開される投稿', body: '企業名、地域、企業情報、職場体験、給与、勤務時間、評価は公開され、オープンデータに含まれる場合があります。投稿前に内容を確認してください。' },
      { title: '不正利用の防止', body: '連続投票や不正リクエストを制限するため、IPを短時間処理し、不可逆な要約に変換して利用します。匿名認証Cookieは最長1年間保存され、人間確認サービスにも検証に必要な通信情報が送られます。' },
      { title: 'AIと外部サービス', body: '公開レビューは企業文化分析のためAIサービスへ送信される場合があります。ホスティング、データベース、人間確認、AIの各事業者はサービス提供に必要な範囲で処理します。' },
      { title: '選択肢', body: '投稿せず閲覧のみ利用でき、匿名認証Cookieはブラウザで削除できます。投稿内容は公開、集計、分析されます。' },
    ],
  },
  ar: {
    title: 'سياسة الخصوصية', intro: 'WorkChain مجتمع عام لمشاركة معلومات الشركات وتجارب العمل دون تسجيل.', back: 'العودة إلى الرئيسية', updated: 'آخر تحديث: 29 يوليو 2026',
    sections: [
      { title: 'معلومات لا نطلبها', body: 'لا تحتاج إلى حساب أو اسم أو هاتف أو بريد إلكتروني أو هوية عامة. لا ترسل بيانات شخصية أو أسراراً تجارية أو معلومات تحدد شخصاً بعينه.' },
      { title: 'المشاركات العامة', body: 'تُنشر أسماء الشركات والمواقع والتفاصيل وتجارب العمل والرواتب وساعات العمل والتقييمات، وقد تُدرج في تنزيلات البيانات المفتوحة.' },
      { title: 'منع الإساءة', body: 'للحد من التلاعب والطلبات المسيئة، يعالج الخادم عنوان IP مؤقتاً ويحوله إلى ملخص أحادي الاتجاه لتحديد المعدل. وقد يبقى ملف تعريف الارتباط المجهول لمدة سنة، وتتلقى خدمة التحقق معلومات الشبكة اللازمة.' },
      { title: 'تحليل AI والخدمات الخارجية', body: 'قد تُرسل التقييمات العامة إلى خدمة AI لإنتاج تحليل ثقافة العمل. يعالج مزودو الاستضافة وقاعدة البيانات والتحقق وAI البيانات بالقدر اللازم لتقديم الخدمة.' },
      { title: 'خياراتك', body: 'يمكنك التصفح دون إرسال محتوى ومسح ملف تعريف الارتباط المجهول من المتصفح. الإرسال يعني فهمك أن المحتوى سيُنشر ويُجمع ويُحلل.' },
    ],
  },
  hi: {
    title: 'गोपनीयता नीति', intro: 'WorkChain बिना पंजीकरण कंपनी जानकारी और कार्य अनुभव साझा करने वाला सार्वजनिक समुदाय है।', back: 'होम पर लौटें', updated: 'अपडेट: 29 जुलाई 2026',
    sections: [
      { title: 'जो जानकारी हम नहीं मांगते', body: 'खाता, नाम, फ़ोन, ईमेल या सार्वजनिक पहचान आवश्यक नहीं है। निजी डेटा, व्यापारिक रहस्य या किसी व्यक्ति की पहचान बताने वाली जानकारी न दें।' },
      { title: 'सार्वजनिक प्रस्तुतियाँ', body: 'कंपनी का नाम, स्थान, विवरण, कार्य अनुभव, वेतन, कार्य समय और रेटिंग सार्वजनिक होंगे और खुले डेटा डाउनलोड में शामिल हो सकते हैं।' },
      { title: 'दुरुपयोग की रोकथाम', body: 'दुरुपयोग रोकने के लिए सर्वर IP को थोड़े समय संसाधित कर दर सीमा हेतु एकतरफ़ा सार में बदलता है। गुमनाम पहचान Cookie एक वर्ष तक रह सकती है और मानव सत्यापन सेवा को आवश्यक नेटवर्क जानकारी मिलती है।' },
      { title: 'AI विश्लेषण और सेवाएँ', body: 'सार्वजनिक समीक्षाएँ संस्कृति विश्लेषण के लिए AI सेवा को भेजी जा सकती हैं। होस्टिंग, डेटाबेस, सत्यापन और AI प्रदाता सेवा देने के लिए आवश्यक सीमा तक डेटा संसाधित करते हैं।' },
      { title: 'आपके विकल्प', body: 'आप बिना कुछ जमा किए ब्राउज़ कर सकते हैं और ब्राउज़र में गुमनाम Cookie मिटा सकते हैं। जमा की गई सामग्री सार्वजनिक, एकत्रित और विश्लेषित होगी।' },
    ],
  },
  tr: {
    title: 'Gizlilik Politikası', intro: 'WorkChain, kayıt olmadan şirket bilgisi ve iş deneyimi paylaşmaya yönelik açık bir topluluktur.', back: 'Ana sayfaya dön', updated: 'Güncelleme: 29 Temmuz 2026',
    sections: [
      { title: 'İstemediğimiz bilgiler', body: 'Hesap, ad, telefon, e-posta veya açık kimlik gerekmez. Kişisel veri, ticari sır veya belirli bir kişiyi tanımlayan bilgi göndermeyin.' },
      { title: 'Herkese açık gönderiler', body: 'Şirket adı, konum, şirket bilgileri, iş deneyimi, maaş, çalışma süresi ve puanlar herkese açıktır ve açık veri indirmelerine eklenebilir.' },
      { title: 'Kötüye kullanımı önleme', body: 'Kötüye kullanımı sınırlamak için IP kısa süre işlenip hız sınırı amacıyla tek yönlü özete çevrilir. Anonim kimlik çerezi bir yıla kadar kalabilir; insan doğrulama hizmeti gerekli ağ bilgisini alır.' },
      { title: 'AI analizi ve hizmet sağlayıcılar', body: 'Açık yorumlar kültür analizi için AI hizmetine gönderilebilir. Barındırma, veritabanı, doğrulama ve AI sağlayıcıları veriyi yalnızca hizmet için gereken ölçüde işler.' },
      { title: 'Seçimleriniz', body: 'Gönderi yapmadan gezinebilir ve anonim çerezi tarayıcıdan silebilirsiniz. Gönderilen içerik herkese açılır, toplulaştırılır ve analiz edilir.' },
    ],
  },
  es: {
    title: 'Política de privacidad', intro: 'WorkChain es una comunidad pública para compartir información empresarial y experiencias laborales sin registro.', back: 'Volver al inicio', updated: 'Última actualización: 29 de julio de 2026',
    sections: [
      { title: 'Datos que no solicitamos', body: 'No necesitas cuenta, nombre, teléfono, correo ni identidad pública. No envíes datos personales, secretos comerciales ni información que identifique a una persona.' },
      { title: 'Contenido público', body: 'Los nombres, ubicaciones, datos empresariales, experiencias, salarios, horarios y puntuaciones son públicos y pueden incluirse en las descargas de datos abiertos.' },
      { title: 'Prevención de abusos', body: 'Para limitar manipulaciones y solicitudes abusivas, el servidor procesa brevemente la IP y la convierte en un resumen irreversible para limitar solicitudes. La cookie anónima puede durar un año y el servicio de verificación recibe la información de red necesaria.' },
      { title: 'Análisis con AI y proveedores', body: 'Las opiniones públicas pueden enviarse a un servicio de AI para generar análisis culturales. Los proveedores de alojamiento, base de datos, verificación y AI procesan lo necesario para prestar sus servicios.' },
      { title: 'Tus opciones', body: 'Puedes navegar sin enviar contenido y borrar la cookie anónima desde el navegador. Al enviar, aceptas que el contenido sea público, agregado y analizado.' },
    ],
  },
  bo: {
    title: 'སྒེར་གསང་སྲིད་བྱུས།', intro: 'WorkChain ནི་ཐོ་འགོད་མི་དགོས་པའི་ཚོང་ལས་ཆ་འཕྲིན་མཉམ་སྤྱོད་སྤྱི་ཚོགས་ཡིན།', back: 'གཙོ་ངོས་སུ་ལོག', updated: 'གསར་བཅོས། 2026-07-29',
    sections: [
      { title: 'ང་ཚོས་མི་དགོས་པའི་ཆ་འཕྲིན།', body: 'ཐོ་གཞུང་དང་མིང་། ཁ་པར། གློག་འཕྲིན་མི་དགོས། མི་སྒེར་དང་ཚོང་ལས་གསང་བའི་ཆ་འཕྲིན་མ་འཇུག' },
      { title: 'སྤྱི་སྤྱོད་འབུལ་བ།', body: 'ཚོང་ལས་མིང་དང་ས་གནས། ལས་ཀའི་ཉམས་མྱོང་། གླ་ཕོགས། ལས་དུས། སྐར་གྲངས་སྤྱི་སྤྱོད་ཡིན།' },
      { title: 'བེད་སྤྱོད་ངན་པ་འགོག་པ།', body: 'བེད་སྤྱོད་ངན་པ་འགོག་ཆེད IP ཐུང་ངུར་སྤྱད་ནས་ཕྱིར་མི་ལྡོག་པའི་རྟགས་སུ་བསྒྱུར། མིང་མེད Cookie ལོ་གཅིག་བར་ཉར་སྲིད།' },
      { title: 'AI དཔྱད་ཞིབ་དང་ཕྱི་ཕྱོགས་ཞབས་ཞུ།', body: 'སྤྱི་སྤྱོད་དཔྱད་བརྗོད AI ཞབས་ཞུར་དཔྱད་ཞིབ་ཆེད་བསྐུར་སྲིད།' },
      { title: 'ཁྱེད་ཀྱི་གདམ་ག', body: 'ཆ་འཕྲིན་མ་འབུལ་བར་ལྟ་ཀློག་བྱས་ཆོག མིང་མེད Cookie བསུབ་ཆོག' },
    ],
  },
};

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = resolveLanguage(rawLang);
  const copy = privacyCopy[lang];

  return (
    <article className="mx-auto w-full max-w-3xl py-10 sm:py-16">
      <Link
        href={`/${localePath(lang)}`}
        className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
      >
        ← {copy.back}
      </Link>

      <header className="mt-8 border-b border-border pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">{copy.intro}</p>
        <p className="mt-3 text-xs text-muted-foreground">{copy.updated}</p>
      </header>

      <div className="divide-y divide-border">
        {copy.sections.map((section) => (
          <section key={section.title} className="py-7">
            <h2 className="text-lg font-bold text-foreground">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
