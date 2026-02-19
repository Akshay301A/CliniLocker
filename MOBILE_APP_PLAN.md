# CliniLocker Mobile App - Complete Build Plan

## 🎯 Goal
Build a native-feeling mobile app using Capacitor that mirrors all website functionality with mobile-optimized UX.

---

## 📋 Phase 1: Project Setup & Architecture

### 1.1 Create Fresh Mobile Project
```bash
# Create new folder
mkdir CliniLockerMobile
cd CliniLockerMobile

# Initialize Vite + React + TypeScript
npm create vite@latest . -- --template react-ts

# Install core dependencies
npm install
```

### 1.2 Install Essential Dependencies
```bash
# Backend & Auth
npm install @supabase/supabase-js

# Routing
npm install react-router-dom

# UI Framework (Tailwind + Shadcn)
npm install -D tailwindcss postcss autoprefixer
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react

# Forms & Validation
npm install react-hook-form @hookform/resolvers zod

# Notifications
npm install sonner

# PDF Viewer
npm install pdfjs-dist

# Capacitor (Mobile Native)
npm install @capacitor/core @capacitor/cli
npm install @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar
npm install @capacitor/android  # For Android
npm install @capacitor/ios        # For iOS (optional)

# Date handling
npm install date-fns

# State Management (optional but recommended)
npm install @tanstack/react-query
```

### 1.3 Project Structure
```
CliniLockerMobile/
├── src/
│   ├── components/
│   │   ├── ui/              # Shadcn components (mobile-optimized)
│   │   ├── layout/          # Mobile layouts (no desktop navbar)
│   │   ├── forms/           # Mobile-optimized forms
│   │   └── common/          # Shared components
│   ├── pages/
│   │   ├── auth/            # Login, Signup, PatientLogin
│   │   ├── patient/         # Patient screens
│   │   ├── lab/             # Lab screens
│   │   └── onboarding/      # Onboarding flow
│   ├── contexts/            # AuthContext, LanguageContext
│   ├── lib/
│   │   ├── api.ts           # API calls (same as website)
│   │   ├── supabase.ts      # Supabase client
│   │   └── utils.ts
│   ├── hooks/               # Custom hooks
│   ├── types/               # TypeScript types
│   └── App.tsx
├── public/
├── capacitor.config.ts      # Capacitor config
├── package.json
└── vite.config.ts
```

---

## 📋 Phase 2: Core Setup

### 2.1 Configure Capacitor
```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.clinilocker.app',
  appName: 'CliniLocker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,  // Set later for production
      keystoreAlias: undefined
    }
  }
};

export default config;
```

### 2.2 Initialize Capacitor
```bash
npx cap init
npx cap add android
```

### 2.3 Setup Supabase (Same as Website)
- Copy `.env.example` from website
- Use same Supabase project
- Same API keys and URLs

### 2.4 Configure Vite for Mobile
```typescript
// vite.config.ts - Mobile optimizations
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  },
  build: {
    // Optimize for mobile
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    }
  }
});
```

---

## 📋 Phase 3: Mobile-First UI Components

### 3.1 Mobile Layout System
- **Bottom Navigation** (instead of top navbar)
- **Stack Navigation** for screens
- **Pull-to-refresh** on lists
- **Swipe gestures** where appropriate

### 3.2 Key Mobile Components to Build

#### Bottom Navigation Component
```typescript
// components/layout/BottomNav.tsx
- Home icon → Dashboard
- Reports icon → My Reports
- Family icon → Family Members
- Settings icon → Settings
```

#### Mobile Header Component
```typescript
// components/layout/MobileHeader.tsx
- Back button (when needed)
- Title
- Action buttons (right side)
```

#### Mobile Card Component
```typescript
// components/ui/MobileCard.tsx
- Larger touch targets (min 44x44px)
- Rounded corners
- Shadow for depth
- Tap feedback (haptic)
```

---

## 📋 Phase 4: Authentication Flow

### 4.1 Onboarding Screens (First Launch)
1. **Splash Screen** (2-3 seconds)
   - Logo animation
   - App name

