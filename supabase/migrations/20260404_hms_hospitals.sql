create table if not exists hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

create table if not exists hospital_users (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text default 'admin',
  created_at timestamptz default now(),
  unique (hospital_id, user_id)
);

create table if not exists hospital_patients (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  health_id text references health_cards(health_id) on delete set null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists hospital_access_requests (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid references hospitals(id) on delete cascade,
  health_id text,
  requested_by uuid references auth.users(id) on delete set null,
  status text default 'pending',
  created_at timestamptz default now()
);

alter table hospitals enable row level security;
alter table hospital_users enable row level security;
alter table hospital_patients enable row level security;
alter table hospital_access_requests enable row level security;

-- hospital_users: only the logged-in user can read their membership
drop policy if exists "Hospital users can read own membership" on hospital_users;
create policy "Hospital users can read own membership"
  on hospital_users
  for select
  using (auth.uid() = user_id);

-- hospital_patients: only members of the hospital can read
drop policy if exists "Hospital members can read patients" on hospital_patients;
create policy "Hospital members can read patients"
  on hospital_patients
  for select
  using (
    exists (
      select 1 from hospital_users hu
      where hu.hospital_id = hospital_patients.hospital_id
      and hu.user_id = auth.uid()
    )
  );

-- hospital_patients: members can insert for their hospital
drop policy if exists "Hospital members can insert patients" on hospital_patients;
create policy "Hospital members can insert patients"
  on hospital_patients
  for insert
  with check (
    exists (
      select 1 from hospital_users hu
      where hu.hospital_id = hospital_patients.hospital_id
      and hu.user_id = auth.uid()
    )
  );

-- hospital_access_requests: members can insert requests
drop policy if exists "Hospital members can request access" on hospital_access_requests;
create policy "Hospital members can request access"
  on hospital_access_requests
  for insert
  with check (
    exists (
      select 1 from hospital_users hu
      where hu.hospital_id = hospital_access_requests.hospital_id
      and hu.user_id = auth.uid()
    )
  );

-- hospital_access_requests: members can read their hospital requests
drop policy if exists "Hospital members can read requests" on hospital_access_requests;
create policy "Hospital members can read requests"
  on hospital_access_requests
  for select
  using (
    exists (
      select 1 from hospital_users hu
      where hu.hospital_id = hospital_access_requests.hospital_id
      and hu.user_id = auth.uid()
    )
  );
