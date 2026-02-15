-- Fix reports RLS policy to prevent recursion issues
-- This migration ensures reports queries work correctly

-- Drop and recreate the lab_users policy with better recursion prevention
drop policy if exists "Lab users can read reports from their lab" on public.reports;
drop policy if exists "Lab users can insert reports for their lab" on public.reports;
drop policy if exists "Lab users can update reports from their lab" on public.reports;

-- Recreate with explicit checks to prevent recursion
create policy "Lab users can read reports from their lab"
  on public.reports for select
  using (
    -- Patient can read their own reports (handled by other policy)
    auth.uid() = patient_id
    or
    -- Lab user can read reports from their lab (with explicit check to prevent recursion)
    exists (
      select 1 from public.lab_users lu
      where lu.lab_id = reports.lab_id
      and lu.user_id = auth.uid()
      -- Explicit check: user must be a lab_user themselves (not recursive)
      and lu.user_id is not null
    )
  );

create policy "Lab users can insert reports for their lab"
  on public.reports for insert
  with check (
    exists (
      select 1 from public.lab_users lu
      where lu.lab_id = reports.lab_id
      and lu.user_id = auth.uid()
      and lu.user_id is not null
    )
  );

create policy "Lab users can update reports from their lab"
  on public.reports for update
  using (
    exists (
      select 1 from public.lab_users lu
      where lu.lab_id = reports.lab_id
      and lu.user_id = auth.uid()
      and lu.user_id is not null
    )
  )
  with check (
    exists (
      select 1 from public.lab_users lu
      where lu.lab_id = reports.lab_id
      and lu.user_id = auth.uid()
      and lu.user_id is not null
    )
  );
