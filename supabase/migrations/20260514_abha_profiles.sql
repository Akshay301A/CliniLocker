create table if not exists public.abha_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  abha_number text,
  abha_address text not null,
  full_name text,
  qr_value text,
  status text not null default 'linked' check (status in ('linked', 'pending', 'revoked')),
  raw_profile jsonb not null default '{}'::jsonb,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists abha_profiles_abha_address_key
  on public.abha_profiles (lower(abha_address));

alter table public.abha_profiles enable row level security;

drop policy if exists "Users can read own ABHA profile" on public.abha_profiles;
create policy "Users can read own ABHA profile"
  on public.abha_profiles
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own ABHA profile" on public.abha_profiles;
create policy "Users can update own ABHA profile"
  on public.abha_profiles
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can insert own ABHA profile" on public.abha_profiles;
create policy "Users can insert own ABHA profile"
  on public.abha_profiles
  for insert
  with check (auth.uid() = user_id);

create or replace function public.set_abha_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists abha_profiles_set_updated_at on public.abha_profiles;
create trigger abha_profiles_set_updated_at
before update on public.abha_profiles
for each row execute function public.set_abha_profiles_updated_at();

comment on table public.abha_profiles is
  'Persistent ABHA linkage details for CliniLocker patients. Stores ABHA-first identity while internal user ownership remains unchanged.';
