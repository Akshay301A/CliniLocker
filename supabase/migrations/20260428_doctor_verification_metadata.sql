alter table public.profiles
  add column if not exists registration_year text,
  add column if not exists verified_at timestamptz,
  add column if not exists verification_metadata jsonb;
