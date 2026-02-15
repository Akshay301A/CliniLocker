-- Add emergency contact fields to profiles (for patient My Profile screen)
alter table public.profiles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_relation text,
  add column if not exists emergency_contact_phone text;

comment on column public.profiles.emergency_contact_name is 'Emergency contact full name';
comment on column public.profiles.emergency_contact_relation is 'Relation to patient (e.g. Father, Spouse)';
comment on column public.profiles.emergency_contact_phone is 'Emergency contact phone number';
