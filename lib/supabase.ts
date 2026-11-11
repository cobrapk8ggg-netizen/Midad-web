import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
export async function list<T>(table:string, filters:Record<string,string>={}):Promise<T[]> {
 let q=supabase.from(`midad_${table}`).select('*'); for(const [k,v] of Object.entries(filters)) q=q.eq(k,v);
 const {data,error}=await q; if(error)throw error; return data as T[];
}
export async function insert<T>(table:string,value:object):Promise<T>{ const {data,error}=await supabase.from(`midad_${table}`).insert(value).select().single();if(error)throw error;return data as T; }
export async function update(table:string,id:string,value:object){const {error}=await supabase.from(`midad_${table}`).update(value).eq('id',id);if(error)throw error;}
export async function remove(table:string,id:string){const {error}=await supabase.from(`midad_${table}`).delete().eq('id',id);if(error)throw error;}
