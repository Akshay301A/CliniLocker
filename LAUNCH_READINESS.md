# CliniLocker — Launch Readiness (Website + Mobile App)

Last updated: 2026-02-21  
Repo: `CliniLocker` (this folder)

This document is a **single source of truth** for what has been built so far and what remains before launching:
- **Website** (Vercel deploy of `CliniLocker/`)
- **Mobile app** (Capacitor Android build from `CliniLockerMobile/`)
- **Backend** (Supabase: DB, Auth, Storage, Edge Functions)

---

## Current high-level status

### Website (Vercel) — **Mostly ready**
- **Core app exists**: React + Vite + Supabase auth/storage/functions.
- **Deployment instructions exist**: see `VERCEL_DEPLOY.md`.
- **Launch blockers usually are configuration**, not code (domains + Supabase URL config + OAuth redirects).

**Launch readiness (website):** ⚠️ *Depends on production configuration + smoke testing*

### Mobile app (Android) — **Not launch-ready yet**
- App UI + flows exist, but **final testing + Android packaging tasks** are pending (see checklist below).
- **Push registration code is added** (device token saved to Supabase) but **sending pushes is not implemented yet**.

**Launch readiness (Android app):** ❌ *Not ready (needs Android project setup, build, device testing)*

---

## What we implemented in this work session (Push Tokens + Registration)

### ✅ Supabase database (device token storage)
- **Added migration:** `supabase/migrations/20250216_push_tokens.sql`
  - Table: `public.push_tokens`
  - RLS: users can manage their own tokens
  - Unique constraint: `(user_id, token)`

### ✅ Mobile app: register token and save to Supabase
- **New file:** `CliniLockerMobile/src/lib/pushRegistration.ts`
  - Uses `@capacitor/push-notifications`
  - Requests permission (native only)
  - Registers and captures the device token
  - Calls `savePushToken()` to store token in Supabase

### ✅ Mobile app: upsert token API
- **Updated:** `CliniLockerMobile/src/lib/api.ts`
  - `savePushToken(token, platform)` upserts into `push_tokens`

### ✅ Mobile app: auto-run registration after patient login
- **Updated:** `CliniLockerMobile/src/contexts/AuthContext.tsx`
  - When a **patient** session is present, calls `registerPushAndSaveToken()` (native only; web no-op)

### ✅ Documentation
- **Added:** `CliniLockerMobile/FIREBASE_ANDROID_SETUP.md`
  - Simple Firebase/FCM setup steps for Android

---

## What is NOT done yet (important)

### Push notifications end-to-end (FCM/APNs)
What you have now is **token collection** (device registers and token gets stored).  
What is still missing is **sending push notifications** from a trusted backend.

- **Missing:** a backend sender (Supabase Edge Function / server) that:
  - reads tokens from `push_tokens`
  - calls FCM (Android) / APNs (iOS) to send messages

**Status:** ⚠️ Tokens can be stored; **sending is not implemented yet**

---

## Website launch readiness checklist (Vercel + Supabase)

### ✅ Code / repo
- [x] Website app exists in `CliniLocker/`
- [x] Deploy guide exists (`VERCEL_DEPLOY.md`)

### ⚠️ Required production configuration
- [ ] **Vercel**: Root Directory set to `CliniLocker`
- [ ] **Vercel env vars** set:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] **Supabase Auth URL config** updated for your domain (see `VERCEL_DEPLOY.md`):
  - [ ] Site URL = `https://clinilocker.com` (or your actual live URL)
  - [ ] Redirect URLs include `https://clinilocker.com/**` (+ www if used)
- [ ] **Google OAuth** (if used): confirm redirect URLs match production domain(s)

### 🧪 Smoke test (must do before launch)
- [ ] Login (patient)
- [ ] Login (lab)
- [ ] Upload a report (storage)
- [ ] View a report (signed URL)
- [ ] Share link flow (if enabled)
- [ ] Basic settings/profile update

**Website launch decision:**  
- ✅ Ready when the configuration is done and smoke tests pass.

---

## Mobile app (Android) launch readiness checklist

