-- Fix lab_users SELECT 500: "Lab admins can read lab_users for their lab" policy
-- recursively queries lab_users and can cause RLS errors. Use a SECURITY DEFINER
-- helper so the policy doesn't trigger RLS on lab_users again.

create or replace function public.current_user_is_lab_admin(p_lab_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.lab_users
    where lab_id = p_lab_id and user_id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Lab admins can read lab_users for their lab" on public.lab_users;

create policy "Lab admins can read lab_users for their lab"
  on public.lab_users for select
  using (
    auth.uid() = user_id
    or current_user_is_lab_admin(lab_id)
  );
