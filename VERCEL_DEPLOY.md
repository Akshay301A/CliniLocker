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

Add any other vars from `CliniLocker/.env.example`. Do not commit `.env` to the repo.

**Auth redirects:** In Supabase → Authentication → URL Configuration, add your production URL (e.g. `https://clinilocker.com/**`) to Redirect URLs and set Site URL so login works on the live site.
