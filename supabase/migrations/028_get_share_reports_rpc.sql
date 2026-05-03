-- Compatibility RPC for the doctor shared-report preview flow.
--
-- The deployed client calls public.get_share_reports. Keep the function broad on
-- accepted argument names so older/newer bundles can call it without a 400, but
-- always scope results to auth.uid().

create or replace function public.get_share_reports(
  doctor_id uuid default null,
  p_doctor_id uuid default null,
  "doctorId" uuid default null,
  user_id uuid default null,
  p_user_id uuid default null,
  "userId" uuid default null,
  report_id uuid default null,
  p_report_id uuid default null,
  "reportId" uuid default null,
  share_id uuid default null,
  p_share_id uuid default null,
  "shareId" uuid default null
)
returns table (
  id uuid,
  lab_id uuid,
  patient_id uuid,
  patient_name text,
  patient_phone text,
  test_name text,
  file_url text,
  file_size bigint,
  status text,
  uploaded_by uuid,
  uploaded_at timestamptz,
  delivered_at timestamptz,
  viewed_at timestamptz,
  test_date date,
  notes text,
  lab_name text,
  shared_at timestamptz,
  granted_by uuid
)
language sql
security definer
set search_path = public
stable
as $$
  with requested_user as (
    select coalesce(doctor_id, p_doctor_id, "doctorId", user_id, p_user_id, "userId", auth.uid()) as id
  ),
  requested_report as (
    select coalesce(report_id, p_report_id, "reportId", share_id, p_share_id, "shareId") as id
  )
  select
    r.id,
    r.lab_id,
    r.patient_id,
    r.patient_name,
    r.patient_phone,
    r.test_name,
    r.file_url,
    r.file_size,
    r.status,
    r.uploaded_by,
    r.uploaded_at,
    r.delivered_at,
    r.viewed_at,
    r.test_date,
    r.notes,
    l.name as lab_name,
    ra.granted_at as shared_at,
    ra.granted_by
  from public.report_access ra
  join public.reports r on r.id = ra.report_id
  left join public.labs l on l.id = r.lab_id
  cross join requested_user ru
  cross join requested_report rr
  where auth.uid() is not null
    and ra.user_id = auth.uid()
    and ru.id = auth.uid()
    and (rr.id is null or r.id = rr.id)
  order by ra.granted_at desc, r.uploaded_at desc;
$$;

grant execute on function public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) to authenticated;

comment on function public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid)
is 'Returns reports shared with the current signed-in user via report_access. Compatibility RPC for doctor shared-report preview.';

notify pgrst, 'reload schema';
