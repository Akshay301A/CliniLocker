# Show ads after AdSense verification

Ads are **hidden** until you turn them on. No app or website update is needed.

## How it works

- The dashboard reads a **remote flag** from Supabase: `app_config.show_ads`.
- Default is **false** (ads section hidden).
- When AdSense verification is done (1–2 weeks), set the flag to **true** in Supabase.
- On the next page load or app open, the ads section will **show automatically** (no deploy, no new APK).

## Turn ads ON (after verification)

1. Open **Supabase Dashboard** → your project.
2. Go to **Table Editor** → **app_config**.
3. Find the row where **key** = `show_ads`.
4. Edit **value**: change `false` to `true` (or replace the whole value with `true`).
5. Save.

That’s it. Website and mobile app will show the ads section on next load.

## Turn ads OFF again

Set **value** back to `false` for the `show_ads` row and save.

## Run the migration first

If you haven’t applied the config table yet, run the migration:

- **Supabase Dashboard** → **SQL Editor** → run the contents of  
  `supabase/migrations/20250210_app_config_show_ads.sql`

Or with Supabase CLI: `supabase db push` (or your usual migration command).
