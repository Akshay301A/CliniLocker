-- =============================================================================
-- CliniLocker Storage: reports bucket and RLS policies
-- =============================================================================
-- Run this in Supabase Dashboard → SQL Editor (after 001–010 migrations).
-- Path convention: labs use {lab_id}/{unique}.pdf, patients use self/{user_id}/{unique}.pdf
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Create the reports bucket (private, PDF only, 10 MB max)
-- -----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reports',
  'reports',
  false,
  10485760,  -- 10 MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 2. Drop existing policies (idempotent re-run)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Lab or patient can upload to own path" ON storage.objects;
DROP POLICY IF EXISTS "Users can read reports they have access to" ON storage.objects;
DROP POLICY IF EXISTS "Lab users can update their lab reports" ON storage.objects;
DROP POLICY IF EXISTS "Lab or patient can delete own report objects" ON storage.objects;

-- -----------------------------------------------------------------------------
-- 3. INSERT: Only allow uploads to paths the user owns
-- -----------------------------------------------------------------------------
-- Labs: path must start with their lab_id (from lab_users).
-- Patients (self-upload): path must start with self/{user_id}/.
CREATE POLICY "Lab or patient can upload to own path"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'reports'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM public.lab_users lu
      WHERE lu.user_id = auth.uid()
      AND storage.objects.name LIKE lu.lab_id::text || '/%'
    )
    OR
    storage.objects.name LIKE 'self/' || auth.uid()::text || '/%'
  )
);

-- -----------------------------------------------------------------------------
-- 4. SELECT: Read only if user has access via reports / report_access
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can read reports they have access to"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'reports'
  AND auth.role() = 'authenticated'
  AND (
    EXISTS (
      SELECT 1 FROM public.reports r
      WHERE r.file_url LIKE '%' || storage.objects.name
      AND r.patient_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.lab_users lu ON lu.lab_id = r.lab_id
      WHERE r.file_url LIKE '%' || storage.objects.name
      AND lu.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.report_access ra ON ra.report_id = r.id
      WHERE r.file_url LIKE '%' || storage.objects.name
      AND ra.user_id = auth.uid()
    )
  )
);

-- -----------------------------------------------------------------------------
-- 5. UPDATE: Lab users can replace files for their lab's reports
-- -----------------------------------------------------------------------------
CREATE POLICY "Lab users can update their lab reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'reports'
  AND EXISTS (
    SELECT 1 FROM public.lab_users lu
    WHERE lu.user_id = auth.uid()
    AND storage.objects.name LIKE lu.lab_id::text || '/%'
  )
);

-- -----------------------------------------------------------------------------
-- 6. DELETE: Lab users can delete their lab's files; patients can delete self-uploads
-- -----------------------------------------------------------------------------
CREATE POLICY "Lab or patient can delete own report objects"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'reports'
  AND (
    EXISTS (
      SELECT 1 FROM public.reports r
      JOIN public.lab_users lu ON lu.lab_id = r.lab_id
      WHERE r.file_url LIKE '%' || storage.objects.name
      AND lu.user_id = auth.uid()
    )
    OR
    (storage.objects.name LIKE 'self/' || auth.uid()::text || '/%')
  )
);
