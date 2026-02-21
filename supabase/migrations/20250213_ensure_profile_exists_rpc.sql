-- RPC: ensure a profile row exists for the current user (auth.uid()).
-- Use when the auth trigger may have missed (e.g. legacy user). Safe: INSERT ... ON CONFLICT DO NOTHING.

create or replace function public.ensure_profile_exists()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    return;
  end if;
  insert into public.profiles (id)
  values (uid)
  on conflict (id) do nothing;
end;
$$;

comment on function public.ensure_profile_exists() is 'Ensures a profile row exists for the current user; no-op if already exists.';

grant execute on function public.ensure_profile_exists() to authenticated;
