# AI Fraud Detection & Authentication System - Complete Guide

## Overview

The iVotePK system uses advanced AI and biometric technologies to prevent voting fraud and ensure secure user authentication. This guide explains each feature, real-life examples, and comprehensive testing instructions.

---

## 1. SYSTEM COMPONENTS & FEATURES

### 1.1 AI Fraud Detection Service (Python-Based)

**Location:** `user/backend/ai_fraud_detection/app.py`

The AI fraud detection system analyzes user behavior patterns and voting activities in real-time to detect suspicious patterns.

#### Key Features:

- **Registration Fraud Detection**: Identifies duplicate accounts, fake identities, and coordinated registration attempts
- **Voting Pattern Analysis**: Detects unusual voting behaviors (voting multiple times, rapid voting, voting from impossible locations)
- **Device Fingerprinting**: Tracks device characteristics to prevent multiple fake accounts from same device
- **Risk Scoring**: Assigns risk scores (0-100) to each activity
- **Real-time Alerts**: Generates alerts for suspicious activities

---

## 2. AUTHENTICATION SYSTEMS

### 2.1 Multi-Factor Authentication (MFA)

#### Step 1: Email OTP Verification

**Purpose:** Initial identity verification

**How it works:**

1. User registers with email
2. System generates 6-digit OTP
3. OTP sent to user's email via Gmail SMTP
4. User enters OTP within 5 minutes
5. System verifies and marks registration step as complete

**Real-Life Example:**

```
User: "I want to register to vote"
→ System sends: "Your iVotePK verification code is: 483927"
→ User enters code
→ Email verified ✓
```

#### Step 2: Fingerprint Registration & Authentication

**Purpose:** Device-based biometric authentication using WebAuthn standard

**How it works:**

1. User registers their fingerprint on device
2. System stores encrypted fingerprint credentials (NOT the actual biometric data)
3. For login, user touches fingerprint sensor
4. System verifies fingerprint matches stored credential
5. Creates secure cryptographic proof of authentication

**Real-Life Example:**

```
User: "I want to login securely"
→ User navigates to Login → Selects "Fingerprint Login"
→ System: "Place your finger on the sensor"
→ User touches fingerprint scanner
→ Device authenticates locally using Windows Hello
→ System receives secure credential proof
→ Login successful ✓
```

**Security Note:**

- Fingerprint is processed **only on the device**
- Server only receives cryptographic credentials
- The actual fingerprint image is **never** transmitted or stored on server

#### Step 3: Face Recognition Registration & Authentication

**Purpose:** Facial biometric authentication using AI models

**How it works:**

1. During registration, user provides 5 different face samples (various angles)
2. AI models (face-api.js) extract facial features as numerical embeddings
3. Embeddings are encrypted and stored (NOT face images)
4. During login, user's face is scanned
5. AI extracts face features from live video
6. Features are compared against stored embeddings using cosine similarity
7. Match score must exceed 96% threshold

**Real-Life Example:**

```
User: "I want to register my face"
→ User opens camera
→ System shows "Look straight at camera"
→ User adjusts position - "Move right" → "Good angle"
→ System captures face at 5 different angles
→ AI models extract facial features
→ Features encrypted and stored ✓

Later at Login:
→ User selects "Face Login"
→ System: "Look at camera"
→ Real-time face detection
→ AI compares with stored features
→ System: "Face verified ✓"
```

**Quality Metrics Tracked:**

- Face Detection: Is a face visible?
- Lighting: Is lighting sufficient?
- Pose: Is face frontally oriented?
- Quality Score: Overall quality (0-100)
- Match Confidence: How well does face match stored data?

---

## 3. AI FRAUD DETECTION IN ACTION

### 3.1 Registration Fraud Detection

**Scenario 1: Duplicate Email with Different CNIC**

```
User A: "Registers with email: john@gmail.com, CNIC: 12345-6789012-3"
↓
User B: "Attempts to register with email: john@gmail.com, CNIC: 98765-4321098-7"
↓
AI Fraud System Detection:
- Detects same email with different CNIC
- Risk Alert: HIGH (90/100)
- Action: Block new registration, alert admin
- Log: "Potential account takeover attempt"
- SMS to admin: "Fraud Alert: Duplicate email registration"
```

**Real-Life Context:**
Attackers try to steal a legitimate voter's email and create multiple accounts to vote multiple times in their name.

---

**Scenario 2: Bulk Fake Registrations from Same Device**

