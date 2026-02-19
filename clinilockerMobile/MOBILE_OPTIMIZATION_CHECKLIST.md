# 📱 Mobile App Optimization Checklist

## ✅ Completed

- [x] **Onboarding Page** - Carousel with swipeable slides
- [x] **Bottom Navigation** - Blue pill-shaped nav bar (5 icons)
- [x] **Mobile Header** - Logo left, Profile right, clean design
- [x] **PatientLayout** - Mobile-optimized with bottom nav

---

## 🔧 Patient Screens - To Optimize

### 1. **Dashboard** (`/patient/dashboard`)
**Current Issues:**
- Large cards might be too big for mobile
- Stats cards grid (2 columns) might be cramped
- Welcome card text might be too large
- Health tips section might need better mobile layout

**To Do:**
- [ ] Make cards more compact for mobile
- [ ] Adjust grid to single column on mobile
- [ ] Reduce padding/spacing on mobile
- [ ] Optimize welcome message size
- [ ] Make health tips more mobile-friendly

### 2. **My Reports** (`/patient/reports`)
**Current Issues:**
- Search bar might need mobile optimization
- Sort/filter dropdowns might be hard to use on mobile
- Report cards might need swipe actions
- List might need pull-to-refresh

**To Do:**
- [ ] Make search bar full-width on mobile
- [ ] Optimize sort/filter UI for touch
- [ ] Add swipe actions (swipe left to share/delete)
- [ ] Add pull-to-refresh functionality
- [ ] Make report cards larger touch targets
- [ ] Optimize tabs for mobile

### 3. **Family Members** (`/patient/family`)
**Current Issues:**
- Form might be too wide
- Invite link sharing might need mobile optimization
- Cards layout might need adjustment
- "Invites received/sent" sections might need better mobile layout

**To Do:**
- [ ] Make form full-width on mobile
- [ ] Add native share API for invite links
- [ ] Optimize invite cards for mobile
- [ ] Make sections collapsible or tabs
- [ ] Improve button sizes for touch

### 4. **Upload Reports** (`/patient/upload`)
**Current Issues:**
- File upload might need camera integration
- Form fields might need mobile keyboard optimization
- File picker might need native file access

**To Do:**
- [ ] Add Capacitor Camera plugin for photo capture
- [ ] Add Capacitor Filesystem for file access
- [ ] Optimize form for mobile keyboards
- [ ] Add drag-and-drop for mobile
- [ ] Better file preview on mobile

### 5. **Settings** (`/patient/settings`)
**Current Issues:**
- Long form sections might need better organization
- Switch toggles might need larger touch targets
- Linked labs section might need mobile optimization
- Password form might need mobile keyboard handling

**To Do:**
- [ ] Make sections collapsible/accordion style
- [ ] Increase toggle switch sizes
- [ ] Optimize linked labs cards for mobile
- [ ] Better form layout for mobile
- [ ] Add haptic feedback on toggles

### 6. **My Profile** (`/patient/profile`)
**Current Issues:**
- Avatar upload might need camera integration
- Form sections might be too long
- Edit mode might need better mobile UX

**To Do:**
- [ ] Add camera for avatar capture
- [ ] Make sections collapsible
- [ ] Optimize edit mode for mobile
- [ ] Better form field spacing
- [ ] Add image picker for avatar

### 7. **Report Viewer** (`/patient/report/:id`)
**Current Issues:**
- PDF viewer might need mobile optimization
- Zoom/pan controls might need touch gestures
- Share/download buttons might need mobile optimization
- Full-screen mode might be needed

**To Do:**
- [ ] Optimize PDF viewer for mobile
- [ ] Add pinch-to-zoom gestures
- [ ] Add native share API
- [ ] Full-screen PDF viewing
- [ ] Better mobile controls

### 8. **Family Reports** (`/patient/family-reports`)
**Current Issues:**
- Similar to My Reports - needs same optimizations
- Might need filter by family member

**To Do:**
- [ ] Same as My Reports optimizations
- [ ] Add family member filter
- [ ] Better mobile layout

---

## 🔧 Lab Screens - To Optimize

### 9. **Lab Dashboard** (`/lab/dashboard`)
**Current Issues:**
- Stats cards grid might be cramped on mobile
- Recent activity list might need mobile optimization
- Cards might be too small for mobile

**To Do:**
- [ ] Single column layout on mobile
- [ ] Larger stat cards for mobile
- [ ] Better recent activity list
- [ ] Optimize spacing/padding

