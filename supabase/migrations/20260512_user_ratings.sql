create table if not exists public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  stars integer not null check (stars between 1 and 5),
  emoji text not null,
  sentiment text not null check (sentiment in ('negative', 'neutral', 'positive')),
  comment text,
  contact_name text,
  contact_email text,
  source text not null default 'website' check (source in ('website', 'mobile')),
  page_path text,
  google_review_prompted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists user_ratings_created_at_idx
  on public.user_ratings(created_at desc);

create index if not exists user_ratings_stars_idx
  on public.user_ratings(stars, created_at desc);

alter table public.user_ratings enable row level security;

drop policy if exists "Allow public rating inserts" on public.user_ratings;
create policy "Allow public rating inserts"
  on public.user_ratings
  for insert
  with check (
    stars between 1 and 5
    and length(emoji) between 1 and 16
    and (comment is null or char_length(comment) <= 2000)
    and (contact_name is null or char_length(contact_name) <= 120)
    and (contact_email is null or char_length(contact_email) <= 160)
  );

drop policy if exists "Allow public positive rating reads" on public.user_ratings;
create policy "Allow public positive rating reads"
  on public.user_ratings
  for select
  using (
    stars >= 4
    and comment is not null
    and char_length(trim(comment)) >= 12
  );

insert into public.app_config (key, value)
values (
  'google_business_review_url',
  '"https://g.page/r/CV16WDYMeDMsEAE/review"'::jsonb
)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

comment on table public.user_ratings is
  'Stores CliniLocker product ratings and private feedback from website/mobile prompts.';
