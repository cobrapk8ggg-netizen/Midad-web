# حالة الوظائف

الحالة العامة: **Partially implemented**. المنتج لا يحقق بعد جميع شروط القبول الواردة في الطلب. لا وضع Demo ولا بيانات مستخدمين مزيفة؛ أغلفة العناوين مولدة بصريًا من المشاريع الحقيقية.

|الميزة|الحالة|النطاق والدليل|
|---|---|---|
|تسجيل الدخول والخروج|Implemented and tested|حسابا QA حقيقيان، Playwright وREST|
|إنشاء الحساب وتأكيد البريد|Blocked|واجهة signUp حقيقية؛ حد البريد منع إكمال تأكيد حساب جديد|
|استعادة كلمة المرور|Implemented but unverified|واجهات resetPasswordForEmail/updateUser؛ تسليم الرسالة وredirect يحتاجان تحققًا|
|جلسة SDK وتجديدها|Partially implemented|استمرار جلسة مختبر؛ انتهاء وتجديد طويل الأمد لم يُختبرا|
|مشاريع وكتب وفصول ومشاهد|Partially implemented|إنشاء وتبديل واسترجاع مختبر؛ بعض عمليات تعديل/حذف الكتب والفصول غير متاحة|
|مكتبة RTL والبحث بالعنوان|Implemented and tested|لقطات Desktop وiPad والهاتف|
|محرر Tiptap عربي ونص طويل|Implemented and tested|23940 حرفًا و4680 كلمة تقريبًا، خروج/دخول واستعادة|
|تنسيق النص والبحث والاستبدال|Implemented but unverified|الأوامر موصولة بـProseMirror؛ يلزم توسيع الاختبار للتحديد واللصق والتراجع|
|الحفظ التلقائي ونسخ سابقة|Implemented and tested|RPC يزيد الإصدار ويحفظ السابقة؛ REST رفض stale version|
|Offline والاستعادة المحلية|Partially implemented|طابور وlocalStorage وretry؛ انظر TEST_REPORT لنتيجة اختبار الشبكة|
|تعارض جلستين|Partially implemented|رفض على القاعدة مختبر؛ UI تنزيل نسخة محلية، لا دمج فقري|
|معاينة واستعادة النسخ|Partially implemented|مقارنة جنبًا لجنب؛ لا diff ملون؛ نتائج المتصفح بالتقرير|
|التركيز|Implemented and tested|المحرر نفسه يبقى مركبًا؛ screenshot محفوظ|
|إعداد الخط والحجم والعرض|Partially implemented|تفاعلي داخل الجلسة؛ لا مزامنة تفضيلات أو تحكم line-height بعد|
|ترتيب المشاهد|Partially implemented|سحب خطوة وأزرار تقديم/تأخير؛ لا نقل بين الفصول ولا transaction جماعي|
|الشخصيات والأماكن|Partially implemented|CRUD حقول أساسية؛ إنشاء شخصية مختبر؛ الحقول المفصلة والوسائط والظهور بالمشاهد ناقصة|
|ملاحظات المشروع|Implemented but unverified|CRUD حقيقي موصول؛ اختبار المتصفح يحتاج توسعة|
|لوحة الأحداث والخط الزمني|Partially implemented|إنشاء وحالة وتاريخ؛ لا arcs/dependencies/scene links كاملة|
|World Bible عبر كتب المشروع|Partially implemented|الكيانات على project scope؛ لا overrides لكل كتاب|
|العلاقات المرئية|Not implemented|لا رسم شكلي|
|TXT/Markdown/DOCX/EPUB export|Partially implemented|الملفات قرئت مجددًا بالاختبار؛ نص وعناوين RTL، marks لا تُصدّر بعد؛ لا EPUBCheck أو Word بصري|
|TXT/MD/DOCX import|Partially implemented|معاينة نص وإضافة كمشهد؛ لا تقسيم فصول آلي ولا حفظ التنسيق الأصلي|
|PDF وEPUB import|Not implemented|لا زر يوهم بالتوفر|
|لوحة الأوامر|Partially implemented|تنقل وأوامر مع Ctrl/⌘ K؛ لا بحث كامل بالمخطوطة|
|RLS وStorage policies|Implemented and tested|32 تحققًا في rls-results.json|
|Storage UI|Not implemented|bucket والسياسات موجودة؛ رفع الأغلفة والصور غير موجود|
|أهداف وإحصاء الكلمات|Partially implemented|عداد وهدف افتراضي فقط؛ لا إعداد هدف أو تقارير يومية|
|Sprint والإحصاءات والجلسات|Not implemented|لم يُنشأ رسم زخرفي|
|المسودات المتعددة والسلاسل|Not implemented|كتب متعددة موجودة، إدارة drafts/series غير موجودة|
|تعليقات وحواشي ومراجعات اقتراحية|Not implemented|تحتاج schema وmarks مستقلة|
|نسخ احتياطية وإدارة البيانات|Not implemented|صادرات نصية فقط ليست backup شاملًا|
|PWA|Partially implemented|manifest وأيقونة؛ لا service worker أو Offline كامل|
|الوصول الشامل وiPad فعلي|Partially implemented|RTL وfocus وnative dialog وتقليل حركة؛ لا ضمان AA أو اختبار A10 فيزيائي|
|النشر|Implemented but unverified|انظر تقرير النشر والاختبار النهائي|

الخطوة التالية بعد حل البريد: اختبار إنشاء مستخدم وتأكيده واستعادة كلمته من الرابط المنشور، ثم توسيع CRUD والمسودات وروابط الشخصيات بالمشاهد قبل أي إعلان جاهزية للإنتاج.
