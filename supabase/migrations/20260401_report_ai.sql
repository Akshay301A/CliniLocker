create table if not exists report_ai (
  report_id uuid primary key references reports(id) on delete cascade,
  summary jsonb,
  diet_plan jsonb,
  diet_prefs jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists report_ai_report_id_idx on report_ai(report_id);

alter table report_ai enable row level security;

drop policy if exists "Report AI readable by owner or shared" on report_ai;
drop policy if exists "Report AI writable by owner" on report_ai;
drop policy if exists "Report AI update by owner" on report_ai;

-- Allow owners and shared users to read AI outputs
create policy "Report AI readable by owner or shared"
  on report_ai
  for select
  using (
    exists (
      select 1 from reports r
      where r.id = report_ai.report_id
      and (r.patient_id = auth.uid()
        or exists (
          select 1 from report_access ra
          where ra.report_id = r.id and ra.user_id = auth.uid()
        )
      )
    )
  );

-- Allow owners to insert/update
create policy "Report AI writable by owner"
  on report_ai
  for insert
  with check (
    exists (
      select 1 from reports r
      where r.id = report_ai.report_id
      and r.patient_id = auth.uid()
    )
  );

create policy "Report AI update by owner"
  on report_ai
  for update
  using (
    exists (
      select 1 from reports r
      where r.id = report_ai.report_id
      and r.patient_id = auth.uid()
    )
  );

-- Auto-update updated_at
create or replace function set_report_ai_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists report_ai_set_updated_at on report_ai;

create trigger report_ai_set_updated_at
before update on report_ai
for each row execute function set_report_ai_updated_at();
