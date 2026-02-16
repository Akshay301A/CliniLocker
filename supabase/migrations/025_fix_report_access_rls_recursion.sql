-- Fix: infinite recursion in report_access RLS when sharing a report.
-- The INSERT policy checked reports; reports has a SELECT policy that checks report_access → cycle.
-- Use a SECURITY DEFINER function to check report ownership so reports RLS is not triggered.

create or replace function public.report_owned_by_current_user(p_report_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.reports
    where id = p_report_id and patient_id = auth.uid()
  );
$$;

comment on function public.report_owned_by_current_user(uuid) is 'Returns true if the report belongs to the current user. Used in report_access INSERT policy to avoid RLS recursion.';

-- Replace the INSERT policy so it does not SELECT from reports (which would trigger report_access)
drop policy if exists "Patients can grant report access" on public.report_access;

create policy "Patients can grant report access"
  on public.report_access for insert
  with check (
    public.report_owned_by_current_user(report_access.report_id)
  );
