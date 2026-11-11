> تحديث v2: أقسام نقل الويب أدناه تسجل خطة التحليل الأولى. الحالة التنفيذية الحالية لكل ميزة في [FEATURE_STATUS.md](FEATURE_STATUS.md)، بعد إضافة مسودات وعلاقات وحواشٍ وأقواس وSprint.

# Novalist Feature Audit → خريطة مِداد

المصدر المقروء: syfslfk00-debug/novalist-official، الفرع build/ipados18-unsigned-ipa، commit b430dc5797867273a385761e400402ccdeefacc2. تحققنا أيضًا من HEAD للمصدر Drommedhar/novalist-official (4d1c8ee6c85326fcaaf973790ad609b221d53839)؛ لم نخلط نسخة HEAD مع الفرع المرجعي. هذا تحليل للفرع المرجعي، وليس إثبات تكافؤ كامل مع كل تطورات المصدر الأصلي.

الترخيص الرئيسي MIT ©2026 Dominik، وLICENSES.md يعدد التبعيات. لم تُنسخ شيفرة أو أصول أو أغلفة؛ بُني التنفيذ مستقلًا. أي نقل لاحق يحتاج الاحتفاظ بإشعارات MIT وفحص ترخيص الاعتماد نفسه. تطبيق المرجع Electron 42 + React + backend C# .NET، مع FileService وRPC وجسور window.novalist. منطق التواريخ والـdiff والـparsing قابل لإعادة كتابة واختبار؛ التنفيذ المباشر C# والمسارات والمراقب وnative dialogs وGit والتحديثات لا يعمل داخل متصفح.

## أدلة واجهة واختبارات
قُرئت Models وServices، useEditorSynchronization.ts، EntityDetailFields.tsx، timelineModel.tsx، دليل 03-projects-and-books، وأجزاء SnapshotService وSceneConflictRpcTests. اختبارات المرجع لم تُشغّل؛ هي أدلة على توقعاته وليست نتائج اختبارات مِداد. أدلة إضافية قابلة للمراجعة: docs/manual/05-editor.md، 06-codex.md، 08-plot-grid.md، 12-timeline.md، 20-export.md، 24-extensions.md، 25-command-palette.md، 37-planning-board.md، 38-manuscript-import.md، 45-drafts.md، tests/Novalist.Backend.Tests/ExportConcurrencyTests.cs وScenesRpcTests.cs وSearchRpcTests.cs. لا ندّعي تدقيق كل مسار فرعي في هذه الجلسة؛ الميزات التالية هي خريطة العمل والأجزاء الدقيقة المذكورة نقاط ارتكاز المصدر.

