# 📂 iVotePK - Complete Project Structure

```
fyp-main/
│
├── 📄 START.bat                          # Windows quick start launcher
├── 📄 START.sh                           # Mac/Linux quick start launcher
├── 📄 README.md                          # Project overview and documentation
├── 📄 INSTALLATION_GUIDE.md              # Step-by-step installation instructions
├── 📄 PROJECT_SUMMARY.md                 # Complete project summary
├── 📄 CHECKLIST.md                       # Implementation checklist
│
├── 📁 user/                              # Main user application
│   │
│   ├── 📄 package.json                   # Frontend dependencies
│   ├── 📄 package-lock.json
│   ├── 📄 .env.example                   # Environment variables template
│   ├── 📄 README.md                      # Frontend documentation
│   │
│   ├── 📁 public/                        # Static public files
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── locales/                      # i18n translations
│   │       ├── en/
│   │       └── ur/
│   │
│   ├── 📁 src/                           # React source code
│   │   ├── 📄 index.js                   # Entry point
│   │   ├── 📄 App.js                     # Main app component
│   │   │
│   │   ├── 📁 pages/                     # Page components
│   │   │   ├── RegisterPage.js          # User registration
│   │   │   ├── LoginPage.js             # User login
│   │   │   ├── OTPVerificationPage.js   # OTP verification
│   │   │   ├── SecurityQuestionsPage.js # Security questions setup
│   │   │   ├── FaceRecognitionPage.js   # Face recognition setup
│   │   │   ├── FingerprintSetupPage.js  # Fingerprint setup
│   │   │   ├── UserDashboard.js         # User dashboard
│   │   │   ├── CastVote.js              # Voting interface
│   │   │   ├── VoteSuccess.js           # Vote confirmation
│   │   │   ├── MeetCandidates.js        # Candidate information
│   │   │   ├── OngoingElections.js      # Active elections
│   │   │   ├── VoterManagement.jsx      # Voter management
│   │   │   ├── LiveAnalytics.jsx        # Real-time analytics
│   │   │   ├── ReportsExport.js         # Report generation
│   │   │   ├── SupportChatbot.js        # Support chat
│   │   │   ├── PrivacyPolicyPage.js     # Privacy policy
│   │   │   ├── TermsConditionsPage.js   # Terms & conditions
│   │   │   ├── ManageCandidates.jsx     # Candidate management
│   │   │   └── ManageParty.jsx          # Party management
│   │   │
│   │   ├── 📁 components/                # Reusable components
│   │   │   ├── Sidebar.js               # Navigation sidebar
│   │   │   ├── Header.js                # Header component
│   │   │   ├── Footer.js                # Footer component
│   │   │   └── LanguageSelector.js      # Language switcher
│   │   │
│   │   ├── 📁 services/                  # API services
│   │   │   ├── api.js                   # API client
│   │   │   ├── authService.js           # Auth API calls
│   │   │   ├── voteService.js           # Voting API calls
│   │   │   ├── electionService.js       # Election API calls
│   │   │   └── translationService.js    # Translation service
│   │   │
│   │   ├── 📁 utils/                     # Utility functions
│   │   │   ├── webauthn.js              # WebAuthn helpers
│   │   │   ├── validation.js            # Form validation
│   │   │   └── constants.js             # App constants
│   │   │
│   │   └── 📁 CSS/                       # Stylesheets
│   │       ├── App.css
│   │       ├── voter-management.css
│   │       ├── live-analytics.css
│   │       └── ReportsExport.css
│   │
│   └── 📁 backend/                       # Node.js backend
│       │
│       ├── 📄 server.js                  # Main server file
│       ├── 📄 package.json               # Backend dependencies
│       ├── 📄 package-lock.json
│       ├── 📄 .env                       # Environment variables
│       ├── 📄 README.md                  # Backend documentation
│       ├── 📄 API_DOCUMENTATION.md       # Complete API docs
│       │
│       ├── 📁 config/                    # Configuration
│       │   └── db.js                     # MongoDB connection
│       │
│       ├── 📁 models/                    # Mongoose models (Database schemas)
│       │   ├── User.js                   # User model (Auth, Biometrics)
│       │   ├── Election.js               # Election model
│       │   ├── Candidate.js              # Candidate model
│       │   ├── Party.js                  # Political party model
│       │   ├── Vote.js                   # Vote model (with fraud detection)
│       │   ├── FraudLog.js               # Fraud detection logs
│       │   ├── SecurityQuestion.js       # Security questions
│       │   └── Analytics.js              # Analytics data
│       │
│       ├── 📁 controllers/               # Business logic
│       │   ├── authController.js         # Authentication logic
│       │   │   ├── register()            # User registration
│       │   │   ├── verifyOTP()          # OTP verification
│       │   │   ├── resendOTP()          # Resend OTP
│       │   │   ├── login()              # User login
│       │   │   ├── setSecurityQuestions() # Security setup
│       │   │   ├── getSecurityQuestions() # Get questions
│       │   │   ├── generateBiometricRegistration() # Biometric setup
│       │   │   ├── verifyBiometricRegistration() # Verify biometric
│       │   │   ├── generateBiometricAuthentication() # Auth options
│       │   │   ├── verifyBiometricAuthentication() # Verify auth
│       │   │   └── getMe()              # Get current user
│       │   │
│       │   ├── voteController.js         # Voting logic
│       │   │   ├── castVote()           # Cast vote with verification
│       │   │   ├── getReceipt()         # Get vote receipt
│       │   │   ├── verifySecurityQuestions() # Verify before vote
│       │   │   └── getVotingHistory()   # User's vote history
│       │   │
│       │   ├── adminController.js        # Admin operations
│       │   │   ├── getElections()       # List elections
│       │   │   ├── getElection()        # Get single election
│       │   │   ├── createElection()     # Create new election
│       │   │   ├── updateElection()     # Update election
│       │   │   ├── deleteElection()     # Delete election
│       │   │   ├── getParties()         # List parties
│       │   │   ├── createParty()        # Create party
│       │   │   ├── updateParty()        # Update party
│       │   │   ├── deleteParty()        # Delete party
│       │   │   ├── getCandidates()      # List candidates
│       │   │   ├── createCandidate()    # Create candidate
│       │   │   ├── updateCandidate()    # Update candidate
│       │   │   ├── deleteCandidate()    # Delete candidate
│       │   │   ├── getUsers()           # List users
│       │   │   ├── getDashboardStats()  # Dashboard stats
│       │   │   ├── getFraudLogs()       # Fraud logs
│       │   │   └── resolveFraudLog()    # Resolve fraud case
│       │   │
│       │   └── electionController.js     # Public election data
│       │       ├── getActiveElections()  # Active elections
│       │       ├── getElectionDetails()  # Election info
│       │       ├── getElectionResults()  # Results
│       │       ├── getParties()          # Public parties
│       │       ├── getPartyDetails()     # Party info
│       │       ├── getCandidatesByElection() # Election candidates
│       │       └── getCandidateDetails() # Candidate info
│       │
│       ├── 📁 routes/                    # API routes
│       │   ├── authRoutes.js             # Auth endpoints
│       │   │   ├── POST /register
│       │   │   ├── POST /verify-otp
│       │   │   ├── POST /resend-otp
│       │   │   ├── POST /login
│       │   │   ├── GET  /security-questions/list
│       │   │   ├── POST /security-questions
│       │   │   ├── POST /biometric/register-options
│       │   │   ├── POST /biometric/register-verify
│       │   │   ├── POST /biometric/auth-options
│       │   │   ├── POST /biometric/auth-verify
│       │   │   └── GET  /me
│       │   │
│       │   ├── voteRoutes.js             # Voting endpoints
│       │   │   ├── POST /cast
│       │   │   ├── POST /verify-security
│       │   │   ├── GET  /receipt/:receiptNumber
│       │   │   └── GET  /history
│       │   │
│       │   ├── adminRoutes.js            # Admin endpoints
│       │   │   ├── GET    /stats
│       │   │   ├── GET    /elections
│       │   │   ├── POST   /elections
│       │   │   ├── GET    /elections/:id
│       │   │   ├── PUT    /elections/:id
│       │   │   ├── DELETE /elections/:id
│       │   │   ├── GET    /parties
│       │   │   ├── POST   /parties
│       │   │   ├── PUT    /parties/:id
│       │   │   ├── DELETE /parties/:id
│       │   │   ├── GET    /candidates
│       │   │   ├── POST   /candidates
│       │   │   ├── PUT    /candidates/:id
│       │   │   ├── DELETE /candidates/:id
│       │   │   ├── GET    /users
│       │   │   ├── GET    /fraud-logs
│       │   │   └── PUT    /fraud-logs/:id/resolve
│       │   │
│       │   └── publicRoutes.js           # Public endpoints
│       │       ├── GET /elections
│       │       ├── GET /elections/:id
│       │       ├── GET /elections/:id/results
│       │       ├── GET /elections/:electionId/candidates
│       │       ├── GET /parties
│       │       ├── GET /parties/:id
│       │       └── GET /candidates/:id
│       │
│       ├── 📁 middleware/                # Express middleware
│       │   ├── auth.js                   # JWT authentication
│       │   │   ├── protect()            # Verify JWT token
│       │   │   ├── authorize()          # Role-based access
│       │   │   └── optionalAuth()       # Optional auth
│       │   │
│       │   ├── rateLimiter.js           # Rate limiting
│       │   │   ├── authLimiter          # 5 req/15min
│       │   │   ├── generalLimiter       # 100 req/15min
│       │   │   ├── voteLimiter          # 10 req/hour
│       │   │   └── otpLimiter           # 3 req/15min
│       │   │
│       │   ├── validation.js            # Input validation
│       │   │   ├── validateRegistration()
│       │   │   ├── validateLogin()
│       │   │   ├── validateVote()
│       │   │   └── sanitizeInput()
│       │   │
│       │   └── error.js                 # Error handling
│       │       └── errorHandler()       # Centralized errors
│       │
│       ├── 📁 utils/                    # Utility functions
│       │   ├── jwt.js                   # JWT utilities
│       │   │   ├── generateToken()     # Create token
│       │   │   └── verifyToken()       # Verify token
│       │   │
│       │   ├── webauthn.js              # WebAuthn utilities
│       │   │   ├── generateChallenge()
│       │   │   ├── generateRegistrationOptions()
│       │   │   ├── generateAuthenticationOptions()
│       │   │   ├── verifyRegistrationResponse()
│       │   │   └── verifyAuthenticationResponse()
│       │   │
│       │   ├── encryption.js            # Encryption utilities
│       │   │   ├── encrypt()           # AES-256 encryption
│       │   │   ├── decrypt()           # Decryption
│       │   │   ├── hashData()          # SHA-256 hashing
│       │   │   └── generateSecureToken() # Token generation
│       │   │
│       │   ├── sendEmail.js             # Email service
│       │   │   └── sendEmail()         # Send email with nodemailer
│       │   │
│       │   ├── socketHandler.js         # WebSocket management
│       │   │   ├── setupSocketIO()     # Socket.io setup
│       │   │   ├── emitVoteUpdate()    # Broadcast votes
│       │   │   ├── emitFraudAlert()    # Send fraud alerts
│       │   │   └── updateAnalytics()   # Update analytics
│       │   │
│       │   └── seedDatabase.js          # Database seeder
│       │       ├── seedSecurityQuestions()
│       │       ├── seedParties()
│       │       ├── seedAdminUser()
│       │       ├── seedTestVoters()
│       │       ├── seedCandidates()
│       │       └── seedElections()
│       │
│       └── 📁 ai_fraud_detection/       # Python AI Module
│           ├── 📄 app.py                 # Flask application
│           │   ├── FraudDetectionModel class
│           │   │   ├── initialize_model()
│           │   │   ├── extract_features()
│           │   │   ├── calculate_risk_score()
│           │   │   └── predict()
│           │   │
│           │   └── API Endpoints:
│           │       ├── GET  /             # API info
│           │       ├── GET  /health       # Health check
│           │       ├── POST /predict      # Predict fraud
│           │       ├── POST /batch-predict # Batch prediction
│           │       ├── POST /train        # Train model
│           │       └── POST /analytics    # Get analytics
│           │
│           ├── 📄 requirements.txt       # Python dependencies
│           │   ├── flask==2.3.2
│           │   ├── flask-cors==4.0.0
│           │   ├── numpy==1.24.3
│           │   ├── scikit-learn==1.3.0
│           │   ├── joblib==1.3.1
│           │   └── pandas==2.0.3
│           │
│           ├── 📄 .env                   # AI environment vars
│           └── 📄 README.md              # AI module documentation
│
└── 📁 admin/                            # Admin dashboard (separate app)
    ├── 📄 package.json
    ├── 📁 src/
    │   └── (Similar structure to user frontend)
    └── 📁 node_modules/

```

