'use client';
import {useEffect,useRef} from 'react';
import {X,Feather} from 'lucide-react';
export function Brand(){return <div className="brand"><Feather size={26}/><span>مِداد<span className="brand-en">MIDAD</span></span></div>}
export function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){const ref=useRef<HTMLDialogElement>(null);useEffect(()=>{ref.current?.showModal()},[]);return <dialog ref={ref} onCancel={onClose}><div className="dialog-heading"><h2>{title}</h2><button aria-label="إغلاق" onClick={onClose}><X size={20}/></button></div>{children}</dialog>}
export function Field({label,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string}){return <label className="field">{label}<input {...props}/></label>}
export function errorMessage(e:unknown){const s=e instanceof Error?e.message:String((e as {message?:string})?.message||e);if(s.includes('Invalid login'))return 'البريد أو كلمة المرور غير صحيحة.';if(s.includes('Email not confirmed'))return 'افتح رسالة تأكيد البريد أولًا.';if(s.includes('rate limit'))return 'طلبات كثيرة. انتظر قليلًا ثم حاول مجددًا.';if(s.includes('Failed to fetch'))return 'تعذر الاتصال. تحقق من الشبكة وحاول مجددًا.';return 'تعذرت العملية: '+s;}
