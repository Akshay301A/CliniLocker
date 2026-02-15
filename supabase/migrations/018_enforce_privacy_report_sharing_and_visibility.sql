-- Enforce Report Sharing and Profile Visibility (Privacy & Security)
-- 1. Only link reports/lab_patient_links to patient when report_sharing_allowed = true
-- 2. RPC for labs to get patient list with name/phone masked when profile_visible_to_labs = false

-- ============================================================================
-- 1. Report Sharing: skip linking when patient has report_sharing_allowed = false
-- ============================================================================

-- When profile phone is set/updated: only link reports and lab_patient_links if report_sharing_allowed = true
create or replace function public.link_reports_to_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.report_sharing_allowed = false then
    return new;
  end if;

  update public.reports
  set patient_id = new.id
  where patient_phone = new.phone and patient_id is null;

  update public.lab_patient_links
  set patient_id = new.id
  where patient_phone = new.phone and patient_id is null;

  return new;
end;
$$;

-- When a report is inserted: only set patient_id on lab_patient_links when that profile has report_sharing_allowed = true
create or replace function public.update_lab_patient_link_on_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lab_patient_links (lab_id, patient_phone, patient_name, first_report_at, last_report_at, reports_count)
  values (new.lab_id, new.patient_phone, new.patient_name, new.uploaded_at, new.uploaded_at, 1)
  on conflict (lab_id, patient_phone) do update
  set
    patient_name = coalesce(excluded.patient_name, lab_patient_links.patient_name),
    last_report_at = excluded.last_report_at,
    reports_count = lab_patient_links.reports_count + 1,
    updated_at = now();

  update public.lab_patient_links
  set patient_id = (
    select id from public.profiles
    where phone = new.patient_phone and report_sharing_allowed = true
    limit 1
  )
  where lab_id = new.lab_id and patient_phone = new.patient_phone and patient_id is null;

  return new;
end;
$$;

-- ============================================================================
-- 2. Profile Visibility: RPC that returns lab patients with name/phone masked when profile_visible_to_labs = false
-- ============================================================================

create or replace function public.get_lab_patients_visible(p_lab_id uuid)
returns table (
  patient_name text,
  patient_phone text,
  reports_count int,
  last_report_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    case
      when lpl.patient_id is null then lpl.patient_name
      when coalesce(p.profile_visible_to_labs, false) then lpl.patient_name
      else 'Hidden'
    end,
    case
      when lpl.patient_id is null then lpl.patient_phone
      when coalesce(p.profile_visible_to_labs, false) then lpl.patient_phone
      else '••••••••••••'
    end,
    lpl.reports_count,
    lpl.last_report_at
  from public.lab_patient_links lpl
  left join public.profiles p on p.id = lpl.patient_id
  where lpl.lab_id = p_lab_id
    and exists (
      select 1 from public.lab_users lu
      where lu.lab_id = p_lab_id and lu.user_id = auth.uid()
    )
  order by lpl.last_report_at desc nulls last;
$$;

comment on function public.get_lab_patients_visible(uuid) is 'Lab patients list with name/phone masked when profile_visible_to_labs is false';
