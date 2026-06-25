# iVotePK - Intelligent Voting System API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Register a new user and send OTP verification email.

**Request Body:**
```json
{
  "cnic": "1234567890123",
  "email": "user@example.com",
  "phone": "+923001234567",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. OTP sent to your email",
  "email": "user@example.com",
  "userId": "64abc123..."
}
```

---

### 2. Verify OTP
**POST** `/auth/verify-otp`

Verify email with OTP code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "64abc123...",
    "email": "user@example.com",
    "cnic": "1234567890123",
    "name": "John Doe",
    "role": "voter"
  }
}
```

---

### 3. Resend OTP
**POST** `/auth/resend-otp`

Request a new OTP code.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

### 4. Login
**POST** `/auth/login`

Login with CNIC/Email and password.

**Request Body:**
```json
{
  "identifier": "1234567890123",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful. Please complete biometric verification.",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "requiresBiometric": true,
  "biometricSetup": {
    "faceRecognition": true,
    "fingerprint": true
  },
  "user": {
    "id": "64abc123...",
    "email": "user@example.com",
    "cnic": "1234567890123",
    "name": "John Doe",
    "role": "voter"
  }
}
```

---

### 5. Get Security Questions
**GET** `/auth/security-questions/list`

Get available security questions.

**Response:**
```json
{
  "success": true,
  "questions": [
    {
      "id": "64abc...",
      "question": "What is your mother's maiden name?",
      "category": "family"
    }
  ]
}
```

---

### 6. Set Security Questions
**POST** `/auth/security-questions`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "questions": [
    {
      "question": "What is your mother's maiden name?",
      "answer": "Smith"
    },
    {
      "question": "What was your first pet's name?",
      "answer": "Fluffy"
    },
    {
      "question": "In which city were you born?",
      "answer": "Karachi"
    }
  ]
}
```

---

### 7. Biometric Registration Options
**POST** `/auth/biometric/register-options`

**Headers:** `Authorization: Bearer <token>`

Get WebAuthn registration options for biometric setup.

---

### 8. Verify Biometric Registration
**POST** `/auth/biometric/register-verify`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "credential": { /* WebAuthn credential */ },
  "type": "face" // or "fingerprint"
}
```

---

### 9. Biometric Authentication Options
**POST** `/auth/biometric/auth-options`

**Headers:** `Authorization: Bearer <token>`

Get WebAuthn authentication options for login.

---

### 10. Verify Biometric Authentication
**POST** `/auth/biometric/auth-verify`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "credential": { /* WebAuthn credential */ }
}
```

---

### 11. Get Current User
**GET** `/auth/me`

**Headers:** `Authorization: Bearer <token>`

Get current authenticated user information.

---

## 🗳️ Voting Endpoints

### 1. Cast Vote
**POST** `/vote/cast`

**Headers:** `Authorization: Bearer <token>`

Cast a vote in an election.

**Request Body:**
```json
{
  "electionId": "64abc123...",
  "candidateId": "64def456...",
  "securityAnswers": [
    { "answer": "Smith" },
    { "answer": "Fluffy" },
    { "answer": "Karachi" }
  ],
  "deviceInfo": {
    "userAgent": "Mozilla/5.0...",
    "platform": "Windows",
    "browser": "Chrome"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vote cast successfully",
  "receipt": {
    "receiptNumber": "VR-1234567890-ABC123",
    "timestamp": "2026-03-18T10:30:00.000Z",
    "election": "National Assembly Election 2026",
    "candidate": "John Smith",
    "party": "Pakistan Tehreek-e-Insaf",
    "voteHash": "a1b2c3d4e5f6..."
  },
  "warning": null
}
```

---

### 2. Verify Security Questions
**POST** `/vote/verify-security`

**Headers:** `Authorization: Bearer <token>`

Verify security questions before voting.

**Request Body:**
```json
{
  "answers": ["Smith", "Fluffy", "Karachi"]
}
```

---

### 3. Get Vote Receipt
**GET** `/vote/receipt/:receiptNumber`

**Headers:** `Authorization: Bearer <token>`

