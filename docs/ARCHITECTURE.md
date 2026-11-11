# البنية
Next.js App Router، React، TypeScript. تطبيق عميل خلف واجهة جلسة Supabase؛ RLS هو حد الأمان الحقيقي، لا إخفاء الصفحات. لا بيانات مخطوطات ضمن HTML المبني أو cache خادم مشترك. CSS tokens مخصصة بدل Tailwind لإبقاء لغة السطوح دقيقة وخفيفة. حركة CSS بدل مكتبة إضافية. Tiptap/ProseMirror يملك DOM النص؛ لا setContent عند حفظه.

components/Auth للمصادقة؛ Midad ينسق المكتبة والكتاب؛ Writer للمحرر وطابور الحفظ؛ Workspace لبناء العالم والتخطيط؛ Publish للاستيراد والتصدير. lib/supabase طبقة البيانات، lib/types العقود، lib/export إنتاج الملفات بتحميل مؤجل لـDOCX/ZIP، lib/words عد الكلمات. التحقق الأساسي HTML وقيود Postgres؛ أزيلت Zod غير المستخدمة. يستحسن فصل Midad إلى hooks ووحدات قبل توسيع المنتج.

الحفظ: نسخة JSON محلية بمفتاح user+scene، debounce 850ms، طابور متسلسل، retry كل 8s وعند online، compare-and-swap ذري في Postgres. رفض version_conflict يبقي النسخة المحلية مع خيار تنزيل وإعادة فتح السحابية. لا دمج تلقائي. النسخ تُنشأ لكل حفظ؛ سياسة احتفاظ لم تُنفذ بعد. الحفظ المحلي synchronous وقد يحتاج IndexedDB للمخطوطات الكبيرة.

استيراد DOCX كنص عبر mammoth لا HTML. تصدير DOCX وEPUB RTL، النص والتقسيم محفوظان؛ تنسيق marks الداخلي لا ينتقل بعد. المصدر الأصلي Electron+C# لا يصلح نقله مباشرًا للخادم؛ التنفيذ مستقل.
