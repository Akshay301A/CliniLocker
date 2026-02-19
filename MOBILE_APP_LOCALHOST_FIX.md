# Fix: OAuth Redirecting to Website When Testing Mobile App in Browser

## 🔴 Problem
When testing the mobile app in browser (`npm run dev`), clicking Google OAuth redirects to `https://www.clinilocker.com` instead of staying on `http://localhost:5173`.

## ✅ Solution

### Step 1: Add Localhost to Supabase Redirect URLs

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

**Add these Redirect URLs:**
```
http://localhost:5173/**
http://localhost:5173/patient/dashboard
http://localhost:5173/lab/dashboard
http://localhost:5173/auth/callback
http://localhost:8080/**  (if using port 8080)
http://127.0.0.1:5173/**   (alternative localhost)
```

**Site URL:** Keep as `https://www.clinilocker.com` (for production website)

### Step 2: Update Mobile App OAuth Code

Create/update the mobile app's PatientLogin.tsx to use the correct redirect URL:

```typescript
// src/pages/PatientLogin.tsx (Mobile App)
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/patient/dashboard";
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    // Get current origin (localhost:5173 in dev, or production URL)
    const currentOrigin = window.location.origin;
    const returnPath = redirectTo.startsWith("/") ? redirectTo : `/${redirectTo}`;
    const redirectUrl = `${currentOrigin}${returnPath}`;
    
    console.log("OAuth redirect URL:", redirectUrl); // Debug log
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { 
        redirectTo: redirectUrl,
        // Important: Don't skip browser redirect in web browser
        skipBrowserRedirect: false
      },
    });
    
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
      return;
    }
    // Note: Supabase will handle the redirect automatically
    setGoogleLoading(false);
  };

  return (
    // ... rest of component
  );
};
```

### Step 3: Handle OAuth Callback in Mobile App

Create an auth callback handler:

```typescript
// src/pages/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      // Check if we have a session (OAuth callback completed)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && !error) {
        // Get the redirect path from URL hash or default to dashboard
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const redirectPath = hashParams.get('redirect_to') || '/patient/dashboard';
        
        // Clean up the URL
        window.history.replaceState({}, document.title, redirectPath);
        
        // Navigate to intended destination
        navigate(redirectPath, { replace: true });
      } else {
        // No session, redirect to login
        navigate('/patient-login', { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
```

### Step 4: Update Supabase Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-detect session from URL hash (OAuth callback)
    detectSessionInUrl: true,
    // Persist session in localStorage
    persistSession: true,
    // Auto-refresh tokens
    autoRefreshToken: true,
    // Use current window origin for redirects
    redirectTo: window.location.origin
  }
});
```

### Step 5: Add Route for Auth Callback

```typescript
// src/App.tsx or router config
import AuthCallback from '@/pages/AuthCallback';

// Add route:
<Route path="/auth/callback" element={<AuthCallback />} />
```

## 🧪 Testing Steps

1. **Start dev server:**
   ```bash
   npm run dev
   ```
   Note the URL (usually `http://localhost:5173`)

2. **Add that exact URL to Supabase:**
   - Go to Supabase Dashboard → Authentication → URL Configuration
   - Add: `http://localhost:5173/**`

3. **Test OAuth:**
   - Open `http://localhost:5173/patient-login`
   - Click "Sign in with Google"
   - Should redirect back to `http://localhost:5173/patient/dashboard`

4. **Check browser console:**
   - Look for any redirect errors
   - Check network tab for OAuth flow

## 🔍 Debugging

### If still redirecting to website:

1. **Check Supabase Redirect URLs:**
   - Must include exact localhost URL with port
   - Use `/**` wildcard: `http://localhost:5173/**`

2. **Check browser console:**
   ```javascript
   // In browser console, check:
   console.log(window.location.origin); // Should be http://localhost:5173
   ```

3. **Verify redirectTo in code:**
   ```typescript
   // Add debug log before OAuth call
   console.log("Redirect URL:", redirectUrl);
   ```

4. **Check Supabase Site URL:**
   - Site URL should be `https://www.clinilocker.com` (for production)
   - But Redirect URLs should include localhost

## 📝 Environment Variables

Make sure `.env` file exists in mobile app:

```bash
# .env (in mobile app folder)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## ✅ Quick Checklist

- [ ] Added `http://localhost:5173/**` to Supabase Redirect URLs
- [ ] Mobile app uses `window.location.origin` for redirectTo
- [ ] AuthCallback component created and routed
- [ ] Supabase client configured with `detectSessionInUrl: true`
- [ ] Tested OAuth flow in browser
- [ ] OAuth redirects back to localhost, not website

## 🚨 Common Issues

### Issue: Still redirecting to website
**Fix:** Double-check Supabase Redirect URLs includes exact localhost URL with port

### Issue: "Redirect URL not allowed" error
**Fix:** Add the exact URL format Supabase expects (with `/**` wildcard)

### Issue: Session not detected after OAuth
**Fix:** Ensure `detectSessionInUrl: true` in Supabase client config

### Issue: Works in browser but not in mobile app
**Fix:** For actual mobile app (not browser), use custom URL scheme approach (see MOBILE_APP_OAUTH_FIX.md)

## 🎯 Summary

**For Browser Testing (Development):**
- Use `http://localhost:5173/**` in Supabase Redirect URLs
- Use `window.location.origin` in code
- Supabase handles redirect automatically

**For Production Mobile App (Android/iOS):**
- Use custom URL scheme: `clinilocker://auth/callback`
- Handle deep links with Capacitor App plugin
- See MOBILE_APP_OAUTH_FIX.md for details
