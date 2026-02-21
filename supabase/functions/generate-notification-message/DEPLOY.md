# Deploy generate-notification-message Edge Function

## Step-by-Step Instructions

### 1. Create the Function in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** → **Create a new function**
3. Name it: `generate-notification-message`
4. Click **Create function**

### 2. Replace Default Code

1. **IMPORTANT**: Select ALL the default code in the editor and **DELETE it**
2. Copy the **entire contents** of `supabase/functions/generate-notification-message/index.ts`
3. Paste it into the Supabase editor
4. Click **Deploy**

### 3. Set Environment Secret

1. In Supabase Dashboard, go to **Edge Functions** → **Secrets**
2. Add secret:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (same one used for other functions)
3. Click **Save**

### 4. Test the Function

1. Go to **Edge Functions** → `generate-notification-message` → **Invoke**
2. Use this test payload:

```json
{
  "medication_name": "Paracetamol",
  "dosage": "500mg",
  "time_of_day": "morning"
}
```

3. Expected response:
```json
{
  "message": "Hey friend! 💊 Time for your Paracetamol (500mg) - let's keep you healthy!"
}
```

### 5. Verify It Works

- Response should contain a `message` field with a fun, friendly notification text
- Message should be under 120 characters
- Message should include emojis and friendly language

---

**Note**: This function uses the same OpenAI API key as your other functions. Make sure it's set correctly.