2. **Onboarding Carousel** (3-4 slides)
   - Slide 1: "Secure Health Records"
   - Slide 2: "Share with Family"
   - Slide 3: "Lab Integration"
   - Slide 4: "Get Started" button

### 4.2 Authentication Screens
- **Patient Login** (Phone/Email + Password or Google)
- **Lab Login** (Email + Password)
- **Signup** (Lab registration)
- **OTP Verification** (for phone login)

### 4.3 Deep Linking
- Handle OAuth callbacks properly
- Store redirect URLs in secure storage
- Handle app state restoration

---

## 📋 Phase 5: Patient Features

### 5.1 Dashboard
- **Health Summary Card**
  - Recent reports count
  - Family members count
  - Quick stats

- **Quick Actions**
  - View Reports
  - Add Family Member
  - Upload Report

- **Recent Activity**
  - Last 3 reports
  - Recent family additions

### 5.2 My Reports
- **List View** (mobile-optimized)
  - Large cards
  - Swipe actions (share, delete)
  - Pull-to-refresh
  - Infinite scroll

- **Report Viewer**
  - Full-screen PDF viewer
  - Zoom & pan
  - Share button
  - Download option

### 5.3 Family Members
- **List of Family Members**
  - Cards with avatars
  - Relationship badges
  - Tap to view shared reports

- **Add Family Member**
  - Form with mobile keyboard
  - Invite via SMS/WhatsApp
  - QR code invite (optional)

- **Invites Section**
  - Received invites
  - Sent invites
  - Accept/Reject actions

### 5.4 Settings
- **Account Settings**
  - Profile edit
  - Password change
  - Language selection

- **Notifications**
  - Toggle switches (mobile-friendly)
  - Notification preferences

- **Privacy & Security**
  - 2FA toggle
  - Report sharing toggle
  - Profile visibility toggle

- **Linked Labs**
  - List of labs (real data)
  - Lab details
  - Report count per lab

---

## 📋 Phase 6: Lab Features

### 6.1 Lab Dashboard
- **Stats Cards**
  - Total reports
  - Reports this month
  - Total patients

- **Quick Actions**
  - Upload Report
  - Add Patient
  - View Reports

### 6.2 Upload Report
- **Camera Integration** (Capacitor Camera plugin)
  - Take photo of report
  - Or select from gallery
  - PDF conversion

- **Form**
  - Patient phone/name
  - Test name
  - Test date
  - Notes

### 6.3 Patients List
- **Search & Filter**
  - Search by name/phone
  - Filter by date

- **Patient Cards**
  - Name (masked if privacy enabled)
  - Report count
  - Last report date
  - Tap to view reports

### 6.4 Reports Management
- **List View**
  - All reports
  - Filter by status
  - Search

- **Report Details**
  - View PDF
  - Edit details
  - Delete option

---

## 📋 Phase 7: Mobile-Specific Features

### 7.1 Native Features (Capacitor Plugins)

#### Camera & File Access
```bash
npm install @capacitor/camera @capacitor/filesystem
```
- Take photos of reports
- Access device storage
- Share files

#### Push Notifications
```bash
npm install @capacitor/push-notifications
```
- Report ready notifications
- Family invite notifications
- Health tips

#### Biometric Auth
```bash
npm install @capacitor/biometric
```
- Face ID / Fingerprint login
- Secure app access

#### App State Management
```bash
npm install @capacitor/app
```
- Handle app backgrounding
- Deep linking
- App state restoration

### 7.2 Offline Support
- Cache reports locally
- Queue uploads when offline
- Sync when online

### 7.3 Performance Optimizations
- Lazy load routes
- Image optimization
- Code splitting
- Bundle size optimization

---

## 📋 Phase 8: Testing & Build

### 8.1 Development Testing
```bash
# Run in browser (for quick testing)
npm run dev

# Sync with Capacitor
npm run build
npx cap sync

# Open in Android Studio
npx cap open android
```

### 8.2 Build for Production

