-- Add weight and blood_pressure fields to profiles table
-- These can be manually entered in settings or extracted from reports

alter table public.profiles
  add column if not exists weight numeric(5,2), -- weight in kg (e.g., 78.50)
  add column if not exists blood_pressure text; -- blood pressure as text (e.g., "128/86" or "120/80")

-- Add comments
comment on column public.profiles.weight is 'Patient weight in kg (can be manually entered or extracted from reports)';
comment on column public.profiles.blood_pressure is 'Patient blood pressure (can be manually entered or extracted from reports, format: "systolic/diastolic")';
