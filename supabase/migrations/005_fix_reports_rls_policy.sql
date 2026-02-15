-- Fix reports RLS policy to prevent 500 errors
-- The subquery in the policy can fail if profile doesn't exist or phone is NULL
-- This fixes the policy to handle edge cases properly

-- Drop existing policy
drop policy if exists "Patients can read own reports" on public.reports;

-- Create improved policy with NULL handling
create policy "Patients can read own reports"
  on public.reports for select
  using (
    -- Direct match by patient_id
    auth.uid() = patient_id
    or
    -- Match by phone number (with proper NULL handling)
    (
      patient_phone is not null
      and exists (
        select 1 
        from public.profiles 
        where profiles.id = auth.uid()
        and profiles.phone is not null
        and profiles.phone = reports.patient_phone
      )
    )
  );

-- Add comment explaining the policy
comment on policy "Patients can read own reports" on public.reports is 
  'Allows patients to read reports where they are the patient_id OR where their phone number matches. Handles NULL values properly.';
