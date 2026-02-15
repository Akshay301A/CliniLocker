-- Add RLS policy to allow patients to upload their own reports
-- This allows patients to self-upload old reports via PatientUpload page

-- First, we need to handle the lab_id requirement for patient uploads
-- Option 1: Create a "Self Upload" system lab
-- Option 2: Make lab_id nullable (but this requires schema change)

-- For now, we'll create a system lab for self-uploads
-- This should be run once by an admin, or we can create it here with a function

-- Create a function to get or create the "Self Upload" lab
create or replace function get_or_create_self_upload_lab()
returns uuid as $$
declare
  lab_uuid uuid;
begin
  -- Try to find existing "Self Upload" lab
  select id into lab_uuid
  from public.labs
  where name = 'Self Upload'
  limit 1;
  
  -- If not found, create it (requires service_role or admin)
  if lab_uuid is null then
    insert into public.labs (name, email)
    values ('Self Upload', 'self-upload@cliniLocker.app')
    returning id into lab_uuid;
  end if;
  
  return lab_uuid;
end;
$$ language plpgsql security definer;

-- Drop existing policy if it exists (for re-runs)
drop policy if exists "Patients can insert own reports" on public.reports;

-- Patients can insert reports where they are the patient
-- Note: lab_id must be set, so patients will use the "Self Upload" lab
create policy "Patients can insert own reports"
  on public.reports for insert
  with check (
    auth.uid() = patient_id
    and (
      patient_phone is null
      or patient_phone in (
        select phone from public.profiles where id = auth.uid()
      )
    )
  );
