# Production Mobile App OAuth - Quick Reference

## 🎯 The Key Difference

| Environment | Redirect URL |
|------------|--------------|
| **Website** | `https://www.clinilocker.com/auth/callback` |
| **Mobile App (Browser Testing)** | `http://localhost:5173/auth/callback` |
| **Mobile App (Production)** | `clinilocker://auth/callback` |

---

## ✅ Production Setup Checklist

### 1. Supabase Configuration (5 minutes)

**Go to:** Supabase Dashboard → Authentication → URL Configuration

**Add Redirect URLs:**
```
clinilocker://auth/callback
com.clinilocker.app://auth/callback
https://clinilocker.app/auth/callback
```

**Site URL:** `https://www.clinilocker.com` (keep for website)

### 2. Code Changes (3 files)

#### File 1: `capacitor.config.ts`
```typescript
{
  appId: 'com.clinilocker.app',
  server: { androidScheme: 'https' }
}
```

#### File 2: `src/lib/supabase.ts`
```typescript
const getRedirectUrl = () => {
  if (Capacitor.isNativePlatform()) {
    return 'clinilocker://auth/callback';  // Mobile
  }
  return `${window.location.origin}/auth/callback`;  // Browser
};

export const supabase = createClient(url, key, {
  auth: { redirectTo: getRedirectUrl() }
});
```

#### File 3: `src/pages/PatientLogin.tsx`
```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: Capacitor.isNativePlatform() 
      ? 'clinilocker://auth/callback'
      : `${window.location.origin}/auth/callback`,
    skipBrowserRedirect: Capacitor.isNativePlatform()
  }
});

// If mobile, open browser and listen for callback
if (Capacitor.isNativePlatform() && data?.url) {
  await Browser.open({ url: data.url });
  App.addListener('appUrlOpen', handleCallback);
}
```

### 3. Android Configuration

**File:** `android/app/src/main/AndroidManifest.xml`

Add intent filter:
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="clinilocker" android:host="auth" />
</intent-filter>
```

### 4. Install Plugins

```bash
npm install @capacitor/app @capacitor/browser
npx cap sync
```

---

## 🧪 Testing

### Browser Testing (Development)
- Use: `http://localhost:5173/**` in Supabase
- OAuth redirects back to localhost ✅

### Production Mobile App
- Use: `clinilocker://auth/callback` in Supabase
- OAuth opens browser → redirects to app ✅

---

## 🔄 Complete Flow

### Production Mobile App OAuth Flow:

1. **User clicks "Sign in with Google"**
2. **App calls** `supabase.auth.signInWithOAuth()`
3. **Browser opens** with Google login page
4. **User logs in** with Google
5. **Google redirects** to `clinilocker://auth/callback?access_token=...`
6. **Android intercepts** deep link
7. **App opens** and handles callback
8. **Session set** in Supabase
9. **User redirected** to dashboard ✅

---

## 📝 Environment Variables

**Same for all environments:**
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**No changes needed** - redirect URL is determined by code, not env vars.

---

## 🚨 Troubleshooting

| Problem | Solution |
|---------|----------|
| Redirects to website | Add `clinilocker://auth/callback` to Supabase Redirect URLs |
| App doesn't open | Check AndroidManifest.xml intent filter |
| Session not saved | Ensure `persistSession: true` in Supabase config |
| Browser doesn't close | Call `Browser.close()` after setting session |

---

## ✅ Final Checklist

- [ ] Supabase has mobile redirect URLs
- [ ] Code uses `Capacitor.isNativePlatform()` check
- [ ] AndroidManifest.xml has intent filter
- [ ] Capacitor plugins installed
- [ ] Tested on real device

**That's it!** Your mobile app OAuth will work in production. 🎉
