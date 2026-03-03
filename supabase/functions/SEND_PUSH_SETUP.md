# send-push setup (FCM)

This function sends push notifications to patient devices registered in `push_tokens`.
It uses Firebase Cloud Messaging **HTTP v1** (legacy API is disabled/deprecated).

## 1) Deploy function

```bash
npx supabase functions deploy send-push
```

## 2) Set required secrets

```bash
npx supabase secrets set FCM_PROJECT_ID="your-firebase-project-id"
npx supabase secrets set FCM_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

`SUPABASE_*` secrets are already available in Supabase runtime.

## 3) Verify auth behavior

The function requires a valid user JWT and only allows callers who are present in `lab_users`.

## 4) How to get FCM service account JSON

1. Firebase Console -> Project settings -> Service accounts.
2. Click **Generate new private key**.
3. Download JSON file.
4. Use entire JSON as one-line value for `FCM_SERVICE_ACCOUNT_JSON`.

PowerShell helper:
```powershell
$json = Get-Content "C:\path\to\service-account.json" -Raw
npx supabase secrets set FCM_SERVICE_ACCOUNT_JSON="$json"
```

## 5) Redeploy function

```bash
npx supabase functions deploy send-push
```

## 6) Test quickly

1. Login as patient in mobile app on a real device (to register a token in `push_tokens`).
2. Login as lab user.
3. Upload a report from lab upload page.
4. Check function logs in Supabase dashboard:
   - expected: `ok: true`
   - and `sent > 0` if patient token exists.