#### Android (AAB for Play Store)
```bash
# Build web assets
npm run build

# Sync with Capacitor
npx cap sync android

# In Android Studio:
# 1. Build → Generate Signed Bundle / APK
# 2. Select Android App Bundle (.aab)
# 3. Create keystore (first time)
# 4. Build release bundle
```

#### iOS (IPA for App Store) - Optional
```bash
npx cap add ios
npx cap sync ios
npx cap open ios
# Build in Xcode
```

### 8.3 Environment Variables
```bash
# .env (same as website)
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 📋 Phase 9: Implementation Order

### Week 1: Foundation
1. ✅ Project setup
2. ✅ Capacitor configuration
3. ✅ Supabase integration
4. ✅ Basic routing
5. ✅ Auth context

### Week 2: Authentication
1. ✅ Onboarding screens
2. ✅ Login/Signup screens
3. ✅ OAuth handling
4. ✅ Protected routes

### Week 3: Patient Features (Core)
1. ✅ Dashboard
2. ✅ My Reports list
3. ✅ Report viewer
4. ✅ Settings

### Week 4: Patient Features (Advanced)
1. ✅ Family Members
2. ✅ Invites system
3. ✅ Family Reports
4. ✅ Linked Labs

### Week 5: Lab Features
1. ✅ Lab Dashboard
2. ✅ Upload Report
3. ✅ Patients List
4. ✅ Reports Management

### Week 6: Polish & Testing
1. ✅ Mobile UX improvements
2. ✅ Native features integration
3. ✅ Performance optimization
4. ✅ Testing on devices
5. ✅ Build for production

---

## 🎨 Design Principles

### Mobile-First Approach
- **Touch Targets**: Minimum 44x44px
- **Spacing**: Generous padding (16px+)
- **Typography**: Larger font sizes (16px+ base)
- **Colors**: High contrast for readability
- **Gestures**: Swipe, pull-to-refresh, long-press

### Navigation Patterns
- **Bottom Navigation**: Primary navigation
- **Stack Navigation**: For detail screens
- **Modal**: For forms and actions
- **Drawer**: For settings (optional)

### Performance
- **Lazy Loading**: Load screens on demand
- **Image Optimization**: Compress images
- **Code Splitting**: Reduce initial bundle
- **Caching**: Cache API responses

---

## 🚀 Quick Start Commands

```bash
# 1. Create project
npm create vite@latest CliniLockerMobile -- --template react-ts
cd CliniLockerMobile
npm install

# 2. Install dependencies (see Phase 1.2)

# 3. Setup Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npx cap add android

# 4. Copy website code structure
# - Copy src/lib/api.ts
# - Copy src/lib/supabase.ts
# - Copy src/contexts/AuthContext.tsx
# - Adapt components for mobile

# 5. Build & Test
npm run build
npx cap sync
npx cap open android
```

---

## 📝 Key Differences from Website

1. **Navigation**: Bottom nav instead of top navbar
2. **Layout**: Full-screen layouts, no sidebars
3. **Forms**: Mobile-optimized inputs, larger touch targets
4. **Lists**: Pull-to-refresh, infinite scroll
5. **PDF Viewer**: Native mobile viewer with zoom
6. **Camera**: Native camera for report uploads
7. **Notifications**: Push notifications instead of just in-app
8. **Offline**: Cache data for offline access

---

## ✅ Success Criteria

- [ ] App installs and runs on Android device
- [ ] All authentication flows work
- [ ] Patient can view reports
- [ ] Patient can manage family members
- [ ] Lab can upload reports
- [ ] Push notifications work
- [ ] App builds as AAB for Play Store
- [ ] Performance is smooth (60fps)
- [ ] No crashes or critical bugs

---

## 🎯 Next Steps

1. **Decide**: Start fresh or fix existing mobile app?
2. **If fresh**: Follow this plan step by step
3. **If fix**: Identify specific issues and address them
4. **Timeline**: 6 weeks for complete build (with focus)

Would you like me to start implementing this plan, or do you want to review and adjust it first?