---

## 📊 File Statistics

### Backend
- **Total Files**: 25+
- **Models**: 8 files
- **Controllers**: 4 files
- **Routes**: 4 files
- **Middleware**: 4 files
- **Utils**: 6 files
- **Config**: 1 file

### Frontend
- **Total Files**: 20+
- **Pages**: 15+ components
- **Services**: 5 files
- **Utils**: 3 files
- **CSS**: 4+ files

### AI Module
- **Total Files**: 4
- **Main App**: 1 file
- **Config**: 2 files
- **Docs**: 1 file

### Documentation
- **Total Files**: 5
- README, API Docs, Installation Guide, Summary, Checklist

---

## 🔑 Key Directories Explained

### `/models` - Database Schemas
Contains Mongoose models that define the structure of data in MongoDB. Each model represents a collection in the database.

### `/controllers` - Business Logic
Contains the core functionality of the application. Each controller handles specific business operations like authentication, voting, admin tasks.

### `/routes` - API Endpoints
Defines the API routes and connects them to controller functions. Includes middleware for authentication and validation.

### `/middleware` - Request Processing
Contains functions that process requests before they reach controllers. Handles authentication, rate limiting, validation, and errors.

### `/utils` - Helper Functions
Reusable utility functions used across the application. Includes JWT, encryption, email, WebSocket, and database utilities.

