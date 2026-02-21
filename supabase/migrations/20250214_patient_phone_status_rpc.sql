-- RPC: check if a phone is linked to any account (auth or profile).
-- Returns: 'auth' = can log in with OTP (phone in auth.users)
--          'profile_only' = number linked to a profile (e.g. Google account) — use Google to sign in
--          'none' = not linked — create new account with OTP
-- Normalizes to last 10 digits for comparison.

create or replace function public.patient_phone_status(phone_input text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  input_digits text;
  input_canonical text;
  in_auth boolean;
  in_profile boolean;
begin
  input_digits := regexp_replace(coalesce(trim(phone_input), ''), '\D', '', 'g');
  if length(input_digits) < 10 then
    return 'none';
  end if;
  input_canonical := right(input_digits, 10);

  select exists (
    select 1 from auth.users u
    where u.phone is not null and trim(u.phone) != ''
    and length(regexp_replace(trim(u.phone), '\D', '', 'g')) >= 10
    and right(regexp_replace(trim(u.phone), '\D', '', 'g'), 10) = input_canonical
  ) into in_auth;

  select exists (
    select 1 from public.profiles p
    where p.phone is not null and trim(p.phone) != ''
    and length(regexp_replace(trim(p.phone), '\D', '', 'g')) >= 10
    and right(regexp_replace(trim(p.phone), '\D', '', 'g'), 10) = input_canonical
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

comment on function public.patient_phone_status(text) is 'Returns auth (OTP login), profile_only (use Google), or none (create account).';

grant execute on function public.patient_phone_status(text) to anon;
grant execute on function public.patient_phone_status(text) to authenticated;