### 10. **Lab Upload** (`/lab/upload`)
**Current Issues:**
- File upload needs camera integration
- Form might need mobile optimization
- Patient search might need mobile optimization

**To Do:**
- [ ] Add Capacitor Camera plugin
- [ ] Add Capacitor Filesystem
- [ ] Optimize form for mobile
- [ ] Better patient search UI
- [ ] Mobile-friendly date picker

### 11. **Lab Patients** (`/lab/patients`)
**Current Issues:**
- Patient list might need mobile optimization
- Search/filter might need mobile UI
- Patient cards might need better mobile layout

**To Do:**
- [ ] Optimize patient list for mobile
- [ ] Better search UI
- [ ] Larger touch targets
- [ ] Swipe actions if needed

### 12. **Lab Reports** (`/lab/reports`)
**Current Issues:**
- Similar to patient reports - needs same optimizations
- Filter/search might need mobile optimization

**To Do:**
- [ ] Same as patient reports optimizations
- [ ] Mobile-friendly filters
- [ ] Better list layout

### 13. **Lab Settings** (`/lab/settings`)
**Current Issues:**
- Form might need mobile optimization
- Similar to patient settings

**To Do:**
- [ ] Optimize form for mobile
- [ ] Better input field sizes
- [ ] Mobile keyboard handling

---

## 🔧 Auth Screens - To Optimize

### 14. **Patient Login** (`/patient-login`)
**Current Issues:**
- Already has mobile OAuth handling ✅
- Form might need mobile optimization
- Logo might be too large

**To Do:**
- [ ] Optimize logo size for mobile
- [ ] Better form spacing
- [ ] Mobile keyboard optimization
- [ ] Remove PublicLayout wrapper (full-screen)

### 15. **Lab Login** (`/login`)
**Current Issues:**
- Similar to Patient Login
- Might need mobile optimization

**To Do:**
- [ ] Same as Patient Login
- [ ] Remove PublicLayout wrapper
- [ ] Mobile-optimized form

### 16. **Lab Signup** (`/signup`)
**Current Issues:**
- Form might be too long for mobile
- Might need better mobile layout

**To Do:**
- [ ] Optimize form layout
- [ ] Better mobile spacing
- [ ] Remove PublicLayout wrapper

---

## 🎨 General Mobile Optimizations Needed

### Layout & Spacing
- [ ] Remove `PublicLayout` wrapper from auth screens (full-screen mobile)
- [ ] Reduce padding on mobile (`p-4` instead of `p-6`)
- [ ] Optimize card spacing for mobile
- [ ] Better touch target sizes (min 44x44px)
- [ ] Remove desktop-only elements on mobile

### Typography
- [ ] Reduce font sizes on mobile where needed
- [ ] Better line heights for mobile
- [ ] Optimize heading sizes

### Forms
- [ ] Full-width inputs on mobile
- [ ] Better mobile keyboard handling
- [ ] Larger touch targets for buttons
- [ ] Better date pickers for mobile
- [ ] Native file pickers

### Lists & Cards
- [ ] Larger cards for mobile
- [ ] Better spacing between items
- [ ] Swipe gestures where appropriate
- [ ] Pull-to-refresh on lists

### Native Features
- [ ] Camera integration for uploads
- [ ] File system access
- [ ] Native share API
- [ ] Haptic feedback
- [ ] Push notifications (later)

---

## 📋 Priority Order

### High Priority (Core UX)
1. ✅ Bottom Navigation - DONE
2. ✅ Mobile Header - DONE
3. ✅ Onboarding - DONE
4. **Dashboard** - Optimize cards and layout
5. **My Reports** - Add pull-to-refresh, optimize cards
6. **Auth Screens** - Remove PublicLayout, optimize forms
7. **Settings** - Optimize toggles and sections
8. **Profile** - Add camera, optimize forms

### Medium Priority (Enhanced UX)
9. **Family Members** - Native share, better layout
10. **Upload Reports** - Camera integration
11. **Report Viewer** - Mobile PDF optimization
12. **Lab Screens** - Similar optimizations

### Low Priority (Polish)
13. **Pull-to-refresh** on all lists
14. **Swipe actions** on cards
15. **Haptic feedback** on interactions
16. **Animations** and transitions

---

## 🚀 Next Steps

1. **Start with Dashboard** - Most visible screen
2. **Then Auth Screens** - First impression
3. **Then Reports** - Most used feature
4. **Then Settings/Profile** - Important but less frequent
5. **Finally Lab Screens** - If needed

**Ready to start optimizing!** 🎯