### `/ai_fraud_detection` - Python AI
Standalone Python Flask application for fraud detection. Can be deployed separately or together with the main backend.

---

## 🚀 Entry Points

### Main Application
- **Frontend**: `user/src/index.js` → Renders React app
- **Backend**: `user/backend/server.js` → Starts Express server
- **AI Module**: `user/backend/ai_fraud_detection/app.py` → Starts Flask server

### Scripts
- **Windows**: `START.bat` → Launches all 3 servers
- **Mac/Linux**: `START.sh` → Launches all 3 servers
- **Seeder**: `user/backend/utils/seedDatabase.js` → Seeds database

---

## 📦 Dependencies Overview

### Backend Dependencies (package.json)
```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT tokens",
  "nodemailer": "Email service",
  "socket.io": "WebSocket server",
  "helmet": "Security headers",
  "cors": "CORS middleware",
  "validator": "Input validation",
  "dotenv": "Environment variables",
  "express-rate-limit": "Rate limiting",
  "express-mongo-sanitize": "MongoDB injection prevention",
  "hpp": "HTTP parameter pollution prevention",
  "axios": "HTTP client"
}
```

### Frontend Dependencies
```json
{
  "react": "UI library",
  "react-dom": "React DOM",
  "react-router-dom": "Routing",
  "i18next": "Internationalization",
  "bootstrap-icons": "Icons",
  "socket.io-client": "WebSocket client"
}
```

