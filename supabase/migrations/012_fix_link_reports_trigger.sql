-- Fix: link_reports_to_patient trigger runs as invoker; patients don't have UPDATE on reports/lab_patient_links.
-- Make the function SECURITY DEFINER so it runs with owner privileges and can link reports by phone.
create or replace function public.link_reports_to_patient()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Link reports by phone
  update public.reports
  set patient_id = new.id
  where patient_phone = new.phone and patient_id is null;

  -- Link lab_patient_links by phone
  update public.lab_patient_links
  set patient_id = new.id
  where patient_phone = new.phone and patient_id is null;

  return new;
end;
$$;
