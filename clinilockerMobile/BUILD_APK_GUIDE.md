# 📦 Building APK for CliniLocker Mobile App

## Prerequisites

1. **Node.js** (v18+)
2. **Java JDK** (17 or 21)
3. **Android Studio** (latest version)
4. **Android SDK** (API 24+)

---

## Step 1: Install Dependencies

```bash
cd CliniLockerMobile
npm install
```

---

## Step 2: Build Web App

```bash
npm run build
```

This creates the `dist` folder with optimized production files.

---

## Step 3: Sync Capacitor

```bash
npm run cap:sync
```

This syncs the web app to the native Android project.

---

## Step 4: Open Android Studio

```bash
npm run cap:open:android
```

Or manually:
```bash
cd android
studio .
```

---

## Step 5: Configure Android Build

### 5.1 Update `android/app/build.gradle`

```gradle
android {
    namespace "com.clinilocker.app"
    compileSdk 34

    defaultConfig {
        applicationId "com.clinilocker.app"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }

    buildTypes {
        release {
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            signingConfig signingConfigs.release
        }
    }
}

signingConfigs {
    release {
        storeFile file('../clinilocker-release.keystore')
        storePassword 'YOUR_STORE_PASSWORD'
        keyAlias 'clinilocker'
        keyPassword 'YOUR_KEY_PASSWORD'
    }
}
```

### 5.2 Create Release Keystore

```bash
cd android/app
keytool -genkey -v -keystore clinilocker-release.keystore -alias clinilocker -keyalg RSA -keysize 2048 -validity 10000
```

**Important**: Save the passwords securely! You'll need them for updates.

---

## Step 6: Build APK

### Option A: Build in Android Studio

1. Open Android Studio
2. **Build** → **Generate Signed Bundle / APK**
3. Select **APK**
4. Choose your keystore
5. Select **release** build variant
6. Click **Finish**

APK will be at: `android/app/release/app-release.apk`

### Option B: Build via Command Line

```bash
cd android
./gradlew assembleRelease
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 7: Build AAB (for Play Store)

```bash
cd android
./gradlew bundleRelease
```

AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

---

## Step 8: Test APK

1. Transfer APK to Android device
2. Enable "Install from Unknown Sources" in settings
3. Install APK
4. Test all features

---

## Step 9: Host APK on Website

### 9.1 Create Download Page

Create `/download` or `/app` page on your website with:

```html
<div class="download-section">
  <h1>Download CliniLocker Mobile App</h1>
  <p>Version 1.0.0</p>
  <a href="/downloads/clinilocker-v1.0.0.apk" download>
    <button>Download APK</button>
  </a>
  <div class="qr-code">
    <!-- QR code for easy mobile download -->
  </div>
  <div class="instructions">
    <h2>Installation Instructions</h2>
    <ol>
      <li>Download the APK file</li>
      <li>Open the downloaded file</li>
      <li>Allow installation from unknown sources if prompted</li>
      <li>Install and open the app</li>
    </ol>
  </div>
</div>
```

### 9.2 Upload APK

Upload APK to your website's static files or CDN:
- Path: `/downloads/clinilocker-v1.0.0.apk`
- Ensure HTTPS is enabled
- Add SHA-256 checksum for verification

---

## Troubleshooting

### Issue: "SDK location not found"
**Fix**: Set `ANDROID_HOME` environment variable:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS/Linux
set ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk  # Windows
```

### Issue: Build fails
**Fix**: 
1. Clean build: `./gradlew clean`
2. Sync Capacitor: `npm run cap:sync`
3. Invalidate caches in Android Studio

### Issue: APK too large
**Fix**:
1. Enable ProGuard/R8
2. Remove unused dependencies
3. Optimize images
4. Enable code splitting

### Issue: OAuth redirect not working
**Fix**: Check `capacitor.config.ts`:
```typescript
server: {
  androidScheme: 'https'
}
```

---

## Version Management

Update version before each release:

1. **package.json**: `"version": "1.0.1"`
2. **android/app/build.gradle**: 
   - `versionCode 2` (increment by 1)
   - `versionName "1.0.1"`
3. **capacitor.config.ts**: `version: "1.0.1"`

---

## Security Checklist

- [ ] APK signed with release keystore
- [ ] Keystore passwords stored securely
- [ ] ProGuard/R8 enabled
- [ ] No debug logs in release build
- [ ] API keys not exposed
- [ ] HTTPS enforced

---

## Next Steps After APK Build

1. ✅ Test APK thoroughly
2. ✅ Host on website
3. ✅ Create download page
4. ✅ Monitor downloads
5. ✅ Collect feedback
6. ✅ Prepare for Play Store (later)

---

**Last Updated**: 2025-02-09