### ✅ Code status
- [x] Core app exists in `CliniLockerMobile/`
- [x] Supabase integration present
- [x] Medication reminders flow exists (local notifications + AI message generation; see `CliniLockerMobile/NOTIFICATIONS_GUIDE.md`)
- [x] Push token registration code added (this session)

### ⚠️ Critical setup items (Android build)
- [ ] Ensure Android project exists (usually created by Capacitor):
  - [ ] Run: `cd CliniLockerMobile && npx cap add android` (if `android/` folder doesn’t exist)
  - [ ] Run: `npx cap sync`
- [ ] **Install required Capacitor plugins** and sync:
  - [ ] `@capacitor/push-notifications` (added to `package.json`, but must be installed locally)
  - [ ] Run: `npm install` then `npx cap sync`
- [ ] **Firebase FCM setup** (Android):
  - [ ] Place `google-services.json` at `CliniLockerMobile/android/app/google-services.json`
  - [ ] Update Gradle files to apply `com.google.gms.google-services` and add `firebase-messaging`
    - See: `CliniLockerMobile/FIREBASE_ANDROID_SETUP.md`
- [ ] **OAuth for mobile** (if using Google): confirm mobile redirect scheme configuration
  - References: `MOBILE_APP_PRODUCTION_OAUTH.md`, `MOBILE_APP_OAUTH_FIX.md` (repo root)

### 🧪 Device testing (before any public release)
- [ ] Install debug build on **real Android device**
- [ ] Patient sign-in / sign-up
- [ ] Lab sign-in / flows (if required)
- [ ] Upload & view PDF reports
- [ ] Reminders scheduling and notification tap behavior
- [ ] Background/kill/restart behavior (session + reminders)
- [ ] Push token appears in Supabase `push_tokens` table after patient login

### 📦 Release packaging
- [ ] Update app version + versionCode in Android Gradle
- [ ] Create keystore and sign release build
- [ ] Build release APK/AAB
- [ ] Validate install/update path (upgrade from older build)

**Android app launch decision:**  
- ❌ Not ready until Android build setup + device testing + signed release build are complete.

---

## Backend (Supabase) readiness checklist

### ✅ Already present (based on repo docs and code)
- [x] Supabase Auth used by web + app
- [x] Storage for reports/prescriptions (used by app code)
- [x] Edge Functions exist for AI features (examples in `supabase/functions/*`)

### ⚠️ Push notifications backend sender (still needed)
Choose one approach:
- [ ] **Supabase Edge Function** to send pushes (recommended for this stack)
- [ ] A separate Node backend/service

Minimum requirements for sender:
- [ ] Secure credentials (Firebase service account / FCM credentials) stored as Supabase secrets (not in git)
- [ ] Function that accepts a `user_id` (or topic) and payload, looks up tokens in `push_tokens`, then sends push
- [ ] Logging + basic error handling (invalid token cleanup is a plus)

---

## Quick “Launch Readiness” summary (today)

### Website
- **Code:** ✅
- **Config:** ⚠️ (needs production domain + Supabase URL config + env vars)
- **Testing:** ⚠️ (smoke tests needed)
- **Overall:** **Almost ready** once configured and tested

### Android app
- **Code:** ✅ (feature-rich, but not fully validated)
- **Android build setup:** ❌ (Firebase/Gradle + build pipeline not completed in repo)
- **Device testing:** ❌
- **Push sending:** ❌ (only token storage is implemented)
- **Overall:** **Not ready** without Android build + testing + sender implementation

---

## Files to know (entry points)

### Website
- App: `CliniLocker/`
- Deploy guide: `VERCEL_DEPLOY.md`

### Mobile
- App: `CliniLockerMobile/`
- Auth state: `CliniLockerMobile/src/contexts/AuthContext.tsx`
- Supabase API helpers: `CliniLockerMobile/src/lib/api.ts`
- Push token registration: `CliniLockerMobile/src/lib/pushRegistration.ts`
- Firebase setup steps: `CliniLockerMobile/FIREBASE_ANDROID_SETUP.md`
- Local notification reminders: `CliniLockerMobile/NOTIFICATIONS_GUIDE.md`

### Supabase
- Migrations: `supabase/migrations/`
- Edge functions: `supabase/functions/`

