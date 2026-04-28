create or replace function public.get_patient_qr_bundle(p_health_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card record;
  v_reports jsonb;
begin
  if auth.uid() is null then
    return null;
  end if;

  select hc.user_id, hc.health_id, hc.name, hc.blood_group
  into v_card
  from public.health_cards hc
  where hc.health_id = p_health_id
  limit 1;

  if v_card.user_id is null then
    return null;
  end if;

  insert into public.report_access (report_id, user_id, granted_by)
  select r.id, auth.uid(), v_card.user_id
  from public.reports r
  where r.patient_id = v_card.user_id
  on conflict (report_id, user_id, family_member_id) do nothing;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'test_name', r.test_name,
        'file_url', r.file_url,
        'uploaded_at', r.uploaded_at,
        'test_date', r.test_date,
        'status', r.status,
        'patient_name', r.patient_name,
        'labs', jsonb_build_object('name', l.name)
      )
      order by r.uploaded_at desc
    ),
    '[]'::jsonb
  )
  into v_reports
  from public.reports r
  left join public.labs l on l.id = r.lab_id
  where r.patient_id = v_card.user_id;

  return jsonb_build_object(
    'health_id', v_card.health_id,
    'name', v_card.name,
    'blood_group', v_card.blood_group,
    'reports', v_reports
  );
end;
$$;

revoke all on function public.get_patient_qr_bundle(text) from public;
grant execute on function public.get_patient_qr_bundle(text) to authenticated;

comment on function public.get_patient_qr_bundle(text) is
  'Returns patient health card details and linked reports for a scanned patient QR, and grants the scanning authenticated user report_access to those reports.';
