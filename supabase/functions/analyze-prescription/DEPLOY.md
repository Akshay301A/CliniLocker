# Deploy Prescription Analysis Edge Function

## Quick Deploy Steps

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Create Edge Function**
   - Go to **Edge Functions** → **Create a new function**
   - Name: `analyze-prescription`
   - Copy the code from `supabase/functions/analyze-prescription/index.ts`
   - Paste it into the editor
   - Click **Deploy**

3. **Set Secret (if not already set)**
   - Go to **Edge Functions** → **Secrets**
   - Check if `OPENAI_API_KEY` exists
   - If not, add it:
     - Name: `OPENAI_API_KEY`
     - Value: Your OpenAI API key (same one used for `analyze-report`)

### Option 2: Via CLI

```bash
# Navigate to project root
cd C:\Users\aksha\OneDrive\Desktop\CliniLocker

# Deploy the function
npx supabase functions deploy analyze-prescription

# If you get JWT errors, use:
npx supabase functions deploy analyze-prescription --no-verify-jwt
```

**Note**: The function uses the same `OPENAI_API_KEY` secret as `analyze-report`, so if that's already set, you don't need to set it again.

---

## Verify Deployment

After deploying, test it in Supabase Dashboard:

### Step-by-Step Testing:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open Edge Functions**
   - Click **Edge Functions** in the left sidebar
   - Find `analyze-prescription` in the list
   - Click on it to open

3. **Test the Function**
   - Click the **"Invoke"** tab (or **"Test"** button)
   - You'll see a request/response interface

4. **Enter Test Payload**
   - In the **Request Body** section, paste this JSON (IMPORTANT: Remove any existing text first, paste ONLY this):
   ```json
   {
     "text": "Dr. Smith\nDate: 2025-02-09\n\nParacetamol 500mg - 1 tablet, 2 times daily, after meals, for 5 days\nAmoxicillin 250mg - 1 capsule, 3 times daily, before meals, for 7 days"
   }
   ```
   
   **⚠️ Common Mistake:** Make sure you don't have extra text like `{ "name": "Functions"` before the JSON. The body should start with `{` and contain ONLY the `text` field.

5. **Click "Invoke" or "Send Request"**

6. **Check Response**
   - You should see a response like:
   ```json
   {
     "summary": "Prescription from Dr. Smith dated 2025-02-09...",
     "medications": [
       {
         "medication_name": "Paracetamol",
         "dosage": "500mg",
         "frequency": "2 times daily",
         "duration_days": 5,
         "start_date": "2025-02-09",
         "times": ["08:00", "20:00"],
         "notes": "after meals"
       },
       {
         "medication_name": "Amoxicillin",
         "dosage": "250mg",
         "frequency": "3 times daily",
         "duration_days": 7,
         "start_date": "2025-02-09",
         "times": ["08:00", "14:00", "20:00"],
         "notes": "before meals"
       }
     ],
     "doctor_name": "Dr. Smith",
     "prescription_date": "2025-02-09"
   }
   ```

### Alternative: Test via Browser/Postman

You can also test via HTTP request:

**URL:**
```
https://qlaltyoganzvjwtgfsxy.supabase.co/functions/v1/analyze-prescription
```

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
```

**Body:**
```json
{
  "text": "Dr. Smith\nDate: 2025-02-09\n\nParacetamol 500mg - 1 tablet, 2 times daily, after meals, for 5 days\nAmoxicillin 250mg - 1 capsule, 3 times daily, before meals, for 7 days"
}
```

**Expected Response:** JSON with `medications` array containing extracted medication details.

---

## Troubleshooting

- **401 Unauthorized**: Use `--no-verify-jwt` flag or check JWT settings
- **500 Error**: Check if `OPENAI_API_KEY` secret is set
- **Function not found**: Make sure function name matches exactly: `analyze-prescription`
