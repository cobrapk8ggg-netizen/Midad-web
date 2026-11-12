create function public.midad_public_profile(handle text) returns table(username text,display_name text,bio text) language sql stable security definer set search_path='' as $$select p.username,p.display_name,p.bio from public.midad_profiles p where p.username=lower(handle) and p.is_public$$;
revoke all on function public.midad_public_profile(text) from public;
grant execute on function public.midad_public_profile(text) to anon,authenticated;
