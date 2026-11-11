# MIDAD · Obsidian Liquid Glass
واجهة عربية أصلية للكاتب، لا لوحة قياس عامة. الأسود الحقيقي هو مساحة الصمت؛ أغلفة الكتب والنص الأدبي هما مركز الانتباه.

## البحث والقرار
تم جلب Apple Liquid Glass وAdopting Liquid Glass من ملفات DocC JSON الرسمية في 2026-11-11: المادة طبقة وظيفية للملاحة والتحكم، وليس خلفية للمحتوى. HIG HTML احتاج JavaScript؛ لم ندّع قراءة محتواه الكامل. تمت قراءة frontend-design/SKILL.md من Anthropic: شخصية مرتبطة بالمادة، تباعد مقصود، نقد باللقطات، وتجنّب الزخرفة المتكررة. تمت مراجعة نص مقال v0 How to prompt v0 وScreenshots and Files: تحديد السياق والمكوّن والحالات، ثم تكرار التنفيذ بالمقارنة البصرية. تمت معاينة بنية صفحات Linear وRaycast وFramer؛ طلبات Arc وNotion وCraft أعادت 403 ولم تُستخدم كأدلة على تفاصيلها الداخلية.

المصادر: https://developer.apple.com/documentation/TechnologyOverviews/liquid-glass ، https://developer.apple.com/documentation/TechnologyOverviews/adopting-liquid-glass ، https://developer.apple.com/design/human-interface-guidelines/ ، https://github.com/anthropics/skills/tree/main/skills/frontend-design ، https://vercel.com/blog/how-to-prompt-v0 ، https://v0.app/docs/screenshots . لا أصول منسوخة من المنتجات المرجعية.

## الرموز
|الدور|القيمة|
|---|---|
|الأساس|#000000|
|مساحة النص|#0B0B0D|
|سطح مرتفع|#141416|
|النص|#FFFFFF|
|ثانوي|#B8B8BF|
|مساعد|#81818A|
|حد|white 10%|
|انعكاس|white 16%|

IBM Plex Sans Arabic للواجهة 400/500/600؛ Amiri للنص الأدبي 400/700. الخطوط مستضافة محليًا بصيغة TTF. أحجام الواجهة 11–16، عناوين 21–44، المخطوطة 18–36 قابلة للتغيير. لا تباعد بين حروف العربية. مقياس مسافات 4/8/12/16/20/24/32/40/64. Lucide بسماكات موحدة وأحجام 14–26.

الأسطح الزجاجية محدودة: topbar، toolbar، dialog. blur=18px، خط ضوء داخلي 1px، بديل معتم عند غياب الدعم. لا حركة مستمرة ولا WebGL. أغلفة هندسية أصلية بـCSS مرتبطة بعنوان الكتاب، ليست بيانات أعمال وهمية. قراءة المخطوطة على سطح ثابت. المكتبة معرض أغلفة مع استكمال آخر عمل؛ لا بطاقات إحصائية زخرفية.

الأزرار: تحويم أبيض 5%، ضغط scale .98، تركيز outline 2px، تعطيل opacity .4، تحميل نص واضح. النجاح والحفظ لا يظهران قبل استجابة قاعدة البيانات. التباين وأهداف اللمس تحتاج توسعة مراجعة AA لبعض نصوص metadata الصغيرة.
