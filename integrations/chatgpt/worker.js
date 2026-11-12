const field=(description,type='string')=>({type,description});
const definition=(name,description,properties={},required=[],write=false)=>({name,description,inputSchema:{type:'object',properties,required,additionalProperties:false},annotations:{readOnlyHint:!write,destructiveHint:write,idempotentHint:!write||name.startsWith('create_'),openWorldHint:false}});
const tools=[
 definition('get_connection_link','اربط حسابك في مِداد. افتح الرابط الناتج واختر رواية وصلاحية القراءة أو الكتابة. لا تطلب كلمة المرور في المحادثة.'),
 definition('list_accounts','اعرض حسابات مِداد المرتبطة بهذا المستخدم، وأسماءها ومعرّفاتها. يمكن ربط عدة حسابات من الموقع ببريد مختلف عن ChatGPT. اختر account_id قبل الأوامر عند وجود أكثر من حساب.'),
 definition('list_novels','اعرض روايات حساب مِداد التي فوّضها الكاتب.'),
 definition('read_novel','اقرأ عنوان الرواية ووصفها وقصتها.',{novel_id:field('معرّف الرواية')},['novel_id']),
 definition('list_chapters','اعرض الفصول الأصلية بالترتيب.',{novel_id:field('معرّف الرواية')},['novel_id']),
 definition('read_chapter','اقرأ نص الفصل ونسخته الحالية قبل التعديل.',{chapter_id:field('معرّف الفصل')},['chapter_id']),
 definition('create_novel','أنشئ رواية جديدة في حساب الكاتب بعد طلبه ذلك. استخدم request_id ثابتًا عند إعادة محاولة نفس الإنشاء.',{title:field('عنوان الرواية'),description:field('نبذة قصيرة'),story:field('قصة الرواية'),request_id:field('UUID جديد لكل إنشاء، أعد استخدامه عند إعادة المحاولة')},['title','request_id'],true),
 definition('create_chapter','أضف فصلًا كاملًا إلى الرواية. النص عربي عادي والفقرات مفصولة بأسطر. احترم طلب الكاتب ولا تنشر الفصل تلقائيًا.',{novel_id:field('معرّف الرواية'),title:field('عنوان الفصل'),text:field('نص الفصل كاملًا'),request_id:field('UUID ثابت لنفس الإنشاء')},['novel_id','title','text','request_id'],true),
 definition('save_chapter','استبدل نص فصل كامل بعد طلب الكاتب. اقرأه أولًا. expected_version يمنع محو تعديلات أحدث. لا يدعم الفصول المقسمة إلى مشاهد.',{chapter_id:field('معرّف الفصل'),expected_version:field('رقم النسخة من read_chapter','integer'),text:field('النص الجديد كاملًا')},['chapter_id','expected_version','text'],true),
 definition('update_novel','حدّث عنوان الرواية أو وصفها أو قصتها فقط بعد طلب الكاتب.',{novel_id:field('معرّف الرواية'),title:field('العنوان'),description:field('النبذة'),story:field('قصة الرواية')},['novel_id'],true)
];
for(const tool of tools)if(!['get_connection_link','list_accounts'].includes(tool.name))tool.inputSchema.properties.account_id=field('معرّف حساب مِداد من list_accounts. مطلوب عند ربط أكثر من حساب؛ لا تخمّن الحساب المقصود.');
const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default {async fetch(req,env){
 const url=new URL(req.url);if(url.pathname!=='/mcp')return new Response('<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><title>مِداد × ChatGPT</title><style>body{background:#000;color:#fff;font:20px system-ui;max-width:680px;margin:15vh auto;padding:32px;line-height:2}a{color:white}section{border:1px solid #ffffff30;border-radius:32px;padding:40px;background:linear-gradient(135deg,#ffffff18,#ffffff03);box-shadow:inset 0 1px #ffffff50}small{color:#bbb}</style><section><small>مِداد × ChatGPT</small><h1>اكتب روايتك من المحادثة.</h1><p>هذا المكوّن يربط مساعدك برواياتك بعد موافقتك داخل مِداد. اختر رواية محددة وصلاحية القراءة أو الكتابة. يمكنك إلغاء الربط من حسابك.</p><a href="https://midad-writing.vercel.app">افتح مِداد ←</a></section></html>',{headers:{'Content-Type':'text/html;charset=utf-8'}});
 if(req.method!=='POST')return json({error:'POST required'},405);
 let body;try{body=await req.json();}catch{return json({error:'Invalid JSON'},400);}
 const {id,method,params={}}=body;const ok=result=>json({jsonrpc:'2.0',id,result});
 if(method==='server/discover')return ok({supportedVersions:['2026-07-28'],capabilities:{tools:{}}});
 if(method==='initialize')return ok({protocolVersion:'2025-03-26',capabilities:{tools:{}},serverInfo:{name:'midad-writer',version:'1.1.0'},instructions:'روايات الكاتب خاصة. يمكن ربط عدة حسابات مِداد ببريد مختلف عن ChatGPT. استخدم list_accounts واختر account_id عند تعددها. اربط الحساب أولًا. لا تطلب كلمات مرور. اقرأ الفصل قبل تعديله واحفظ expected_version. لا تنشر أو تحذف أعمال الكاتب.'});
 if(method==='notifications/initialized')return new Response(null,{status:202});
 if(method==='ping')return ok({});if(method==='tools/list')return ok({tools});
 if(method!=='tools/call')return json({jsonrpc:'2.0',id,error:{code:-32601,message:'Method not found'}});
 const fail=message=>ok({content:[{type:'text',text:message}],isError:true});
 if(!tools.some(t=>t.name===params.name))return fail('أمر غير معروف');
 const subject=req.headers.get('oai-authenticated-user-id');if(!subject)return fail('يلزم الدخول عبر مكوّن مِداد الموثّق في ChatGPT.');
 if(!env.MIDAD_BRIDGE_KEY)return fail('الربط غير مهيأ على الخادم.');
 try{const res=await fetch('https://pdfzdcwkkgapcwsnezvn.supabase.co/functions/v1/midad-plugin-api',{method:'POST',headers:{Authorization:'Bearer '+env.MIDAD_BRIDGE_KEY,'Content-Type':'application/json'},body:JSON.stringify({action:params.name,args:params.arguments||{},subject,email:req.headers.get('oai-authenticated-user-email')||''})});const data=await res.json();return ok({content:[{type:'text',text:JSON.stringify(data)}],isError:!res.ok});}catch{return fail('تعذر الاتصال بمِداد. أعد المحاولة؛ استخدم request_id نفسه عند إعادة الإنشاء.');}
}};
