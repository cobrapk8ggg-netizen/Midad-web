# النشر
المشروع Vercel midad-writing ضمن الفريق المتصل team_U4DAB2GV7xkOX1SigPnHjzS4؛ Next.js وNode 22. حماية Vercel SSO معطلة لهذا المشروع فقط لفتح رابط المنتج للعامة؛ بيانات الحساب تحميها Supabase Auth وRLS.

متغيران عامان: NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. لا أسرار خادم مطلوبة حاليًا. يجب ضبط Site URL وredirect allowlist في Supabase Auth إلى رابط المنتج قبل التحقق من رسائل الاستعادة والتأكيد؛ لا تُغيّر إعدادات المشروع المشترك دون فحص التطبيقات الأخرى.

البناء npm ci && npm run build. التشغيل npm run dev. الاختبارات npm test وnpm run test:e2e. حسابات QA تأتي من ملف خارج المستودع، لا كلمات مرور committed.

الرابط النهائي وحالة اختباره يُسجلان في TEST_REPORT.md.