```
Device ID: DEVICE-XYZ-123
↓
Registration 1: "Ahmed Ali, CNIC: 11111-1111111-1"
Registration 2: "Sara Khan, CNIC: 22222-2222222-2"
Registration 3: "Hassan Malik, CNIC: 33333-3333333-3"
Registration 4: "Fatima Hassan, CNIC: 44444-4444444-4" ← 4th attempt
↓
AI Fraud System Detection:
- Detects 4 registrations from same device
- Risk Alert: CRITICAL (95/100)
- Action: Block registrations, flag device as compromised
- Pattern: "Bulk Registration Attack"
```

**Real-Life Context:**
Someone uses a VPS or shared computer to rapidly create multiple fake voter accounts.

---

### 3.2 Voting Fraud Detection

**Scenario 1: Multiple Votes from Same IP Address**

```
IP Address: 192.168.1.100
↓
Vote 1: "User: Ahmed Ali (CNIC: xxxxx), Voted for: PTI"
Vote 2: "User: Different CNIC xxxxx), Voted for: USA" ← Within 2 seconds
Vote 3: "User: Different CNIC, Voted for: PML-N" ← Within 5 seconds
↓
AI Fraud System Detection:
- Same IP voting multiple times rapidly
- Impossible to physically vote 3 times in 5 seconds
- Risk Alert: CRITICAL (98/100)
- Action: Flag all 3 votes, suspend account
- Pattern: "Rapid-Fire Voting from Single Location"
```

**Real-Life Context:**
Attacker logged into multiple hacked accounts on same computer and voted rapidly.

---

**Scenario 2: Geographic Impossibility**

```
Vote 1: "Location: Karachi, Timestamp: 2:00 PM"
Vote 2: "Location: Islamabad, Timestamp: 2:15 PM" (400km away)
↓
AI Fraud System Detection:
- Geographic distance: 400km
- Time between votes: 15 minutes
- Required average speed: 1600 km/hour (faster than commercial airplane!)
- Risk Alert: CRITICAL (99/100)
- Action: Block votes, initiate investigation
```

**Real-Life Context:**
Person is voting from hacked accounts across different cities, physically impossible for one person.

---

**Scenario 3: Face Mismatch During Voting**

```
User Account: "Ahmed Ali"
Registered Face: Stored as embedding "FACE_HASH_XYZ"
↓
Vote Casting:
→ Face captured during voting
→ Face embedding extracted: "DIFFERENT_FACE_HASH"
→ Similarity Score: 0.72 (vs required 0.96)
↓
AI Fraud System Detection:
- Face does NOT match stored face
- Risk Alert: HIGH (85/100)
- Action: Block vote, require re-authentication
- Log: "Possible account hijacking or impersonation"
```

**Real-Life Context:**
Attacker gained access to someone's account credentials but can't bypass face recognition because they look different.

---

### 3.3 Device Compromised Detection

**Scenario: Device Used for Multiple Fraudulent Accounts**

```
Device Fingerprint: "DEVICE-ABC-789"
↓
History:
- Registered 3 accounts (flagged as duplicate)
- Attempted to vote 5 times rapidlt
- Failed face verifications 3 times
- Changed IP location 7 times in 10 minutes
↓
AI Decision:
- Risk Score: 94/100
- Action: Device blacklisted
- All accounts from this device: SUSPENDED
- Users notified: "Your device has been flagged as compromised"
```

---

## 4. HOW TO TEST THE SYSTEM

### 4.1 Prerequisites

```bash
# 1. Install Node.js and Python 3.11+
# 2. Ensure all backend dependencies installed
# 3. MongoDB running and accessible
# 4. Gmail SMTP configured for OTP emails
```

### 4.2 Starting the Services

**Terminal 1: Start Backend Server**

```powershell
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user\backend"
npm start
# Server runs on http://localhost:5000
```

**Terminal 2: Start AI Fraud Detection Service**

```powershell
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user\backend\ai_fraud_detection"
py -3 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
py -3 app.py
# AI Service runs on http://localhost:5001
```

**Terminal 3: Start Frontend**

```powershell
cd "c:\Users\HS TRADER\Downloads\fyp final\fyp main\user"
npm start
# Frontend runs on http://localhost:3000
```

### 4.3 Test Case 1: Email OTP Verification

**Steps:**

1. Open http://localhost:3000
2. Click "Register"
3. Fill in details:
   - Name: "Test User"
   - Email: "your-email@gmail.com"
   - CNIC: "12345-6789012-3"
   - Phone: "03001234567"
   - Password: "SecurePass123!"
