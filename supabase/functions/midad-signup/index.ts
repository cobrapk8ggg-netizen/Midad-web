import {createClient} from 'npm:@supabase/supabase-js@2.119.0';
const allowed=new Set(['https://midad-writing.vercel.app','https://midad-writing-jooosos-projects.vercel.app','http://localhost:3000','http://127.0.0.1:3000']);
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':allowed.has(origin)?origin:'https://midad-writing.vercel.app','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'POST, OPTIONS','Vary':'Origin'};
 const respond=(body:object,status=200)=>new Response(JSON.stringify(body),{status,headers});
 if(origin&&!allowed.has(origin))return respond({error:'هذا المصدر غير مسموح.'},403);
 if(req.method==='OPTIONS')return new Response(null,{headers,status:204});
 if(req.method!=='POST')return respond({error:'طريقة غير مسموحة.'},405);
 try{
  const body=await req.text();if(body.length>4096)return respond({error:'الطلب أكبر من المسموح.'},413);
  const {email,password}=JSON.parse(body);
  if(typeof email!=='string'||email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<8||password.length>128)return respond({error:'أدخل بريدًا صحيحًا وكلمة مرور بين ٨ و١٢٨ حرفًا.'},400);
  const admin=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  const hash=async(s:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(v=>v.toString(16).padStart(2,'0')).join('');
  const ip=req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  const {data:permitted,error:rateError}=await admin.rpc('midad_signup_limit',{rate_keys:['ip:'+await hash(ip),'email:'+await hash(email.trim().toLowerCase())]});
  if(rateError)return respond({error:'تعذر إنشاء الحساب الآن. حاول لاحقًا.'},503);
  if(!permitted)return respond({error:'طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.'},429);
  const {error}=await admin.auth.admin.createUser({email:email.trim().toLowerCase(),password,email_confirm:true,app_metadata:{created_by:'midad'}});
  if(error)return respond({error:'تعذر إنشاء الحساب. إن سبق لك التسجيل، جرّب تسجيل الدخول أو استعادة كلمة المرور.'},400);
  return respond({created:true});
 }catch{return respond({error:'تعذر إنشاء الحساب. تحقق من البيانات وحاول مجددًا.'},400)}
});
