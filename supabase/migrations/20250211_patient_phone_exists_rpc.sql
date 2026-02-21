-- RPC for patient login/signup: check if this phone already has an AUTH account (used for OTP login).
-- Must check auth.users.phone, NOT profiles.phone. If we check profiles only, a user who signed up
-- with Google (and has phone in profile) would be told "account exists", but OTP would create a
-- NEW auth user and empty profile. Checking auth.users ensures: exists = OTP will sign into same user.
-- Normalizes input and auth.users.phone to last 10 digits for comparison.

create or replace function public.patient_phone_exists(phone_input text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  input_digits text;
  input_canonical text;
begin
  input_digits := regexp_replace(coalesce(trim(phone_input), ''), '\D', '', 'g');
  if length(input_digits) < 10 then
    return false;
  end if;
  input_canonical := right(input_digits, 10);

  return exists (
    select 1 from auth.users u
    where u.phone is not null and trim(u.phone) != ''
    and length(regexp_replace(trim(u.phone), '\D', '', 'g')) >= 10
    and right(regexp_replace(trim(u.phone), '\D', '', 'g'), 10) = input_canonical
  );
end;
$$;

comment on function public.patient_phone_exists(text) is 'Returns true if this phone is already registered in auth (OTP login will sign into existing account).';

grant execute on function public.patient_phone_exists(text) to anon;
grant execute on function public.patient_phone_exists(text) to authenticated;
