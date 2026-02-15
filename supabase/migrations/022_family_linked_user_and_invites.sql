-- Family members: link to auth account (required for sharing). Invites for account creation.

-- ============================================================================
-- 1. family_members.linked_user_id (the family member's auth user when they have an account)
-- ============================================================================
alter table public.family_members
  add column if not exists linked_user_id uuid references auth.users(id) on delete set null;

create index if not exists family_members_linked_user_id_idx on public.family_members(linked_user_id);

comment on column public.family_members.linked_user_id is 'Auth user id of the family member once they have created an account via invite.';

-- ============================================================================
-- 2. family_invites: token for "invite to join" flow (account required for everyone)
-- ============================================================================
create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_member_id uuid not null references public.family_members(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now()
);

create index if not exists family_invites_family_member_id_idx on public.family_invites(family_member_id);
create index if not exists family_invites_token_idx on public.family_invites(token);
create index if not exists family_invites_expires_at_idx on public.family_invites(expires_at);

alter table public.family_invites enable row level security;

-- Only the patient who owns the family_member can read/insert invites for that member
create policy "Patients can manage invites for own family members"
  on public.family_invites for all
  using (
    exists (
      select 1 from public.family_members fm
      where fm.id = family_invites.family_member_id and fm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.family_members fm
      where fm.id = family_invites.family_member_id and fm.user_id = auth.uid()
    )
  );

comment on table public.family_invites is 'Invite tokens so family members can create an account and link to family_members.';

-- ============================================================================
-- 3. RPC: accept family invite (family member signs up and links account)
-- ============================================================================
create or replace function public.accept_family_invite(p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return json_build_object('ok', false, 'error', 'Not signed in');
  end if;

  select fi.family_member_id into v_member_id
  from public.family_invites fi
  join public.family_members fm on fm.id = fi.family_member_id
  where fi.token = p_token and fi.expires_at > now() and fm.linked_user_id is null
  limit 1;

  if v_member_id is null then
    return json_build_object('ok', false, 'error', 'Invalid or expired invite');
  end if;

  update public.family_members
  set linked_user_id = v_user_id
  where id = v_member_id;

  return json_build_object('ok', true);
end;
$$;

comment on function public.accept_family_invite(text) is 'Links the current user to a family_member record when they accept an invite (after signup).';
