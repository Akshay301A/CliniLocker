-- Push tokens for FCM (and optionally APNs). One row per device; same user can have multiple devices.
create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text, -- 'android' | 'ios' | 'web'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens(user_id);
create index if not exists push_tokens_token_idx on public.push_tokens(token);

alter table public.push_tokens enable row level security;

-- Users can manage only their own tokens
create policy "Users can manage own push tokens"
  on public.push_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role can read for sending (Edge Function uses service role)
comment on table public.push_tokens is 'FCM/APNs device tokens for app push notifications. RLS: users manage own rows.';
