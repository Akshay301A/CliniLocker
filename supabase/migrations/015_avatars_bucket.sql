-- =============================================================================
-- Avatars bucket for profile images (profiles.avatar_url)
-- =============================================================================
-- Path convention: {user_id}/avatar.{ext} (one image per user; overwrite on re-upload)
-- Bucket is public so avatar_url can be the public object URL.
-- RLS uses storage.foldername(name)[1] = auth.uid() so uploads work correctly.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create the avatars bucket (public, images only, 2 MB max)
-- Include image/jpg (some browsers send this instead of image/jpeg)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- -----------------------------------------------------------------------------
-- 2. RLS: Users can only upload/update/delete their own avatar path
-- Upsert needs INSERT + SELECT + UPDATE; use auth.jwt()->>'sub' for folder check.
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can select own avatar" ON storage.objects;

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Users can select own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.jwt()->>'sub')
);