Retrieve vote receipt by receipt number.

---

### 4. Get Voting History
**GET** `/vote/history`

**Headers:** `Authorization: Bearer <token>`

Get user's complete voting history.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "votes": [
    {
      "receiptNumber": "VR-1234567890-ABC123",
      "timestamp": "2026-03-18T10:30:00.000Z",
      "election": {
        "title": "National Assembly Election 2026",
        "type": "National"
      },
      "candidate": {
        "name": "John Smith"
      },
      "party": {
        "name": "PTI",
        "symbol": "Bat"
      },
      "status": "valid"
    }
  ]
}
```

---

## 📊 Public Endpoints

### 1. Get Active Elections
**GET** `/public/elections?status=active&type=National`

Get all active elections.

**Query Parameters:**
- `status`: active | upcoming | completed
- `type`: National | Provincial | Local
- `constituency`: Constituency name

---

### 2. Get Election Details
**GET** `/public/elections/:id`

Get detailed information about an election.

---

### 3. Get Election Results
**GET** `/public/elections/:id/results`

Get real-time election results.

**Response:**
```json
{
  "success": true,
  "results": {
    "electionTitle": "National Assembly Election 2026",
    "totalVotes": 15234,
    "turnoutPercentage": 67.5,
    "status": "active",
    "results": [
      {
        "candidateId": {
          "name": "John Smith",
          "photo": "...",
          "party": {
            "name": "PTI",
            "symbol": "Bat"
          }
        },
        "votes": 5678,
        "percentage": 37.3
      }
    ]
  }
}
```

---

### 4. Get All Parties
**GET** `/public/parties`

Get all active political parties.

---

### 5. Get Party Details
**GET** `/public/parties/:id`

Get detailed information about a party including candidates.

---

### 6. Get Candidates by Election
**GET** `/public/elections/:electionId/candidates`

Get all candidates for a specific election.

---

### 7. Get Candidate Details
**GET** `/public/candidates/:id`

Get detailed information about a candidate.

---

## 👨‍💼 Admin Endpoints

All admin endpoints require admin role authorization.

**Headers:** `Authorization: Bearer <admin_token>`

### Elections Management

#### Get All Elections
**GET** `/admin/elections?status=active&page=1&limit=10`

#### Get Single Election
**GET** `/admin/elections/:id`

#### Create Election
**POST** `/admin/elections`

**Request Body:**
```json
{
  "title": "National Assembly Election 2026",
  "description": "General elections for National Assembly",
  "type": "National",
  "constituency": "NA-245",
  "startDate": "2026-03-18T08:00:00Z",
  "endDate": "2026-03-18T17:00:00Z",
  "candidates": ["64abc...", "64def..."],
  "parties": ["64ghi...", "64jkl..."]
}
```

#### Update Election
**PUT** `/admin/elections/:id`

#### Delete Election
**DELETE** `/admin/elections/:id`

---

### Parties Management

#### Get All Parties
**GET** `/admin/parties?page=1&limit=20`

#### Create Party
**POST** `/admin/parties`

**Request Body:**
```json
{
  "name": "Pakistan Tehreek-e-Insaf",
  "shortName": "PTI",
  "symbol": "Bat",
  "logo": "https://...",
  "description": "...",
  "leader": "...",
  "color": "#00563B",
  "registrationNumber": "PTI-001"
}
```

#### Update Party
**PUT** `/admin/parties/:id`

#### Delete Party
**DELETE** `/admin/parties/:id`

---

### Candidates Management

#### Get All Candidates
**GET** `/admin/candidates?party=64abc...&constituency=NA-245`

#### Create Candidate
**POST** `/admin/candidates`

**Request Body:**
```json
{
  "name": "John Smith",
  "cnic": "1234567890123",
  "email": "john@example.com",
  "phone": "+923001234567",
  "party": "64abc...",
  "constituency": "NA-245",
  "age": 45,
  "gender": "Male",
  "education": "Masters in Political Science",
  "biography": "...",
  "promises": ["Promise 1", "Promise 2"]
}
```

#### Update Candidate
**PUT** `/admin/candidates/:id`

#### Delete Candidate
**DELETE** `/admin/candidates/:id`

---

### User Management

#### Get All Users
**GET** `/admin/users?role=voter&isVerified=true&page=1`

---

### Dashboard & Analytics

#### Get Dashboard Statistics
**GET** `/admin/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 50000,
    "totalElections": 25,
    "activeElections": 3,
    "totalVotes": 125000,
    "totalFraudAlerts": 15,
    "totalParties": 12,
    "totalCandidates": 150
  },
  "recentVotes": [...],
  "fraudAlerts": [...]
}
```

---

### Fraud Management

#### Get Fraud Logs
**GET** `/admin/fraud-logs?severity=high&status=detected&page=1`

**Response:**
```json
{
  "success": true,
  "count": 15,
  "logs": [
    {
      "userId": {...},
      "electionId": {...},
      "fraudType": "multiple_votes",
      "severity": "high",
      "riskScore": 85,
      "description": "...",
      "detectedAt": "2026-03-18T10:30:00Z",
      "status": "detected"
    }
  ]
}
```

#### Resolve Fraud Log
**PUT** `/admin/fraud-logs/:id/resolve`

**Request Body:**
```json
{
  "notes": "Investigated and found to be legitimate vote"
}
```

---

## 🔌 Real-time WebSocket Events

Connect to: `ws://localhost:5000`

