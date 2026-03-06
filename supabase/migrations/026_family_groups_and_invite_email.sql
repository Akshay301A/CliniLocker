-- Family groups foundation + invite email support (backward compatible)

-- 1) Families table (group model)
create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists families_owner_id_idx on public.families(owner_id);

alter table public.families enable row level security;

drop policy if exists "Users can read own families" on public.families;
drop policy if exists "Users can insert own families" on public.families;

create policy "Users can read own families"
  on public.families for select
  using (owner_id = auth.uid());

create policy "Users can insert own families"
  on public.families for insert
  with check (owner_id = auth.uid());

-- 2) Add family_id to existing family tables
alter table public.family_members
  add column if not exists family_id uuid references public.families(id) on delete cascade;

create index if not exists family_members_family_id_idx on public.family_members(family_id);

alter table public.family_invites
  add column if not exists family_id uuid references public.families(id) on delete cascade;

create index if not exists family_invites_family_id_idx on public.family_invites(family_id);

-- Invite email used to show pending invites by email (not only phone)
alter table public.family_invites
  add column if not exists invite_email text;

create index if not exists family_invites_invite_email_idx on public.family_invites((lower(invite_email)));

-- 3) Backfill families + family_id for existing rows
insert into public.families (name, owner_id)
select 'My Family', fm.user_id
from (
  select distinct user_id
  from public.family_members
  where user_id is not null
) fm
where not exists (
  select 1
  from public.families f
  where f.owner_id = fm.user_id
);

update public.family_members fm
set family_id = f.id
from public.families f
where fm.family_id is null
  and f.owner_id = fm.user_id;

update public.family_invites fi
set family_id = fm.family_id
from public.family_members fm
where fi.family_id is null
  and fm.id = fi.family_member_id;

-- 4) Helper for app inserts (web/mobile) to always get one family for current user
create or replace function public.get_or_create_my_family_id()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_family_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return null;
  end if;

  select id into v_family_id
  from public.families
  where owner_id = v_user_id
  order by created_at asc
  limit 1;

  if v_family_id is null then
    insert into public.families (name, owner_id)
    values ('My Family', v_user_id)
    returning id into v_family_id;
  end if;

  return v_family_id;
end;
$$;

comment on function public.get_or_create_my_family_id() is 'Returns current user family id, creating a default family when missing.';

