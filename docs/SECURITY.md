# الأمان
لا service_role ولا كلمة مرور في الواجهة أو جداول التطبيق. Publishable Key فقط. Supabase SDK يدير الجلسة والتجديد، وجميع طلبات البيانات تحمل JWT مع RLS. user_metadata لا تستخدم في أي صلاحية. الحماية الفعلية في القاعدة وتعمل حتى مع طلب REST مباشر.

RLS: ملكية auth.uid()، منع نقل المالك، وربط مركب يمنع إلحاق بيانات بحاوية مستخدم آخر. Storage private مع سياسات select/insert/update/delete على uid في المجلد الأول. السجل القديم محفوظ قبل كل تعديل مقبول.

React يهرب النصوص؛ لا dangerouslySetInnerHTML. Tiptap يعرض schema محددة، استيراد DOCX كنص فقط، وEPUB XML يهرب الرموز. رؤوس nosniff وframe DENY وReferrer Policy وPermissions Policy. CSP شاملة لم تُنفذ. التحقق من أحجام JSON والطول والتدقيق المتقدم يحتاج تحسينًا. بيانات الاستعادة المحلية ليست مشفرة؛ الجهاز المشترك يتطلب انتباهًا، وتُعزل المفاتيح حسب uid.

Security Advisors: لا تحذير على جداول أو دوال مِداد. تحذيران informational عن جداول zeus_ بدون سياسات (تُترك دون تدخل)، وتحذير عام Leaked Password Protection Disabled؛ يحتاج ضبط Auth مناسبًا للمشروع المشترك. لا ندعي خلو المشروع بأكمله من التحذيرات.

اختبارات RLS الفعلية في docs/rls-results.json. مستخدما QA مؤقتان جرى توفيرهما في Auth بصلاحية إدارية بسبب حد البريد؛ الدخول والبيانات اختُبرت كـauthenticated بالمفتاح العام، لا كـpostgres. هذه ليست برهانًا على تسليم رسالة تأكيد البريد.
