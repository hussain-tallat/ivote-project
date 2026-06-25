# 🔐 iVotePK WebAuthn End-to-End Testing Guide

## 📋 Prerequisites

Before starting tests, ensure:

- **Backend running**: `http://localhost:5000` ✅
- **Frontend running**: `http://localhost:3000` ✅
- **Database**: MongoDB connected with test data
- **Browser**: Windows 10/11 with Windows Hello or macOS with Touch ID / Linux with compatible biometric device
- **Test User**: Have a valid email for creating test account

## 🎯 Test Suite Overview

| Test | Scenario                        | Expected Result                                 | Status |
| ---- | ------------------------------- | ----------------------------------------------- | ------ |
| T1   | Registration with fingerprint   | Fingerprint credential saved                    | ⬜     |
| T2   | Registration with face          | Face credential saved                           | ⬜     |
| T3   | Login with fingerprint only     | Should not allow voting yet                     | ⬜     |
| T4   | Login with fingerprint + face   | Full authentication complete                    | ⬜     |
| T5   | No Passkey error fix            | credentialParser converts Base64 to Uint8Array  | ⬜     |
| T6   | Duplicate email fraud detection | Registration blocked, admin alerted             | ⬜     |
| T7   | Duplicate vote fraud detection  | Vote blocked, admin alerted                     | ⬜     |
| T8   | Both biometric steps required   | Cannot skip fingerprint to face                 | ⬜     |
| T9   | 2-minute window between steps   | Face must complete within 2 mins of fingerprint | ⬜     |
| T10  | Password reset flow             | Can reset password via email                    | ⬜     |

---

## 🧪 DETAILED TEST CASES

### TEST 1: ✅ REGISTRATION - FINGERPRINT SETUP

**Objective**: Register new voter and enroll fingerprint credential

**Steps**:

1. Go to `http://localhost:3000/register`
2. Fill form:
   - **Name**: Test User 1
   - **Email**: testuser1@example.com
   - **CNIC**: 42101-1234567-1
   - **Password**: TestPassword123!
   - **Confirm Password**: TestPassword123!
3. Click "Register"
4. Navigate to verification (check console for OTP or email)
5. Verify email with OTP
6. When prompted for **Fingerprint Setup**:
   - Click "Scan Fingerprint"
   - Place finger on Windows Hello / Touch ID sensor
   - **Expected**: Success message, credential saved in DB

**Browser Console Checks**:

```javascript
// Check if credential ID is properly stored
// Open DevTools → Application → IndexedDB / LocalStorage
// Should see credential data structure
```

**Database Check**:

```bash
# In MongoDB client, verify fingerprint credential stored
db.users.findOne({ email: "testuser1@example.com" })
# Should contain:
# - fingerprintCredential: { id: "...", publicKey: "...", ... }
```

**Acceptance Criteria**:

- ✅ User sees "Fingerprint registered successfully"
- ✅ No JavaScript errors in console
- ✅ Credential stored in database
- ✅ Credential ID is Base64-encoded string

---

### TEST 2: ✅ REGISTRATION - FACE SETUP

**Objective**: Complete registration by enrolling face credential

**Prerequisites**: TEST 1 must pass

**Steps**:

1. From TEST 1 result, system should prompt for Face Setup
2. Click "Scan Face"
3. Position face in front of camera/sensor
4. **Expected**: Success message, face credential saved

**Browser Console Checks**:

```javascript
// Verify face credential different from fingerprint
console.log(fingerprintCredID); // Base64 format
console.log(faceCredID); // Should be different Base64
```

**Database Check**:

```bash
db.users.findOne({ email: "testuser1@example.com" })
# Should contain BOTH:
# - fingerprintCredential
# - faceCredential
```

**Acceptance Criteria**:

- ✅ User sees "Face registered successfully"
- ✅ System shows "Registration Complete"
- ✅ Both credentials in database
- ✅ No credential ID collisions

---

### TEST 3: ✅ SECURITY QUESTIONS STEP

**Objective**: Set up account recovery questions

**Steps**:

1. After Face Setup, system prompts for 3 security questions
2. Select 3 questions and answer them (e.g., "Mother's maiden name": "Ahmed")
3. Click "Set Security Questions"
4. **Expected**: Directed to login page

**Database Check**:

```bash
db.users.findOne({ email: "testuser1@example.com" })
# Should contain:
# - securityQuestionAnswers: [{ questionId, answer }, ...]
# - isVerified: true
```

**Acceptance Criteria**:

- ✅ All 3 questions answered and saved
- ✅ Answers are hashed (not plaintext in DB)
- ✅ User redirected to login

---

### TEST 4: 🔐 LOGIN - FINGERPRINT VERIFICATION

**Objective**: Test first step of two-step biometric login

