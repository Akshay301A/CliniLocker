# Quick Fix: Mobile App OAuth Redirect Issue

## The Problem
When testing mobile app in browser (`npm run dev`), Google OAuth redirects to `https://www.clinilocker.com` instead of `http://localhost:5173`.

## Immediate Fix (2 Steps)

### Step 1: Add Localhost to Supabase (30 seconds)

1. Go to: **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   http://localhost:5173/**
   http://localhost:8080/**
   ```
3. Click **Save**

### Step 2: Update Mobile App Code

**File: `src/pages/PatientLogin.tsx`**

Find the `handleGoogleLogin` function and change:

**BEFORE:**
```typescript
const handleGoogleLogin = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${returnPath}` },
  });
};
```

**AFTER:**
```typescript
const handleGoogleLogin = async () => {
  // Force use current origin (localhost in dev)
  const currentOrigin = window.location.origin;
  const redirectUrl = `${currentOrigin}${returnPath}`;
  
  console.log("OAuth redirect:", redirectUrl); // Debug
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { 
      redirectTo: redirectUrl,
      skipBrowserRedirect: false  // Important for browser testing
    },
  });
};
```

**File: `src/lib/supabase.ts`**

Change:

**BEFORE:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**AFTER:**
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,  // Detect OAuth callback
    persistSession: true,
    autoRefreshToken: true
  }
});
```

## Test It

1. Run: `npm run dev`
2. Go to: `http://localhost:5173/patient-login`
3. Click "Google" button
4. Should redirect back to `http://localhost:5173/patient/dashboard` ✅

## If Still Not Working

Check browser console for errors. Common issues:

1. **"Redirect URL not allowed"**
   → Go back to Step 1, make sure URL is exactly `http://localhost:5173/**`

2. **Redirects to website anyway**
   → Check Supabase Site URL (should be `https://www.clinilocker.com`)
   → But Redirect URLs should have localhost

3. **Session not detected**
   → Make sure `detectSessionInUrl: true` is set in supabase.ts

That's it! This should fix the redirect issue for browser testing.
