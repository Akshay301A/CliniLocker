create table if not exists health_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  health_id text unique,
  name text,
  blood_group text,
  created_at timestamptz default now()
);

create index if not exists health_cards_health_id_idx on health_cards(health_id);

alter table health_cards enable row level security;

drop policy if exists "Users can insert their card" on health_cards;
create policy "Users can insert their card"
  on health_cards
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their card" on health_cards;
create policy "Users can view their card"
  on health_cards
  for select
  using (auth.uid() = user_id);

drop policy if exists "Public read access" on health_cards;
create policy "Public read access"
  on health_cards
  for select
  using (true);
