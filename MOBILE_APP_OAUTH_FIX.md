# Mobile App OAuth Redirect Fix

## 🔴 Problem
When using Google OAuth in the mobile app, Supabase redirects to the website domain (`https://www.clinilocker.com`) instead of handling it within the mobile app.

## ✅ Solution: Deep Linking & Custom URL Scheme

### Step 1: Configure Custom URL Scheme in Capacitor

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinilocker.app',
  appName: 'CliniLocker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',  // Use https for Android
    iosScheme: 'clinilocker'  // Custom scheme for iOS
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    }
  }
};

export default config;
```

### Step 2: Update Android Manifest for Deep Links

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">
    
    <!-- Existing intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
    
    <!-- Deep link intent filter -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="clinilocker" android:host="auth" />
    </intent-filter>
    
    <!-- HTTPS deep link (for OAuth) -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="clinilocker.app" android:pathPrefix="/auth" />
    </intent-filter>
</activity>
```

### Step 3: Configure Supabase Redirect URLs

In Supabase Dashboard → Authentication → URL Configuration:

**Add these Redirect URLs:**
```
clinilocker://auth/callback
https://clinilocker.app/auth/callback
com.clinilocker.app://auth/callback
```

**Site URL:** Keep as `https://www.clinilocker.com` (for website)

### Step 4: Handle OAuth in Mobile App

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Custom redirect URL for mobile
const getMobileRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // Use custom scheme for mobile
    return 'clinilocker://auth/callback';
  }
  // Fallback for web
  return `${window.location.origin}/auth/callback`;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: getMobileRedirectUrl(),
    // Auto-refresh session
    autoRefreshToken: true,
    // Persist session
    persistSession: true,
    // Detect session from URL
    detectSessionInUrl: true
  }
});

// Handle OAuth callback in mobile app
if (Capacitor.isNativePlatform()) {
  App.addListener('appUrlOpen', (event) => {
    const url = new URL(event.url);
    const accessToken = url.searchParams.get('access_token');
    const refreshToken = url.searchParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // Exchange tokens for session
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    }
  });
}
```

### Step 5: Update OAuth Login Functions

```typescript
// src/lib/api.ts or src/pages/auth/PatientLogin.tsx

import { Capacitor } from '@capacitor/core';

export async function signInWithGoogle() {
  const redirectUrl = Capacitor.isNativePlatform() 
    ? 'clinilocker://auth/callback'
    : `${window.location.origin}/auth/callback`;
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      // Skip browser redirect in mobile
      skipBrowserRedirect: Capacitor.isNativePlatform()
    }
  });
  
  if (Capacitor.isNativePlatform() && data?.url) {
    // Open OAuth URL in in-app browser
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url: data.url });
  }
  
  return { data, error };
}
```

### Step 6: Install Required Capacitor Plugins

```bash
npm install @capacitor/app @capacitor/browser
```

### Step 7: Create Auth Callback Handler

```typescript
// src/pages/auth/AuthCallback.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (Capacitor.isNativePlatform()) {
        // Listen for app URL open event
        App.addListener('appUrlOpen', async (event) => {
          const url = new URL(event.url);
          
          // Extract tokens from URL
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set session
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!error && data.session) {
              // Redirect to dashboard
              navigate('/patient/dashboard');
            } else {
              navigate('/patient-login?error=auth_failed');
            }
          }
        });
      } else {
        // Web: Supabase handles it automatically
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/patient/dashboard');
        } else {
          navigate('/patient-login');
        }
      }
    };

    handleAuthCallback();
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

### Step 8: Alternative Approach - Use Supabase Deep Links Plugin

If the above doesn't work, use a dedicated deep linking approach:

```typescript
// Install plugin
npm install @supabase/auth-helpers-react

// Or use manual URL handling
import { App } from '@capacitor/app';

// In your login component
const handleGoogleLogin = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'clinilocker://auth/callback',
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (data?.url) {
    // Open in browser
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ 
      url: data.url,
      windowName: '_self'
    });
  }
};
```

## 🔧 Testing Deep Links

### Test on Android:
```bash
# Build app
npm run build
npx cap sync android

# Test deep link (from terminal or ADB)
adb shell am start -W -a android.intent.action.VIEW -d "clinilocker://auth/callback?access_token=test&refresh_token=test" com.clinilocker.app
```

### Test OAuth Flow:
1. Click "Sign in with Google" in app
2. Browser opens for Google login
3. After login, redirects to `clinilocker://auth/callback?access_token=...`
4. App handles the callback
5. User is logged in

## 📝 Key Points

1. **Custom URL Scheme**: `clinilocker://` instead of `https://`
2. **Android Manifest**: Add intent filters for deep links
3. **Supabase Config**: Add mobile redirect URLs
4. **Capacitor App Plugin**: Listen for `appUrlOpen` events
5. **Browser Plugin**: Open OAuth in in-app browser
6. **Session Handling**: Extract tokens from URL and set session

## 🚨 Common Issues & Fixes

### Issue 1: Redirect still goes to website
**Fix**: Check Supabase Redirect URLs include `clinilocker://auth/callback`

### Issue 2: App doesn't open after OAuth
**Fix**: Verify AndroidManifest.xml has correct intent filters

### Issue 3: Tokens not extracted
**Fix**: Check URL parsing in `appUrlOpen` listener

### Issue 4: Session not persisting
**Fix**: Ensure `persistSession: true` in Supabase config

## ✅ Final Checklist

- [ ] Custom URL scheme configured in `capacitor.config.ts`
- [ ] AndroidManifest.xml has intent filters
- [ ] Supabase redirect URLs include mobile scheme
- [ ] `@capacitor/app` plugin installed
- [ ] `@capacitor/browser` plugin installed
- [ ] OAuth login uses mobile redirect URL
- [ ] `appUrlOpen` listener handles callbacks
- [ ] Auth callback page exists
- [ ] Tested on real Android device

This approach ensures OAuth redirects stay within the mobile app instead of going to the website domain.
