# النشر
المشروع Vercel midad-writing ضمن الفريق المتصل team_U4DAB2GV7xkOX1SigPnHjzS4؛ Next.js وNode 22. حماية Vercel SSO معطلة لهذا المشروع فقط لفتح رابط المنتج للعامة؛ بيانات الحساب تحميها Supabase Auth وRLS.

متغيران عامان: NEXT_PUBLIC_SUPABASE_URL وNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. لا أسرار خادم مطلوبة حاليًا. يجب ضبط Site URL وredirect allowlist في Supabase Auth إلى رابط المنتج قبل التحقق من رسائل الاستعادة والتأكيد؛ لا تُغيّر إعدادات المشروع المشترك دون فحص التطبيقات الأخرى.

البناء npm ci && npm run build. التشغيل npm run dev. الاختبارات npm test وnpm run test:e2e. حسابات QA تأتي من ملف خارج المستودع، لا كلمات مرور committed.

الرابط النهائي وحالة اختباره يُسجلان في TEST_REPORT.md.

## الإصدار الثاني
نشر Edge Function midad-signup مستقل عن Vercel، source في supabase/functions/midad-signup/index.ts. verify_jwt=false لأنها مسار signup عام؛ الدالة تطبق تحقق الإدخال وrate limit. SUPABASE_SERVICE_ROLE_KEY متاح داخل runtime فقط ولم يُنقل إلى Vercel أو العميل. رابط المنتج الثابت ضمن CORS.
تشغيل E2E بـnpm run test:e2e يفعّل proxy في Node؛ setup ينشئ حسابين مخصصين عبر مسار التسجيل الحقيقي أو يستعمل E2E_CREDENTIALS_FILE موجودًا. credentials خارج المستودع، وتُحذف fixtures بعد الاختبار النهائي بأدوات الإدارة.

## V3

موقع الويب: https://midad-writing.vercel.app . نُشرت نسخة `38aad139472dcbcea2ca1371f13cd99e6ae5591c` وتحقق منها المتصفح: تسجيل جديد بلا تأكيد، نقل الضيف، دخول لاحق، حفظ سحابي واسترجاع، بلا أخطاء JS أو overflow على الهاتف. يلحقها إصدار تصحيحي بعد اختبار المسارات القديمة والملف العام.

MCP خاص: https://midad-chatgpt-writer.carefreepeach1.chatgpt.site/mcp . Sites version 2، source commit `a5c22e9`، 10 أدوات. سر MIDAD_BRIDGE_KEY داخل إعدادات خادم Sites فقط؛ Gateway يستخدم Supabase runtime secret المدمج، ولا يوجد secret في GitHub. رابط الدخول إلى Sites يثبت هوية مستخدم المكوّن فقط؛ ربط حساب الموقع وصلاحياته يحدث عبر /connect.

التحقق النهائي المحلي للتصحيح: 10/10 Playwright، 5/5 Vitest، 40/40 API. نُشر ملف الكاتب العام والتصحيحات بعد هذه الفحوص. آخر SHA ورابط النشر يثبتان من بيانات Vercel والأدلة المرفقة عند الإصدار.

الإصدار التصحيحي النهائي READY: `4f7674605fb60d44460b9e78a058c7afa711bcb4` / `dpl_F7AvpM4QsjRoJ7Q3jJ6rnG5FW2La`. رابط الإنتاج https://midad-writing.vercel.app . تحقق V3 على الإنتاج في v3-production-verification.json؛ التعديلات اللاحقة في Git توثيق ولقطات ومحدد اختبار فقط، دون تغيير كود التطبيق.
