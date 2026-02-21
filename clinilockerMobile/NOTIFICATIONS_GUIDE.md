# 🔔 Push Notifications for Medication Reminders - Complete Guide

## 📱 How It Works

### Overview
When a user uploads a prescription, the app:
1. **Analyzes** the prescription with AI
2. **Extracts** medications and their times (e.g., "08:00", "20:00")
3. **Creates** reminders in the database
4. **Schedules** local notifications on the device
5. **Sends** notifications at the specified times daily

### Technology Stack
- **Capacitor Local Notifications Plugin**: Native notifications for Android/iOS
- **Local Scheduling**: Notifications are scheduled on the device (no server needed)
- **Daily Recurrence**: Notifications repeat every day automatically

---

## 🚀 Setup Instructions

### Step 1: Install Plugin

```powershell
cd CliniLockerMobile
npm install @capacitor/local-notifications
```

### Step 2: Deploy Edge Function for AI Messages

1. Go to Supabase Dashboard → Edge Functions
2. Create new function: `generate-notification-message`
3. Copy code from `supabase/functions/generate-notification-message/index.ts`
4. Deploy the function
5. Set secret: `OPENAI_API_KEY` (same key used for other functions)
6. See `supabase/functions/generate-notification-message/DEPLOY.md` for detailed instructions

### Step 3: Sync Capacitor

```powershell
npm run cap:sync
```

This adds the native plugin to your Android/iOS projects.

### Step 4: Android Permissions (Automatic)

Capacitor automatically adds notification permissions to `AndroidManifest.xml` when you sync.

### Step 5: Test Notifications

1. Build and run the app on a device (not browser - notifications only work on native)
2. Upload a prescription
3. Check if notifications are scheduled
4. Wait for the scheduled time to see the notification

---

## 🔧 How Notifications Are Scheduled

### When Prescription is Uploaded

```typescript
// In insertPrescription() function:
1. Prescription is saved to database
2. Reminders are created
3. For each reminder with times:
   - scheduleMedicationReminder() is called
   - Creates a notification for each time (e.g., 08:00, 20:00)
   - Sets to repeat daily
```

### Example Flow

**Prescription has:**
- Paracetamol: 2 times daily at ["08:00", "20:00"]
- Amoxicillin: 3 times daily at ["08:00", "14:00", "20:00"]

**Notifications Created:**
- 5 total notifications (2 + 3)
- Each repeats daily
- Shows: "💊 Medication Reminder - Time to take [Medication] ([Dosage])"

---

## 📋 Notification Features

### ✅ What's Implemented

1. **Automatic Scheduling**
   - When prescription is uploaded → notifications scheduled
   - When reminder is edited → old notifications cancelled, new ones scheduled
   - When reminder is deleted → notifications cancelled
   - When reminder is deactivated → notifications cancelled

2. **Daily Recurrence**
   - Notifications repeat every day automatically
   - No need to reschedule

3. **Permission Handling**
   - Requests permission on first use
   - Checks permission before scheduling

4. **AI-Generated Fun Messages** 🎉
   - Uses OpenAI to generate friendly, engaging notification messages
   - Similar to Zomato's flirty/meme-style notifications
   - Messages are fun, friendly, and encouraging
   - Examples: "Hey friend! 💊 Time for your Paracetamol - let's keep you healthy!"
   - Falls back to default message if AI generation fails

5. **Notification Tap Handler**
   - When user taps notification → opens reminders page

### ⚠️ Limitations

1. **Browser Testing**: Notifications **don't work** in browser - only on native Android/iOS
2. **Duration**: Currently schedules indefinitely (until manually cancelled)
3. **Time Zones**: Uses device's local time zone
4. **Battery Optimization**: Android may delay notifications if battery saver is on

---

## 🎯 User Experience Flow

### 1. Upload Prescription
- User uploads prescription PDF
- AI extracts medications
- Reminders created automatically
- Notifications scheduled automatically

### 2. Daily Notifications
- User receives notification at scheduled times
- Example: "💊 Medication Reminder - Time to take Paracetamol (500mg)"
- User taps notification → Opens reminders page

