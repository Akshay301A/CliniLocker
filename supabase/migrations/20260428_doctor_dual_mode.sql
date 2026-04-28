alter table public.profiles
  add column if not exists role text,
  add column if not exists is_verified boolean not null default false,
  add column if not exists registration_number text,
  add column if not exists medical_council text;

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('patient', 'doctor') or role is null);

update public.profiles p
set role = 'patient'
where p.role is null
  and not exists (
    select 1
    from public.lab_users lu
    where lu.user_id = p.id
  );

create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references auth.users(id) on delete cascade,
  doctor_id uuid not null references auth.users(id) on delete cascade,
  patient_name text,
  doctor_name text,
  report_ids uuid[] not null default '{}',
  quick_notes text,
  unread boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shares_doctor_id_created_at_idx
  on public.shares(doctor_id, created_at desc);

create index if not exists shares_patient_id_created_at_idx
  on public.shares(patient_id, created_at desc);

create index if not exists shares_report_ids_gin_idx
  on public.shares
  using gin(report_ids);

alter table public.shares enable row level security;

drop policy if exists "Patients can create shares" on public.shares;
create policy "Patients can create shares"
  on public.shares
  for insert
  with check (
    auth.uid() = patient_id
    and exists (
      select 1
      from public.profiles patient_profile
      where patient_profile.id = auth.uid()
      and patient_profile.role = 'patient'
    )
  );

drop policy if exists "Patients can read own shares" on public.shares;
create policy "Patients can read own shares"
  on public.shares
  for select
  using (auth.uid() = patient_id);

drop policy if exists "Doctors can read assigned shares" on public.shares;
create policy "Doctors can read assigned shares"
  on public.shares
  for select
  using (
    auth.uid() = doctor_id
    and exists (
      select 1
      from public.profiles doctor_profile
      where doctor_profile.id = auth.uid()
      and doctor_profile.role = 'doctor'
    )
  );

drop policy if exists "Doctors can update assigned shares" on public.shares;
create policy "Doctors can update assigned shares"
  on public.shares
  for update
  using (
    auth.uid() = doctor_id
    and exists (
      select 1
      from public.profiles doctor_profile
      where doctor_profile.id = auth.uid()
      and doctor_profile.role = 'doctor'
    )
  )
  with check (
    auth.uid() = doctor_id
    and exists (
      select 1
      from public.profiles doctor_profile
      where doctor_profile.id = auth.uid()
      and doctor_profile.role = 'doctor'
    )
  );

create or replace function public.set_shares_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists shares_set_updated_at on public.shares;
create trigger shares_set_updated_at
before update on public.shares
for each row execute function public.set_shares_updated_at();

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

  return v_share_id;
end;
$$;

revoke all on function public.create_doctor_share(uuid, uuid[]) from public;
grant execute on function public.create_doctor_share(uuid, uuid[]) to authenticated;

create or replace function public.get_share_reports(
  p_share_id uuid
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
  is_handwritten boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1
    from public.shares s
    where s.id = p_share_id
      and (s.patient_id = v_user_id or s.doctor_id = v_user_id)
  ) then
    raise exception 'Access denied';
  end if;

  return query
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
    r.is_handwritten
  from public.shares s
  join public.reports r
    on r.id = any(s.report_ids)
  where s.id = p_share_id
  order by r.uploaded_at desc;
end;
$$;

revoke all on function public.get_share_reports(uuid) from public;
grant execute on function public.get_share_reports(uuid) to authenticated;

create or replace function public.get_doctor_public_profile(
  p_doctor_id uuid
)
returns table (
  id uuid,
  full_name text,
  is_verified boolean,
  registration_number text,
  medical_council text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.id,
    p.full_name,
    p.is_verified,
    p.registration_number,
    p.medical_council
  from public.profiles p
  where p.id = p_doctor_id
    and p.role = 'doctor';
end;
$$;

revoke all on function public.get_doctor_public_profile(uuid) from public;
grant execute on function public.get_doctor_public_profile(uuid) to authenticated;