**Prerequisites**: TEST 1-3 must be complete

**Steps**:

1. Go to `http://localhost:3000/login`
2. Enter credentials:
   - **Email/Username**: testuser1@example.com
   - **Password**: TestPassword123!
3. Click "Login"
4. System asks for **Fingerprint Verification**
   - Click "Scan Fingerprint"
   - Place finger on sensor
5. **Expected**: "Fingerprint verified" message
6. System should NOT show voting page yet

**Key Assertions**:

```javascript
// In browser console, check state
// Should be: biometricStage === 'fingerprint_complete'
// Should NOT be: loggedIn = true or isBiometricallyVerified = true
```

**Backend Logs Check**:

```bash
# In terminal running backend, should see:
# "Fingerprint verification successful for user testuser1@example.com"
# status: 201 POST /api/auth/biometric/verify
```

**No Passkey Fix Test** 🔧:

- If you see error: "NotAllowedError: No credentials available"
- This means **credentialParser** fix is working (correct error message)
- Browser should retry with fallback mode automatically
- If error persists, see "TROUBLESHOOTING" section

**Acceptance Criteria**:

- ✅ Fingerprint scan completes without "No Passkey" error
- ✅ User NOT logged in yet (cannot access voting)
- ✅ System waiting for face verification
- ✅ 2-minute timer starts in UI

---

### TEST 5: ✅ LOGIN - FACE VERIFICATION (COMPLETE AUTH)

**Objective**: Complete two-step biometric authentication

**Prerequisites**: TEST 4 fingerprint successful

**Steps**:

1. After fingerprint verified, system shows message:
   - "✅ Fingerprint verified. Now scan your face to complete login."
2. Click "Scan Face"
3. Position face in front of sensor
4. **Expected**:
   - "Face verified" message
   - Redirected to voting dashboard
   - User fully authenticated

**Backend Logs Check**:

```bash
# Should see in backend terminal:
# "Face verification successful"
# "User testuser1@example.com fully authenticated"
# status: 201 POST /api/auth/biometric/verify
```

**Session State Check**:

```javascript
// In browser DevTools → Application → LocalStorage
// Should see:
localStorage.userToken = "eyJhbGc..." (JWT token)
localStorage.biometricVerified = "true"
localStorage.lastFaceVerification = "2026-03-23T14:30:00Z"
```

**Acceptance Criteria**:

- ✅ Both fingerprint AND face verified
- ✅ JWT token issued and stored
- ✅ Redirected to voting dashboard
- ✅ Can access voting functionality
- ✅ Backend logged both verification events

---

### TEST 6: 🚨 NO PASSKEY ERROR FIX VALIDATION

**Objective**: Verify credentialParser correctly converts Base64 to Uint8Array

**Setup**:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run during login:

**Code to Verify Fix**:

```javascript
// In browser console during login attempt
// This tests the credentialParser fix

// 1. Simulate stored Base64 credential ID (as stored in DB)
const base64CredentialID = "9Z-4rg7ukJwXYVdL0qBPeQ"; // Example from DB

// 2. Import and test credentialParser
import { base64ToUint8Array } from "../utils/credentialParser.js";

// 3. Convert
const uint8Array = base64ToUint8Array(base64CredentialID);
console.log("Converted to Uint8Array:", uint8Array);
console.log("Type check: ", uint8Array instanceof Uint8Array); // Should be: true

// 4. Verify it's usable by WebAuthn
console.log("Array length:", uint8Array.length); // Should be number > 0
console.log("First bytes:", Array.from(uint8Array.slice(0, 4))); // Check values
```

**Expected Output**:

```
Converted to Uint8Array: Uint8Array(32) [ 245, 159, 184, 174, ... ]
Type check: true ✅
Array length: 32
First bytes: [245, 159, 184, 174]
```

**If Error Appears**:

```
"No Passkey Available" → Check if credentialParser returns Uint8Array
"NotAllowedError" → WebAuthn browser error, retry with fallback
"Invalid credential format" → Credential ID format issue, check DB
```

**Real-World Test**:

1. During actual login, if you get "No Passkey Available"
2. Check browser console for specific error
3. If error mentions "credential", it's being caught and fallback triggered
4. System should auto-retry with `allowTransportFallback: true`
5. If still fails, credential format in DB may be corrupted

**Acceptance Criteria**:

- ✅ credentialParser correctly converts Base64 to Uint8Array
- ✅ Converted array is valid for WebAuthn API
- ✅ Login flow retries once on "No Passkey" error
- ✅ Fallback mode triggers if needed

---

### TEST 7: 🚨 FRAUD DETECTION - DUPLICATE EMAIL

**Objective**: Verify system blocks duplicate email registration and alerts admin

**Setup**: TEST 1 (testuser1@example.com) completed