### AI Module Dependencies
```txt
flask: Web framework
flask-cors: CORS support
numpy: Numerical computing
scikit-learn: Machine learning
pandas: Data manipulation
joblib: Model serialization
```

---

## 🔐 Environment Variables

### Backend (.env)
- `PORT`: Server port (5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing key
- `JWT_EXPIRE`: Token expiration (7d)
- `EMAIL_USER`: Gmail address
- `EMAIL_PASS`: Gmail app password
- `FROM_EMAIL`: Sender email
- `FROM_NAME`: Sender name
- `NODE_ENV`: Environment (development/production)
- `ENCRYPTION_KEY`: AES encryption key
- `CLIENT_URL`: Frontend URL
- `AI_FRAUD_API`: AI module URL
- `RP_ID`: WebAuthn relying party ID

### AI Module (.env)
- `AI_PORT`: Flask server port (5001)
- `FLASK_ENV`: Environment
- `MODEL_PATH`: ML model directory
- `LOG_LEVEL`: Logging level

---

## 📝 File Naming Conventions

- **Models**: PascalCase (User.js, Election.js)
- **Controllers**: camelCase with "Controller" suffix (authController.js)
- **Routes**: camelCase with "Routes" suffix (authRoutes.js)
- **Middleware**: camelCase (auth.js, rateLimiter.js)
- **Utils**: camelCase (jwt.js, encryption.js)
- **React Components**: PascalCase (RegisterPage.js, UserDashboard.js)
- **CSS Files**: kebab-case (voter-management.css)

---

## 🎯 Import Paths

### Backend Imports
```javascript
// Models
const User = require('../models/User');

// Controllers
const { register } = require('../controllers/authController');

// Middleware
const { protect } = require('../middleware/auth');

// Utils
const { generateToken } = require('../utils/jwt');
```

### Frontend Imports
```javascript
// Components
import RegisterPage from './pages/RegisterPage';

// Services
import { registerUser } from './services/authService';

// Utils
import { validateCNIC } from './utils/validation';
```

---

This structure follows industry best practices and provides clear separation of concerns, making the codebase maintainable, scalable, and easy to understand.
