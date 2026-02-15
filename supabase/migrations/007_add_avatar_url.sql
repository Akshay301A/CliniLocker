-- Add avatar_url field to profiles table for profile images
-- Profile images will be stored in Supabase Storage or from Google OAuth

alter table public.profiles
  add column if not exists avatar_url text;

-- Add comment
comment on column public.profiles.avatar_url is 'URL to the patient profile image stored in Supabase Storage or from Google OAuth';

-- Update existing profiles with Google avatar URLs from auth.users
-- This syncs Google profile images for users who signed up with Google OAuth
update public.profiles p
set avatar_url = coalesce(
  (select raw_user_meta_data->>'avatar_url' from auth.users where id = p.id),
  (select raw_user_meta_data->>'picture' from auth.users where id = p.id)
)
where p.avatar_url is null
and exists (
  select 1 from auth.users u
  where u.id = p.id
  and (
    u.raw_user_meta_data->>'avatar_url' is not null
    or u.raw_user_meta_data->>'picture' is not null
  )
);
