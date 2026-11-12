# حالة الوظائف — الإصدار الثاني

حالات التنفيذ تعني النطاق المحدد أدناه، لا تكافؤًا كاملًا مع Novalist. ما زالت بعض شروط المنتج الأصلي غير مكتملة.

|الميزة|الحالة|النطاق والدليل|
|---|---|---|
|التسجيل بلا تأكيد بريد|Implemented and tested|midad-signup يؤكد المستخدم على الخادم ثم دخول عادي؛ لا رسالة تأكيد مطلوبة|
|الدخول والخروج|Implemented and tested|حسابات جديدة حقيقية، وليست fixtures أضيفت يدويًا إلى Auth|
|الضيف|Implemented and tested|IndexedDB، روايات/كتب/فصول/مشاهد، حفظ ونسخ محلية، إعادة فتح، نقل إلى الحساب|
|نقل الضيف إلى حساب|Implemented and tested|UUIDs ثابتة وروابط محفوظة؛ إعادة دخول واسترجاع النص والحاشية؛ الأصل المحلي يبقى|
|الواجهة الزجاجية الجديدة|Implemented and tested|Login/Library/Editor، SVG أصلي وتكوين فضي، لقطات Desktop/iPad/Phone؛ الحكم الجمالي النهائي للمستخدم|
|مشاريع وكتب وفصول ومشاهد|Partially implemented|إنشاء، تعديل أسماء، حذف كتاب/فصل/مشهد، ترتيب فصول ومشاهد؛ بعض CRUD لم تختبر منفردة|
|المسودات المستقلة|Implemented and tested|نسخ نصوص وannotations أو بداية فارغة، تبديل، حذف نسخة مع حماية الأصل؛ لا diff بين المسودات بعد|
|محرر عربي طويل|Implemented and tested|Tiptap، نص عربي مختلط، RTL، autosave، استعادة بعد دخول|
|تعارض النسخ السحابية|Implemented and tested|CAS ذري، رفض stale version، snapshot قبل كل تعديل؛ UI يحفظ النسخة المحلية|
|نسخ المشاهد واستعادتها|Implemented and tested|معاينة جنبًا لجنب، حماية الحالية؛ لا diff ملون|
|التركيز|Implemented and tested|نفس مثيل المحرر، Esc واختصار، تباعد/عرض/حجم مستقل|
|إعدادات المحرر|Implemented and tested|حجم وخط وعرض وتباعد؛ حفظ محلي تلقائي وسحابي عند طلب الحفظ؛ تحقق بسياق متصفح جديد|
|الشخصيات والأماكن|Partially implemented|اسم/ألقاب/عمر/وصف/خلفية/أهداف/انتماءات، CRUD وصورة خاصة؛ custom fields وظهور المشاهد ناقصان|
|العلاقات المرئية|Implemented and tested|إنشاء وتعديل علاقة، SVG حقيقي، قائمة تحرير وحذف؛ إنشاء/تحرير مختبران، حذف العلاقة يحتاج اختبار متصفح منفصل|
|التعليقات والحواشي|Partially implemented|mark ID مرتبط بالتحديد، نص الملاحظة، قفز/تحرير/حذف؛ إنشاء ونقل للحساب مختبران؛ التصدير يجمعها نهاية الفصل ولا ينتج native Word comments|
|الأقواس والأحداث|Partially implemented|هدف/صراع/نتيجة، حالة وتاريخ، ربط قوس ومشهد، انتقال للمشهد؛ dependencies والتقويم الخيالي غير منفذين|
|الخط الزمني|Partially implemented|ترتيب بالأحداث وتواريخ قابلة للتحرير؛ لا zoom أو مسارات متوازية أو تواريخ نسبية|
|البحث بالمشروع|Implemented and tested|النصوص والشخصيات والملاحظات والأحداث، تطبيع التشكيل والألف، انتقال للمشهد؛ بحث عميل غير مفهرس SQL|
|Writing Sprint|Implemented and tested|توقيت محفوظ على الجهاز، delta كلمات الكتاب ونتيجة محفوظة بالحساب/الضيف، إنهاء يدوي؛ لا تقرير يومي مفصل|
|الصور الخاصة|Implemented and tested|Storage private + روابط موقعة، رفع/عرض/حذف غلاف، UI للشخصيات؛ صورة الشخصية نفسها لم تختبر منفردة|
|TXT/MD/DOCX/EPUB export|Partially implemented|نص/عناوين/RTL وعريض ومائل وتسطير أساسي، حواشي نهاية الفصل؛ اختبارات XML وZIP؛ لا EPUBCheck أو Word بصري أو full fidelity|
|TXT/MD/DOCX import|Partially implemented|معاينة نص وإضافة لمشهد؛ DOCX كنص فقط، لا تقسيم فصول أو الحفاظ على كل تنسيق|
|نسخ احتياطية JSON|Implemented and tested|نصوص وكيانات وتخطيط ونسخ وعلاقات، معاينة ثم استيراد بمعرّفات جديدة؛ تستثني الصور والملفات|
|RLS وStorage|Implemented and tested|فحوص REST بحسابين عبر المفتاح العام؛ النتائج في v2-rls-results.json|
|استعادة كلمة المرور|Implemented but unverified|Supabase email recovery؛ ما زال يحتاج SMTP/redirect verification؛ لا خلط بينها وبين تأكيد التسجيل الذي أزيل من مسار مِداد|
|أداء Safari/iPad A10|Implemented but unverified|اختبار مقاسات فقط عبر Chromium؛ الجهاز الفيزيائي غير متاح|
|PDF، EPUB import، plugins|Not implemented|لا أزرار توهم بتوفرها|
|Series مخصصة، multiple timelines، custom entities كاملة|Not implemented|مشروع متعدد الكتب وWorld Bible مشتركة موجودان؛ واجهات سلسلة متخصصة غير موجودة|
|PWA Offline كامل|Partially implemented|manifest فقط؛ guest database محلية لكن تشغيل shell بلا شبكة بعد إغلاقه ليس مضمونًا|
|إتاحة WCAG AA شاملة|Partially implemented|RTL، native dialogs، focus، reduced motion، إصلاحات overlays؛ لا تدقيق شامل|

