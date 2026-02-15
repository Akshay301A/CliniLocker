# Supabase Auth URLs (Google login / redirects)

When you use **Google login** (or any OAuth), Supabase redirects the user back to your app. Two settings control this:

## 1. Site URL

- **What it is:** The default “home” URL of your app. Supabase uses it when it needs to redirect but the URL you sent is **not** in the allowlist (Redirect URLs).
- **Where:** Supabase Dashboard → **Authentication** → **URL Configuration** → **Site URL**.
- **For CliniLocker (Vite on port 8080):** Set this to your main dev URL:
  - **Desktop:** `http://localhost:8080`
  - Do **not** use `http://localhost:3000` — your app runs on **8080**, not 3000. Using 3000 is why you see redirects to localhost:3000.

## 2. Redirect URLs

- **What it is:** A list of URLs Supabase is **allowed** to send users to after login (e.g. after Google OAuth). If the URL your app requests is **not** in this list, Supabase ignores it and uses **Site URL** instead — so you end up at localhost:3000 on mobile.
- **Where:** Same page: **Authentication** → **URL Configuration** → **Redirect URLs**.

Add **every** URL where you open the app (one per line), for example:

```
http://localhost:8080/**
http://192.168.1.5:8080/**
```

- `http://localhost:8080/**` — when you test on your PC.
- `http://192.168.1.5:8080/**` — when you test on your phone (replace with your PC’s IP if different). The `/**` means “any path” (e.g. `/patient/dashboard`).

## Steps to fix “redirects to localhost:3000” on mobile

1. Open **Supabase Dashboard** → your project.
2. Go to **Authentication** → **URL Configuration**.
3. Set **Site URL** to: `http://localhost:8080` (not 3000).
4. In **Redirect URLs**, add (if not already there):
   - `http://localhost:8080/**`
   - `http://192.168.1.5:8080/**`  
   (Use your actual PC IP if different; find it with `ipconfig` on Windows.)
5. Click **Save**.

After this, Google login from your phone at `http://192.168.1.5:8080/` will redirect back to `http://192.168.1.5:8080/patient/dashboard` instead of localhost:3000.
