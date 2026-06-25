# Testing & Deployment Steps

## 🎯 Quick Start (5 Minutes)

### **Step 1: Start Both Servers**

**Terminal 1 - Backend:**

```bash
cd c:\Users\HS TRADER\Downloads\fyp main\user\backend
npm start
```

**Terminal 2 - Frontend:**

```bash
cd c:\Users\HS TRADER\Downloads\fyp main\user
npm start
```

**Expected Output:**

- Backend: `Server running on port 5000`
- Frontend: `Compiled successfully!` or loads on `localhost:3000`

---

### **Step 2: Test with New Account**

1. **Open browser:** `http://localhost:3000`
2. **Click "Register"**
3. **Create account:**
   - CNIC: `1234567890123` (13 digits, unique)
   - Email: `test@example.com` (unique)
   - Phone: `03001234567`
   - Password: `Test@123`
   - Name: `Test User`

4. **Verify email:** Check console or use OTP code shown

5. **Complete registration:**
   - ✅ Fingerprint setup (Windows Hello)
   - ✅ Face setup (Windows Hello)
   - ✅ Security questions

6. **Logout**

---

### **Step 3: Test Login Biometric**

1. **Go to login page**
2. **Enter credentials:**
   - CNIC/Email: `test@example.com`
   - Password: `Test@123`
3. **Click "Continue"**
4. **Choose "Use Fingerprint"**
5. **Complete Windows Hello when prompted**

**Expected Result:**

- ✅ No error
- ✅ "Fingerprint verified" message
- ✅ Redirects to dashboard

---

### **Step 4: Check Logs**

**In Backend Terminal, look for:**

```
[Auth Verify] Incoming credential ID: A1B2C3D4E5F6...
[Auth Verify] Stored credential IDs: [ 'A1B2C3D4E5F6...' ]
```

**In Browser Console (F12), look for:**

```
[LoginPage Fingerprint] { success: true, message: 'Biometric authentication successful.', status: 200 }
```

---

## 🐛 Troubleshooting During Test

### **If you see "Credential not recognized":**

**Backend logs show:**

```
[Auth Verify] NO MATCH - Incoming: A1B2C3D4E5F6...
[Auth Verify] Stored: X9Y8Z7...
```

**This means:** Device mismatch or credentials not stored

**Solution:**

1. Clear browser cache (Ctrl+Shift+Delete)
2. Close browser completely
3. Re-register biometrics from account settings
4. Try login again

---

### **If you see "Account is blocked":**

**This means:** Your account was marked as fraud

**Solution:**

1. Create new account with different CNIC/email
2. OR contact admin to unblock
3. Check Fraud Detection page for your account status

---

### **If backend crashes:**

**Error: `Cannot find module`**

```bash
cd user/backend
npm install
npm start
```

**Error: `Port 5000 already in use`**

```bash
# Find and kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or use different port:
export PORT=5001
npm start
```

---

## ✅ Success Checklist

- [ ] Both servers running without errors
- [ ] Can register new account
- [ ] Can complete fingerprint registration
- [ ] Can complete face registration
- [ ] Can login with password
- [ ] Biometric selection screen appears
- [ ] Fingerprint scan completes
- [ ] NO "No Data" error
- [ ] "Fingerprint verified" message shows
- [ ] Redirects to dashboard
- [ ] Can see user profile in dashboard

---

## 📊 Test Scenarios

### **Scenario 1: Successful Biometric Login**

```
✅ PASS: Register → Password Login → Fingerprint → Dashboard
```

### **Scenario 2: Face Login After Fingerprint**

```
✅ PASS: Logout → Password Login → Face ID → Dashboard
```

### **Scenario 3: Cross-Device Test**

```
EXPECTED FAIL: Register on Device A → Try on Device B
ERROR: "Credential not recognized"
✅ PASS: Re-register on Device B → Works
```

### **Scenario 4: Blocked Account**

```
SETUP: Admin blocks account on Fraud Detection page
EXPECTED: Login fails with "Account is blocked"
✅ PASS: Shows clear blocking message
```

---

## 📝 Bug Report Template (If Issues Found)

Use this if you find a bug:

```
Title: [Biometric] Description of issue

Steps to Reproduce:
1. ...
2. ...
3. ...

Expected Result:
... (what should happen)

Actual Result:
... (what actually happens)

Screenshots:
- Browser console error
- Backend console logs
- Error message on screen

Environment:
- OS: Windows/Mac/Linux (version)
- Browser: Chrome/Edge/Firefox (version)
- Device: Laptop/Desktop/Phone
- CNIC: [if not sensitive]
```

---

## 🚀 Production Deployment

**When ready to deploy:**

```bash
# Build production frontend
cd c:\Users\HS TRADER\Downloads\fyp main\user
npm run build

# Backend is already production-ready
# Just ensure:
# - MongoDB connection string is correct
# - All environment variables are set
# - CORS is configured correctly
```

**Check:**

- ✅ Frontend builds without errors
- ✅ All API endpoints respond
- ✅ Biometric auth works
- ✅ Error messages are clear

---

## 📋 Deployment Checklist

- [ ] Code reviewed
- [ ] Tests passed
- [ ] Frontend builds successfully
- [ ] Backend logs are clear
- [ ] No sensitive data in logs
- [ ] Error messages are user-friendly
- [ ] Documentation updated
- [ ] Admin aware of any changes
- [ ] Database backed up
- [ ] Rollback plan ready

---

## 🔍 Monitoring After Deployment

**Watch for:**

1. Biometric auth errors in logs
2. Credential mismatches
3. Account lockouts
4. Performance issues

**Commands:**

```bash
# Monitor backend logs (Windows PowerShell)
Get-Content "path/to/logs" -Tail 50 -Wait

# Check MongoDB credentials
mongo mongodb://connection_string
db.users.count()
db.fraudlogs.count()
```

---

## 💬 User Feedback to Collect

After deployment:

- Is biometric login working reliably?
- Are error messages clear?
- Any device-specific issues?
- How long does scan take?
- Does re-registration work?

---

## ✨ Summary

This deployment fixes:

1. ✅ Credential matching using correct database fields
2. ✅ Enhanced error logging for debugging
3. ✅ Better error messages for users
4. ✅ Support for multiple credential storage locations

Ready to deploy! 🚀
