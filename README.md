# مِداد — منصة عربية لكتابة روايات الويب

**[افتح مِداد](https://midad-writing.vercel.app)** · [دليل V4](docs/V4_RELEASE.md) · [التجارب والأدلة](docs/V4_TEST_REPORT.md) · [حالة الوظائف والحدود](docs/FEATURE_STATUS.md) · [ربط ChatGPT](docs/GPT_CONNECTION.md)

مكتبة ← رواية وقصتها ← فصل كامل. المشاهد اختيارية. حساب بلا تأكيد بريد أو ضيف محلي قابل للنقل. بروفايل بصورة وغلاف ونبذة وروابط ورف تختاره، متابعة وقائمة قراءة وتقييمات وترتيب عام داخل مِداد. محرر Tiptap بأدوات تنسيق ظاهرة وستة خيارات خط، وتفضيلات كتابة مستقلة عن تنسيق الفصل. Next.js/React/TypeScript/Supabase مع RLS وStorage خاص.

تعاون قارئ/محرر ونشر فصول مختارة متاحان؛ التحرير المتزامن CRDT والرسائل والإشعارات ومراجعة المحتوى الاجتماعية لم تنفذ بعد. لا بيانات QA تُعرض كروايات مستخدم حقيقية.

## التشغيل
Node 22 أو أحدث. `npm ci`، انسخ `.env.example` إلى `.env.local` واضبط عنوان Supabase والمفتاح العام، ثم `npm run dev`.

`npm run build` للبناء، `npm test` للوحدات والصادرات، `npm run test:e2e` للمتصفح. حسابات الاختبار تُحقن خارج المستودع عبر E2E_CREDENTIALS_FILE (ملف JSON يضم emailA وemailB وpassword)؛ يجب أن يكون الحسابان منفصلين ومخصصين للاختبار. شغّل core ثم recovery ثم publish بالتسلسل. اختبارات REST تستخدم NODE_USE_ENV_PROXY=1 عند الحاجة إلى proxy.

## التوثيق
[البنية](docs/ARCHITECTURE.md) · [التصميم](docs/DESIGN_SYSTEM.md) · [تحليل Novalist](docs/NOVALIST_FEATURE_AUDIT.md) · [القاعدة](docs/DATABASE_SCHEMA.md) · [الأمان](docs/SECURITY.md) · [النشر](docs/DEPLOYMENT.md).

لا شيفرة أو صور منسوخة من Novalist؛ مراجعة MIT والتبعيات موثقة في التحليل. خطوط IBM Plex Sans Arabic وAmiri وNoto Naskh Arabic وCairo وTajawal مرخصة OFL، انظر public/fonts.

## سلوك الحساب والضيف
زر الضيف يفتح IndexedDB على هذا الجهاز. الحساب الجديد يدخل مباشرة دون تأكيد بريد عبر Edge Function آمنة. بعد الدخول يمكن نقل أعمال الضيف إلى الحساب. لا تعتبر بيانات الضيف متزامنة قبل النقل.

[اختبارات v2](docs/V2_TEST_REPORT.md) · [التصميم الجديد](docs/VISUAL_DIRECTION_V2.md).