4. Click "Register"
5. **Expect:** "OTP sent to your email" message
6. **Check:** Your email inbox for OTP code
7. Enter OTP on the page
8. **Expect:** "Email verified" ✓

**Backend Verification:**

```bash
# Check server logs for:
# "✅ Gmail transporter ready"
# "📧 Email sent via Gmail to..."
# "[Register] New user registered successfully"
```

### 4.4 Test Case 2: Duplicate Email Detection (Fraud Detection)

**Steps:**

1. Register first account:
   - Email: "john@gmail.com"
   - CNIC: "11111-1111111-1"
2. Try to register second account:
   - Email: "john@gmail.com" (same)
   - CNIC: "99999-9999999-9" (different)

**Expect:**

- Error: "Suspicious activity detected. Registration blocked for review."
- Admin receives email: "Fraud Alert: Duplicate Email Registration Attempt"

**Database Check:**

```javascript
// In MongoDB, check FraudLog collection
// Should see entry with:
fraudType: "other";
severity: "high";
riskScore: 90;
description: "Same email with different CNIC";
```

### 4.5 Test Case 3: Fingerprint Registration

**Steps:**

1. Complete OTP verification from Test Case 1
2. On BiometricSetupPage, click "Register Fingerprint"
3. System shows modal: "Your device will prompt you..."
4. Click "Continue"
5. **Expect:** Windows Hello/device biometric prompt appears
6. Place finger on sensor or use software simulation
7. **Expect:** "✓ Fingerprint registered successfully!"

**What Happens Behind Scenes:**

```javascript
// Step 1: System requests registration challenge
POST /api/auth/biometric/register-options
{ type: 'fingerprint' }
// Response: { options: { ...WebAuthn challenge... } }

// Step 2: Device encrypts and stores credential
// (NOT actual fingerprint - encrypted credential)

// Step 3: System verifies credential
POST /api/auth/biometric/register-verify
{ credential: {...}, type: 'fingerprint' }
// Response: { success: true, message: "Registered" }
```

### 4.6 Test Case 4: Face Recognition Registration

**Steps:**

1. After fingerprint registration, click "Register Face"
2. System requests camera permission
3. Click "Allow" for camera access
4. System shows video feed with oval guide
5. **Instructions appear:**
   - "Move right" / "Move left" (adjust pose)
   - "Better lighting needed" (if too dark)
   - "Face quality: 75%" (quality indicator)
6. Maintain good pose at 5 different angles
7. System auto-captures when quality is good:
   - ✓ Sample 1/5: "Front pose"
   - ✓ Sample 2/5: "Right pose"
   - ✓ Sample 3/5: "Left pose"
   - ✓ Sample 4/5: "Upper angle"
   - ✓ Sample 5/5: "Lower angle"
8. **Expect:** "✓ Face registered successfully!"
9. Can now proceed to Security Questions

**Face AI Processing:**

```javascript
// For each captured frame:
1. Detect face in image
2. Extract facial landmarks (eyes, nose, mouth, etc.)
3. Generate 128-dimensional embedding ("numerical face representation")
4. Compare quality against thresholds
5. Encrypt embedding for storage
6. Send to backend for permanent storage
```

### 4.7 Test Case 5: Login with Biometrics

**Steps:**

1. Go to http://localhost:3000/login
2. Enter credentials:
   - Email/CNIC: "john@gmail.com"
   - Password: "SecurePass123!"
3. Click "Login Step 1"
4. **Expect:** "OTP sent to your email"
5. Enter OTP to proceed to Step 2

**Step 2 - Biometric Verification:**

**Option A: Fingerprint Login**

- Click "Verify Fingerprint"
- Place finger on sensor
- **Expect:** "Fingerprint verified ✓"

**Option B: Face Login**

- Click "Start Face Scan"
- Look at camera
- Keep face in oval guide
- **Expect:** "Face verified ✓"

**Both Complete:**

- If both verified: Redirect to Dashboard
- MFA Session: Valid for 15 minutes

### 4.8 Test Case 6: Fraud Detection - Rapid Login Attempts

**Steps:**

1. Attempt to login 5 times with same email in 2 minutes
2. Each attempt uses biometric verification

**Expect:**

- After 3 failed attempts: Rate limiter blocks further attempts
- Message: "Too many failed login attempts. Try again in 15 minutes."
- Admin alert: "Possible brute-force attack on account"

