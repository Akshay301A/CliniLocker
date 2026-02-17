# Privacy & Security – How it works (user POV)

This is the **patient’s view** of each option in Settings → Privacy & Security, and what is implemented today.

---

## 1. Two-Factor Authentication (2FA)

**What the user sees:**  
A toggle: “Two-Factor Authentication (2FA) – When ON: we use OTP (code on your phone) for login when possible, so only you can access your account.”

**User POV:**
- **ON:** “I want the extra security of a code on my phone (or signing in with Google) when I log in. Prefer that over password-only.”
- **OFF:** “I’m okay with password or other sign-in; I don’t need to insist on OTP.”

**What happens today:**
- The choice is **saved** in your profile (`two_factor_enabled`).
- Your app **already** supports phone OTP and Google login. So in practice, many users are already using a “second factor” (OTP or Google).
- **To fully “work” from user POV:**  
  - If you later add **email+password** login, you could treat this flag as: when ON, require OTP or Google and don’t allow password-only.  
  - For now, saving the preference is enough; the main login options are already OTP/Google.

---

## 2. Report Sharing

**What the user sees:**  
“Report Sharing – When ON: labs you’re linked with can add and share reports to your account. When OFF: they cannot link new reports to you.”

**User POV:**
- **ON:** “Labs I’m linked with can upload/link reports to my CliniLocker. I’ll see those reports in My Reports.”
- **OFF:** “Don’t let any lab add or link new reports to my account. I only want reports I upload myself (or that were already linked).”

**What happens today:**
- The choice is **saved** in your profile (`report_sharing_allowed`).
- **To fully “work”:**  
  When a **lab** tries to link/upload a report for a patient (e.g. by phone), the backend should:
  - Load that patient’s profile and check `report_sharing_allowed`.
  - If **OFF**, **block** the link/upload and return a clear error (e.g. “This patient has disabled report sharing”).
  - If **ON**, allow the link/upload as you do today.

So the **user’s expectation** (“labs can’t add reports when I turn this off”) is met only after you add this check in the lab report-upload/link flow.

---

## 3. Profile Visibility to Labs

**What the user sees:**  
“Profile Visibility to Labs – When ON: linked labs can see your name and phone. When OFF: they see only what’s needed to deliver your reports.”

**User POV:**
- **ON:** “Labs I’m linked with can see my name and phone number (e.g. to identify me and contact me).”
- **OFF:** “Don’t show my name and phone to labs; only give them the minimum needed to deliver my reports (e.g. report ID or a masked identifier).”

**What happens today:**
- The choice is **saved** in your profile (`profile_visible_to_labs`).
- **To fully “work”:**  
  Any **lab-facing** API or UI that shows patient info (e.g. “Patient name”, “Phone”) should:
  - Load the patient’s `profile_visible_to_labs`.
  - If **OFF**, **hide** or mask name and phone (e.g. show “Patient” and last 4 digits, or “Hidden”).
  - If **ON**, show name and phone as you do today.

So the **user’s expectation** (“labs can’t see my details when I turn this off”) is met only after you add this filtering wherever labs see patient data.

---

## Summary for you (developer)

| Option              | Saved in DB | User expectation                    | What still needs to be done                    |
|---------------------|------------|--------------------------------------|-----------------------------------------------|
| 2FA                 | Yes        | Prefer OTP/Google over password-only | Optional: enforce when you add email login    |
| Report Sharing      | Yes        | Labs can’t link reports when OFF     | Check `report_sharing_allowed` in lab upload   |
| Profile Visibility  | Yes        | Labs can’t see name/phone when OFF   | Filter profile in lab APIs/UI by this flag    |

The in-app descriptions in Settings now match this user POV; you can wire the backend checks when you’re ready.