**Steps**:

1. Go to `http://localhost:3000/register`
2. Try to register with SAME email but DIFFERENT CNIC:
   - **Email**: testuser1@example.com (SAME)
   - **CNIC**: 42101-9999999-9 (DIFFERENT)
   - **Password**: TestPassword123!
   - Other fields: any values
3. Click "Register"

**Expected Error**:

```
❌ Error: Account with this email already exists with different CNIC
   This indicates potential fraud. Please contact support.
```

**Backend Logs Check**:

```bash
# Should see in backend terminal:
# "FRAUD DETECTED: Duplicate email with different CNIC"
# Status: 403 Forbidden
```

**Database Verification**:

```bash
# Check FraudLog entry created
db.fraudLogs.findOne({ fraudType: "duplicate_email" })
# Should show:
# {
#   fraudType: "duplicate_email",
#   userEmail: "testuser1@example.com",
#   severity: "high",
#   riskScore: 90,
#   status: "detected",
#   action: "account_blocked"
# }

# Check user account blocked
db.users.findOne({ email: "testuser1@example.com" })
# Should show:
# isActive: false  ← BLOCKED
```

**Email Verification**:

1. Check admin inbox for fraud alert email
2. Email should contain:
   - Red alert banner with "⚠️ DUPLICATE EMAIL REGISTRATION BLOCKED"
   - Both CNICs listed
   - Action taken: ACCOUNT BLOCKED
   - Admin fraud monitor link

**Acceptance Criteria**:

- ✅ Registration blocked with clear error message
- ✅ FraudLog created with severity='high', riskScore=90
- ✅ Original account marked inactive (isActive=false)
- ✅ Admin email alert sent
- ✅ No duplicate account created

---

### TEST 8: 🚨 FRAUD DETECTION - DUPLICATE VOTE

**Objective**: Prevent voter from casting multiple votes same election

**Setup**:

- Have TEST 4 & 5 complete (logged-in voter)
- Have pending election to vote on

**Steps**:

1. Log in with testuser1 (two-step biometric)
2. Go to voting page
3. Select a candidate and click "Cast Vote"
4. **Expected**: Vote recorded, success message
5. Try to vote again in SAME election
6. Click different candidate, "Cast Vote"

**Expected on 2nd Vote**:

```
❌ Error: You have already voted in this election
   Your vote was blocked for security.
```

**Backend Logs Check**:

```bash
# POST /api/vote/
# First vote: 201 Created ✅
# Second vote: 400 Bad Request ❌
# Message: "You have already voted in this election"
```

**Database Verification**:

```bash
# Check FraudLog for duplicate vote
db.fraudLogs.findOne({ fraudType: "multiple_votes" })
# Should show:
# {
#   fraudType: "multiple_votes",
#   userEmail: "testuser1@example.com",
#   userCnic: "42101-1234567-1",
#   electionId: ObjectId(...),
#   severity: "high",
#   riskScore: 100,
#   status: "detected"
# }

# Check only first vote counted
db.votes.find({ userId: "<testuser1_id>" }).count()
# Should be: 1 (not 2)
```

**Email Verification**:

1. Check admin inbox for fraud alert
2. Email should show:
   - "🗳️ DUPLICATE VOTE ATTEMPT BLOCKED"
   - First vote time vs attempted time
   - "VOTE BLOCKED" badge in red

**Acceptance Criteria**:

- ✅ 2nd vote rejected with clear error
- ✅ Only 1 vote recorded in database
- ✅ FraudLog created with riskScore=100
- ✅ Admin alerted via email
- ✅ Fraud attempt logged with timestamp

---

### TEST 9: ⏱️ 2-MINUTE WINDOW TEST

**Objective**: Verify face verification must complete within 2 minutes of fingerprint

**Setup**: Start fresh login

**Steps**:

1. Start login process
2. Complete fingerprint scan ✅
3. System shows message with timer
4. **Wait 2+ minutes** (do NOT click face scan button)
5. After 2 minutes, click "Scan Face"

**Expected Behavior**:

```
❌ Error: Fingerprint verification expired
   Please start login again and scan fingerprint within 2 minutes of face
```

**Code to Check Time Window**:

```javascript
// In backend auth controller, check timestamp logic
// Should see something like:
const fingerprintTime = userData.lastFingerprintVerifiedAt;
const currentTime = Date.now();
const timeDiff = (currentTime - fingerprintTime) / 1000 / 60; // minutes

if (timeDiff > 2) {
  // Reject face verification
  return res.status(401).json({ message: "Fingerprint verification expired" });
}
```

**Acceptance Criteria**:

- ✅ Face verification rejected if >2 mins after fingerprint
- ✅ Clear error message to user
- ✅ Can start fresh login to try again
- ✅ No partial authentication state persists

