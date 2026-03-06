-- Switch mobile app update URL to raw GitHub hosted APK for v1.0.3.

update public.app_config
set value = jsonb_set(
  coalesce(value, '{}'::jsonb),
  '{apk_url}',
  '"https://raw.githubusercontent.com/Akshay301A/CliniLocker/master/CliniLocker/public/downloads/CliniLocker-Android-v1.0.3-release.apk"'::jsonb,
  true
),
updated_at = now()
where key = 'mobile_app_update';
