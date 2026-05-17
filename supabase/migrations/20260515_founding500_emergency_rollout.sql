create table if not exists public.emergency_campaigns (
  slug text primary key,
  name text not null,
  max_free_claims integer not null default 500 check (max_free_claims > 0),
  original_price integer not null default 499 check (original_price >= 0),
  launch_price integer not null default 199 check (launch_price >= 0),
  shipping_enabled boolean not null default false,
  shipping_price integer not null default 0 check (shipping_price >= 0),
  validation_seconds integer not null default 60 check (validation_seconds between 45 and 90),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.emergency_campaigns (
  slug,
  name,
  max_free_claims,
  original_price,
  launch_price,
  shipping_enabled,
  shipping_price,
  validation_seconds,
  is_active
)
values (
  'founding500',
  'Founding500 Emergency Identity Rollout',
  500,
  499,
  199,
  false,
  0,
  60,
  true
)
on conflict (slug) do nothing;

alter table public.emergency_campaigns enable row level security;

drop policy if exists "Anyone can read emergency campaigns" on public.emergency_campaigns;
create policy "Anyone can read emergency campaigns"
  on public.emergency_campaigns for select
  using (true);

alter table public.profiles
  add column if not exists allergies text,
  add column if not exists medical_conditions text;

create table if not exists public.emergency_identity_activations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  campaign_slug text not null references public.emergency_campaigns(slug) on delete restrict default 'founding500',
  phone text,
  phone_verified_at timestamptz,
  medical_records_count integer not null default 0 check (medical_records_count >= 0),
  emergency_profile_completed_at timestamptz,
  qr_generated_at timestamptz,
  qr_saved_at timestamptz,
  validation_started_at timestamptz,
  validation_completed_at timestamptz,
  eligibility_status text not null default 'inactive' check (
    eligibility_status in ('inactive', 'in_progress', 'under_validation', 'approved', 'launch_offer', 'rejected', 'revoked')
  ),
  founding_member_id text unique,
  founding_approved_at timestamptz,
  suspicious_flag boolean not null default false,
  suspicious_reason text,
  admin_review_status text not null default 'clean' check (
    admin_review_status in ('clean', 'review', 'approved', 'rejected')
  ),
  admin_notes text,
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id) on delete set null,
  order_claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists emergency_identity_activations_campaign_idx
  on public.emergency_identity_activations (campaign_slug, eligibility_status);

create index if not exists emergency_identity_activations_member_idx
  on public.emergency_identity_activations (founding_member_id);

alter table public.emergency_identity_activations enable row level security;

drop policy if exists "Users can read own emergency activations" on public.emergency_identity_activations;
drop policy if exists "Users can insert own emergency activations" on public.emergency_identity_activations;
drop policy if exists "Users can update own emergency activations" on public.emergency_identity_activations;

create policy "Users can read own emergency activations"
  on public.emergency_identity_activations for select
  using (auth.uid() = user_id);

create policy "Users can insert own emergency activations"
  on public.emergency_identity_activations for insert
  with check (auth.uid() = user_id);

create policy "Users can update own emergency activations"
  on public.emergency_identity_activations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.founding500_orders (
  id uuid primary key default gen_random_uuid(),
  campaign_slug text not null references public.emergency_campaigns(slug) on delete restrict default 'founding500',
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'created' check (
    status in ('created', 'awaiting_payment', 'paid', 'failed', 'cancelled', 'fulfilled')
  ),
  pricing_mode text not null check (pricing_mode in ('founding500', 'launch_offer')),
  coupon_code text,
  original_price integer not null check (original_price >= 0),
  discounted_price integer not null check (discounted_price >= 0),
  shipping_price integer not null default 0 check (shipping_price >= 0),
  total_amount integer not null check (total_amount >= 0),
  merchant_order_id text unique,
  cf_order_id text unique,
  cf_payment_session_id text,
  cf_order_status text,
  shipping_name text not null,
  shipping_phone text not null,
  shipping_line1 text not null,
  shipping_line2 text,
  shipping_city text not null,
  shipping_state text not null,
  shipping_pincode text not null,
  shipping_country text not null default 'India',
  normalized_address_hash text,
  suspicious_flag boolean not null default false,
  suspicious_reason text,
  payment_verified_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists founding500_orders_one_paid_per_user_idx
  on public.founding500_orders (user_id)
  where status in ('paid', 'fulfilled');

create index if not exists founding500_orders_campaign_status_idx
  on public.founding500_orders (campaign_slug, status, created_at desc);

create index if not exists founding500_orders_address_hash_idx
  on public.founding500_orders (normalized_address_hash);

alter table public.founding500_orders enable row level security;

drop policy if exists "Users can read own founding500 orders" on public.founding500_orders;
drop policy if exists "Users can insert own founding500 orders" on public.founding500_orders;

create policy "Users can read own founding500 orders"
  on public.founding500_orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own founding500 orders"
  on public.founding500_orders for insert
  with check (auth.uid() = user_id);

create table if not exists public.emergency_identity_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists emergency_identity_otps_user_phone_idx
  on public.emergency_identity_otps (user_id, phone, created_at desc);

alter table public.emergency_identity_otps enable row level security;

drop policy if exists "Users can read own emergency OTPs" on public.emergency_identity_otps;
create policy "Users can read own emergency OTPs"
  on public.emergency_identity_otps for select
  using (auth.uid() = user_id);

alter table public.reports
  add column if not exists file_hash text,
  add column if not exists content_fingerprint text,
  add column if not exists extracted_text text,
  add column if not exists upload_source text not null default 'patient_web',
  add column if not exists activation_declaration_accepted boolean not null default false;

create index if not exists reports_patient_hash_idx
  on public.reports (patient_id, file_hash);

create index if not exists reports_patient_fingerprint_idx
  on public.reports (patient_id, content_fingerprint);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists emergency_campaigns_touch_updated_at on public.emergency_campaigns;
create trigger emergency_campaigns_touch_updated_at
before update on public.emergency_campaigns
for each row execute function public.touch_updated_at();

drop trigger if exists emergency_identity_activations_touch_updated_at on public.emergency_identity_activations;
create trigger emergency_identity_activations_touch_updated_at
before update on public.emergency_identity_activations
for each row execute function public.touch_updated_at();

drop trigger if exists founding500_orders_touch_updated_at on public.founding500_orders;
create trigger founding500_orders_touch_updated_at
before update on public.founding500_orders
for each row execute function public.touch_updated_at();
