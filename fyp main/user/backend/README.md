# iVotePK - Intelligent Voting System

![iVotePK Logo](https://via.placeholder.com/800x200/00563B/FFFFFF?text=iVotePK+-+Secure+Digital+Elections+for+Pakistan)

## 🎯 Project Overview

**iVotePK** is a production-level, full-stack intelligent voting system designed for secure, transparent, and fraud-resistant digital elections in Pakistan. This Final Year Project combines modern web technologies, biometric authentication, AI-powered fraud detection, and real-time analytics to create a robust democratic platform.

### 🌟 Key Features

- ✅ **Complete Authentication System**
  - CNIC-based registration
  - Email OTP verification
  - Security questions (3-factor)
  - WebAuthn biometric authentication (Face & Fingerprint)
  - JWT token-based session management

- ✅ **Secure Voting System**
  - One person, one vote enforcement
  - Multi-layer verification
  - Encrypted vote storage
  - Digital vote receipts
  - Duplicate vote prevention

- ✅ **AI Fraud Detection**
  - Real-time fraud analysis
  - Rule-based risk scoring
  - Pattern recognition
  - Behavioral analysis
  - Automated alerts

- ✅ **Real-time Analytics**
  - Live vote counting
  - WebSocket integration
  - Party-wise statistics
  - Constituency analysis
  - Fraud metrics

- ✅ **Admin Dashboard**
  - Election management
  - Candidate & party CRUD
  - User management
  - Fraud investigation
  - Report generation

- ✅ **Security Features**
  - Rate limiting
  - Input validation
  - SQL injection prevention
  - XSS protection
  - CSRF protection
  - AES encryption

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  User    │  │  Admin   │  │  Voting  │  │Analytics │  │
│  │Dashboard │  │Dashboard │  │  System  │  │Dashboard │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS + WebSocket
┌────────────────────┴────────────────────────────────────────┐
│                  BACKEND (Node.js + Express)                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │  Voting  │  │  Admin   │  │  Socket  │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │   .IO    │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Middleware (JWT, Rate Limit, etc)           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴──────────┐
        │                       │
┌───────┴────────┐    ┌─────────┴──────────┐
│   MongoDB      │    │   AI Fraud API     │
│   Database     │    │   (Python/Flask)   │
│                │    │                    │
│  • Users       │    │  • Risk Scoring    │
│  • Elections   │    │  • ML Prediction   │
│  • Votes       │    │  • Pattern Detect  │
│  • FraudLogs   │    │  • Analytics       │
└────────────────┘    └────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **React 18.2.0** - UI library
- **React Router 6.3** - Navigation
- **Bootstrap Icons** - Icons
- **i18next** - Internationalization (Urdu/English)
- **Socket.io Client** - Real-time updates
- **WebAuthn API** - Biometric authentication

### Backend (Node.js)
- **Express 4.18** - Web framework
- **MongoDB + Mongoose 7.0** - Database
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **Socket.io 4.6** - WebSocket server
- **Helmet** - Security headers
- **Express Rate Limit** - Rate limiting
- **Validator** - Input validation

### AI Module (Python)
- **Flask 2.3** - Web framework
- **NumPy** - Numerical computing
- **Scikit-learn** - Machine learning
- **Pandas** - Data analysis

### Database
- **MongoDB Atlas** - Cloud database
- Connection: `mongodb+srv://HUSSAIN:hussain786@cluster0.qlovyqz.mongodb.net/ivotepk`

---

## 📁 Project Structure

```
fyp-main/
│
├── user/                           # User-facing application
│   ├── src/                        # React frontend
│   │   ├── pages/                  # Page components
│   │   │   ├── RegisterPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── OTPVerificationPage.js
│   │   │   ├── SecurityQuestionsPage.js
│   │   │   ├── FaceRecognitionPage.js
│   │   │   ├── FingerprintSetupPage.js
│   │   │   ├── UserDashboard.js
│   │   │   ├── CastVote.js
│   │   │   ├── VoteSuccess.js
│   │   │   ├── MeetCandidates.js
│   │   │   └── OngoingElections.js
│   │   ├── components/             # Reusable components
│   │   ├── services/               # API services
│   │   └── utils/                  # Utility functions
│   │
│   └── backend/                    # Node.js backend
│       ├── models/                 # Mongoose models
│       │   ├── User.js
│       │   ├── Election.js
│       │   ├── Candidate.js
│       │   ├── Party.js
│       │   ├── Vote.js
│       │   ├── FraudLog.js
│       │   ├── SecurityQuestion.js
│       │   └── Analytics.js
│       │
│       ├── controllers/            # Business logic
│       │   ├── authController.js
│       │   ├── voteController.js
│       │   ├── adminController.js
│       │   └── electionController.js
│       │
│       ├── routes/                 # API routes
│       │   ├── authRoutes.js
│       │   ├── voteRoutes.js
│       │   ├── adminRoutes.js
│       │   └── publicRoutes.js
│       │
│       ├── middleware/             # Express middleware
│       │   ├── auth.js
│       │   ├── rateLimiter.js
│       │   ├── validation.js
│       │   └── error.js
│       │
│       ├── utils/                  # Utilities
│       │   ├── jwt.js
│       │   ├── webauthn.js
│       │   ├── encryption.js
│       │   ├── sendEmail.js
│       │   └── socketHandler.js
│       │
│       ├── ai_fraud_detection/    # Python AI module
│       │   ├── app.py
│       │   ├── requirements.txt
│       │   └── README.md
│       │
│       ├── config/
│       │   └── db.js
│       │
│       ├── server.js               # Main server file
│       ├── package.json
│       └── .env
│
└── admin/                          # Admin dashboard (separate app)
    └── [Similar structure]
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ and npm
- Python 3.8+
- MongoDB Atlas account
- Gmail account (for email OTP)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd "fyp main"
```

### 2. Backend Setup

```bash
cd user/backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file with your credentials:
# - MongoDB connection string
# - JWT secret
# - Email credentials
# - Encryption key

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. AI Module Setup

```bash
cd user/backend/ai_fraud_detection

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start AI server
python app.py
```

The AI server will run on `http://localhost:5001`

### 4. Frontend Setup

```bash
cd user

# Install dependencies
npm install

# Start React development server
npm start
```

The frontend will run on `http://localhost:3000`

---

## 🔑 Environment Variables

### Backend (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://HUSSAIN:hussain786@cluster0.qlovyqz.mongodb.net/ivotepk?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
FROM_EMAIL=noreply@ivotepk.com
FROM_NAME=iVotePK
NODE_ENV=development
ENCRYPTION_KEY=your_32_character_encryption_key
CLIENT_URL=http://localhost:3000
AI_FRAUD_API=http://localhost:5001
```

### AI Module (.env)
```env
AI_PORT=5001
FLASK_ENV=development
MODEL_PATH=./models
LOG_LEVEL=INFO
```

---

## 📊 Database Schema

### User Schema
```javascript
{
  cnic: String (13 digits, unique),
  email: String (unique),
  phone: String,
  password: String (hashed),
  name: String,
  role: String (voter/admin),
  isVerified: Boolean,
  securityQuestions: [{
    question: String,
    answer: String (hashed)
  }],
  biometricSetup: {
    faceRecognition: Boolean,
    fingerprint: Boolean,
    webAuthnCredentials: [...]
  },
  hasVoted: [{ electionId, votedAt }],
  loginAttempts: { count, lastAttempt, lockUntil },
  ipAddresses: [{ ip, timestamp }]
}
```

### Vote Schema
```javascript
{
  voter: ObjectId (User),
  voterCnic: String,
  election: ObjectId (Election),
  candidate: ObjectId (Candidate),
  party: ObjectId (Party),
  voteHash: String (unique),
  receiptNumber: String (unique),
  timestamp: Date,
  ipAddress: String,
  deviceInfo: Object,
  biometricVerified: { face, fingerprint },
  securityQuestionVerified: Boolean,
  fraudScore: Number (0-100),
  isFlagged: Boolean,
  status: String (valid/flagged/verified/rejected)
}
```

---

## 🔐 Security Features

1. **Password Security**
   - bcrypt hashing (10 salt rounds)
   - Minimum 6 characters
   - No plaintext storage

2. **JWT Authentication**
   - Secure token generation
   - 7-day expiration
   - Role-based access control

3. **WebAuthn Biometrics**
   - Platform authenticator
   - Public key cryptography
   - No raw biometric storage

4. **Rate Limiting**
   - Auth: 5 requests/15min
   - OTP: 3 requests/15min
   - Voting: 10 requests/hour
   - General: 100 requests/15min

5. **Input Validation**
   - Sanitization
   - Type checking
   - Format validation
   - SQL injection prevention

6. **Encryption**
   - AES-256-CBC for sensitive data
   - SHA-256 hashing
   - Secure random generation

---

## 🤖 AI Fraud Detection

### Detection Criteria

| Factor | Threshold | Risk Points |
|--------|-----------|-------------|
| Vote count (1 hour) | > 3 | +30 |
| IP address reuse | > 5 | +40 |
| Device reuse | > 3 | +25 |
| Time since last vote | < 60s | +20 |
| No biometric | - | +15 |
| No security questions | - | +20 |
| Rapid pattern | Detected | +25 |
| Unusual hours | 10PM-6AM | +10 |

**Fraud Threshold:** 50+ points

### Fraud Types Detected
- Multiple votes
- Duplicate IP
- Duplicate device
- Suspicious patterns
- Rapid voting
- Biometric mismatch
- Security question failure
- Location anomaly
- Bot detection
- VPN/Proxy usage

---

## 📱 User Flow

### Registration & Setup
1. User registers with CNIC, email, phone, password
2. Receives OTP via email
3. Verifies OTP
4. Selects 3 security questions
5. Sets up face recognition
6. Sets up fingerprint
7. Account fully activated

### Login Flow
1. User enters CNIC/email + password
2. System validates credentials
3. User completes biometric authentication
4. Access granted to dashboard

### Voting Flow
1. User selects ongoing election
2. Views candidates and parties
3. Selects candidate
4. Answers security questions (random 3)
5. System verifies answers
6. Vote is cast and encrypted
7. Digital receipt generated
8. Real-time analytics updated

---

## 👨‍💼 Admin Features

- **Dashboard**: Real-time statistics and metrics
- **Election Management**: Create, update, delete elections
- **Candidate Management**: Add/edit candidate profiles
- **Party Management**: Manage political parties
- **User Management**: View and manage voters
- **Fraud Detection**: Monitor and investigate alerts
- **Analytics**: View detailed reports
- **Export Reports**: Generate PDF/Excel reports

---

## 📈 Real-time Features

### WebSocket Events

**Client Side:**
```javascript
// Join election for live updates
socket.emit('joinElection', electionId);

// Listen for vote updates
socket.on('voteUpdate', (data) => {
  // Update UI with new vote count
});

// Listen for analytics
socket.on('analyticsUpdate', (data) => {
  // Update charts and graphs
});

// Admin: Listen for fraud alerts
socket.on('fraudAlert', (alert) => {
  // Show notification
});
```

---

## 🧪 Testing

### Backend API Testing
```bash
# Install dependencies
npm install

# Run tests (if configured)
npm test

# Manual testing with Postman/Thunder Client
# Import API_DOCUMENTATION.md endpoints
```

### Frontend Testing
```bash
npm test
```

---

## 🚢 Deployment

### Backend Deployment (Heroku/Railway/DigitalOcean)

1. Set environment variables
2. Configure MongoDB Atlas
3. Set up email service
4. Deploy Node.js app
5. Deploy Python AI module
6. Configure domains

### Frontend Deployment (Vercel/Netlify)

1. Build production bundle
2. Configure environment variables
3. Deploy static files
4. Connect to backend API

---

## 📝 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/verify-otp` | Verify email OTP |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/security-questions` | Set security questions |
| POST | `/api/vote/cast` | Cast a vote |
| GET | `/api/public/elections` | Get active elections |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/fraud-logs` | Fraud detection logs |

[See full API documentation](./API_DOCUMENTATION.md)

---

## 🤝 Contributing

This is a Final Year Project. For academic purposes only.

---

## 📄 License

This project is developed as an academic Final Year Project.

---

## 👥 Team

- **Developer**: Hussain
- **Project Type**: Final Year Project (FYP)
- **Institution**: [Your University Name]
- **Year**: 2026

---

## 📞 Support

For questions or issues:
- Email: support@ivotepk.com
- GitHub Issues: [Create an issue]

---

## 🙏 Acknowledgments

- Election Commission of Pakistan (ECP) - Inspiration
- WebAuthn/FIDO Alliance - Biometric standards
- Open source community

---

## ⚠️ Important Notes

1. **Email Configuration**: Update SMTP credentials in `.env`
2. **MongoDB**: Use the provided connection string or create your own
3. **Security**: Change all default keys and secrets in production
4. **Biometrics**: Requires HTTPS in production for WebAuthn
5. **AI Module**: Python server must be running for fraud detection

---

**Built with ❤️ for a better democratic future in Pakistan 🇵🇰**
