# Play Store Deployment - Complete Step-by-Step Guide

**Solo Developer:** Iker Vélez  
**App:** Ideas Mobile  
**Timeline:** ~2-3 hours total  
**Status:** Production-ready backend ✅

---

## PHASE 1: BUILD RELEASE APK (30 minutes)

### Step 1.1: Open Android Project

```bash
# Navigate to Android folder
/home/velez/repos/my-turborepo/apps/mobile/android

# Open in Android Studio:
# File → Open → Select 'android' folder directly
# Wait for Gradle sync to complete (5-10 minutes first time)
```

### Step 1.2: Build Web for Android

```bash
# Terminal in workspace root:
cd /home/velez/repos/my-turborepo/apps/mobile

# Build React app for web
npm run build

# This creates: apps/mobile/dist/
# Copy to Android:
npm run sync
# (runs: vite build && cap sync)
```

### Step 1.3: Generate Signed Release APK

**In Android Studio:**

1. **Menu:** Build → Generate Signed Bundle/APK
2. **Select:** APK (not Bundle)
3. **Click:** Next

### Step 1.4: Create Keystore (First Time Only)

**Create New Keystore:**

- **Key store path:** Click "..." → Create new folder:
  ```
  /home/velez/repos/my-turborepo/apps/mobile/android/key.jks
  ```

- **Key store password:** `[CREATE STRONG PASSWORD - SAVE THIS!]`
  - Example: `MyApp@2026!SecureKey123`
  - Save in: `.env` or password manager

- **Key alias:** `release-key`
- **Key password:** [Same as keystore password]
- **Validity (years):** 50
- **First and Last Name (CN):** Your Full Name (Iker Vélez)
- **Organizational Unit:** Development  
- **Organization:** Your Company/Solo
- **City/Locality:** Your City
- **State/Province:** Your Region
- **Country Code:** ES (or your country)

**Click OK** → Creates `key.jks`

### Step 1.5: Sign APK

After keystore creation:

- **Key store:** Auto-selected
- **Key alias:** `release-key`
- **Key password:** [Your password]
- **Destination Folder:** `apps/mobile/android/app/release/`
- **Build Variants:** `release`
- **V1 Signature:** ✅ Check
- **V2 Signature:** ✅ Check

**Click Finish** → Gradle builds release APK (2-5 minutes)

### Step 1.6: Verify APK Created

```bash
# Terminal:
ls -lh /home/velez/repos/my-turborepo/apps/mobile/android/app/release/

# Should show:
# app-release.apk (3-10 MB)
```

---

## PHASE 2: TEST APK ON DEVICE (45 minutes)

### Step 2.1: Install APK on Android Device

**Connect Android phone to laptop via USB:**

```bash
# In Android Studio:
# Device Manager (right side) → Select your connected device

# OR Terminal:
cd /home/velez/repos/my-turborepo/apps/mobile/android/app/release
adb install app-release.apk

# Wait for installation...
# ✅ "Success" message
```

### Step 2.2: Test on Device - Critical Tests

**Open app on phone:**

#### TEST 1: App Starts  
- [ ] App opens without crashing
- [ ] Shows login screen
- [ ] No red error overlay

#### TEST 2: Login Flow
- [ ] Email field accepts input
- [ ] Password field masks text
- [ ] "Sign in" button clickable
- Try invalid credentials:
  - [ ] Shows error message (not crash)
  - [ ] Message is clear

#### TEST 3: Create Account
- [ ] Click "Create Account" button works
- [ ] SignupScreen loads
- [ ] Form fields work
- [ ] Password validation shows: "Mínimo 8 caracteres"
- [ ] Confirm password field exists
- [ ] "Sync existing ideas?" toggle visible

#### TEST 4: Actual Signup
- [ ] Sign up with real email (use test email)
- [ ] Wait for response (15-30 seconds)
- [ ] User is created in production Supabase ✅
  - Verify in Supabase Dashboard → Auth → Users

#### TEST 5: After Login
- [ ] App shows AppContent (main screen)
- [ ] Shows "Logged as: [your.email@domain.com]"
- [ ] "Logout" button visible
- [ ] Can create ideas (click "Create" button)
- [ ] Ideas appear in list

#### TEST 6: Logout
- [ ] Click "Logout"
- [ ] Returns to login screen
- [ ] Can login again

#### TEST 7: Offline Functionality
- [ ] Turn on airplane mode
- [ ] Try to create idea
- [ ] Should work (offline mode)
- [ ] Turn off airplane mode
- [ ] Should sync to production

**If ALL tests ✅ → Proceed. If ANY fail → Fix before Play Store**

### Step 2.3: Debug Issues

**App Won't Start:**
```bash
# View logs:
adb logcat | grep "myapp"

# Look for errors:
adb logcat -e "error | E/"
```

