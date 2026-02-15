-- Preferred language for patient (used with Google Translate for UI)
alter table public.profiles
  add column if not exists preferred_language text not null default 'en';

comment on column public.profiles.preferred_language is 'ISO 639-1 language code: en, hi, ta, te, kn, ml';
