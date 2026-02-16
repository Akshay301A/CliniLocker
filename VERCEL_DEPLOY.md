# Deploying CliniLocker (e.g. clinilocker.com)

**Supabase is already live.** Migrations are applied; new ones for new features can be run later when needed.

**For deployment:** Only the frontend is deployed via Vercel. The `supabase/` folder is in the repo for version control; Vercel does not deploy it.

---

## Vercel (frontend)

1. Vercel Dashboard → your project → **Settings** → **General**.
2. **Root Directory** → Edit → enter **`CliniLocker`** → Save.
3. Redeploy (or push a new commit).

**Environment variables:**  
Vercel → Settings → Environment Variables. Add at least:

- `VITE_SUPABASE_URL` – your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` – your Supabase anon key

Do not add an OpenAI API key as a Vercel env var for the frontend – it would be bundled and exposed. OpenAI is used only in Supabase Edge Functions (secrets). Do not commit `.env` to the repo.

---

## Production URL checklist (clinilocker.com)

### 1. Application code – no changes needed

The app uses **`window.location.origin`** for:

- Login/Signup/Patient login redirects (where to send the user after auth)
- Report share links (copy link uses current domain)

So on **clinilocker.com** it already uses `https://clinilocker.com` automatically. No code updates required for the live domain.

### 2. Supabase Dashboard – update for live site

You **must** add your live domain in Supabase so login (including Google OAuth) works on clinilocker.com.

**Where:** Supabase Dashboard → your project → **Authentication** → **URL Configuration**.

**What to set:**

| Setting | What to enter |
|--------|----------------|
| **Site URL** | `https://clinilocker.com` |
| **Redirect URLs** | Add these (one per line). Keep any localhost entries if you still develop locally. |
| | `https://clinilocker.com/**` |
| | `https://www.clinilocker.com/**` (if you use www) |
| | `http://localhost:8080/**` (optional, for local dev) |

**Steps:**

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → select your project.
2. Left sidebar → **Authentication** → **URL Configuration**.
3. **Site URL:** set to `https://clinilocker.com` (or `https://www.clinilocker.com` if that’s your main URL).
4. **Redirect URLs:** add the lines from the table above. The `/**` means “any path on this domain” (e.g. `/patient/dashboard`, `/lab/dashboard`).
5. Click **Save**.

After this, when a user signs in (or uses Google login) on **clinilocker.com**, Supabase will redirect them back to clinilocker.com instead of localhost or another URL.
