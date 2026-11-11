-- Only service_role can consume signup rate limits. Passwords never enter these tables.
create schema if not exists midad_private;
revoke all on schema midad_private from public,anon,authenticated;
create table midad_private.signup_limits(key text not null, bucket timestamptz not null, hits integer not null default 1,primary key(key,bucket));
alter table midad_private.signup_limits enable row level security;
create policy no_client_access on midad_private.signup_limits for all to anon,authenticated using(false) with check(false);
create function public.midad_signup_limit(rate_keys text[]) returns boolean language plpgsql security definer set search_path='' as $$
declare k text; n integer; slot timestamptz:=date_trunc('hour',now()); begin
 foreach k in array rate_keys loop
 insert into midad_private.signup_limits(key,bucket) values(k,slot) on conflict(key,bucket) do update set hits=midad_private.signup_limits.hits+1 returning hits into n;
 if n>(case when k like 'email:%' then 4 else 20 end) then return false; end if;
 end loop;
 delete from midad_private.signup_limits where bucket<now()-interval '2 days';
 return true;
end $$;
revoke all on function public.midad_signup_limit(text[]) from public,anon,authenticated;
grant execute on function public.midad_signup_limit(text[]) to service_role;

alter table public.midad_entities add column age text not null default '',add column aliases text not null default '',add column appearance text not null default '',add column affiliations text not null default '';
alter table public.midad_events add column scene_id uuid,add column arc_id uuid;
create table public.midad_arcs(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid(),project_id uuid not null,title text not null,goal text not null default '',conflict text not null default '',outcome text not null default '',position integer not null default 0,unique(id,user_id),foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
create table public.midad_relationships(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid(),project_id uuid not null,source_id uuid not null,target_id uuid not null,label text not null,unique(source_id,target_id,label),check(source_id<>target_id),foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade,foreign key(source_id,user_id) references public.midad_entities(id,user_id) on delete cascade,foreign key(target_id,user_id) references public.midad_entities(id,user_id) on delete cascade);
create table public.midad_sessions(id uuid primary key default gen_random_uuid(),user_id uuid not null default auth.uid(),project_id uuid not null,started_at timestamptz not null,ended_at timestamptz not null,duration integer not null check(duration>=0),word_delta integer not null,foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
alter table public.midad_events add foreign key(scene_id,user_id) references public.midad_scenes(id,user_id) on delete set null (scene_id),add foreign key(arc_id,user_id) references public.midad_arcs(id,user_id) on delete set null (arc_id);
do $$ declare t text; begin foreach t in array array['arcs','relationships','sessions'] loop
 execute format('alter table public.midad_%I enable row level security',t);
 execute format('create policy owner_select on public.midad_%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('create policy owner_insert on public.midad_%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_update on public.midad_%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_delete on public.midad_%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 execute format('grant select,insert,update,delete on public.midad_%I to authenticated',t);
 execute format('create index on public.midad_%I(user_id)',t);
 execute format('create index on public.midad_%I(project_id)',t);
 end loop; end $$;
create index on public.midad_relationships(source_id);
create index on public.midad_relationships(target_id);
create index on public.midad_events(scene_id);
create index on public.midad_events(arc_id);