## المشاريع والكتب
- وظيفة الكاتب: اختيار كتاب وقراءة كتب أخرى دون تبديل ActiveBook؛ تصدير السلسلة يقرأ مسارات مستقلة.
- التنفيذ المرجعي: `Novalist.Core/Models/BookData.cs`, `Novalist.Core/Services/ProjectService.Books.cs`.
- البيانات والعلاقات: Project، Book، author، cover، ترتيب؛ يرتبط بالفصول والتصدير.
- نقل الويب واختباره: جداول project/book وUUID بدل مسارات القرص؛ CRUD واختبار تبديل كتاب.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## المسودات
- وظيفة الكاتب: إعادة كتابة مستقلة لكل كتاب ومقارنة المسودات دون تغيير الحالية.
- التنفيذ المرجعي: `Novalist.Core/Models/BookDraftData.cs`, `Novalist.Core/Services/DraftCompareService.cs`.
- البيانات والعلاقات: DraftIndex، draft.json، فصول ومشاهد؛ يرتبط بالتاريخ والنسخ.
- نقل الويب واختباره: جدول drafts مع book_id وفروع محتوى؛ ليس منفذًا؛ اختبار مقارنة واستعادة منفصلة.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الفصول والمشاهد
- وظيفة الكاتب: المشهد وحدة تحرير له هدف ونتيجة وحالة وعلامات واستبعاد من النشر.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneData.cs`, `Novalist.Core/Services/SceneEditingState.cs`.
- البيانات والعلاقات: Chapter GUID، Scene ID، order، synopsis، goal، outcome، wordCount.
- نقل الويب واختباره: علاقات SQL وترتيب محفوظ؛ اختبار إنشاء/تبديل/ترتيب/حذف وعدم تغيير بقية الكتاب.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## المحرر والتزامن
- وظيفة الكاتب: يحمل الكاتب بصمة آخر محتوى؛ يرفض حفظ النص إذا تغير الملف، ويعرض طرفي التعارض.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneData.cs`, `Novalist.Core/Services/SceneConflictGuard.cs`.
- البيانات والعلاقات: HTML، expected hash، DiskHtml؛ يرتبط بالمحرر وsync والتاريخ.
- نقل الويب واختباره: Tiptap JSON + إصدار ذري، طابور autosave ومسودة محلية؛ اختبار نص طويل وجلستين وانقطاع شبكة.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## النسخ والاستعادة
- وظيفة الكاتب: ListAsync يقرأ ملفات JSON ويرتب بتاريخ الإنشاء؛ RestoreAsync يلتقط الحالية أولًا ثم يستعيد النص والحقول الملتقطة فقط.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneSnapshot.cs`, `Novalist.Core/Services/SnapshotService.cs`.
- البيانات والعلاقات: content، metadata، capturedFields، timestamp؛ يرتبط بالمشاهد.
- نقل الويب واختباره: جدول revisions وRPC ذرية؛ اختبار حماية الحالية واستعادة مشهد دون حذف مشروع.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## البحث والاستبدال
- وظيفة الكاتب: تجميع المطابقات مع خيارات حدود الكلمات وتطبيق التعديلات على النصوص.
- التنفيذ المرجعي: `Novalist.Core/Models/FindReplace.cs`, `Novalist.Core/Services/FindReplaceService.cs`.
- البيانات والعلاقات: أنماط ومطابقات ومواضع؛ يرتبط بالتحرير والتراجع.
- نقل الويب واختباره: ProseMirror transactions بدل معالجة ملفات HTML؛ اختبار تشكيل ونص مختلط وتراجع.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## التعليقات والحواشي
- وظيفة الكاتب: نقل علامات annotation عند تقسيم/نقل المشاهد مع الحفاظ على مرجعها.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneData.cs`, `Novalist.Core/Services/SceneAnnotationTransfer.cs`.
- البيانات والعلاقات: معرّفات annotations ومواضع النص؛ ترتبط بنقل المشاهد وتصدير DOCX.
- نقل الويب واختباره: marks ذات IDs وجداول comments/footnotes؛ غير منفذ؛ اختبار انتقال وربط العلامات وتصديرها.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## ملاحظات وأفكار
- وظيفة الكاتب: ملاحظات المشهد جزء من بياناته، scratchpad مساحة تدوين منفصلة.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneData.cs`, `Novalist.Core/Services/ScratchpadService.cs`.
- البيانات والعلاقات: Notes، synopsis، scratchpad؛ ترتبط بالتخطيط.
- نقل الويب واختباره: project_notes أولًا ثم notes مرتبطة بالمشهد؛ اختبار CRUD واستمرارها بعد الدخول.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الشخصيات والأماكن
- وظيفة الكاتب: Load/Save/Delete لكل نوع، تحويل كيان من كتاب إلى World Bible والعكس.
- التنفيذ المرجعي: `Novalist.Core/Models/CharacterData.cs`, `Novalist.Core/Services/EntityService.cs`.
- البيانات والعلاقات: aliases، age، appearance، sections، goals، overrides، media؛ ترتبط بمشاهد وكتب.
- نقل الويب واختباره: كيانات علائقية مع حقول مرنة ووسائط خاصة؛ اختبار CRUD وعزل المستخدم.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## World Bible والقوالب
- وظيفة الكاتب: ترتيب/إخفاء حقول النوع وحقل IsWorldBible ومشاركة كيان بين الكتب.
- التنفيذ المرجعي: `Novalist.Core/Models/EntitySheet.cs`, `Novalist.Core/Services/EntityService.cs`.
- البيانات والعلاقات: typeKey، hidden، order، project entities؛ يرتبط بالسلسلة.
- نقل الويب واختباره: كيان على مستوى المشروع، تخصيص حقول versioned مستقبلًا؛ اختبار عدم تكرار الشخصية عبر الكتب.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## العلاقات
- وظيفة الكاتب: تعديل العلاقات بمنطق مستقل عن الواجهة وإرجاع نتيجة الكتابة والصفوف.
- التنفيذ المرجعي: `Novalist.Core/Models/CharacterData.cs`, `Novalist.Core/Services/RelationshipWriter.cs`.
- البيانات والعلاقات: طرفا العلاقة، النوع والدور العكسي؛ يرتبط بالشخصيات.
- نقل الويب واختباره: جدول relationships مع FKs وفحص الملكية؛ رسم SVG قابل للتحرير، ليس منفذًا؛ اختبار التعديل والحذف والروابط المعكوسة.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الحبكة وشبكة المشاهد
- وظيفة الكاتب: Create/Update/Reorder، ربط المشهد بمسار حبكة وكتابة ملاحظة للخلية وتاريخ واستعادة القوس.
- التنفيذ المرجعي: `Novalist.Core/Models/BookData.cs`, `Novalist.Core/Services/PlotlineService.cs`.
- البيانات والعلاقات: PlotlineData، Scene.PlotlineIds، grid cell notes؛ يرتبط بالمخطوطة.
- نقل الويب واختباره: arcs + event_scene join؛ اللوحة الحالية حالات أحداث فقط، لا تكافؤ كامل؛ اختبار ترتيب وربط وتاريخ.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الخطوط الزمنية
- وظيفة الكاتب: أحداث يدوية ومشتقة من مشاهد، مسارات متعددة، تواريخ نسبية وتبعيات وإزاحات.
- التنفيذ المرجعي: `Novalist.Core/Models/TimelineData.cs`, `Novalist.Core/Services/InWorldCalendarService.cs`.
- البيانات والعلاقات: date/endDate، category، linkedScene، character/location IDs، dependsOn؛ يرتبط بالتقويم.
- نقل الويب واختباره: أحداث SQL وروابط، حساب تواريخ ضمن خدمة نقية؛ الخط الحالي أبسط؛ اختبار دورة تبعيات وترتيب وتقويم خيالي.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## لوحة التخطيط الحرة
- وظيفة الكاتب: Create/Load/Save/Delete للوحات محفوظة بمرجع من manifest.
- التنفيذ المرجعي: `Novalist.Core/Models/CanvasData.cs`, `Novalist.Core/Services/CanvasService.cs`.
- البيانات والعلاقات: nodes/edges/positions؛ ترتبط بكيانات ومشاهد.
- نقل الويب واختباره: جداول boards/cards/edges وسحب مع أزرار ترتيب؛ غير منفذ؛ اختبار الإحداثيات والربط.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الاستيراد
- وظيفة الكاتب: تفكيك Markdown وتعرّف العناوين والمشاهد وبيانات frontmatter؛ مسارات Scrivener مستقلة.
- التنفيذ المرجعي: `Novalist.Core/Models/BookData.cs`, `Novalist.Core/Services/FolderImportMarkdown.cs`.
- البيانات والعلاقات: نص أصلي وفصول مستخرجة؛ يرتبط بالكتاب والكيانات.
- نقل الويب واختباره: File API + معاينة قبل insert؛ TXT/MD/DOCX كنص؛ اختبار paragraphs وUnicode وملف تالف.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## التصدير
- وظيفة الكاتب: CompileChapters ثم dispatch للصيغة؛ VolumeSource يمنع تبديل حالة الكتاب أثناء تصدير مجلدات متعددة.
- التنفيذ المرجعي: `Novalist.Core/Services/ExportService.cs`.
- البيانات والعلاقات: خيارات نشر وفصول مختارة ومشاهد مستبعدة ومؤلف لكل مجلد.
- نقل الويب واختباره: مكتبات JS لـDOCX وEPUB وXML RTL؛ اختبار فتح ZIP وقراءة النص والفهرس؛ PDF مؤجل حتى اختبار تشكيل العربية.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## البحث العام
- وظيفة الكاتب: SearchAsync يبحث النص والكيانات عبر أنواع ويقرأ نصوص المشاهد من خدمة المشروع.
- التنفيذ المرجعي: `Novalist.Core/Models/SceneData.cs`, `Novalist.Core/Services/GlobalSearchService.cs`.
- البيانات والعلاقات: GlobalSearchHit(kind,id,snippet)؛ يرتبط بالتنقل.
- نقل الويب واختباره: SQL FTS أو trigram + فهرس Unicode؛ المكتبة فقط حاليًا؛ اختبار مطابقة عربية وأداء على آلاف المشاهد.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## جلسات الإنتاجية
- وظيفة الكاتب: جلسات كتابة ونتائج عدد الكلمات والتوقيت؛ لا تختزل إلى رسم زخرفي.
- التنفيذ المرجعي: `Novalist.Core/Models/AppSettings.cs`, `Novalist.Core/Services/SprintService.cs`.
- البيانات والعلاقات: توقيت وبداية/نهاية وعد الكلمات؛ يرتبط بالأهداف.
- نقل الويب واختباره: writing_sessions مع elapsed وword_delta؛ غير منفذ؛ اختبار إعادة تحميل timer وعدم ازدواج الجلسة.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الإعدادات والاختصارات
- وظيفة الكاتب: إعدادات خط وحجم وتباعد وtypewriter وfocus وألوان واختصارات مخزنة منفصلة عن الكتاب.
- التنفيذ المرجعي: `Novalist.Core/Models/AppSettings.cs`, `Novalist.Core/Services/ProjectService.cs`.
- البيانات والعلاقات: AppSettings وProjectSettings overrides؛ يرتبط بكل العروض.
- نقل الويب واختباره: user_preferences مع editor مستقل؛ إعدادات محلية جزئية فقط؛ اختبار keyboard/reduced motion وRTL.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## النسخ الاحتياطي وGit
- وظيفة الكاتب: نسخ مجلدات المشروع وإدارة retention؛ GitService يستدعي أدوات سطح مكتب.
- التنفيذ المرجعي: `Novalist.Core/Models/GitModels.cs`, `Novalist.Core/Services/BackupService.cs`.
- البيانات والعلاقات: مسارات وarchives وGit history؛ يرتبط بإدارة الملفات.
- نقل الويب واختباره: نسخ SQL/Storage مع export قابل للنقل؛ لا git على العميل؛ غير منفذ؛ اختبار restore معزول.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## الإضافات
- وظيفة الكاتب: تثبيت إضافات مع فحص توافق؛ وجود SDK مستقل لـC# .NET.
- التنفيذ المرجعي: `Novalist.Core/Models/ExtensionGallery.cs`, `Novalist.Core/Services/ExtensionGalleryService.Install.cs`.
- البيانات والعلاقات: metadata/compatibility/files/settings؛ ترتبط بدورة حياة التطبيق.
- نقل الويب واختباره: لا تشغيل كود سطح المكتب داخل جلسة المستخدم؛ يلزم sandbox وصلاحيات صريحة؛ غير منفذ؛ اختبار عزل extension.
- إعادة الاستخدام والتبعيات: إعادة هندسة إلى TypeScript/Postgres؛ يُعاد استخدام المفهوم والاختبارات السلوكية، لا IO القرص أو RPC/native الخاص بـElectron.

## فجوات يتطلب تدقيقها تفصيلًا لاحقًا
Narration، AI policies، الخرائط، اللغات الخيالية، Exposé، Craft، reader views، promises، rubrics، submissions، نظام الاقتراحات والتعقب: موجودة أسماؤها وملفاتها في الفرع، لم يُنجز تدقيق سلوكي كامل لها ولم تُنفذ في مِداد. يجب إضافة قسم أدلة لكل منها قبل اعتبار خريطة التكافؤ شاملة. أولوية المنتج: سلامة النص وعزل الحسابات، ثم استكمال المسودات والروابط والتخطيط، ثم أدوات متقدمة.
