-- Fix: "new row violates RLS policy" when patients upload reports (storage + reports table)
-- Storage path: reports bucket, object name = self/{user_id}/{uuid}.pdf
-- Reports table: allow patient self-insert when patient_phone is empty or matches profile

-- 1. Drop existing storage INSERT policies (idempotent)
DROP POLICY IF EXISTS "Lab or patient can upload to own path" ON storage.objects;
DROP POLICY IF EXISTS "Patient can upload to self path" ON storage.objects;
DROP POLICY IF EXISTS "Lab can upload to lab path" ON storage.objects;

-- 2. Patient self-upload: dedicated policy using auth.jwt()->>'sub' (reliable in storage context)
CREATE POLICY "Patient can upload to self path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND name LIKE 'self/' || (auth.jwt()->>'sub') || '/%'
);

-- 3. Lab uploads: path starts with their lab_id
CREATE POLICY "Lab can upload to lab path"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'reports'
  AND EXISTS (
    SELECT 1 FROM public.lab_users lu
    WHERE lu.user_id = auth.uid()
    AND name LIKE lu.lab_id::text || '/%'
  )
);

-- 4. Patient can update own self-upload (needed if client uses upsert)
DROP POLICY IF EXISTS "Patient can update own self-upload" ON storage.objects;
CREATE POLICY "Patient can update own self-upload"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'reports'
  AND name LIKE 'self/' || (auth.jwt()->>'sub') || '/%'
);

-- -----------------------------------------------------------------------------
-- 5. Reports table: fix "Patients can insert own reports" (403 on self-upload)
-- -----------------------------------------------------------------------------
-- Allow patient_phone empty or matching profile (was failing when profile.phone is null)
DROP POLICY IF EXISTS "Patients can insert own reports" ON public.reports;

CREATE POLICY "Patients can insert own reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = patient_id
    AND (
      patient_phone IS NULL
      OR trim(patient_phone) = ''
      OR patient_phone = (SELECT phone FROM public.profiles WHERE id = auth.uid() LIMIT 1)
    )
  );
