  -- CliniLocker Complete Database Schema
  -- Run this entire file in Supabase Dashboard → SQL Editor.
  -- Before using: enable Anonymous sign-in in Authentication → Providers → Anonymous → Enable.

  -- ============================================================================
  -- 1. PROFILES (Patient/User profiles linked to auth.users)
  -- ============================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text unique,
  phone_verified boolean not null default false,
  email text,
  date_of_birth date,
  weight numeric(5,2), -- weight in kg (e.g., 78.50)
  blood_pressure text, -- blood pressure as text (e.g., "128/86" or "120/80")
  avatar_url text, -- URL to profile image from Supabase Storage or Google OAuth
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

  create index if not exists profiles_phone_idx on public.profiles(phone);

  alter table public.profiles enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Users can read own profile" on public.profiles;
  drop policy if exists "Users can update own profile" on public.profiles;
  drop policy if exists "Users can insert own profile" on public.profiles;

  create policy "Users can read own profile"
    on public.profiles for select
    using (auth.uid() = id);

  create policy "Users can update own profile"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

  create policy "Users can insert own profile"
    on public.profiles for insert
    with check (auth.uid() = id);

  -- ============================================================================
  -- 2. LABS (Lab organizations)
  -- ============================================================================
  create table if not exists public.labs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text,
    phone text,
    address text,
    license_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  create index if not exists labs_name_idx on public.labs(name);

  alter table public.labs enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Anyone can read labs" on public.labs;
  drop policy if exists "Lab users can update own lab" on public.labs;

  -- Labs are public (anyone can read)
  create policy "Anyone can read labs"
    on public.labs for select
    using (true);

  -- ============================================================================
  -- 3. LAB_USERS (Lab staff accounts - links auth.users to labs)
  -- ============================================================================
  create table if not exists public.lab_users (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    lab_id uuid not null references public.labs(id) on delete cascade,
    role text not null default 'staff', -- 'admin', 'staff'
    created_at timestamptz not null default now(),
    unique(user_id, lab_id)
  );

  create index if not exists lab_users_user_id_idx on public.lab_users(user_id);
  create index if not exists lab_users_lab_id_idx on public.lab_users(lab_id);

  alter table public.lab_users enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Users can read own lab_users" on public.lab_users;
  drop policy if exists "Lab admins can read lab_users for their lab" on public.lab_users;

  -- Now create the labs update policy that references lab_users (after lab_users exists)
  create policy "Lab users can update own lab"
    on public.labs for update
    using (exists (
      select 1 from public.lab_users
      where lab_users.lab_id = labs.id
      and lab_users.user_id = auth.uid()
    ));

  create policy "Users can read own lab_users"
    on public.lab_users for select
    using (auth.uid() = user_id);

  create policy "Lab admins can read lab_users for their lab"
    on public.lab_users for select
    using (
      -- User is reading their own lab_users record
      auth.uid() = user_id
      or
      -- User is an admin of the lab associated with this lab_users record
      exists (
        select 1 from public.lab_users lu
        where lu.lab_id = lab_users.lab_id
        and lu.user_id = auth.uid()
        and lu.role = 'admin'
        -- Prevent infinite recursion by ensuring we're not checking the same row
        and lu.id != lab_users.id
      )
    );

  -- ============================================================================
  -- 4. FAMILY_MEMBERS (Patient's family members)
  -- ============================================================================
  create table if not exists public.family_members (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name text not null,
    relation text not null,
    phone text,
    date_of_birth date,
    email text,
    created_at timestamptz not null default now()
  );

  create index if not exists family_members_user_id_idx on public.family_members(user_id);

  alter table public.family_members enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Users can read own family members" on public.family_members;
  drop policy if exists "Users can insert own family members" on public.family_members;
  drop policy if exists "Users can update own family members" on public.family_members;
  drop policy if exists "Users can delete own family members" on public.family_members;

  create policy "Users can read own family members"
    on public.family_members for select
    using (auth.uid() = user_id);

  create policy "Users can insert own family members"
    on public.family_members for insert
    with check (auth.uid() = user_id);

  create policy "Users can update own family members"
    on public.family_members for update
    using (auth.uid() = user_id);

  create policy "Users can delete own family members"
    on public.family_members for delete
    using (auth.uid() = user_id);

  -- ============================================================================
  -- 5. REPORTS (Medical reports uploaded by labs)
  -- ============================================================================
  create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    lab_id uuid not null references public.labs(id) on delete restrict,
    patient_id uuid references auth.users(id) on delete set null, -- null if patient not registered yet
    patient_name text not null, -- stored even if patient_id is null
    patient_phone text not null, -- for linking/unlinking patients
    test_name text not null,
    file_url text not null, -- Supabase Storage URL or external URL
    file_size bigint, -- bytes
    status text not null default 'pending', -- 'pending', 'delivered', 'viewed'
    uploaded_by uuid references auth.users(id) on delete set null, -- lab user who uploaded
    uploaded_at timestamptz not null default now(),
    delivered_at timestamptz,
    viewed_at timestamptz,
    test_date date, -- date when test was performed
    notes text -- lab notes
  );

  create index if not exists reports_lab_id_idx on public.reports(lab_id);
  create index if not exists reports_patient_id_idx on public.reports(patient_id);
  create index if not exists reports_patient_phone_idx on public.reports(patient_phone);
  create index if not exists reports_status_idx on public.reports(status);
  create index if not exists reports_uploaded_at_idx on public.reports(uploaded_at desc);

  alter table public.reports enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Patients can read own reports" on public.reports;
  drop policy if exists "Lab users can read reports from their lab" on public.reports;
  drop policy if exists "Lab users can insert reports for their lab" on public.reports;
  drop policy if exists "Lab users can update reports from their lab" on public.reports;

  -- Patients can read their own reports
  -- Fixed: Proper NULL handling to prevent 500 errors
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

  -- Lab users can read reports from their lab
  create policy "Lab users can read reports from their lab"
    on public.reports for select
    using (exists (
      select 1 from public.lab_users
      where lab_users.lab_id = reports.lab_id
      and lab_users.user_id = auth.uid()
    ));

  -- Lab users can insert reports for their lab
  create policy "Lab users can insert reports for their lab"
    on public.reports for insert
    with check (exists (
      select 1 from public.lab_users
      where lab_users.lab_id = reports.lab_id
      and lab_users.user_id = auth.uid()
    ));

  -- Lab users can update reports from their lab
  create policy "Lab users can update reports from their lab"
    on public.reports for update
    using (exists (
      select 1 from public.lab_users
      where lab_users.lab_id = reports.lab_id
      and lab_users.user_id = auth.uid()
    ));

  -- ============================================================================
  -- 6. REPORT_ACCESS (Who can view which reports - for family members)
  -- ============================================================================
  create table if not exists public.report_access (
    id uuid primary key default gen_random_uuid(),
    report_id uuid not null references public.reports(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade, -- patient or family member
    family_member_id uuid references public.family_members(id) on delete cascade, -- if access via family member
    granted_by uuid references auth.users(id) on delete set null, -- who granted access
    granted_at timestamptz not null default now(),
    unique(report_id, user_id, family_member_id)
  );

  create index if not exists report_access_report_id_idx on public.report_access(report_id);
  create index if not exists report_access_user_id_idx on public.report_access(user_id);
  create index if not exists report_access_family_member_id_idx on public.report_access(family_member_id);

  alter table public.report_access enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Users can read own report access" on public.report_access;
  drop policy if exists "Patients can grant report access" on public.report_access;

  -- Users can read access records they're involved in
  create policy "Users can read own report access"
    on public.report_access for select
    using (
      auth.uid() = user_id
      or exists (
        select 1 from public.family_members
        where family_members.id = report_access.family_member_id
        and family_members.user_id = auth.uid()
      )
    );

  -- Patients can grant access to their reports
  create policy "Patients can grant report access"
    on public.report_access for insert
    with check (
      exists (
        select 1 from public.reports
        where reports.id = report_access.report_id
        and reports.patient_id = auth.uid()
      )
    );

  -- ============================================================================
  -- 7. LAB_PATIENT_LINKS (Links between labs and patients - for lab portal)
  -- ============================================================================
  create table if not exists public.lab_patient_links (
    id uuid primary key default gen_random_uuid(),
    lab_id uuid not null references public.labs(id) on delete cascade,
    patient_id uuid references auth.users(id) on delete cascade,
    patient_phone text not null, -- stored even if patient_id is null
    patient_name text, -- cached name
    first_report_at timestamptz,
    last_report_at timestamptz,
    reports_count int not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(lab_id, patient_phone)
  );

  create index if not exists lab_patient_links_lab_id_idx on public.lab_patient_links(lab_id);
  create index if not exists lab_patient_links_patient_id_idx on public.lab_patient_links(patient_id);
  create index if not exists lab_patient_links_patient_phone_idx on public.lab_patient_links(patient_phone);

  alter table public.lab_patient_links enable row level security;

  -- Drop existing policies if they exist (for re-runs)
  drop policy if exists "Lab users can read links for their lab" on public.lab_patient_links;
  drop policy if exists "Patients can read own links" on public.lab_patient_links;

  -- Lab users can read links for their lab
  create policy "Lab users can read links for their lab"
    on public.lab_patient_links for select
    using (exists (
      select 1 from public.lab_users
      where lab_users.lab_id = lab_patient_links.lab_id
      and lab_users.user_id = auth.uid()
    ));

  -- Patients can read links they're part of
  create policy "Patients can read own links"
    on public.lab_patient_links for select
    using (
      auth.uid() = patient_id
      or patient_phone in (
        select phone from public.profiles where id = auth.uid()
      )
    );

  -- ============================================================================
  -- FUNCTIONS & TRIGGERS
  -- ============================================================================

  -- Function to update updated_at timestamp
  create or replace function update_updated_at_column()
  returns trigger as $$
  begin
    new.updated_at = now();
    return new;
  end;
  $$ language plpgsql;

  -- Drop existing triggers if they exist (for re-runs)
  drop trigger if exists update_profiles_updated_at on public.profiles;
  drop trigger if exists update_labs_updated_at on public.labs;
  drop trigger if exists update_lab_patient_links_updated_at on public.lab_patient_links;

  -- Triggers for updated_at
  create trigger update_profiles_updated_at before update on public.profiles
    for each row execute function update_updated_at_column();

  create trigger update_labs_updated_at before update on public.labs
    for each row execute function update_updated_at_column();

  create trigger update_lab_patient_links_updated_at before update on public.lab_patient_links
    for each row execute function update_updated_at_column();

  -- Function to auto-create profile on user signup
  create or replace function handle_new_user()
  returns trigger as $$
  begin
    begin
      insert into public.profiles (id, email, full_name, avatar_url)
      values (
        new.id,
        new.email,
        coalesce(
          new.raw_user_meta_data->>'full_name',
          new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'display_name'
        ),
        -- Get Google avatar URL if available
        coalesce(
          new.raw_user_meta_data->>'avatar_url',
          new.raw_user_meta_data->>'picture'
        )
      )
      on conflict (id) do nothing;
    exception when others then
      raise warning 'Failed to create profile for user %: %', new.id, sqlerrm;
    end;
    return new;
  end;
  $$ language plpgsql security definer;

  -- Drop existing trigger if it exists (for re-runs)
  drop trigger if exists on_auth_user_created on auth.users;

  -- Trigger to create profile when auth user is created
  create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_user();

  -- Function to update lab_patient_links when report is uploaded
  create or replace function update_lab_patient_link_on_report()
  returns trigger as $$
  begin
    insert into public.lab_patient_links (lab_id, patient_phone, patient_name, first_report_at, last_report_at, reports_count)
    values (new.lab_id, new.patient_phone, new.patient_name, new.uploaded_at, new.uploaded_at, 1)
    on conflict (lab_id, patient_phone) do update
    set
      patient_name = coalesce(excluded.patient_name, lab_patient_links.patient_name),
      last_report_at = excluded.last_report_at,
      reports_count = lab_patient_links.reports_count + 1,
      updated_at = now();
    
    -- Try to link patient_id if phone matches
    update public.lab_patient_links
    set patient_id = (select id from public.profiles where phone = new.patient_phone limit 1)
    where lab_id = new.lab_id and patient_phone = new.patient_phone and patient_id is null;
    
    return new;
  end;
  $$ language plpgsql;

  -- Drop existing trigger if it exists (for re-runs)
  drop trigger if exists on_report_inserted on public.reports;

  -- Trigger to update lab_patient_links on report insert
  create trigger on_report_inserted
    after insert on public.reports
    for each row execute function update_lab_patient_link_on_report();

  -- Function to link report to patient when patient signs up (by phone)
  create or replace function link_reports_to_patient()
  returns trigger as $$
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
  $$ language plpgsql;

  -- Drop existing trigger if it exists (for re-runs)
  drop trigger if exists on_profile_phone_updated on public.profiles;

  -- Trigger to link reports when profile phone is set/updated
  create trigger on_profile_phone_updated
    after insert or update of phone on public.profiles
    for each row
    when (new.phone is not null)
    execute function link_reports_to_patient();

  -- ============================================================================
  -- COMMENTS
  -- ============================================================================
  comment on table public.profiles is 'Patient/user profiles linked to auth.users';
  comment on table public.labs is 'Lab organizations';
  comment on table public.lab_users is 'Lab staff accounts linking users to labs';
  comment on table public.family_members is 'Family members added by patients';
  comment on table public.reports is 'Medical reports uploaded by labs';
  comment on table public.report_access is 'Access control for reports (family member sharing)';
  comment on table public.lab_patient_links is 'Links between labs and patients for lab portal';
