create table public.midad_preferences(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid() references auth.users(id) on delete cascade unique,settings jsonb not null default '{}',updated_at timestamptz not null default now());
create table public.midad_annotations(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid(),scene_id uuid not null,kind text not null check(kind in ('comment','footnote')),body text not null check(length(body) between 1 and 10000),quote text not null default '',created_at timestamptz not null default now(),foreign key(scene_id,user_id) references public.midad_scenes(id,user_id) on delete cascade);
do $$ declare t text; begin foreach t in array array['preferences','annotations'] loop
 execute format('alter table public.midad_%I enable row level security',t);
 execute format('create policy owner_select on public.midad_%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('create policy owner_insert on public.midad_%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_update on public.midad_%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_delete on public.midad_%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 execute format('grant select,insert,update,delete on public.midad_%I to authenticated',t);
 end loop; end $$;
create index on public.midad_annotations(user_id);
create index on public.midad_annotations(scene_id);
