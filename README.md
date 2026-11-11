# مِداد — MIDAD
الموقع: https://midad-writing.vercel.app

مساحة عربية لكتابة الروايات. Obsidian Liquid Glass، محرر RTL، وSupabase Auth/RLS.

**الحالة: تنفيذ أولي حقيقي، ليس منتجًا مكتملًا وفق جميع شروط الطلب.** راجع [حالة الوظائف](docs/FEATURE_STATUS.md) و[تقرير الاختبار](docs/TEST_REPORT.md).

## التشغيل
Node 22 أو أحدث. `npm ci`، انسخ `.env.example` إلى `.env.local` واضبط عنوان Supabase والمفتاح العام، ثم `npm run dev`.

`npm run build` للبناء، `npm test` للوحدات والصادرات، `npm run test:e2e` للمتصفح. حسابات الاختبار تُحقن خارج المستودع عبر E2E_CREDENTIALS_FILE (ملف JSON يضم emailA وemailB وpassword)؛ يجب أن يكون الحسابان منفصلين ومخصصين للاختبار. شغّل core ثم recovery ثم publish بالتسلسل. اختبارات REST تستخدم NODE_USE_ENV_PROXY=1 عند الحاجة إلى proxy.

## التوثيق
[البنية](docs/ARCHITECTURE.md) · [التصميم](docs/DESIGN_SYSTEM.md) · [تحليل Novalist](docs/NOVALIST_FEATURE_AUDIT.md) · [القاعدة](docs/DATABASE_SCHEMA.md) · [الأمان](docs/SECURITY.md) · [النشر](docs/DEPLOYMENT.md).

لا شيفرة أو صور منسوخة من Novalist؛ مراجعة MIT والتبعيات موثقة في التحليل. خطوط IBM Plex Sans Arabic وAmiri مرخصة OFL، انظر public/fonts.
