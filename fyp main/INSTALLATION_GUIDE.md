# iVotePK - Complete Installation Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software
- **Node.js** (v16.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Python** (v3.8.0 or higher) - [Download](https://www.python.org/downloads/)
- **pip** (comes with Python)
- **Git** - [Download](https://git-scm.com/downloads)
- **MongoDB Compass** (Optional, for database viewing) - [Download](https://www.mongodb.com/products/compass)

### Accounts Required
- **MongoDB Atlas** - Free tier account ([Sign up](https://www.mongodb.com/cloud/atlas/register))
- **Gmail** account - For sending OTP emails

---

## 🚀 Step-by-Step Installation

### Step 1: Verify Prerequisites

Open your terminal/command prompt and verify installations:

```bash
# Check Node.js version
node --version
# Should show v16.0.0 or higher

# Check npm version
npm --version

# Check Python version
python --version
# Should show 3.8.0 or higher

# Check pip version
pip --version
```

---

### Step 2: Download/Clone the Project

```bash
# If using Git
git clone <repository-url>
cd "fyp main"

# OR if you have a ZIP file
# Extract the ZIP and navigate to the folder
cd "path/to/fyp main"
```

---

### Step 3: Backend Setup

#### 3.1 Navigate to Backend Directory
```bash
cd user/backend
```

#### 3.2 Install Node.js Dependencies
```bash
npm install
```

This will install:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- nodemailer
- socket.io
- helmet
- cors
- And other dependencies...

**Wait for installation to complete (may take 2-5 minutes)**

#### 3.3 Configure Environment Variables

Open `.env` file in the backend directory and update:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Connection (IMPORTANT: Use your own connection string)
MONGO_URI=mongodb+srv://HUSSAIN:hussain786@cluster0.qlovyqz.mongodb.net/ivotepk?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_change_this_in_production
JWT_EXPIRE=7d

# Email Configuration (Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
FROM_EMAIL=noreply@ivotepk.com
FROM_NAME=iVotePK

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_here_1234567890ab

# Client URL
CLIENT_URL=http://localhost:3000

# AI Fraud Detection API
AI_FRAUD_API=http://localhost:5001
```

**🔴 IMPORTANT: Gmail App Password Setup**

1. Go to your Google Account: https://myaccount.google.com/
2. Security → 2-Step Verification (enable if not enabled)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use it in `EMAIL_PASS` (without spaces)

#### 3.4 Seed the Database

```bash
npm run seed
```

This will create:
- Admin account
- Test voter accounts
- Security questions
- Sample parties
- Sample candidates
- Sample elections

**Credentials Created:**
- Admin: `admin@ivotepk.com` / `admin123456`
- Voters: `voter1@test.com` to `voter5@test.com` / `voter123`

---

### Step 4: AI Fraud Detection Setup

#### 4.1 Navigate to AI Directory
```bash
# From backend directory
cd ai_fraud_detection
```

#### 4.2 Create Virtual Environment

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` in your terminal prompt.

#### 4.3 Install Python Dependencies
```bash
pip install -r requirements.txt
```

This will install:
- Flask
- Flask-CORS
- NumPy
- Scikit-learn
- Pandas

**Wait for installation to complete (may take 3-7 minutes)**

#### 4.4 Verify Installation
```bash
pip list
```

You should see all packages listed.

---

### Step 5: Frontend Setup

#### 5.1 Navigate to Frontend Directory
```bash
# From project root
cd user
```

#### 5.2 Install React Dependencies
```bash
npm install
```

This will install:
- react
- react-dom
- react-router-dom
- i18next (for language support)
- And other dependencies...

**Wait for installation to complete (may take 3-8 minutes)**

---

## ▶️ Running the Application

You need to run **THREE** servers simultaneously. Open **three separate terminals**:

### Terminal 1: Backend Server

```bash
cd user/backend
npm run dev
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════╗
║         iVotePK - Intelligent Voting System          ║
║  Server running on port 5000                         ║
║  Environment: development                            ║
╚═══════════════════════════════════════════════════════╝
```

The backend is now running at `http://localhost:5000`

---

### Terminal 2: AI Fraud Detection Server

```bash
cd user/backend/ai_fraud_detection

# Activate virtual environment first!
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

python app.py
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════╗
║         iVotePK AI Fraud Detection Module            ║
║  Running on port 5001                                ║
║  Model: Rule-based + ML Hybrid                       ║
╚═══════════════════════════════════════════════════════╝
```

The AI server is now running at `http://localhost:5001`

---

### Terminal 3: Frontend React Server

```bash
cd user
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view ivotepk-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The frontend will automatically open in your default browser at `http://localhost:3000`

---

## ✅ Verification & Testing

### 1. Test Backend API

Open your browser and visit: `http://localhost:5000`

You should see:
```json
{
  "success": true,
  "message": "iVotePK API - Intelligent Voting System",
  "version": "1.0.0"
}
```

### 2. Test AI Module

Visit: `http://localhost:5001`

You should see:
```json
{
  "success": true,
  "message": "iVotePK AI Fraud Detection API",
  "version": "1.0.0"
}
```

### 3. Test Frontend

Visit: `http://localhost:3000`

You should see the iVotePK home page with:
- Navigation bar
- Language selector (English/Urdu)
- Login/Register buttons

### 4. Test Complete Flow

#### Login as Admin:
1. Click "Login"
2. Enter:
   - Email: `admin@ivotepk.com`
   - Password: `admin123456`
3. You should reach the admin dashboard

#### Register as New Voter:
1. Click "Register"
2. Fill in the form
3. Check your email for OTP (if configured)
4. Complete security questions
5. Set up biometrics (simulated in development)

---

## 🗄️ Database Management

### View Database in MongoDB Compass

1. Open MongoDB Compass
2. Connect using: `mongodb+srv://HUSSAIN:hussain786@cluster0.qlovyqz.mongodb.net/`
3. Select database: `ivotepk`
4. You should see collections:
   - users
   - elections
   - candidates
   - parties
   - votes
   - fraudlogs
   - securityquestions
   - analytics

### Reset Database

To clear all data and reseed:

```bash
cd user/backend
npm run seed
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Port 5000 already in use"

**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

Or change `PORT` in `.env` file.

---

### Issue 2: "MongoDB connection failed"

**Solutions:**
1. Check internet connection
2. Verify MongoDB URI in `.env`
3. Whitelist your IP in MongoDB Atlas:
   - Go to Network Access
   - Add IP Address
   - Choose "Allow Access from Anywhere" (for development)

---

### Issue 3: "Email not sending"

**Solutions:**
1. Verify Gmail app password is correct
2. Check if 2-Step Verification is enabled
3. Try generating a new app password
4. Check EMAIL_USER and EMAIL_PASS in `.env`

---

### Issue 4: Python venv activation fails

**Windows PowerShell:**
```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try activating again.

---

### Issue 5: "Module not found" errors

**Backend:**
```bash
cd user/backend
rm -rf node_modules package-lock.json
npm install
```

**Frontend:**
```bash
cd user
rm -rf node_modules package-lock.json
npm install
```

**Python:**
```bash
cd user/backend/ai_fraud_detection
pip install -r requirements.txt --force-reinstall
```

---

### Issue 6: React won't start on port 3000

Edit `package.json` in user folder, change start script:

**Windows:**
```json
"start": "react-scripts start"
```

**Mac/Linux:**
```json
"start": "react-scripts start"
```

---

## 📱 Testing User Flows

### Complete Voter Registration Flow

1. Go to `http://localhost:3000`
2. Click "Register"
3. Fill in:
   - CNIC: `1234567890123` (13 digits)
   - Email: Your email
   - Phone: `+923001234567`
   - Password: `test123`
   - Name: `Test User`
4. Click Register
5. Check email for OTP
6. Enter OTP
7. Select 3 security questions and answers
8. Complete biometric setup (skip in dev)
9. You're registered!

### Voting Flow

1. Login with your account
2. Go to "Ongoing Elections"
3. Select an active election
4. View candidates
5. Click "Cast Vote"
6. Answer security questions
7. Confirm vote
8. Receive digital receipt

---

## 🔄 Development Workflow

### Making Changes

1. **Backend changes**: Server auto-restarts (nodemon)
2. **Frontend changes**: Page auto-reloads (React hot reload)
3. **AI module changes**: Restart Python server manually

### View Logs

- **Backend**: Check terminal running `npm run dev`
- **Frontend**: Check browser console (F12)
- **AI**: Check terminal running `python app.py`

---

## 📊 Project Structure Quick Reference

```
fyp-main/
├── user/
│   ├── backend/
│   │   ├── models/          # Database schemas
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API endpoints
│   │   ├── middleware/      # Auth, validation
│   │   ├── utils/           # Helper functions
│   │   ├── ai_fraud_detection/  # Python AI
│   │   └── server.js        # Main entry point
│   └── src/                 # React frontend
└── admin/                   # Admin dashboard
```

---

## 🎓 Next Steps

1. Read `API_DOCUMENTATION.md` for all endpoints
2. Read `README.md` for project overview
3. Explore the code structure
4. Test all features
5. Customize for your needs

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide first
2. Check error messages in terminal
3. Search online for specific errors
4. Check MongoDB Atlas dashboard
5. Verify all prerequisites

---

## ⚠️ Important Reminders

- ✅ Keep all 3 servers running
- ✅ Don't commit `.env` to Git
- ✅ Change default passwords
- ✅ Use HTTPS in production
- ✅ Backup database regularly

---

**Congratulations! 🎉 Your iVotePK system is now running!**

For questions: support@ivotepk.com

