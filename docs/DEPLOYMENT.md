# النشر
المشروع Vercel midad-writing ضمن الفريق المتصل team_U4DAB2GV7xkOX1SigPnHjzS4؛ Next.js وNode 22. حماية Vercel SSO معطلة لهذا المشروع فقط لفتح رابط المنتج للعامة؛ بيانات الحساب تحميها Supabase Auth وRLS.

متغيران عامان: NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. لا أسرار خادم مطلوبة حاليًا. يجب ضبط Site URL وredirect allowlist في Supabase Auth إلى رابط المنتج قبل التحقق من رسائل الاستعادة والتأكيد؛ لا تُغيّر إعدادات المشروع المشترك دون فحص التطبيقات الأخرى.

البناء npm ci && npm run build. التشغيل npm run dev. الاختبارات npm test وnpm run test:e2e. حسابات QA تأتي من ملف خارج المستودع، لا كلمات مرور committed.

الرابط النهائي وحالة اختباره يُسجلان في TEST_REPORT.md.

## الإصدار الثاني
نشر Edge Function midad-signup مستقل عن Vercel، source في supabase/functions/midad-signup/index.ts. verify_jwt=false لأنها مسار signup عام؛ الدالة تطبق تحقق الإدخال وrate limit. SUPABASE_SERVICE_ROLE_KEY متاح داخل runtime فقط ولم يُنقل إلى Vercel أو العميل. رابط المنتج الثابت ضمن CORS.
تشغيل E2E بـnpm run test:e2e يفعّل proxy في Node؛ setup ينشئ حسابين مخصصين عبر مسار التسجيل الحقيقي أو يستعمل E2E_CREDENTIALS_FILE موجودًا. credentials خارج المستودع، وتُحذف fixtures بعد الاختبار النهائي بأدوات الإدارة.