---

### TEST 10: 🔐 PASSWORD RESET FLOW

**Objective**: Test secure password reset with email template

**Steps**:

1. Go to `http://localhost:3000/login`
2. Click "Forgot Password?"
3. Enter email: testuser1@example.com
4. Click "Send Reset Link"
5. Check email (or console if Gmail not configured)
6. Look for reset link with token
7. Click reset link or copy token
8. Enter new password: NewPassword456!
9. Confirm: NewPassword456!
10. Click "Reset Password"

**Email Verification**:

1. Check inbox for password reset email
2. Should contain:
   - "🔑 Reset Your Password" subject
   - "PASSWORD RESET INITIATED" header
   - Reset link button with token
   - 30-minute expiry notice
   - Professional branding with iVotePK logo

**After Reset**:

1. Try to login with **OLD password** → Should FAIL ❌
2. Try to login with **NEW password** → Should SUCCEED ✅
3. Complete two-step biometric as usual

**Acceptance Criteria**:

- ✅ Reset email sent with professional template
- ✅ Token included in link and email
- ✅ Link is clickable (not just text)
- ✅ Old password no longer works
- ✅ New password works immediately
- ✅ Can login and access voting after reset

---

## 🐛 TROUBLESHOOTING GUIDE

### Issue: "NotAllowedError: No credentials available"

**Diagnosis**:

- Credential not registered for this user
- Credential ID format incorrect
- Browser settings disabled biometric

**Fix**:

1. Verify user registered fingerprint/face in TEST 1 & 2
2. Check database that credentials exist:
   ```bash
   db.users.findOne({ email: "testuser1@example.com" })
   # Should have fingerprintCredential and faceCredential fields
   ```
3. Verify credentials are Base64 strings (not corrupted)
4. Try again with fresh biometric scan during registration

---

### Issue: "AbortError: The operation either timed out or was not allowed"

**Diagnosis**:

- Browser biometric timeout
- User cancelled biometric prompt
- System doesn't have biometric hardware

**Fix**:

1. Close and re-open browser
2. Try biometric again within timeout window
3. Check Windows Hello / Touch ID is enabled in OS
4. For Linux, ensure compatible biometric device is connected

---

### Issue: Logout doesn't clear session

**Diagnosis**:

- Token still in localStorage
- Session cache not cleared

**Fix**:

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
// Then refresh page
location.reload();
```

---

### Issue: credentialParser not found

**Diagnosis**:

- File location incorrect
- Import path wrong

**Fix**:

1. Verify file exists: `user/src/utils/credentialParser.js`
2. Check import in LoginPage.js:
   ```javascript
   import { base64ToUint8Array } from "../utils/credentialParser";
   ```
3. Check path is relative to component location

---

### Issue: Multer file upload fails

**Diagnosis**:

- Multer middleware not loaded
- File size too large (>5MB)
- Wrong file type

**Fix**:

1. Verify `/uploads` directory exists in backend root
2. Check file is image/PDF and <5MB
3. Verify multer route in adminRoutes.js:
   ```javascript
   .post(upload.single('logo'), createParty);
   ```
4. Check Form-Data has `logo` field name in AddParty.jsx

---

## 📊 TEST RESULTS CHECKLIST

Once all tests complete, check off:

- [ ] TEST 1: Fingerprint registration passed
- [ ] TEST 2: Face registration passed
- [ ] TEST 3: Security questions passed
- [ ] TEST 4: Fingerprint login passed (no "No Passkey" error)
- [ ] TEST 5: Face login and full auth passed
- [ ] TEST 6: credentialParser correctly converts Base64
- [ ] TEST 7: Duplicate email fraud detected and blocked
- [ ] TEST 8: Duplicate vote fraud detected and blocked
- [ ] TEST 9: 2-minute biometric window enforced
- [ ] TEST 10: Password reset email sent with template

**Overall Status**:

- ✅ All tests passed → System ready for deployment
- ⚠️ Some tests need debugging → See troubleshooting
- ❌ Critical tests failed → Review implementation

---

## 🚀 NEXT STEPS AFTER TESTING

1. **Create real election and candidates** for voter testing
2. **Set up automated test suite** with Selenium/Cypress
3. **Performance test** with 100+ concurrent voters
4. **Security audit** of all endpoints
5. **Load test** fraud detection system
6. **Begin UAT** with real stakeholders

---

## 📞 SUPPORT CONTACTS

- **Technical Issues**: Check logs in backend terminal
- **Database Issues**: Verify MongoDB connection
- **Email Template Issues**: Check sendEmail.js configuration
- **Frontend Issues**: Check browser console (F12)

**Document Version**: 1.0  
**Last Updated**: 2026-03-23  
**Status**: Ready for Testing ✅
