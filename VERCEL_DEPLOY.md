# Deploying to Vercel (e.g. clinilocker.com)

The frontend app lives in the **`CliniLocker`** subfolder. To fix "Could not resolve entry module index.html":

1. In **Vercel Dashboard** → your project → **Settings** → **General**.
2. Under **Root Directory**, click **Edit**, enter **`CliniLocker`**, and save.
3. Redeploy (or push a new commit).

Vercel will then run `npm install` and `npm run build` inside `CliniLocker`, where `index.html` and the Vite config are located.

**Environment variables:** In Vercel → Settings → Environment Variables, add your production values (e.g. `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and any others from `.env.example`). Do not commit `.env` to the repo.
