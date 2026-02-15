# AI Report Analysis (OpenAI) – Setup

The **analyze-report** Edge Function uses OpenAI to explain lab reports in simple English. **No report data is stored anywhere** (not in Supabase, not in OpenAI beyond the single API request).

## 1. Set your OpenAI API key in Supabase

In **Supabase Dashboard** → **Edge Functions** → **Secrets**, add:

- **Name:** `OPENAI_API_KEY`
- **Value:** your OpenAI API key (same one you use in `.env` as `VITE_OPENAI_API_KEY` for reference; the function uses the secret, not the env var)

Or via CLI:

```bash
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
```

## 2. Deploy the function

```bash
npx supabase functions deploy analyze-report
```

If you use `config.toml` with `verify_jwt = false` for `analyze-report`, the above is enough. Otherwise:

```bash
npx supabase functions deploy analyze-report --no-verify-jwt
```

## 3. Flow (no storage)

1. User opens a report → app fetches the PDF (signed URL).
2. App extracts text from the PDF in the browser (in memory only).
3. App sends **only that text** to `analyze-report`; nothing is written to the database.
4. The Edge Function calls OpenAI once and returns summary, findings, and actions.
5. The app shows the result; the function does not log or store the report or the analysis.

No report content or analysis is saved in Supabase or in your app.