**Connection to Production Fails:**
1. Verify credentials in `.env.local` are correct
2. Check network: `ping qoipckppzzecwdocnqje.supabase.co`
3. Verify Supabase project is running (check dashboard)
4. Check RLS policies aren't blocking (shouldn't at auth level)

**Signup Fails:**
1. Email already exists → use new email
2. Password too weak → use 8+ chars with mix
3. Network timeout → try again

---

## PHASE 3: GOOGLE PLAY ACCOUNT SETUP (15 minutes)

### Step 3.1: Create Google Play Developer Account

**Cost:** $25 one-time fee

1. Go to: https://play.google.com/console
2. **Sign in/Create Google Account** (if needed)
3. **Accept Terms**
4. **Pay $25** (credit card required)
5. **Wait:** Account activation (usually instant)

### Step 3.2: Create Project in Play Console

1. **Google Play Console Dashboard**
2. **Click:** "Create App"
3. **App name:** `Ideas` or `MyApp Ideas`
4. **Default language:** English
5. **App or game:** App
6. **Category:** Productivity (or Lifestyle)
7. **Free or paid:** Free
8. **Click:** Create app

---

## PHASE 4: CONFIGURE APP IN PLAY CONSOLE (30 minutes)

### Step 4.1: App Details

**Left menu → All apps → Your app → Dashboard**

#### Dashboard > App Details > About Your App

Fill in ALL required (*):

```
App name (required):
  Ideas

Short description (required) [80 chars]:
  "Capture, organize, and sync your ideas offline-first"

Full description (required) [4000 chars]:
  "Ideas is an offline-first productivity app for capturing 
   and organizing your thoughts. Create ideas, organize them, 
   and they'll sync automatically when you're online.
   
   Features:
   • Capture ideas instantly
   • Organize with connections
   • Works completely offline
   • Automatic sync to cloud
   • No ads, no tracking
   
   Perfect for writers, developers, students, and anyone 
   who wants to capture ideas on the go."

Developer contact info (required):
  - Name: Iker Vélez
  - Email: [your@email.com]
  - Phone: [your phone]
  - Website: [optional - leave blank if none]

Privacy policy (required):
  - URL: [Must have one - create simple privacy policy or use generator]
  - https://privacypolicygenerator.info or https://www.privacy-policies.com
  - Upload to your website or GitHub pages

Email address (required):
  [your@email.com]

Type of app:
  - Select: "App"
```

**Save**

### Step 4.2: Add Screenshots & Graphics

**Left menu → Store listing → Screenshots & graphics**

Upload (minimum required):

**Phone Screenshots (minimum 2, up to 8):**
- [ ] Screenshot 1: Login screen
  - Can use Android Studio emulator screenshot
  - File: `screenshot1.png` (1080×1920 px minimum)
- [ ] Screenshot 2: Main app screen with ideas
  - File: `screenshot2.png`

**Simple way:** Use Android Studio emulator:
```bash
# In Android Studio Emulator:
# Run app → navigate through UI
# Camera icon (right side) → Take screenshot
# Saves to Downloads
```

**Icon (512x512 px):**
- Design a simple app icon
- Or use simple placeholder (any app icon)
- Format: PNG

**Feature Graphic (1024x500 px):**
- Optional but recommended
- Can be simple (app name + tagline on colored background)

### Step 4.3: Content Rating

**Left menu → Store listing → Content rating**

1. **Click:** "Set up questionnaire"
2. **Answer questions** (takes 5 minutes):
   - Violence? No
   - Sexual content? No
   - Profanity? No
   - Ads? No (checked)
   - Personal data? Yes (email for auth)
   - Financial info? No
   - Other topics? (Answer honestly)
3. **Save ratings**

### Step 4.4: Target Audience

**Left menu → Store listing → Target audience**

Select:
- [ ] Minimum age: 13 years old
- [ ] Primary audience: Adults (25+)
- [ ] Intended audience: Productivity/Notes apps

---

## PHASE 5: UPLOAD APK & RELEASE (15 minutes)

### Step 5.1: Create Release

**Left menu → Release → Production**

1. **Click:** "Create new release"
2. **Under "APKs to add":**
   - **Click:** "Upload APK"
   - **Select file:** `/home/velez/repos/my-turborepo/apps/mobile/android/app/release/app-release.apk`
   - **Verify:** File selected ✅

3. **Release name:** `1.0` (First release)
4. **Release notes (en-US):**
   ```
   Initial release of Ideas app
   - Offline-first sync
   - Ideas creation and organization
   - Cloud backup
   ```

5. **Click:** "Add release"

### Step 5.2: Review & Submit

**Before submitting, verify:**

```
Checklist:
[ ] App icon uploaded
[ ] 2+ screenshots uploaded
[ ] Content rating completed
[ ] Privacy policy set
[ ] Contact info complete
[ ] APK uploaded without errors
[ ] All required fields filled (green checkmarks)
```

