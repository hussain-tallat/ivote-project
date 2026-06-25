# Quick Testing Reference - iVotePK Fraud Detection

## 🚀 Quick Start (5 Minutes)

### Step 1: Start All Services

```powershell
# Terminal 1 - Backend
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user\backend"
npm start

# Terminal 2 - AI Service
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user\backend\ai_fraud_detection"
py -3 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py -3 app.py

# Terminal 3 - Frontend
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user"
npm start
```

### Step 2: Test Registration

1. Go to http://localhost:3000
2. Click "Register"
3. Fill details and submit
4. **Check email for OTP** (Gmail inbox)
5. Enter OTP
6. Register fingerprint (Windows Hello or simulation)
7. Register face (5 angles of your face)
8. Set security questions
9. **Success ✓**

### Step 3: Test Login

1. Go to http://localhost:3000/login
2. Enter email + password
3. Verify with biometric (fingerprint OR face)
4. **Success ✓ - Redirected to Dashboard**

---

## 🛡️ Fraud Detection Test Scenarios

### Scenario 1: Duplicate Email (Fraud Detected ✓)

```
Attempt 1: Email: test@gmail.com, CNIC: 11111-1111111-1 ✓ SUCCESS
Attempt 2: Email: test@gmail.com, CNIC: 99999-9999999-9 ✗ BLOCKED
Message: "Suspicious activity detected"
Fraud Log: Risk Score 90/100
Admin Email: Fraud alert received
```

### Scenario 2: Bulk Registrations from Same Device (Fraud Detected ✓)

```
AI Detection:
- 5+ registrations from same device
- Within 5 minutes
↓
Action: All blocked
Risk Score: 95/100
Admin: Alert generated
```

### Scenario 3: Geographic Impossibility (Fraud Detected ✓)

```
Vote 1: Karachi  (2:00 PM)
Vote 2: Islamabad (2:05 PM) - 400km away
↓
System: "Impossible travel speed detected"
Action: Block vote
Risk Score: 99/100
Investigation: Auto-flagged
```

### Scenario 4: Face Mismatch (Fraud Detected ✓)

```
Registered Face: User A
Login Attempt: User B looking at camera
↓
Similarity Score: 0.65 (need 0.96)
System: "Face does not match"
Action: Require OTP re-verification
Account: Temporarily suspicious
```

---

## 📊 Real-Time Monitoring Dashboard

### Check Current Status:

```bash
# Backend running?
curl http://localhost:5000
# Expected: iVotePK API response

# AI Service running?
curl http://localhost:5001/health
# Expected: {"status": "healthy"}

# Frontend running?
Open http://localhost:3000
# Expected: iVotePK homepage loads
```

### Monitor Fraud Logs (MongoDB):

```javascript
// In MongoDB compass or terminal
use ivotepk
db.fraudlogs.find().sort({ detectedAt: -1 }).limit(10)

// Should show detected frauds with:
{
  userId: "xxx",
  fraudType: "duplicate_registration",
  riskScore: 90,
  severity: "high",
  detectedAt: ISODate(...),
  actionTaken: "registration_blocked"
}
```

---

## 🔍 Detailed Test Cases (30 Minutes)

### TEST 1: Complete Registration Flow

```
Time: 2-3 minutes
Steps:
1. Register → Fill form
2. Check email → Copy OTP
3. Verify OTP → Mark complete
4. Register fingerprint → Windows Hello
5. Register face → 5 angles
6. Save security questions
Expected: All steps complete, Dashboard accessible
Evidence: Check MongoDB → User doc with all flags set
```

### TEST 2: Spoofing Detection

```
Time: 5 minutes
Steps:
1. Register user "Ahmed" with your face
2. Have friend attempt login with Ahmed's password
3. During face verification, friend looks at camera
Expected: Face mismatch error, suspicious log created
Evidence: Check FraudLog for entry with riskScore > 80
```

### TEST 3: Device Compromise Detection

