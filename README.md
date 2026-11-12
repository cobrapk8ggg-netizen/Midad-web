# مِداد — كتابة روايات الويب بالعربية

**[افتح مِداد](https://midad-writing.vercel.app)** · [طريقة استخدام الإصدار الثالث](docs/V3_RELEASE.md) · [ربط ChatGPT وحسابات مِداد المتعددة](docs/GPT_CONNECTION.md) · [الأدلة والحدود](docs/V3_TEST_REPORT.md)

أنشئ رواية من المكتبة، اكتب قصتها، ثم أنشئ فصولًا واكتبها كاملة. المشاهد اختيارية. أضف صديقًا للقراءة أو كتابة الفصول، أو انشر فصولًا محددة للجمهور. الأساس عربي RTL، Next.js وTiptap وSupabase مع RLS. لا تُعرض روايات تجريبية كبيانات حساب حقيقية.

# مِداد — MIDAD
الموقع: https://midad-writing.vercel.app

مساحة عربية لكتابة الروايات. Obsidian Liquid Glass، محرر RTL، وSupabase Auth/RLS.

**الإصدار الثاني: تسجيل فوري دون تأكيد بريد، ضيف محلي قابل للنقل، وهوية Liquid Obsidian مع توسعة وظائف فعلية. ما زالت بعض الوظائف المتقدمة غير مكتملة.** راجع [حالة الوظائف](docs/FEATURE_STATUS.md) و[تقرير الاختبار](docs/TEST_REPORT.md).

## التشغيل
Node 22 أو أحدث. `npm ci`، انسخ `.env.example` إلى `.env.local` واضبط عنوان Supabase والمفتاح العام، ثم `npm run dev`.

`npm run build` للبناء، `npm test` للوحدات والصادرات، `npm run test:e2e` للمتصفح. حسابات الاختبار تُحقن خارج المستودع عبر E2E_CREDENTIALS_FILE (ملف JSON يضم emailA وemailB وpassword)؛ يجب أن يكون الحسابان منفصلين ومخصصين للاختبار. شغّل core ثم recovery ثم publish بالتسلسل. اختبارات REST تستخدم NODE_USE_ENV_PROXY=1 عند الحاجة إلى proxy.

## التوثيق
[البنية](docs/ARCHITECTURE.md) · [التصميم](docs/DESIGN_SYSTEM.md) · [تحليل Novalist](docs/NOVALIST_FEATURE_AUDIT.md) · [القاعدة](docs/DATABASE_SCHEMA.md) · [الأمان](docs/SECURITY.md) · [النشر](docs/DEPLOYMENT.md).

لا شيفرة أو صور منسوخة من Novalist؛ مراجعة MIT والتبعيات موثقة في التحليل. خطوط IBM Plex Sans Arabic وAmiri مرخصة OFL، انظر public/fonts.

## سلوك الحساب والضيف
زر الضيف يفتح IndexedDB على هذا الجهاز. الحساب الجديد يدخل مباشرة دون تأكيد بريد عبر Edge Function آمنة. بعد الدخول يمكن نقل أعمال الضيف إلى الحساب. لا تعتبر بيانات الضيف متزامنة قبل النقل.

[اختبارات v2](docs/V2_TEST_REPORT.md) · [التصميم الجديد](docs/VISUAL_DIRECTION_V2.md).