1. **Click:** "Review release"
2. **Verify all green checkmarks**
3. **Click:** "Submit release for review"

---

## PHASE 6: MONITOR REVIEW PROCESS (1-3 days)

### Step 6.1: Track Status

**In Play Console:**
- Release section shows status
- Possible statuses:
  - 🟡 Setup in progress (immediate)
  - 🟡 Sending for review (< 1 hour)
  - 🟡 In review (1-3 days, usually 24 hours)
  - 🟢 Approved (app goes live!)
  - 🔴 Rejected (need to fix)

### Step 6.2: Common Rejection Reasons & Fixes

**If Rejected:**

| Reason | Fix |
|--------|-----|
| Privacy policy missing/invalid | Add clear privacy policy URL |
| Bugs/Crashes | Test more thoroughly, rebuild |
| Broken sign-in | Verify production Supabase works |
| Malware detected | False positive, resubmit with explanation |
| Content misleading | Update description to match actual app |

**Resubmit:**
- Fix issue
- Click "Edit release"
- Upload new APK (increment version in build.gradle)
- Resubmit

---

## PHASE 7: AFTER APPROVAL (Launch!)

### Step 7.1: App Goes Live

- 🎉 App appears on Google Play
- URL: `https://play.google.com/store/apps/details?id=com.myapp.mobile`
- Shareable link ready

### Step 7.2: Monitor Crashes

**Left menu → Vitals → Crashes**
- Monitor for user crashes
- Fix issues quickly
- Version 1.0.1 update if needed

### Step 7.3: Gather Reviews

- Users can review/rate your app
- Respond to feedback
- Plan updates

---

## QUICK REFERENCE CHECKLIST

### Before Build
- [ ] `.env.local` has production credentials ✅
- [ ] Backend deployed to Supabase ✅
- [ ] RLS policies active ✅
- [ ] Tested in Android Studio emulator

### Build Phase
- [ ] Run: `npm run build` in mobile/
- [ ] Run: `npm run sync` to sync to Android
- [ ] Build → Generate Signed Bundle/APK
- [ ] Create keystore (save password!)
- [ ] Sign APK with release-key
- [ ] APK generated at: `app/release/app-release.apk`

### Test Phase
- [ ] Install APK on real device
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Test offline functionality
- [ ] Test after coming online
- [ ] Verify data in Supabase dashboard

### Play Store Setup
- [ ] Create Google Play Account ($25)
- [ ] Create project in Play Console
- [ ] Fill app details (name, description, contact)
- [ ] Upload screenshots
- [ ] Set content rating
- [ ] Add privacy policy

### Submit
- [ ] Upload APK
- [ ] Write release notes
- [ ] Submit for review
- [ ] Wait 1-3 days
- [ ] If rejected, fix & resubmit
- [ ] If approved, app is LIVE! 🎉

---

## TROUBLESHOOTING

### APK Installation Fails
```bash
# Check device:
adb devices

# Uninstall old version:
adb uninstall com.myapp.mobile

# Install new:
adb install app-release.apk
```

### App Crashes on Startup
1. Check logcat: `adb logcat`
2. Look for: Missing env vars, network errors
3. Verify: `.env.local` has correct credentials
4. Rebuild: `npm run build && npm run sync`

### Play Store Upload Fails
- [ ] APK signing correct
- [ ] Min API level compatible (check in build.gradle)
- [ ] App package name matches: `com.myapp.mobile`
- [ ] Version code incremented

### Supabase Connection Fails
1. Check network on device (open browser to Google)
2. Check credentials in `.env.local`
3. Verify Supabase project is running
4. Check RLS isn't blocking (shouldn't for auth)

---

## ESTIMATED TIMELINE

| Phase | Duration | Total |
|-------|----------|-------|
| Build APK | 30 min | 30 min |
| Test on Device | 45 min | 1h 15min |
| Play Store Setup | 45 min | 2h |
| Submit & Review | 1-3 days | **2h + 1-3 days** |

**Your work time:** ~2 hours  
**Wait for review:** 1-3 days  
**TOTAL LAUNCH:** ~2-4 days

---

## FINAL CHECKLIST BEFORE YOU START

```
✅ Backend Production Deployment:
  ✅ Supabase project created
  ✅ Schema deployed (5 tables)
  ✅ RLS policies active
  ✅ Performance indices deployed

✅ Android App:
  ✅ Production credentials in .env.local
  ✅ App builds locally
  ✅ Tested in Android Studio
  ✅ AuthProvider working
  ✅ Login/Signup screens complete

✅ You Have:
  ✅ Android device to test
  ✅ Google account for Play Store
  ✅ $25 for Play Store registration
  ✅ 2-3 hours for this process

READY? → START WITH PHASE 1!
```
