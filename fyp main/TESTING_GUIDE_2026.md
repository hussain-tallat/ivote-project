# iVotePK - Testing Guide (March 2026)

## Quick Start

### Prerequisites

- Node.js v14+ installed
- MongoDB running (local or cloud)
- Gmail account with App Password (for email OTP)

### Setup Steps

1. **Install dependencies**

   ```bash
   # From project root
   cd user/backend && npm install
   cd user && npm install
   cd user && npm install
   ```

2. **Configure Backend**
   - Edit `user/backend/.env`:

   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/ivotepk_db
   SMTP_USER=your_gmail@gmail.com
   SMTP_PASS=your_app_password
   JWT_SECRET=your_secret_key
   ```

3. **Start Services** (in 3 separate terminals)

   ```bash
   # Terminal 1: Backend
   cd user/backend && npm start

   # Terminal 2: Voter Frontend
   cd user && npm start

   # Terminal 3: Admin Frontend
   cd user && npm start
   ```

---

## Test Cases

### 1. Biometric Login Fix ✅ BACKEND COMPLETED

**Status**: Backend improvements deployed
**Files Modified**:

- `user/backend/controllers/authController.js` - Enhanced error logging
- `user/backend/routes/authRoutes.js` - Routes verified

**What Changed**:

- Added detailed logging in credential storage/retrieval
- Improved error messages (no more generic "no data")
- Console logs show exactly what credentials exist

**Test Instructions**:

1. Register voter with fingerprint and face biometrics
2. Login with password
3. Try fingerprint authentication
4. Check browser console and backend logs for detailed messages instead of "no data"
5. **Expected Results**: Clear error messages showing which credentials are missing

---

### 2. Admin Forgot Password ✅ BACKEND COMPLETED

**Status**: Fully implemented
**Endpoints Added**:

- `POST /api/auth/admin/forgot-password`
- `POST /api/auth/admin/reset-password`

**Files Modified**:

- `user/backend/controllers/authController.js` - Two new functions
- `user/backend/routes/authRoutes.js` - Two new routes
- `user/src admin routes/src/pages/AdminLoginForgotPassword.jsx` - Updated to use correct endpoints

**Test Instructions**:

1. Go to Admin Login page
2. Click "Forgot Password?" link
3. Enter admin email
4. Click "Send OTP"
5. **Expected Result**: Email received with 6-digit OTP
6. Enter OTP and new password
7. Click reset
8. **Expected Result**: "Password reset successfully!" message
9. Login with new password and OTP verification

---

### 3. Home Button in Admin Dashboard ✅ COMPLETED

**Status**: Already exists - verified
**Location**: Top-right of AdminDashboard page
**Styling**: Emerald Green (#10b981) button
**Link**: Goes to "/" (homepage)

**Test Instructions**:

1. Login as admin
2. Go to AdminDashboard
3. Look for green "Home" button (top-right)
4. Click it
5. **Expected Result**: Navigates to homepage

---

### 4. Empty State UI / No Dummy Data ✅ COMPLETED

#### AdminDashboard Changes

**Status**: Completed - removed all dummy data
**Files Modified**:

- `user/src admin routes/src/pages/AdminDashboard.jsx` - Complete rewrite
- `user/src admin routes/src/components/EmptyState.jsx` - New component created

**What Changed**:

- Removed hardcoded stats (15,234 voters, 8,540 votes, etc.)
- Now fetches real data from API
- Shows empty state when no elections exist
- Displays action button to create first election

**Test Instructions**:

1. Login as admin with empty database (no elections created)
2. Go to Admin Dashboard
3. **Expected Result**:
   - ✓ See "No Elections Yet" empty state
   - ✓ See explanation message
   - ✓ See "+ Create Your First Election" button
   - ✓ No dummy candidate names (Rana Ali, Maria Khan, etc.)
4. Click "+ Create Your First Election"
5. **Expected Result**: Redirected to AddElection page

---

### 5. Dashboard with Real Data

**Test Instructions**:

1. Create an election with candidates and parties
2. Go back to Admin Dashboard
3. **Expected Result**:
   - ✓ Shows real stats (actual voter count, votes cast, turnout %)
   - ✓ Bar chart shows actually created elections
   - ✓ Pie chart shows actual vote distribution
   - ✓ No dummy data visible

---

### 6. Rate Limiter Status ✅ VERIFIED

**Status**: Already correctly configured

- Window: 15 minutes
- Limit: 1000 requests
- Message: "Too many requests..."

**What This Means**:

- No changes needed
- Already set to a reasonable limit
- Won't cause issues in normal operation

---

## Page Redesigns Status

### ✅ COMPLETED

- [x] AdminDashboard - Empty state + real data
- [x] Admin Forgot Password - Updated endpoints
- [x] Home Button - Verified exists
- [x] Biometric Error Messages - Enhanced logging

### ⚠️ IN PROGRESS / TODO

- [ ] AddParty page - Colorful redesign
- [ ] AddCandidate page - Glassmorphism effect
- [ ] AddElection page - Dark theme + preview
- [ ] ElectionManagement page - Remove error handling, add spinner
- [ ] ReportsExport page - Clean dummy data
- [ ] ManageCandidates page - Add empty state
- [ ] Ensure admin-only data filtering

---

## Common Issues & Solutions

### Issue: "MongoDB connection failed"

**Solution**:

```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas cloud connection in .env:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/ivotepk_db
```

### Issue: "Email/OTP not sending"

**Solution**:

1. Enable 2-Step Verification in Gmail
2. Create App Password: https://myaccount.google.com/apppasswords
3. Update SMTP credentials in .env
4. Restart backend server

### Issue: "Admin won't login"

**Solution**:

1. First admin needs to be registered via `/admin-registration`
2. Verify OTP from email
3. Then can login with email + password (requires OTP)
4. If password forgotten, use the fixed Forgot Password flow

### Issue: "Blank Dashboard / No data showing"

**Solution**:

1. Check browser console for errors (F12 → Console)
2. Check backend logs for API errors
3. Verify token is valid in localStorage
4. Create at least one election first
5. Refresh page (Ctrl+R)

---

## API Testing Commands

### Test Admin Forgot Password (using curl)

```bash
# Step 1: Send OTP
curl -X POST http://localhost:5000/api/auth/admin/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com"}'

