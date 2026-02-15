-- Add notification preference columns to profiles (patient Settings)
-- Used by patient Settings → Notifications section; saved via updateProfile.

alter table public.profiles
  add column if not exists notify_sms boolean not null default true,
  add column if not exists notify_whatsapp boolean not null default true,
  add column if not exists notify_email boolean not null default false,
  add column if not exists notify_report_ready boolean not null default true,
  add column if not exists notify_health_tips boolean not null default false,
  add column if not exists notify_promotional boolean not null default false;

comment on column public.profiles.notify_sms is 'Patient prefers SMS notifications';
comment on column public.profiles.notify_whatsapp is 'Patient prefers WhatsApp notifications';
comment on column public.profiles.notify_email is 'Patient prefers email notifications';
comment on column public.profiles.notify_report_ready is 'Notify when a new report is available';
comment on column public.profiles.notify_health_tips is 'Receive health tips';
comment on column public.profiles.notify_promotional is 'Receive promotional / lab offers';