الاختبارات النهائية والإصدار المنشور في TEST_REPORT.md. لا تُقرأ نتائج الإصدار الأول كتقرير للميزات المضافة حديثًا.

## تحديث V3 (يُراجع مع V3_TEST_REPORT.md)

|الميزة|الحالة|النطاق|
|---|---|---|
|رواية → قصة → فصل كامل مباشرة|Implemented and tested|اختبار ضيف ونص عربي طويل واسترجاع؛ لا خطوة كتاب|
|المشاهد اختيارية ومعاينة الفصل مجمعًا|Implemented and tested|تحويل فصل محفوظ إلى مشاهد مع بقاء نصه الأصلي؛ معاينة النصين|
|الملف الشخصي|Partially implemented|تعديل الاسم واسم المستخدم والنبذة وخيار الظهور؛ واجهة ملف عام مستقلة لم تنفذ بعد|
|مشاركة قارئ/كاتب|Implemented and tested|RLS وحسابان حقيقيان؛ اختبار واجهة مستمر حتى التقرير النهائي|
|نشر فصول مختارة|Implemented and tested|API نشر وقراءة مجهولة وإلغاء نشر؛ اختبار UI مستمر حتى التقرير النهائي|
|ChatGPT MCP|Implemented and tested|مكوّن Sites خاص منشور، أدواته ظهرت واستُدعيت فعليًا بالمحادثة؛ الكتابة الفعلية اختبرت بحسابات QA|
|ربط حسابات مِداد متعددة|Implemented and tested|اختيار حساب مستقل، بريد مختلف عن GPT، إلغاء مستقل، عدم اختيار حساب ضمنيًا عند التعدد|
|تحرير لحظي بمؤشرات مشتركة|Not implemented|المشاركة الحالية حفظ نسخ متعارضة محمي، وليست CRDT|
|متابعة كتاب/تعليقات القراء/إشعارات/جدولة نشر|Not implemented|مقترحات لتوسيع المنصة؛ لا أزرار شكلية لها|
