-- Ensure doctor QR shares grant the same report access used by report previews.
-- Without this, doctors can read the share metadata but storage signed URLs can fail.

create or replace function public.create_doctor_share(
  p_doctor_id uuid,
  p_report_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_patient_id uuid := auth.uid();
  v_share_id uuid;
  v_patient_name text;
  v_doctor_name text;
  v_report_id uuid;
begin
  if v_patient_id is null then
    raise exception 'Not authenticated';
  end if;

  if p_doctor_id is null then
    raise exception 'Doctor is required';
  end if;

  if p_report_ids is null or array_length(p_report_ids, 1) is null then
    raise exception 'At least one report must be selected';
  end if;

  select coalesce(full_name, 'Patient')
    into v_patient_name
  from public.profiles
  where id = v_patient_id;

  select coalesce(full_name, 'Doctor')
    into v_doctor_name
  from public.profiles
  where id = p_doctor_id
    and role = 'doctor';

  if v_doctor_name is null then
    raise exception 'Doctor not found';
  end if;

  foreach v_report_id in array p_report_ids loop
    if not exists (
      select 1
      from public.reports r
      where r.id = v_report_id
        and (
          r.patient_id = v_patient_id
          or exists (
            select 1
            from public.profiles p
            where p.id = v_patient_id
              and p.phone is not null
              and r.patient_phone = p.phone
          )
        )
    ) then
      raise exception 'One or more reports do not belong to the patient';
    end if;
  end loop;

  insert into public.shares (
    patient_id,
    doctor_id,
    patient_name,
    doctor_name,
    report_ids
  )
  values (
    v_patient_id,
    p_doctor_id,
    v_patient_name,
    v_doctor_name,
    p_report_ids
  )
  returning id into v_share_id;

  insert into public.report_access (report_id, user_id, granted_by)
  select distinct shared_report.report_id, p_doctor_id, v_patient_id
  from unnest(p_report_ids) as shared_report(report_id)
  on conflict (report_id, user_id, family_member_id) do nothing;

  return v_share_id;
end;
$$;

revoke all on function public.create_doctor_share(uuid, uuid[]) from public;
grant execute on function public.create_doctor_share(uuid, uuid[]) to authenticated;

insert into public.report_access (report_id, user_id, granted_by)
select distinct shared_report.report_id, s.doctor_id, s.patient_id
from public.shares s
cross join lateral unnest(s.report_ids) as shared_report(report_id)
on conflict (report_id, user_id, family_member_id) do nothing;

comment on function public.create_doctor_share(uuid, uuid[])
  is 'Creates a doctor share and grants report_access to the assigned doctor for each shared report.';
