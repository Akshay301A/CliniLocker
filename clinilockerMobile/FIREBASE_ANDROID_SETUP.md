# Firebase push – simple setup (do in order)

You already downloaded **google-services.json** from Firebase. Do these 4 steps.

---

## Step 1: Put the file in the right place

1. Open your project folder: **CliniLockerMobile**
2. Go into **android** → **app**
3. Put **google-services.json** inside the **app** folder  
   So the path is: **CliniLockerMobile/android/app/google-services.json**

(If you don’t see an **android** folder, run in terminal: `cd CliniLockerMobile` then `npx cap add android`, then put the file in **android/app**.)

---

## Step 2: Edit the first file (root build.gradle)

1. Open **CliniLockerMobile/android/build.gradle** in a text editor (or Android Studio).
2. Find the part that looks like this (it has the word **dependencies** and **classpath**):

   ```
   dependencies {
       classpath("com.android.tools.build:gradle:...
   ```

3. **Add one new line** inside that **dependencies** block (before the closing `}`):

   ```
   classpath("com.google.gms:google-services:4.4.4")
   ```

4. Save the file.

---

## Step 3: Edit the second file (app build.gradle)

1. Open **CliniLockerMobile/android/app/build.gradle**
2. Do **two** things:

   **A)** Near the top you’ll see something like:
   ```
   apply plugin: 'com.android.application'
   ```
   Add this line **right under it**:
   ```
   apply plugin: 'com.google.gms.google-services'
   ```

   **B)** Find the **dependencies { }** block (further down). Inside it, add these two lines (you can put them at the end, before the closing `}`):
   ```
   implementation platform('com.google.firebase:firebase-bom:33.7.0')
   implementation 'com.google.firebase:firebase-messaging'
   ```

3. Save the file.

---

## Step 4: Sync and run

- If you use **Android Studio**: menu **File** → **Sync Project with Gradle Files** (or click the elephant icon with an arrow).
- Then run the app on your phone (Run button or **Run** → **Run 'app'**).

---

## Done

When you open the app on your phone and sign in as a patient, the app will register for push. You can check in Supabase: **Table Editor** → **push_tokens** – you should see a new row.

---

**If something goes wrong:**  
- “Default FirebaseApp is not initialized” → check that **google-services.json** is really in **android/app/** and that you did Step 2 and Step 3.  
- Build errors → make sure you didn’t delete any existing lines; you only **add** the new ones.
