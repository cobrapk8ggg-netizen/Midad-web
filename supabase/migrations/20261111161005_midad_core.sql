-- Additive namespace: existing zeus tables and auth configuration are untouched.
create table public.midad_projects (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 200), description text not null default '', goal integer not null default 80000 check(goal>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(id,user_id));
create table public.midad_books (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), project_id uuid not null,
 title text not null, position integer not null default 0, unique(id,user_id),
 foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
create table public.midad_chapters (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), book_id uuid not null, title text not null,
 position integer not null default 0, unique(id,user_id), foreign key(book_id,user_id) references public.midad_books(id,user_id) on delete cascade);
create table public.midad_scenes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), chapter_id uuid not null, title text not null,
 content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}', plain_text text not null default '',
 position integer not null default 0, version integer not null default 0, updated_at timestamptz not null default now(), unique(id,user_id),
 foreign key(chapter_id,user_id) references public.midad_chapters(id,user_id) on delete cascade);
create table public.midad_revisions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), scene_id uuid not null,
 content jsonb not null, plain_text text not null, version integer not null, created_at timestamptz not null default now(),
 foreign key(scene_id,user_id) references public.midad_scenes(id,user_id) on delete cascade);
create table public.midad_notes (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), project_id uuid not null,
 title text not null, body text not null default '', created_at timestamptz not null default now(),
 foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
create table public.midad_entities (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), project_id uuid not null,
 kind text not null check(kind in ('character','location','organization','item','lore')), name text not null, description text not null default '',
 background text not null default '', goals text not null default '', details jsonb not null default '{}', unique(id,user_id),
 foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
create table public.midad_events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid(), project_id uuid not null,
 title text not null, body text not null default '', stage text not null default 'idea' check(stage in ('idea','draft','done')),
 position integer not null default 0, story_date text not null default '',
 foreign key(project_id,user_id) references public.midad_projects(id,user_id) on delete cascade);
do $$ declare t text; begin
 foreach t in array array['projects','books','chapters','scenes','revisions','notes','entities','events'] loop
 execute format('alter table public.midad_%I enable row level security',t);
 execute format('create policy owner_select on public.midad_%I for select to authenticated using ((select auth.uid())=user_id)',t);
 execute format('create policy owner_insert on public.midad_%I for insert to authenticated with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_update on public.midad_%I for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',t);
 execute format('create policy owner_delete on public.midad_%I for delete to authenticated using ((select auth.uid())=user_id)',t);
 execute format('grant select, insert, update, delete on public.midad_%I to authenticated',t);
 execute format('create index on public.midad_%I(user_id)',t);
 end loop; end $$;
create index on public.midad_books(project_id);
create index on public.midad_chapters(book_id);
create index on public.midad_scenes(chapter_id);
create index on public.midad_revisions(scene_id);
create index on public.midad_notes(project_id);
create index on public.midad_entities(project_id);
create index on public.midad_events(project_id);
-- Atomic compare-and-swap; every successful edit preserves the previous document.
create function public.midad_save_scene(sid uuid, expected_version integer, document jsonb, prose text)
returns setof public.midad_scenes language plpgsql security invoker set search_path = '' as $$
declare old public.midad_scenes; begin
 select * into old from public.midad_scenes where id=sid for update;
 if old.id is null then raise exception 'scene_not_found'; end if;
 if old.version<>expected_version then raise exception 'version_conflict'; end if;
 insert into public.midad_revisions(user_id,scene_id,content,plain_text,version) values(auth.uid(),sid,old.content,old.plain_text,old.version);
 return query update public.midad_scenes set content=document,plain_text=prose,version=version+1,updated_at=now() where id=sid returning *;
end $$;
revoke all on function public.midad_save_scene(uuid,integer,jsonb,text) from public,anon;
grant execute on function public.midad_save_scene(uuid,integer,jsonb,text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('midad-assets','midad-assets',false,10485760,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy midad_assets_select on storage.objects for select to authenticated using(bucket_id='midad-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy midad_assets_insert on storage.objects for insert to authenticated with check(bucket_id='midad-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy midad_assets_update on storage.objects for update to authenticated using(bucket_id='midad-assets' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='midad-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy midad_assets_delete on storage.objects for delete to authenticated using(bucket_id='midad-assets' and (storage.foldername(name))[1]=(select auth.uid())::text);