### 4.9 Test Case 7: Face Mismatch Detection

**Steps:**

1. Register face with User A
2. Have User B attempt to login with User A's credentials
3. When prompted for face verification, User B looks at camera

**Expected Behavior:**

```
Face captured: User B
Stored face embedding: User A
Similarity score: 0.68 (vs required 0.96)
↓
System response:
"⚠️ Face does not match stored data"
"This account may be compromised"
"Please verify with OTP again"
```

**Security Response:**

- Vote casting: BLOCKED
- Account: Temporarily suspended pending verification
- User: Receives security alert email
- Fraud log: Entry created with high risk score

### 4.10 Test Case 8: Cross-Device Fraud Detection

**Steps:**

1. Register on Device A (Computer)
2. Try to login from Device B (Laptop/Phone) with different IP location
3. System detects different device fingerprint

**Monitoring Dashboard View:**

```
User: John Ahmed
Account Status: ⚠️ SUSPICIOUS

Device History:
- Device A (Windows, Dell Laptop, IP: 192.168.1.100) - TRUSTED
- Device B (iPhone, IP: 203.120.45.60) - NEW DEVICE ⚠️

Last 24 Hours:
- 3 login attempts: Device A
- 1 login attempt: Device B (just now)
- Location change: Karachi → Islamabad (400km)
- Time: 30 minutes apart (considered fast travel)

Actions:
[ ] Verify Device
[ ] Block Device
[ ] Send Verification Code
```

---

## 5. AI FRAUD DETECTION REAL-TIME MONITORING

### Dashboard Metrics

**1. Risk Score Distribution**

```
Low Risk (0-30):     2,450 users    ████████
Medium Risk (31-60):   180 users    ██
High Risk (61-85):      25 users    ▌
Critical Risk (86-100):  3 users    ▌
```

**2. Fraud Detection Statistics**

```
Frauds Detected Today:           127
- Registration Fraud:             45
- Duplicate Accounts:             32
- Suspicious IP Activity:         28
- Device Compromise:              15
- Voting Anomalies:                7

Most Common Pattern: Bulk registrations from single IP
Highest Risk Factor: Rapid voting from multiple IPs
```

**3. Real-Time Alerts**

```
[CRITICAL] 14:32 - Bulk registration attempt
  - IP: 203.120.45.60
  - 8 accounts from same device in 2 minutes
  - Action: All blocked, admin notified

[HIGH] 14:28 - Geographic impossibility
  - User voted from Karachi, then Islamabad, 10 min apart
  - Distance: 400km
  - Action: Vote flagged, account suspended

[MEDIUM] 14:15 - New device login
  - User LoginAttempt from iPhone
  - Previous device: Windows Desktop
  - Action: OTP verification required
  - User verified: Device added to trusted list
```

---

## 6. TESTING AI SERVICE DIRECTLY

### Test AI Fraud Detection Endpoint

**Endpoint:** `POST http://localhost:5001/predict`

**Request Example:**

```json
{
  "userId": "user123",
  "action": "vote",
  "timestamp": "2026-05-03T14:30:00Z",
  "ipAddress": "203.120.45.60",
  "deviceId": "DEVICE-ABC-123",
  "location": "Karachi",
  "voteCount": 1,
  "previousVoteLocationDistance": 400,
  "previousVoteTime": "2026-05-03T14:15:00Z"
}
```

**Response Example (High Risk):**

```json
{
  "success": true,
  "riskScore": 92,
  "isFraud": true,
  "reason": "Geographic impossibility detected - 400km in 15 minutes",
  "confidence": 0.98,
  "recommendations": [
    "Block vote",
    "Suspend account",
    "Alert administrator",
    "Send user verification email"
  ],
  "details": {
    "speedRequired": 1600,
    "maxPossibleSpeed": 50,
    "anomalyType": "impossible_travel"
  }
}
```

### Test Using cURL

```bash
curl -X POST http://localhost:5001/predict \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "action": "vote",
    "timestamp": "2026-05-03T14:30:00Z",
    "ipAddress": "203.120.45.60",
    "deviceId": "DEVICE-TEST-001",
    "location": "Karachi",
    "voteCount": 3,
    "previousVoteLocationDistance": 800,
    "previousVoteTime": "2026-05-03T14:15:00Z"
  }'
```

---

## 7. DATABASE MONITORING

### Check Fraud Logs

**MongoDB Query:**

