# قاعدة البيانات
Supabase project pdfzdcwkkgapcwsnezvn (zeus-cloud)، PostgreSQL 17. مخطط إضافي بأسماء midad_ لتجنب جداول zeus_ القائمة. لا تغييرات في بياناتها أو إعدادات Auth المشتركة.

|الجدول|الغرض والعلاقة|
|---|---|
|midad_projects|مالك auth.users، عنوان، وصف، هدف|
|midad_books|project_id + user_id FK مركب|
|midad_chapters|book_id + user_id FK مركب|
|midad_scenes|chapter_id + user_id، JSON ProseMirror، نص بحث، إصدار|
|midad_revisions|scene_id + user_id، محتوى الإصدار السابق وتاريخه|
|midad_notes|ملاحظات المشروع|
|midad_entities|شخصيات وأماكن وأنواع مرنة؛ details JSONB للخصائص المرنة فقط|
|midad_events|أحداث مؤرخة وحالة وترتيب|

كل الجداول RLS بأربع سياسات منفصلة. USING وWITH CHECK على update. FKs مركبة تمنع ربط الطفل بمالك مشروع آخر. حذف cascade داخل المشروع. فهارس المالك وكل FK. الدالة midad_save_scene SECURITY INVOKER مع search_path فارغ وقفل FOR UPDATE. UUIDs تولد في القاعدة. الملفات في bucket خاص midad-assets ومسار uid/file. لا واجهة رفع أصول بعد.

الترحيل: supabase/migrations/20261111161005_midad_core.sql أنشأه CLI v3.1.0. نُفذ نصه عبر MCP execute_sql مع حفظه بالمستودع؛ لا يوجد إدخال remote migration history حتى تتم تسوية CLI linked migration baseline. لا تعِد تطبيق CREATE TABLE على المشروع الحالي دون baseline. يلزم اختبار reset/إعادة تطبيق على قاعدة معزولة قبل اعتبار دورة الترحيل مكتملة.

## توسعة الإصدار الثاني
Migration 20261111172030: midad_arcs، relationships، sessions، حقول الشخصيات، روابط أحداث→مشاهد/أقواس، وmidad_private.signup_limits. كل الجداول العامة RLS بملكية، private schema ممنوعة على العميل. rate limiter SECURITY DEFINER بمسار فارغ وEXECUTE على service_role فقط.
Migration 20261111173015: preferences (unique user_id) وannotations مع scene_id/owner FK، kind/body/quote.
Migration 20261111174047: drafts مع book/owner، chapter.draft_id، project.cover_path وentity.image_path. لا public bucket.
النصوص والكيانات والتخطيط ليست JSON واحدًا؛ JSONB للمحرر والحقول المرنة والتفضيلات فقط.

## V3

midad_projects.story وmidad_chapters.writing_mode يضيفان قصة الرواية والفصل المستمر/المشاهد الاختيارية. midad_profiles تخزن اسم مستخدم فريد واسمًا ظاهرًا ونبذة وخيار الظهور. midad_members تربط حسابًا برواية بدور reader/editor دون نقل الملكية. midad_publications تشير إلى فصول أصلية اختار المالك نشرها. واجهات عامة محددة تعيد المنشور فقط.

midad_private.bridge_config/pending/links/ai_writes تحفظ تجزئة سر الجسر وطلبات التفويض المؤقتة وروابط حسابات مِداد المتعددة ومفاتيح منع تكرار الإنشاء. account_id UUID مستقل لكل حساب مفوض، المفتاح المركب يمنع تكرار نفس حساب مِداد لنفس هوية المكوّن. لا كلمات مرور أو JWTs محفوظة في هذه الجداول. source migrations بتاريخ 20261112.
