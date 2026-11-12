drop policy owner_select on public.midad_projects;
create policy owner_select on public.midad_projects for select to authenticated using(user_id=(select auth.uid()) or midad_private.can_read(id));
create or replace function public.midad_find_profile(handle text) returns table(user_id uuid,username text,display_name text,bio text) language sql stable security definer set search_path='' as $$select user_id,username,display_name,case when is_public or user_id=auth.uid() then bio else '' end from public.midad_profiles where username=lower(handle) and auth.uid() is not null$$;
