# Google Translate (Language) setup

**If you see 401 Unauthorized** when changing language: redeploy the function without JWT checks:
```bash
npx supabase functions deploy translate --no-verify-jwt
```
The project’s `supabase/config.toml` also sets `verify_jwt = false` for future deploys.

---

1. **Get a Google Cloud API key**  
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Enable **Cloud Translation API**.  
   - Create an API key (Credentials → Create credentials → API key).  
   - Restrict the key to “Cloud Translation API” if you want.

2. **Set Supabase secret**  
   In Supabase Dashboard → Edge Functions → Secrets, add:
   - `GOOGLE_TRANSLATE_API_KEY` = your Google Cloud API key

   Or via CLI:
   ```bash
   supabase secrets set GOOGLE_TRANSLATE_API_KEY=AIzaSyC20fUCWU_4at7MJRidMiUuGhhyzhoeWmk
   ```

3. **Deploy the function** (no JWT required — uses anon key so language works before login)
   ```bash
   npx supabase functions deploy translate
   ```
   The project’s `supabase/config.toml` sets `verify_jwt = false` for `translate`, so the gateway won’t return 401. If you deploy without that config, use:
   ```bash
   npx supabase functions deploy translate --no-verify-jwt
   ```

4. **Run migration for language preference**  
   In Supabase SQL Editor, run the contents of `019_profiles_preferred_language.sql` so the `profiles.preferred_language` column exists.

After this, patients can choose a language in Settings → Language; the app uses the Translate Edge Function (and thus Google Translate) for UI strings when the language is not English.
