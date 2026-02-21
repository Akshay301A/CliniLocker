-- App config for feature flags (e.g. show ads after AdSense verification).
-- Read by website and mobile; update in Supabase Dashboard when verification is done.

create table if not exists public.app_config (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- Allow anyone to read (anon + authenticated) so dashboards can show/hide ads without auth.
alter table public.app_config enable row level security;

create policy "Allow read app_config"
  on public.app_config for select
  using (true);

-- Only service role / dashboard can update (no policy for insert/update from anon).
-- You will update via Supabase Dashboard: Table Editor -> app_config.

-- Default: hide ads until AdSense verification is complete. Set value to true when done.
insert into public.app_config (key, value)
values ('show_ads', 'false')
on conflict (key) do nothing;

comment on table public.app_config is 'Feature flags and app settings. show_ads: set to true after AdSense verification.';
