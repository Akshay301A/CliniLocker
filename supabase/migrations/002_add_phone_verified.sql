-- Add phone_verified column to profiles table
-- Run this in Supabase Dashboard → SQL Editor if you already ran 001_complete_schema.sql

alter table public.profiles
add column if not exists phone_verified boolean not null default false;

comment on column public.profiles.phone_verified is 'Whether the phone number has been verified via OTP';
