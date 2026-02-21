-- RPC: check if an email is linked to any account (auth or profile).
-- Returns: 'auth' = can log in with email magic link (email in auth.users)
--          'profile_only' = email linked to a profile (e.g. phone-only account) — use phone or Google
--          'none' = not linked — create new account with magic link
-- Comparison is case-insensitive and trimmed.

create or replace function public.patient_email_status(email_input text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  input_normalized text;
  in_auth boolean;
  in_profile boolean;
begin
  input_normalized := lower(trim(coalesce(email_input, '')));
  if input_normalized = '' or position('@' in input_normalized) < 2 then
    return 'none';
  end if;

  select exists (
    select 1 from auth.users u
    where u.email is not null and lower(trim(u.email)) = input_normalized
  ) into in_auth;

  select exists (
    select 1 from public.profiles p
    where p.email is not null and lower(trim(p.email)) = input_normalized
  ) into in_profile;

  if in_auth then
    return 'auth';
  end if;
  if in_profile then
    return 'profile_only';
  end if;
  return 'none';
end;
$$;

comment on function public.patient_email_status(text) is 'Returns auth (email magic link login), profile_only (use phone/Google), or none (create account).';

grant execute on function public.patient_email_status(text) to anon;
grant execute on function public.patient_email_status(text) to authenticated;

-- RPC: true if this email exists in profiles for a different user (same person, other auth method).
-- Used after Google sign-in: if current user's email is in profiles for another id → sign out and ask to use phone.
create or replace function public.patient_email_owned_by_other_user(email_input text, current_uid uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  input_normalized text;
begin
  input_normalized := lower(trim(coalesce(email_input, '')));
  if input_normalized = '' or position('@' in input_normalized) < 2 then
    return false;
  end if;
  return exists (
    select 1 from public.profiles p
    where p.id is not null and p.id != current_uid
    and p.email is not null and lower(trim(p.email)) = input_normalized
  );
end;
$$;

comment on function public.patient_email_owned_by_other_user(text, uuid) is 'True if email is in profiles for another user (avoid duplicate account when signing in with Google).';

grant execute on function public.patient_email_owned_by_other_user(text, uuid) to authenticated;
