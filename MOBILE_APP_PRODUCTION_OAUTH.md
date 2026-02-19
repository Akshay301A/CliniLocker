# Mobile App Production OAuth Setup

## 🎯 Goal
Configure OAuth to work correctly when the mobile app is deployed as a native Android/iOS app (not browser testing).

---

## 📱 Production Setup Overview

For production mobile apps, we use **Custom URL Schemes** instead of HTTP URLs:
- **Development (browser)**: `http://localhost:5173`
- **Production (mobile app)**: `clinilocker://auth/callback`

---

## 🔧 Step-by-Step Production Setup

### Step 1: Configure Custom URL Scheme in Capacitor

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinilocker.app',
  appName: 'CliniLocker',
  webDir: 'dist',
  server: {
    androidScheme: 'https',  // Use https for Android deep links
  },
  android: {
    buildOptions: {
      keystorePath: undefined,  // Set for production builds
      keystoreAlias: undefined
    }
  }
};

export default config;
```

### Step 2: Update Android Manifest for Deep Links

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask">
            
            <!-- Existing launcher intent -->
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
            
            <!-- Custom URL scheme deep link -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="clinilocker" android:host="auth" />
            </intent-filter>
            
            <!-- HTTPS deep link (alternative) -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data 
                    android:scheme="https" 
                    android:host="clinilocker.app" 
                    android:pathPrefix="/auth" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### Step 3: Add Mobile Redirect URLs to Supabase

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

**Add these Redirect URLs:**
```
clinilocker://auth/callback
com.clinilocker.app://auth/callback
https://clinilocker.app/auth/callback
```

**Site URL:** Keep as `https://www.clinilocker.com` (for website)

**Important:** Add ALL three formats to ensure compatibility across different Android versions and OAuth providers.

### Step 4: Update Supabase Client for Mobile

```typescript
// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { Capacitor } from "@capacitor/core";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Get redirect URL based on platform
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    // Mobile app: use custom URL scheme
    return 'clinilocker://auth/callback';
  } else {
    // Browser: use current origin
    return `${window.location.origin}/auth/callback`;
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    redirectTo: getRedirectUrl(),
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true
  }
});
```

### Step 5: Handle OAuth in Mobile App

```typescript
// src/pages/PatientLogin.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PatientLoginPage = () => {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    
    try {
      const redirectUrl = Capacitor.isNativePlatform() 
        ? 'clinilocker://auth/callback'
        : `${window.location.origin}/auth/callback`;
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: Capacitor.isNativePlatform()  // Skip in mobile
        }
      });
      
      if (error) {
        toast.error(error.message);
        setGoogleLoading(false);
        return;
      }
      
      // In mobile app, open OAuth URL in browser
      if (Capacitor.isNativePlatform() && data?.url) {
        await Browser.open({ 
          url: data.url,
          windowName: '_self'
        });
        
        // Listen for app URL open (OAuth callback)
        App.addListener('appUrlOpen', async (event) => {
          const url = new URL(event.url);
          
          // Extract tokens from URL
          const accessToken = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Set session
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!sessionError && sessionData.session) {
              // Close browser
              await Browser.close();
              // Navigate to dashboard
              navigate('/patient/dashboard');
              toast.success('Signed in successfully!');
            } else {
              toast.error('Failed to sign in');
            }
            
            // Remove listener
            App.removeAllListeners();
          }
        });
      }
      
      // In browser, Supabase handles redirect automatically
      setGoogleLoading(false);
    } catch (error) {
      toast.error('An error occurred');
      setGoogleLoading(false);
    }
  };

  return (
    // ... your UI
  );
};
```

### Step 6: Install Required Capacitor Plugins

```bash
npm install @capacitor/app @capacitor/browser
npx cap sync
```

### Step 7: Handle App State (Optional but Recommended)

