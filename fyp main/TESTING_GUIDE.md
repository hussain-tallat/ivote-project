# 🎯 HOW TO TEST YOUR VOTING SYSTEM - STEP BY STEP

## ✅ ALL SERVERS RUNNING:
- Frontend: http://localhost:3000 ✅
- Backend: http://localhost:5000 ✅
- MongoDB: Connected ✅

---

## 📝 COMPLETE REGISTRATION TEST

### **STEP 1: Open Registration Page**
```
Open browser: http://localhost:3000/register
```

### **STEP 2: Fill Registration Form**
Use these test values:
```
CNIC:            1234567890123
Email:           test@example.com
Phone:           03001234567
Password:        Test@123
Confirm Password: Test@123
```

Click **"Register Now"**

### **STEP 3: Get OTP from Backend Console** ⭐ IMPORTANT!

**WHERE TO FIND OTP:**

Look at your **backend terminal window** (where you see "MongoDB Connected").

You will see this output:

```
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║  📧 EMAIL NOT CONFIGURED - OTP DISPLAYED HERE        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
To: test@example.com
Subject: iVotePK - Email Verification OTP

🔑 YOUR OTP CODE: 654321

⚠️  Copy this OTP and paste it in the verification page!
```

**COPY THE 6-DIGIT NUMBER!**

### **STEP 4: Enter OTP**
- You'll be automatically redirected to `/otp-verification`
- Enter the 6 digits from backend console
- Click "Verify"
- ✅ **Token Generated and Saved!**

### **STEP 5: Fingerprint Setup**
- Automatically redirected to `/fingerprint-setup`
- Click **"Scan Fingerprint"**
- Wait 2 seconds
- ✅ **Fingerprint captured and saved!**
- ✅ **Now using your token - NO ERROR!**

### **STEP 6: Face Recognition**
- Automatically redirected to `/face-recognition`
- Camera activates (allow camera permission)
- Your face shows on screen
- Click **"Capture Face"**
- ✅ **Face image captured and saved!**

### **STEP 7: Security Questions**
- Automatically redirected to `/security-questions`
- Select 3 different questions
- Provide answers
- Click "Save"
- ✅ **Registration Complete!**

---

## 🔐 LOGIN TEST (After Registration)

### **STEP 1: Go to Login**
```
http://localhost:3000/login
```

### **STEP 2: Enter Credentials**
```
CNIC: 1234567890123
Password: Test@123
```
Click **"Continue to Biometric Verification"**

### **STEP 3: Fingerprint Verification**
- Click **"Verify Fingerprint"**
- System matches your stored fingerprint
- ✅ **Step 2 of 3 Complete!**

### **STEP 4: Face Verification**
- Camera activates
- Click **"Verify Face"**
- System matches your stored face
- Shows similarity percentage
- ✅ **Step 3 of 3 Complete!**

### **STEP 5: Dashboard Access**
- ✅ **Logged in successfully!**
- Redirected to User Dashboard

---

## 🖥️ BACKEND CONSOLE LOCATION

**Windows Terminal/PowerShell showing:**
```
╔═══════════════════════════════════════════════════════╗
║         iVotePK - Intelligent Voting System          ║
║  Server running on port 5000                         ║
╚═══════════════════════════════════════════════════════╝
MongoDB Connected: ac-ykuxanr-shard-00-02.qlovyqz.mongodb.net
```

**👆 THIS WINDOW will show your OTP when you register!**

---

## ⚠️ COMMON ISSUES & SOLUTIONS

### Issue: "Token failed after 3 seconds"
**✅ FIXED!** Token is now generated AFTER OTP verification

### Issue: "Can't find OTP email"
**✅ FIXED!** OTP displays in backend console

### Issue: Camera not working
- Allow camera permissions in browser
- Use Chrome, Edge, or Firefox
- Check if another app is using camera

### Issue: Backend not showing OTP
- Make sure backend is running
- Check the terminal window
- Scroll up to see recent OTP

---

## 📊 WHAT'S STORED IN DATABASE

After complete registration, your MongoDB has:

```javascript
{
  cnic: "1234567890123",
  email: "test@example.com",
  password: "[HASHED]",
  isVerified: true,
  biometricSetup: {
    fingerprint: {
      isSetup: true,
      fingerprintKey: "[ENCRYPTED]"
    },
    faceRecognition: {
      isSetup: true,
      faceData: "[ENCRYPTED_FEATURES]",
      faceHash: "[SHA256_HASH]"
    }
  },
  securityQuestions: [
    { question: "...", answer: "[HASHED]" },
    { question: "...", answer: "[HASHED]" },
    { question: "...", answer: "[HASHED]" }
  ]
}
```

---

## 🎯 EXPECTED BEHAVIOR

### During Registration:
1. ✅ API call to backend
2. ✅ OTP generated (6 digits)
3. ✅ OTP displayed in console
4. ✅ User enters OTP → Gets token
5. ✅ Token used for fingerprint (NO ERROR!)
6. ✅ Token used for face (NO ERROR!)
7. ✅ Token used for security questions (NO ERROR!)

### During Login:
1. ✅ Password verification
2. ✅ Fingerprint matching
3. ✅ Face comparison with similarity score
4. ✅ Access granted to dashboard

---

## 🚀 START TESTING NOW!

1. Backend Console: Keep visible to see OTP
2. Browser: http://localhost:3000/register
3. Follow steps above
4. Watch OTP appear in console
5. Complete registration
6. Test login with 3-factor auth

**Your system is now 100% functional with proper token flow!** 🎉🇵🇰
