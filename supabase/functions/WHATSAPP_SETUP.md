# WhatsApp Business API (Meta Cloud API) setup for CliniLocker

Use **Meta’s WhatsApp Cloud API** directly (no Twilio). Messages come from your WhatsApp Business number with no trial branding.

---

## 1. Create Meta app and get WhatsApp access

1. Go to [Meta for Developers](https://developers.facebook.com/) → **My Apps** → **Create App** → choose **Business** type.
2. In the app dashboard, add the **WhatsApp** product (or **WhatsApp Business Platform**).
3. Open **WhatsApp** → **API Setup** (or **Getting Started**).
4. You’ll need:
   - **Phone number ID** – shown in API Setup (your WhatsApp Business number’s ID).
   - **Access token** – use a **permanent** token for production:
     - For testing: copy the **temporary** token from API Setup (expires in 24h).
     - For production: **System Users** → create system user → generate token with `whatsapp_business_messaging` and `whatsapp_business_management` → copy the permanent token.

---

## 2. Set Supabase secrets

In **Supabase Dashboard** → your project → **Edge Functions** → **Secrets**, add:

| Secret               | Value |
|----------------------|--------|
| `WA_ACCESS_TOKEN`    | Your WhatsApp Cloud API **permanent** access token |
| `WA_PHONE_NUMBER_ID` | Your **Phone number ID** from Meta API Setup (numeric ID, not the phone number) |

---

## 3. Deploy the function

```bash
cd C:\Users\aksha\OneDrive\Desktop\CliniLocker
npx supabase functions deploy send-whatsapp
```

---

## 4. Call the function

**URL:** `https://qlaltyoganzvjwtgfsxy.supabase.co/functions/v1/send-whatsapp`

**Method:** `POST`  
**Headers:** `Content-Type: application/json`, `Authorization: Bearer YOUR_ANON_KEY`  
**Body:**

```json
{
  "to": "+919876543210",
  "body": "Your report is ready. View it in CliniLocker."
}
```

- `to`: recipient phone in E.164 (e.g. `+919876543210`). The function strips non-digits before sending.
- `body`: message text (plain text).

---

## 5. WhatsApp 24-hour rule and templates

- **Within 24 hours** of the user’s last message to you: you can send **free-form text** (this function does that).
- **Outside 24 hours** (or first contact): you must use **pre-approved message templates**. Create templates in Meta Business Suite → WhatsApp Manager → Message templates, then use the Template API instead of a plain text message.

For “Report ready” notifications, if the user hasn’t messaged you in 24h, you’ll need an approved template (e.g. “Your health report is ready.”) and a small change to the function or a second function that sends that template. For now this function is for **session** (reply) messages.

---

## 6. Business verification (production)

For production and higher limits, Meta may require **Business Verification**. For testing you can use the test number and temporary token. For going live, complete verification in Meta Business Suite.

---

## Summary vs Twilio

| | Twilio trial | WhatsApp Cloud API (Meta) |
|--|--------------|---------------------------|
| Branding | “Sent from your Twilio trial account” | Your business name / number |
| Setup | SID + token + number | Meta app + Phone number ID + token |
| Cost | Per SMS (trial limits) | Per conversation (see Meta pricing) |

You can keep or remove the Twilio `send-sms` function; use `send-whatsapp` for WhatsApp notifications and respect the 24h/template rules above.