```typescript
// src/App.tsx or main entry point
import { App } from '@capacitor/app';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle app URL open (deep link)
    App.addListener('appUrlOpen', async (event) => {
      const url = new URL(event.url);
      
      // Handle OAuth callback
      if (url.pathname === '/auth/callback') {
        const accessToken = url.searchParams.get('access_token');
        const refreshToken = url.searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error && data.session) {
            navigate('/patient/dashboard');
          }
        }
      }
    });

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground - refresh session
        supabase.auth.getSession();
      }
    });

    return () => {
      App.removeAllListeners();
    };
  }, []);

  return (
    // ... your app
  );
}
```

---

## 🧪 Testing Production Setup

### Test Deep Link (Android)

```bash
# Build app
npm run build
npx cap sync android

# Test deep link via ADB
adb shell am start -W -a android.intent.action.VIEW \
  -d "clinilocker://auth/callback?access_token=test&refresh_token=test" \
  com.clinilocker.app
```

### Test OAuth Flow

1. **Install app on device** (via Android Studio or APK)
2. **Click "Sign in with Google"**
3. **Browser opens** for Google login
4. **After login**, redirects to `clinilocker://auth/callback?access_token=...`
5. **App opens** and handles callback
6. **User is logged in** ✅

---

## 📋 Production Checklist

### Supabase Configuration
- [ ] Added `clinilocker://auth/callback` to Redirect URLs
- [ ] Added `com.clinilocker.app://auth/callback` to Redirect URLs
- [ ] Added `https://clinilocker.app/auth/callback` to Redirect URLs
- [ ] Site URL remains `https://www.clinilocker.com` (for website)

### Code Configuration
- [ ] `capacitor.config.ts` has correct `appId`
- [ ] `AndroidManifest.xml` has intent filters for deep links
- [ ] Supabase client uses mobile redirect URL
- [ ] OAuth handler uses `@capacitor/app` and `@capacitor/browser`
- [ ] App state handling implemented

### Testing
- [ ] Tested OAuth flow on real Android device
- [ ] Deep links work correctly
- [ ] Session persists after app restart
- [ ] OAuth callback handled correctly

---

## 🔄 Environment-Specific Configuration

### Development (Browser Testing)
```typescript
// Use localhost
redirectTo: 'http://localhost:5173/auth/callback'
```

### Production (Mobile App)
```typescript
// Use custom URL scheme
redirectTo: 'clinilocker://auth/callback'
```

### Production (Website)
```typescript
// Use website domain
redirectTo: 'https://www.clinilocker.com/auth/callback'
```

---

## 🚨 Common Production Issues

### Issue 1: OAuth redirects to website instead of app
**Fix:** 
- Verify custom URL scheme is in Supabase Redirect URLs
- Check AndroidManifest.xml has correct intent filters
- Ensure `skipBrowserRedirect: true` for mobile

### Issue 2: App doesn't open after OAuth
**Fix:**
- Verify deep link URL matches exactly: `clinilocker://auth/callback`
- Check AndroidManifest.xml intent filter matches
- Test deep link manually with ADB

### Issue 3: Session not persisting
**Fix:**
- Ensure `persistSession: true` in Supabase config
- Check app has storage permissions
- Verify session is saved to secure storage

### Issue 4: Browser opens but doesn't close
**Fix:**
- Ensure `Browser.close()` is called after setting session
- Check `appUrlOpen` listener is set up correctly

---

## 📱 iOS Setup (Optional)

If building for iOS:

```xml
<!-- ios/App/App/Info.plist -->
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>clinilocker</string>
        </array>
    </dict>
</array>
```

Add to Supabase Redirect URLs:
```
clinilocker://auth/callback
```

---

## 🎯 Summary

**For Production Mobile App:**

1. ✅ Use custom URL scheme: `clinilocker://auth/callback`
2. ✅ Configure AndroidManifest.xml for deep links
3. ✅ Add mobile redirect URLs to Supabase
4. ✅ Use Capacitor App plugin to handle callbacks
5. ✅ Use Capacitor Browser plugin to open OAuth
6. ✅ Handle app state and session persistence

**Key Difference:**
- **Website**: Uses `https://www.clinilocker.com`
- **Mobile App**: Uses `clinilocker://auth/callback` (custom scheme)

This ensures OAuth works correctly in production mobile apps without redirecting to the website!