### 3. Edit Reminder
- User edits medication times
- Old notifications cancelled
- New notifications scheduled with new times

### 4. Delete Reminder
- User deletes reminder
- All related notifications cancelled

---

## 🔍 Testing Notifications

### On Android Device

1. **Build APK** and install on device
2. **Grant permissions** when app asks
3. **Upload prescription** with times
4. **Check scheduled notifications**:
   ```javascript
   // In browser console (if testing via web):
   // This won't work in browser, but shows the concept
   ```
5. **Wait for scheduled time** or **set time to 1 minute from now** for testing

### Testing Tips

1. **Set test times close to current time** (e.g., 1-2 minutes from now)
2. **Check notification tray** after scheduled time
3. **Tap notification** to verify it opens the app
4. **Edit reminder** to verify notifications update
5. **Delete reminder** to verify notifications are cancelled

---

## 📱 Android Configuration

### Automatic Setup
Capacitor automatically adds to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Notification Channel (Android 8+)
The plugin automatically creates a default notification channel. You can customize it later if needed.

---

## 🐛 Troubleshooting

### Issue: Notifications not showing
**Solutions:**
1. Check if running on **native device** (not browser)
2. Verify **permissions granted** in device settings
3. Check **battery optimization** - disable for your app
4. Verify **notification channel** is enabled in Android settings

### Issue: Notifications delayed
**Solutions:**
1. Disable battery optimization for the app
2. Check Do Not Disturb mode
3. Ensure device is not in power saver mode

### Issue: Notifications not repeating
**Solutions:**
1. Verify `repeats: true` and `every: "day"` are set
2. Check notification ID is stable (shouldn't change)

### Issue: Wrong time zone
**Solutions:**
1. Notifications use device's local time
2. Ensure device time zone is correct
3. Times are stored as strings (HH:MM format)

---

## 📊 Notification Data Structure

Each notification includes:
```typescript
{
  id: number,              // Unique notification ID
  title: "💊 Medication Reminder",
  body: "AI-generated fun message",  // e.g., "Hey friend! 💊 Time for your Paracetamol - let's keep you healthy!"
  schedule: {
    at: Date,              // First occurrence
    repeats: true,         // Repeat daily
    every: "day"           // Frequency
  },
  extra: {
    reminderId: string,    // Database reminder ID
    medicationName: string,
    dosage: string,
    time: string          // e.g., "08:00"
  }
}
```

### AI Message Generation

- Messages are generated using OpenAI when scheduling notifications
- Each time slot gets a unique, fun message
- Messages are context-aware (morning/afternoon/evening/night)
- Falls back to default message if AI generation fails
- Messages are friendly, engaging, and similar to Zomato's style

---

## 🔄 Lifecycle Management

### App Startup
- Notification handlers are registered
- Tapping notification opens reminders page

### Reminder Created
- Notifications scheduled immediately
- Stored on device (survives app restart)

### Reminder Updated
- Old notifications cancelled
- New notifications scheduled

### Reminder Deleted
- All related notifications cancelled

### App Uninstall
- All notifications automatically removed

---

## 📝 Code Files

- **`src/lib/notifications.ts`** - Notification service functions (includes AI message generation)
- **`src/lib/api.ts`** - Integrated notification scheduling in `insertPrescription()` + `generateNotificationMessage()`
- **`src/pages/patient/Reminders.tsx`** - Notification management in edit/delete
- **`src/App.tsx`** - Notification tap handler setup
- **`supabase/functions/generate-notification-message/index.ts`** - Edge Function for AI message generation

---

## ✅ Next Steps

1. **Install plugin**: `npm install @capacitor/local-notifications`
2. **Deploy Edge Function**: Follow `supabase/functions/generate-notification-message/DEPLOY.md`
3. **Sync Capacitor**: `npm run cap:sync`
4. **Build APK**: Test on real device
5. **Test notifications**: Upload prescription and verify fun AI-generated notification messages

---

**Status**: ✅ Code ready with AI-generated fun messages, needs plugin installation and Edge Function deployment
**Last Updated**: 2025-02-09
