-- Ensure profile is created with phone when user signs up via phone OTP (auth.users.phone is set).
-- Reduces 406 / missing-profile issues and keeps profile in sync with auth identity.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    insert into public.profiles (id, email, full_name, avatar_url, phone)
    values (
      new.id,
      new.email,
      coalesce(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        new.raw_user_meta_data->>'display_name'
      ),
      coalesce(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture'
      ),
      new.phone
    )
    on conflict (id) do nothing;
  exception when others then
    raise warning 'Failed to create/update profile for user %: %', new.id, sqlerrm;
  end;
  return new;
end;
$$;

comment on function public.handle_new_user() is 'Creates or updates profile on auth user insert; includes phone for OTP signups.';
