-- Compatibility RPC for the doctor shared-report preview flow.
--
-- The current client sends a share id, not a report id. This function keeps
-- broad accepted parameter names so older/newer bundles can call it, but it
-- always resolves the value as a share id and returns the reports attached to
-- that share for the signed-in patient or doctor only.

drop function if exists public.get_share_reports(uuid);
drop function if exists public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);
drop function if exists public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid);

create or replace function public.get_share_reports(
  share_id uuid default null,
  p_share_id uuid default null,
  "shareId" uuid default null,
  doctor_id uuid default null,
  p_doctor_id uuid default null,
  "doctorId" uuid default null,
  user_id uuid default null,
  p_user_id uuid default null,
  "userId" uuid default null
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
  is_handwritten boolean,
  lab_name text,
  shared_at timestamptz,
  granted_by uuid
)
language sql
security definer
set search_path = public
stable
as $$
  with requested_share as (
    select coalesce(share_id, p_share_id, "shareId") as id
  ),
  requested_user as (
    select coalesce(doctor_id, p_doctor_id, "doctorId", user_id, p_user_id, "userId", auth.uid()) as id
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
    null::boolean as is_handwritten,
    l.name as lab_name,
    s.created_at as shared_at,
    s.patient_id as granted_by
  from requested_share rs
  join public.shares s
    on s.id = rs.id
  join requested_user ru
    on ru.id = auth.uid()
  join public.reports r
    on r.id = any(s.report_ids)
  left join public.labs l
    on l.id = r.lab_id
  where auth.uid() is not null
    and rs.id is not null
    and (s.patient_id = auth.uid() or s.doctor_id = auth.uid())
  order by r.uploaded_at desc;
$$;

grant execute on function public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid) to authenticated;

comment on function public.get_share_reports(uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid, uuid)
is 'Returns reports attached to a doctor share for the current signed-in patient or doctor. Compatibility RPC for doctor shared-report preview.';

notify pgrst, 'reload schema';
