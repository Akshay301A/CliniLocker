-- Report sharing: allow users with report_access to read reports; share tokens for "Copy link"
-- 1. Reports RLS: user can read if they have report_access
-- 2. report_share_tokens table + RPC for opening shared links in another account

-- ============================================================================
-- 1. Reports: allow read when user has report_access
-- ============================================================================
-- 009 already has "Lab users can read" and 005 has "Patients can read own reports".
-- Add policy so users who have been granted access via report_access can read.
create policy "Users with report_access can read report"
  on public.reports for select
  using (
    exists (
      select 1 from public.report_access ra
      where ra.report_id = reports.id and ra.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. report_share_tokens: one-time or time-limited tokens for "Copy link"
-- ============================================================================
create table if not exists public.report_share_tokens (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '30 days'),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists report_share_tokens_report_id_idx on public.report_share_tokens(report_id);
create index if not exists report_share_tokens_token_idx on public.report_share_tokens(token);
create index if not exists report_share_tokens_expires_at_idx on public.report_share_tokens(expires_at);

alter table public.report_share_tokens enable row level security;

-- Report owner can insert tokens for their reports
create policy "Report owner can insert share tokens"
  on public.report_share_tokens for insert
  with check (
    exists (
      select 1 from public.reports r
      where r.id = report_share_tokens.report_id and r.patient_id = auth.uid()
    )
  );

-- Report owner can read their tokens
create policy "Report owner can read own share tokens"
  on public.report_share_tokens for select
  using (
    exists (
      select 1 from public.reports r
      where r.id = report_share_tokens.report_id and r.patient_id = auth.uid()
    )
  );

-- ============================================================================
-- 3. RPC: get report by share token (for opening link in another account)
-- ============================================================================
-- When a user opens /patient/report/:id?share=TOKEN, we validate the token,
-- grant them report_access so they can see the report and get signed URL,
-- and return the report row (with labs).
create or replace function public.get_report_by_share_token(p_report_id uuid, p_token text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report json;
  v_token record;
begin
  if auth.uid() is null then
    return null;
  end if;

  select id, report_id, granted_by into v_token
  from public.report_share_tokens
  where report_id = p_report_id and token = p_token and expires_at > now()
  limit 1;

  if v_token.id is null then
    return null;
  end if;

  -- Grant this user access so they can read the report and storage
  insert into public.report_access (report_id, user_id, granted_by)
  values (p_report_id, auth.uid(), v_token.granted_by)
  on conflict (report_id, user_id, family_member_id) do nothing;
  -- unique is (report_id, user_id, family_member_id); family_member_id is null so we need to allow one row per (report_id, user_id)
  -- Check constraint: unique(report_id, user_id, family_member_id) - so (report_id, user_id, null) can only appear once. Good.

  select to_jsonb(r) into v_report
  from (
    select r.*, json_build_object('name', l.name) as labs
    from public.reports r
    left join public.labs l on l.id = r.lab_id
    where r.id = p_report_id
    limit 1
  ) r;

  return v_report;
end;
$$;

comment on function public.get_report_by_share_token(uuid, text) is 'Validates share token, grants report_access to current user, returns report. Used when opening shared report link in another account.';

-- ============================================================================
-- 4. RPC: create or get share token for "Copy link"
-- ============================================================================
create or replace function public.create_or_get_report_share_token(p_report_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_user_id uuid;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return null;
  end if;

  if not exists (select 1 from public.reports where id = p_report_id and patient_id = v_user_id) then
    return null;
  end if;

  select token into v_token
  from public.report_share_tokens
  where report_id = p_report_id and granted_by = v_user_id and expires_at > now()
  limit 1;

  if v_token is not null then
    return v_token;
  end if;

  v_token := replace(replace(encode(gen_random_bytes(18), 'base64'), '+', '-'), '/', '_');
  insert into public.report_share_tokens (report_id, token, granted_by)
  values (p_report_id, v_token, v_user_id);

  return v_token;
end;
$$;

comment on function public.create_or_get_report_share_token(uuid) is 'Creates or returns existing valid share token for report. Only report owner can call.';
