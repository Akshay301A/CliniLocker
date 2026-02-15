# WhatsApp Bot – Vercel API Setup

The WhatsApp webhook is at: **`/api/whatsapp-webhook`**

- **Full URL:** `https://clinilocker.com/api/whatsapp-webhook` (use this in Meta as Callback URL)

---

## 1. Environment variables (Vercel)

In **Vercel → Project → Settings → Environment Variables**, add:

| Name | Description | Example |
|------|-------------|---------|
| `WHATSAPP_VERIFY_TOKEN` | Secret word you choose (same as in Meta) | `clini_verify_123` |
| `WHATSAPP_ACCESS_TOKEN` | Long-lived access token from Meta (WhatsApp API) | from Meta Dashboard |
| `WHATSAPP_PHONE_NUMBER_ID` | Phone number ID from Meta (WhatsApp → API Setup) | numeric ID |
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (Settings → API). Needed so the webhook can look up `profiles` by phone. | from Supabase Dashboard |
| `SITE_URL` | (Optional) Base URL for links in bot messages | `https://clinilocker.com` |

**Important:** Use **SUPABASE_SERVICE_ROLE_KEY**, not the anon key. Get it from Supabase → Settings → API → `service_role` (secret).

---

## 2. Meta (WhatsApp) configuration

1. **Callback URL:** `https://clinilocker.com/api/whatsapp-webhook`
2. **Verify token:** Same string as `WHATSAPP_VERIFY_TOKEN` in Vercel.
3. **Verify and save** – Meta will send a GET request; the API responds with the challenge and verification will succeed.

---

## 3. Flow

- User sends **Hi** (or similar) to your WhatsApp number.
- Meta sends a POST to `/api/whatsapp-webhook`.
- The API reads the sender phone, checks `profiles` in Supabase.
- **If user exists:** Sends menu with links (View reports, Download reports).
- **If not:** Sends “Create account” + link to `SITE_URL/patient-login`.

Share your WhatsApp link (e.g. `https://wa.me/YOUR_PHONE_NUMBER`) on your site so users can open a chat and send Hi.