### Client Events (Emit)

```javascript
// Join election room for live updates
socket.emit('joinElection', 'election-id');

// Leave election room
socket.emit('leaveElection', 'election-id');

// Request analytics data
socket.emit('requestAnalytics', 'election-id');

// Join admin dashboard (admin only)
socket.emit('joinAdminDashboard');
```

### Server Events (Listen)

```javascript
// Receive election data
socket.on('electionData', (data) => {
  console.log(data.totalVotes, data.results);
});

// Receive vote updates in real-time
socket.on('voteUpdate', (data) => {
  console.log('New vote!', data);
});

// Receive analytics updates
socket.on('analyticsUpdate', (data) => {
  console.log('Analytics:', data);
});

// Receive fraud alerts (admin only)
socket.on('fraudAlert', (alert) => {
  console.log('Fraud detected!', alert);
});

// Handle errors
socket.on('error', (error) => {
  console.error(error);
});
```

---

## 🤖 AI Fraud Detection API

Base URL: `http://localhost:5001`

### Predict Fraud
**POST** `/predict`

**Request Body:**
```json
{
  "voteId": "64abc...",
  "userId": "64def...",
  "electionId": "64ghi...",
  "vote_count_last_hour": 2,
  "ip_vote_count": 1,
  "device_vote_count": 1,
  "time_since_last_vote": 300,
  "biometric_verified": true,
  "security_verified": true
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "is_fraudulent": false,
    "risk_score": 25.5,
    "confidence": 0.75,
    "fraud_indicators": [],
    "features": {...}
  }
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "success": false,
  "message": "Error description"
}
```

### Common Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

---

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes
- OTP endpoints: 3 requests per 15 minutes
- Voting: 10 requests per hour
- General: 100 requests per 15 minutes

---

## Security Best Practices

1. Always use HTTPS in production
2. Store JWT tokens securely
3. Never expose sensitive data in logs
4. Implement CSRF protection
5. Use rate limiting
6. Validate all inputs
7. Encrypt sensitive data
8. Regular security audits

---

## Database Schema Overview

### User
- Authentication (CNIC, Email, Password)
- Security Questions
- Biometric Setup (WebAuthn)
- Voting History
- Role-based Access

### Election
- Basic Info (Title, Type, Dates)
- Candidates & Parties
- Results & Analytics
- Status Management

### Vote
- Voter Reference
- Election & Candidate
- Verification Data
- Fraud Score
- Receipt Number

### FraudLog
- Detection Data
- Risk Score
- Evidence
- Investigation Status

---

## Support

For issues or questions:
- Email: support@ivotepk.com
- GitHub: https://github.com/ivotepk
- Documentation: https://docs.ivotepk.com