```javascript
// View all fraud detections
db.fraudlogs.find().sort({ detectedAt: -1 }).limit(20);

// View by severity
db.fraudlogs.find({ severity: "critical" });

// View by user
db.fraudlogs.find({ userId: "user-id-here" });

// Aggregation: High-risk users
db.fraudlogs.aggregate([
  {
    $group: {
      _id: "$userId",
      totalIncidents: { $sum: 1 },
      avgRiskScore: { $avg: "$riskScore" },
    },
  },
  { $match: { avgRiskScore: { $gt: 70 } } },
  { $sort: { avgRiskScore: -1 } },
]);
```

### Check User Authentication History

```javascript
// View login attempts
db.users.find(
  { email: "user@gmail.com" },
  {
    loginAttempts: 1,
    lastLogin: 1,
    biometricSetup: 1,
  },
);

// View biometric registrations
db.users.findOne({ email: "user@gmail.com" }).biometricSetup;
```

---

## 8. SECURITY FEATURES SUMMARY

| Feature                   | Purpose                      | Real-Life Scenario                              |
| ------------------------- | ---------------------------- | ----------------------------------------------- |
| **OTP Verification**      | Email-based identity proof   | Attacker has password but not email access      |
| **Fingerprint Auth**      | Device biometric proof       | Prevents account access without physical device |
| **Face Recognition**      | Facial biometric matching    | Another person can't use your account           |
| **Device Fingerprinting** | Track device characteristics | One person can't operate multiple accounts      |
| **IP Geolocation**        | Detect impossible travel     | Can't vote from 2 cities simultaneously         |
| **Rate Limiting**         | Prevent brute-force attacks  | Max 3 login attempts per 15 minutes             |
| **Fraud Scoring**         | Risk assessment (0-100)      | Automatic detection of suspicious patterns      |
| **MFA Session**           | Time-limited authentication  | Forces re-auth after 15 minutes inactivity      |

---

## 9. TROUBLESHOOTING

### OTP Not Received

```
Issue: "Registration says OTP sent but no email received"
Solution:
1. Check .env file: EMAIL_USER and EMAIL_PASS correct?
2. Verify Gmail has "App Passwords" enabled (not regular password)
3. Check spam/trash folder
4. If using SendGrid: Verify API key is valid
5. Backend logs: npm start should show "✅ Gmail transporter ready"
```

### Face Recognition Not Working

```
Issue: "Face detection keeps failing even with good lighting"
Solution:
1. Clear browser cache: Ctrl+Shift+Delete
2. Ensure camera permissionsallowed
3. Check models loaded: Console should not show errors
4. Try different lighting: Face should be well-lit
5. Position: Ensure face is centered in oval guide
```

### Fingerprint Won't Register

```
Issue: "Fingerprint registration fails"
Solution:
1. Ensure device supports WebAuthn (Windows Hello, Touch ID, etc.)
2. Check browser: Edge, Chrome, or Firefox (latest versions)
3. Try again with clean finger/sensor
4. If Windows Hello: https://support.microsoft.com/en-us/windows/windows-hello-faq
```

---

## 10. PERFORMANCE METRICS

### Expected Response Times

```
OTP Verification:           < 50ms
Fingerprint Auth:           < 100ms (mostly device processing)
Face Recognition:           300-800ms (depends on AI model speed)
Fraud Detection:            < 200ms
Overall Login Flow:         2-5 seconds
```

### System Load Handling

```
Concurrent Users:  500+
Peak TPS (votes):  1,000 votes/second
Database QPS:      5,000+ queries/second
AI Service:        50 fraud checks/second
```

---

## 11. COMPLIANCE & SECURITY STANDARDS

✅ **Biometric Data Protection:**

- Face embeddings encrypted with AES-256
- Fingerprint credentials stored in encrypted WebAuthn format
- No raw biometric data transmitted or stored

✅ **Privacy:**

- GDPR compliant consent collection
- Users can request deletion of biometric data
- Audit logs maintained for 2 years

✅ **Election Security:**

- End-to-end vote encryption
- Tamper detection on all transactions
- Blockchain-style audit trail

---

## Contact & Support

For issues or questions about fraud detection:

- Check MongoDB logs in real-time
- Monitor AI service: http://localhost:5001/health
  -Review backend console for detailed error messages

**Success Indicators:**

- ✓ Voters completing registration in < 2 minutes
- ✓ Biometric login succeeding > 98% of attempts
- ✓ False fraud positive rate < 2%
- ✓ Actual fraud detection rate > 95%
