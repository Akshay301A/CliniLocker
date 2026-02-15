-- Ensure weight, blood_pressure, and avatar_url columns exist in profiles table
-- This migration is idempotent - safe to run multiple times

-- Add weight column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'weight'
  ) then
    alter table public.profiles add column weight numeric(5,2);
  end if;
end $$;

-- Add blood_pressure column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'blood_pressure'
  ) then
    alter table public.profiles add column blood_pressure text;
  end if;
end $$;

-- Add avatar_url column if it doesn't exist
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'profiles' 
    and column_name = 'avatar_url'
  ) then
    alter table public.profiles add column avatar_url text;
  end if;
end $$;
