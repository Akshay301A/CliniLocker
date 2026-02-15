# Supabase Migrations

This directory contains SQL migration files for setting up the CliniLocker database schema and storage.

## Migration order

Run in numeric order: **001** → **002** → … → **011**.

| File | Purpose |
|------|--------|
| **001_complete_schema.sql** | Base schema: profiles, labs, lab_users, family_members, reports, report_access, lab_patient_links, RLS, triggers |
| **002_add_phone_verified.sql** | `profiles.phone_verified` |
| **003_add_patient_upload_policy.sql** | `get_or_create_self_upload_lab()`, RLS for patient report insert |
| **004_create_self_upload_lab.sql** | Insert "Self Upload" lab |
| **005_fix_reports_rls_policy.sql** | Fix "Patients can read own reports" (NULL-safe) |
| **006_add_weight_blood_pressure.sql** | `profiles.weight`, `profiles.blood_pressure` |
| **007_add_avatar_url.sql** | `profiles.avatar_url` |
| **008_add_profile_fields.sql** | `profiles`: gender, blood_group, address, abha_id |
| **009_fix_reports_rls.sql** | Recreate lab report RLS (no recursion) |
| **010_ensure_profile_columns.sql** | Idempotent add of weight, blood_pressure, avatar_url |
| **011_storage_buckets.sql** | `reports` bucket + storage RLS (see below) |
| **012_fix_link_reports_trigger.sql** | `link_reports_to_patient()` as SECURITY DEFINER so profile phone update can link reports |
| **013_fix_lab_users_rls.sql** | Fix lab_users SELECT 500: use `current_user_is_lab_admin()` so RLS doesn’t recurse |
| **014_profiles_emergency_contact.sql** | `profiles`: emergency_contact_name, emergency_contact_relation, emergency_contact_phone |
| **015_avatars_bucket.sql** | `avatars` bucket (public) + RLS; path `{user_id}/avatar.{ext}`; allows image/jpg, image/jpeg, etc. |

## Storage (011_storage_buckets.sql)

- **Bucket:** `reports` — private, PDF only, 10 MB per file.
- **Path convention (required for RLS):**
  - **Labs:** `{lab_id}/{unique}.pdf` (e.g. `a1b2c3d4-.../report-uuid.pdf`).
  - **Patients (self-upload):** `self/{user_id}/{unique}.pdf`.
- **Policies:** INSERT only to own path; SELECT via reports/report_access; UPDATE/DELETE for lab or own self-upload.

When saving a report, set `reports.file_url` to a value that **contains** the storage object path (e.g. full URL or path) so SELECT policy matching works.

## Running migrations

1. Supabase Dashboard → **SQL Editor**.
2. Run each file in order (001 → 011).
3. Confirm no errors.

## Verification

- All tables exist and RLS is enabled.
- Triggers and functions are present.
- "Self Upload" lab exists.
- Storage bucket `reports` exists and policies are active.