# Step 2: Reset Password
curl -X POST http://localhost:5000/api/auth/admin/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","otp":"123456","newPassword":"newpass"}'
```

### Test Biometric Login Flow

```bash
# Step 1: Login with password
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"user@example.com","password":"pass"}'

# Step 2: Get biometric options
curl -X POST http://localhost:5000/api/auth/biometric/auth-options \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"biometric"}'

# Step 3: Verify biometric (check console for detailed error info)
curl -X POST http://localhost:5000/api/auth/biometric/auth-verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"credential":{...},"type":"biometric"}'
```

---

## Verification Checklist

- [ ] Backend starts on port 5000 without errors
- [ ] Voter app starts on port 3000
- [ ] Admin app starts on port 3001
- [ ] Admin can register and verify email with OTP
- [ ] Admin can login with email + OTP
- [ ] Admin Forgot Password flow works end-to-end
- [ ] Admin Dashboard shows empty state when no data
- [ ] Admin Dashboard shows real data when elections exist
- [ ] Home button in dashboard works
- [ ] Biometric login shows improved error messages
- [ ] No dummy candidate names visible (Rana Ali, Maria Khan)
- [ ] Empty states show professional UI
- [ ] All paths and images load correctly

---

## Performance Notes

- Dashboard data fetches on component mount
- Empty state renders instantly
- No unnecessary re-renders
- Smooth transitions and animations

---

## Support

For detailed changes, see: [CHANGES_SUMMARY_2026.md](CHANGES_SUMMARY_2026.md)

For API docs, see: `user/backend/API_DOCUMENTATION.md`

---

**Last Updated**: March 24, 2026
**Testing Status**: Ready for Verification

