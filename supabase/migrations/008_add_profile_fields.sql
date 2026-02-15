-- Add additional profile fields for complete patient information
-- Gender, Blood Group, Address, ABHA ID

alter table public.profiles
  add column if not exists gender text, -- 'male', 'female', 'other'
  add column if not exists blood_group text, -- 'A+', 'B+', 'O+', 'AB+', etc.
  add column if not exists address text, -- Full address
  add column if not exists abha_id text; -- ABHA (Ayushman Bharat Health Account) ID

-- Add comments
comment on column public.profiles.gender is 'Patient gender';
comment on column public.profiles.blood_group is 'Patient blood group (e.g., A+, B+, O+, AB+)';
comment on column public.profiles.address is 'Patient full address';
comment on column public.profiles.abha_id is 'ABHA (Ayushman Bharat Health Account) ID';
