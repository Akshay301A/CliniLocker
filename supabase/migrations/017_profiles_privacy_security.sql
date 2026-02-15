-- Privacy & Security preferences (patient Settings)
-- Used by Settings → Privacy & Security; saved via updateProfile.

alter table public.profiles
  add column if not exists two_factor_enabled boolean not null default true,
  add column if not exists report_sharing_allowed boolean not null default true,
  add column if not exists profile_visible_to_labs boolean not null default false;

comment on column public.profiles.two_factor_enabled is 'Patient prefers 2FA (OTP) for login when available';
comment on column public.profiles.report_sharing_allowed is 'Allow labs to share/link reports with this patient';
comment on column public.profiles.profile_visible_to_labs is 'Let linked labs see basic profile (name, phone, etc.)';
