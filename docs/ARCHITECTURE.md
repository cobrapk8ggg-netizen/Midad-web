# البنية
Next.js App Router، React، TypeScript. تطبيق عميل خلف واجهة جلسة Supabase؛ RLS هو حد الأمان الحقيقي، لا إخفاء الصفحات. لا بيانات مخطوطات ضمن HTML المبني أو cache خادم مشترك. CSS tokens مخصصة بدل Tailwind لإبقاء لغة السطوح دقيقة وخفيفة. حركة CSS بدل مكتبة إضافية. Tiptap/ProseMirror يملك DOM النص؛ لا setContent عند حفظه.

components/Auth للمصادقة؛ Midad ينسق المكتبة والكتاب؛ Writer للمحرر وطابور الحفظ؛ Workspace لبناء العالم والتخطيط؛ Publish للاستيراد والتصدير. lib/supabase طبقة البيانات، lib/types العقود، lib/export إنتاج الملفات بتحميل مؤجل لـDOCX/ZIP، lib/words عد الكلمات. التحقق الأساسي HTML وقيود Postgres؛ أزيلت Zod غير المستخدمة. يستحسن فصل Midad إلى hooks ووحدات قبل توسيع المنتج.

الحفظ: نسخة JSON محلية بمفتاح user+scene، debounce 850ms، طابور متسلسل، retry كل 8s وعند online، compare-and-swap ذري في Postgres. رفض version_conflict يبقي النسخة المحلية مع خيار تنزيل وإعادة فتح السحابية. لا دمج تلقائي. النسخ تُنشأ لكل حفظ؛ سياسة احتفاظ لم تُنفذ بعد. الحفظ المحلي synchronous وقد يحتاج IndexedDB للمخطوطات الكبيرة.

استيراد DOCX كنص عبر mammoth لا HTML. تصدير DOCX وEPUB RTL، النص والتقسيم محفوظان؛ تنسيق marks الداخلي لا ينتقل بعد. المصدر الأصلي Electron+C# لا يصلح نقله مباشرًا للخادم؛ التنفيذ مستقل.

## الإصدار الثاني
طبقة البيانات تختار بين Supabase وIndexedDB وفق actor صريح. الضيف ليس جلسة Supabase مزيفة. lib/guest stores صفوفًا منفصلة وفهرس table ومعاملات atomic للحفظ والإصدارات؛ lib/portable ينشئ نسخًا قابلة للنقل ويتحقق من الروابط ويعيد المعرفات عند الاستعادة. نقل الضيف إلى الحساب idempotent مع حفظ المصدر المحلي.
Auth ينشئ الحساب عبر Edge Function محددة للمنتج تستخدم admin.createUser(email_confirm:true) ثم دخول Supabase العادي. لا مفاتيح privileged في العميل ولا تغيير لإعداد Auth المشترك. المكونات الجديدة منفصلة: Plan، Relationships، Sprint، Annotations، ManuscriptManager، ProjectSettings، BackupManager، Assets وProjectSearch.
المسودات تربط chapters بـdraft_id؛ null تعني الأصل. نسخ المسودة يعيد معرّفات المشاهد والحواشي ويحافظ على النص الأصلي. assets في bucket خاصة مع روابط موقعة لعشر دقائق.

## V3 — النموذج الذي يراه الكاتب

المكتبة → الرواية → القصة والفصول. book container داخلي يُنشأ تلقائيًا للتوافق مع البيانات السابقة. المستند الداخلي scene في الفصل المستمر لا يظهر كمتطلب أو كيان إضافي. writing_mode يميز الفصل الكامل من الفصل المقسم اختياريًا إلى مشاهد. القراءة والتصدير يرتبان الأجزاء داخل الفصل.

`NovelHome`, `Platform`, و`Connect` تفصل قصة الرواية والمشاركة والملفات وصفحة الموافقة عن منطق محرر Tiptap. ربط ChatGPT خدمة MCP خاصة مستقلة على Sites، والواجهة الرئيسية باقية على Vercel. التفاصيل في GPT_CONNECTION.md.
