import { createClient } from 'npm:@supabase/supabase-js@2';
const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const doc=(text:string)=>({type:'doc',content:text.split(/\r?\n/).map(t=>({type:'paragraph',...(t?{content:[{type:'text',text:t}]}:{})}))});
async function rpc(name:string,args:object){const {data,error}=await admin.rpc(name,args);if(error)throw error;return data;}
Deno.serve(async req=>{
 if(req.method!=='POST')return reply({error:'POST required'},405);
 try{
 const secret=req.headers.get('Authorization')?.replace(/^Bearer /,'');if(!secret||secret.length<40)return reply({error:'Unauthorized'},401);
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret)))).map(x=>x.toString(16).padStart(2,'0')).join('');
 if(Number(req.headers.get('content-length'))>1100000)return reply({error:'حجم الطلب كبير'},413);
 const raw=await req.text();if(raw.length>1100000)return reply({error:'حجم الطلب كبير'},413);
 const {action,subject,email,args={}}=JSON.parse(raw);if(typeof subject!=='string'||!subject||subject.length>300)throw Error('هوية ChatGPT مفقودة');
 if(action==='get_connection_link'){
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
 await rpc('midad_bridge_request',{secret_hash:hash,subject_id:subject,email:typeof email==='string'?email:'',nonce});
 return reply({url:'https://midad-writing.vercel.app/connect?request='+nonce,message:'افتح الرابط، سجّل الدخول إلى مِداد، ثم اختر الرواية وصلاحية الكتابة. ينتهي الرابط خلال عشر دقائق.'});
 }
 const accounts=await rpc('midad_bridge_accounts',{secret_hash:hash,subject_id:subject});
 if(action==='list_accounts')return reply({accounts,message:accounts.length?'استخدم account_id للحساب الذي تقصده في الأوامر.':'لا توجد حسابات مِداد مرتبطة. اطلب get_connection_link ثم سجل الدخول بحساب الموقع، ويمكن أن يختلف بريده عن ChatGPT.'});
 const selected=args.account_id||(accounts.length===1?accounts[0].account_id:null);
 if(!selected)return reply({error:accounts.length?'لديك عدة حسابات مِداد. اختر account_id للحساب المطلوب.':'اربط حساب مِداد أولًا باستخدام get_connection_link',accounts},403);
 if(!uuid(selected))throw Error('معرّف الحساب غير صالح');
 const identities=await rpc('midad_bridge_identity',{secret_hash:hash,subject_id:subject,account_id:selected});const identity=identities?.[0];if(!identity)return reply({error:'هذا الحساب غير مرتبط بمستخدم المكوّن الحالي'},403);
 const owner=identity.user_id;const scope=identity.project_id;
 const owned=async(id:string)=>{if(!uuid(id)||scope&&scope!==id)throw Error('الرواية خارج نطاق التفويض');const {data,error}=await admin.from('midad_projects').select('id,title,description,story,updated_at').eq('id',id).eq('user_id',owner).single();if(error)throw Error('الرواية غير متاحة');return data;};
 const chapter=async(id:string)=>{if(!uuid(id))throw Error('معرّف الفصل غير صالح');const {data,error}=await admin.from('midad_chapters').select('id,title,book_id,draft_id,position,writing_mode').eq('id',id).eq('user_id',owner).single();if(error||data.draft_id)throw Error('الفصل غير متاح');const {data:b}=await admin.from('midad_books').select('project_id').eq('id',data.book_id).eq('user_id',owner).single();if(!b)throw Error('الرواية غير متاحة');await owned(b.project_id);return {...data,novel_id:b.project_id};};
 if(action==='list_novels'){let q=admin.from('midad_projects').select('id,title,description,updated_at').eq('user_id',owner).order('updated_at',{ascending:false}).limit(100);if(scope)q=q.eq('id',scope);const{data,error}=await q;if(error)throw error;return reply({novels:data});}
 if(action==='read_novel')return reply(await owned(args.novel_id));
 if(action==='list_chapters'){await owned(args.novel_id);const {data:bs,error:be}=await admin.from('midad_books').select('id').eq('project_id',args.novel_id).eq('user_id',owner);if(be)throw be;const {data,error}=await admin.from('midad_chapters').select('id,title,position,writing_mode').in('book_id',bs!.map(b=>b.id)).eq('user_id',owner).is('draft_id',null).order('position').limit(1000);if(error)throw error;return reply({chapters:data});}
 if(action==='read_chapter'){const c=await chapter(args.chapter_id);const {data,error}=await admin.from('midad_scenes').select('id,title,plain_text,version,position').eq('chapter_id',c.id).eq('user_id',owner).order('position');if(error)throw error;return reply({...c,text:data!.map(s=>s.plain_text).join('\n\n'),version:data!.length===1?data![0].version:null,parts:data});}
 if(!identity.allow_write)return reply({error:'تفويضك يسمح بالقراءة فقط. غيّر الصلاحية من رابط الربط.'},403);
 if(['create_novel','create_chapter'].includes(action)){
 if(!uuid(args.request_id))throw Error('request_id UUID مطلوب لمنع التكرار');
 if(typeof args.title!=='string'||args.title.trim().length<1||args.title.length>200)throw Error('العنوان مطلوب، حتى 200 حرف');
 if(action==='create_novel'&&scope)throw Error('إنشاء رواية يتطلب تفويض جميع رواياتي');if(action==='create_chapter')await owned(args.novel_id);
 const text=typeof args.text==='string'?args.text:'';if(text.length>1000000)throw Error('النص أكبر من الحد');
 return reply(await rpc('midad_ai_create',{operation:action,owner_id:owner,novel_id:args.novel_id||null,title:args.title.trim(),description:String(args.description||'').slice(0,10000),story:String(args.story||'').slice(0,100000),document:doc(text),prose:text,request_key:args.request_id}));
 }
 if(action==='save_chapter'){const c=await chapter(args.chapter_id);if(!Number.isInteger(args.expected_version)||args.expected_version<0||typeof args.text!=='string'||args.text.length>1000000)throw Error('اقرأ الفصل أولًا ومرّر نسخته الحالية مع النص');return reply(await rpc('midad_ai_save_chapter',{owner_id:owner,cid:c.id,expected:args.expected_version,document:doc(args.text),prose:args.text}));}
 if(action==='update_novel'){await owned(args.novel_id);const patch:Record<string,string>={};for(const k of ['title','description','story'])if(typeof args[k]==='string')patch[k]=args[k].slice(0,k==='title'?200:100000);if(patch.title==='')throw Error('العنوان مطلوب');const {error}=await admin.from('midad_projects').update(patch).eq('id',args.novel_id).eq('user_id',owner);if(error)throw error;return reply({saved:true,novel_id:args.novel_id});}
 return reply({error:'أمر غير معروف'},400);
 }catch(e){const m=String((e as Error)?.message||e);return reply({error:m.includes('version_conflict')?'يوجد تعديل أحدث. اقرأ الفصل ثم ادمج التعديلات قبل الحفظ.':m.includes('chapter_has_multiple_scenes')?'هذا الفصل مقسّم إلى مشاهد. تعديل الفصل كاملًا من المساعد غير متاح لحماية نصوصه.':m.includes('invalid_bridge')?'Unauthorized':m},400);}
});
