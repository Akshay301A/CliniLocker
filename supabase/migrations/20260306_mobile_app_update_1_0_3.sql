-- Set mobile app update config to latest v1.0.3 release.

insert into public.app_config (key, value, updated_at)
values (
  'mobile_app_update',
  '{
    "title": "Update Available",
    "message": "A new version is available. Please update for best performance.",
    "force_update": false,
    "latest_version": "1.0.3",
    "min_supported_version": "1.0.0",
    "apk_url": "https://clinilocker.vercel.app/downloads/CliniLocker-Android-v1.0.3-release.apk"
  }'::jsonb,
  now()
)
on conflict (key) do update
set value = excluded.value,
    updated_at = now();

