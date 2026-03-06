# send-family-invite-email setup

This function sends family invite emails directly from backend (no `mailto` prompt).

## 1) Deploy function

```bash
npx supabase functions deploy send-family-invite-email
```

## 2) Required secrets

Set these in Supabase project secrets:

- `RESEND_API_KEY` -> your Resend API key
- `INVITE_FROM_EMAIL` -> verified sender (example: `CliniLocker <noreply@yourdomain.com>`)

Already present in your project for other functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Example:

```bash
npx supabase secrets set RESEND_API_KEY=re_xxx
npx supabase secrets set INVITE_FROM_EMAIL="CliniLocker <noreply@yourdomain.com>"
```

## 3) Domain/sender requirement

`INVITE_FROM_EMAIL` must be from a verified domain/sender in Resend.
If not verified, function returns provider error and email will not send.

## 4) Branding/logo

The client passes logo URL to the function (`/logo (2).png` from your site origin).
If unavailable, fallback text branding is used.