```
Time: 10 minutes
Steps:
1. Register on Computer A with account X
2. Immediately try login from Computer B with account X
3. System should detect new device
Expected: Extra verification required
Evidence: Check loginAttempts history in user doc
```

### TEST 4: Rate Limiting

```
Time: 3 minutes
Steps:
1. Attempt login 5 times with wrong password
2. On 4th attempt, get rate limited
3. Wait 15 minutes or manually reset user in DB
Expected: "Too many attempts" message after 3 tries
Evidence: Check middleware logs in backend console
```

### TEST 5: AI Fraud Scoring

```
Time: 5 minutes
Via cURL:
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test123",
    "action": "vote",
    "voteCount": 5,
    "ipChanges": 3,
    "timeToVote": 120
  }'

Expected: Response with riskScore (0-100)
Evidence: High scores for suspicious patterns
```

---

## 🎯 Success Indicators

### Registration Should Complete:

- ✓ Email OTP received within 30 seconds
- ✓ Fingerprint registered in < 5 seconds
- ✓ Face registered after 5 angle captures (~30 seconds)
- ✓ All 3 security questions set
- **Total time: < 3 minutes**

### Login Should Work:

- ✓ Email + password accepted
- ✓ OTP verified
- ✓ Biometric (fingerprint OR face) verified
- ✓ Dashboard loads
- **Total time: 20-40 seconds**

### Fraud Detection Should Work:

- ✓ Duplicate emails blocked immediately
- ✓ Risk scores assigned within 200ms
- ✓ Admin alerts sent for high-risk actions
- ✓ Suspicious activities logged in database
- **No false positives for legitimate users**

---

## 🐛 Quick Troubleshooting

| Problem                        | Solution                                                |
| ------------------------------ | ------------------------------------------------------- |
| OTP not received               | Check .env EMAIL_USER/PASS correct, check spam folder   |
| Face registration fails        | Ensure good lighting, centered face, camera permissions |
| Fingerprint won't authenticate | Windows Hello active? Device supports WebAuthn?         |
| "Port already in use" error    | Kill previous node process: `taskkill /F /IM node.exe`  |
| AI service won't start         | Python 3.11+, venv activated, requirements installed    |
| Fraud alerts not showing       | Check MongoDB connected, FraudLog collection exists     |

---

## 📱 Key Endpoints for Testing

### Authentication

```
POST /api/auth/register         - Start registration
POST /api/auth/verify-otp       - Verify email OTP
POST /api/auth/login            - Password login
POST /api/auth/biometric/register-options - Get fingerprint challenge
```

### Biometric

```
POST /api/auth/face/verify      - Verify face during login
GET /api/auth/biometric/status  - Check biometric setup status
```

### Admin/Monitoring

```
GET /api/admin/fraud-logs       - View all fraud detections
GET /api/admin/users?risk=high  - List high-risk users
POST /api/admin/block-user      - Block suspicious account
```

### AI Service

```
POST /localhost:5001/predict    - Get fraud score for activity
GET /localhost:5001/health      - Check AI service status
```

---

## 💡 Testing Philosophy

**Real-Life vs. System Testing:**

- Real-life: Actual users, genuine attempts, real devices
- System: Simulated attacks, edge cases, stress testing

**What to Test:**

1. ✓ Happy path: Normal registration → login → voting
2. ✓ Fraud paths: Duplicate accounts, rapid voting, device changes
3. ✓ Error handling: Invalid OTP, failed biometric verification
4. ✓ Performance: 500 concurrent users
5. ✓ Compliance: Data privacy, audit logs

---

## 📈 Expected Metrics

### Performance

- Registration: < 3 minutes
- Login: 20-40 seconds
- Fraud detection: < 200ms
- Database queries: < 50ms average

### Accuracy

- Face recognition: > 98% success rate
- Fraud detection: > 95% accuracy
- False positives: < 2%

### Security

- Password hashing: bcrypt with salt rounds=10
- Encryption: AES-256
- Rate limiting: 3 attempts per 15 minutes
- Session timeout: 15 minutes of inactivity

---

**Last Updated:** May 3, 2026
**Status:** ✅ All systems operational
