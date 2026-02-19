# 🔧 Supabase URLs Setup - DO THIS FIRST!

## ⚠️ IMPORTANT: Add These URLs to Supabase Before Testing

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

### Add These Redirect URLs:

```
# For browser testing (development) - ADD THESE NOW
http://localhost:5173/**
http://localhost:8080/**
http://127.0.0.1:5173/**

# For production mobile app - ADD THESE NOW (ready for when you build)
clinilocker://auth/callback
com.clinilocker.app://auth/callback
https://clinilocker.app/auth/callback

# For website (if not already there) - ADD IF MISSING
https://www.clinilocker.com/**
https://www.clinilocker.com/auth/callback
```

**Why add production URLs now?**
- Won't hurt anything - Supabase supports multiple URLs
- When you build the mobile app later, OAuth will already work
- Better to set up everything now than forget later

### Site URL:
Keep as: `https://www.clinilocker.com` (for website)

---

## 📝 Step-by-Step:

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in left sidebar
   - Click **URL Configuration**

3. **Add Redirect URLs**
   - Scroll to **Redirect URLs** section
   - Click **Add URL**
   - Add each URL from the list above
   - Click **Save** after adding all

4. **Verify Site URL**
   - Check **Site URL** is set to: `https://www.clinilocker.com`
   - If not, update it

5. **Save Changes**
   - Click **Save** at the bottom

---

## ✅ After Setup:

Once you've added these URLs:
- ✅ Browser testing will work (`localhost`)
- ✅ Mobile app OAuth will work (`clinilocker://`)
- ✅ Website OAuth will work (`www.clinilocker.com`)

**Then proceed with:** `npm install` and `npm run dev` in the mobile app folder.
