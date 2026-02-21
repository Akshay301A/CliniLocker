# 🚀 Deploy analyze-prescription Function - Step by Step

## ⚠️ The Issue

You're getting `{ "message": "Hello undefined!" }` which means the function is using the **default template code** instead of our actual code.

## ✅ Solution: Replace the Code

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in left sidebar

### Step 2: Find or Create Function
- If `analyze-prescription` exists → Click on it
- If it doesn't exist → Click **"Create a new function"** → Name it: `analyze-prescription`

### Step 3: DELETE ALL EXISTING CODE
1. **Select ALL** code in the editor (Ctrl+A)
2. **Delete it** (Delete key)
3. Make sure the editor is **completely empty**

### Step 4: Paste the Correct Code
1. Open file: `supabase/functions/analyze-prescription/index.ts`
2. **Copy ALL the code** (Ctrl+A, Ctrl+C)
3. **Paste it** into the Supabase editor (Ctrl+V)

### Step 5: Deploy
1. Click **"Deploy"** button (or **"Save"**)
2. Wait for deployment to complete

### Step 6: Verify Secret
1. Go to **Edge Functions** → **Secrets**
2. Make sure `OPENAI_API_KEY` exists
3. If not, add it (same key used for `analyze-report`)

---

## 🧪 Test After Deployment

### Test Payload:
```json
{
  "text": "Dr. Smith\nDate: 2025-02-09\n\nParacetamol 500mg - 1 tablet, 2 times daily, after meals, for 5 days\nAmoxicillin 250mg - 1 capsule, 3 times daily, before meals, for 7 days"
}
```

### Expected Response:
```json
{
  "summary": "Prescription from Dr. Smith...",
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

---

## 📝 Quick Copy-Paste Code

The complete code is in: `supabase/functions/analyze-prescription/index.ts`

**OR** copy from: `supabase/functions/analyze-prescription/COMPLETE_CODE.txt`

---

## ✅ Checklist

- [ ] Opened Supabase Dashboard → Edge Functions
- [ ] Found/Created `analyze-prescription` function
- [ ] **DELETED all existing code** (very important!)
- [ ] Pasted the correct code from `index.ts`
- [ ] Clicked **Deploy**
- [ ] Verified `OPENAI_API_KEY` secret exists
- [ ] Tested with the JSON payload above
- [ ] Got response with `medications` array (not `findings`)

---

**The key is: DELETE the default template code completely before pasting our code!**
