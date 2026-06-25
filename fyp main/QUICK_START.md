# 🚀 Quick Start Guide - Running Your iVotePK Website

## ✅ **Current Status**
- ✅ Backend code is ready and working
- ❌ MongoDB authentication needs fixing
- ✅ Frontend is ready to run
- ❌ Python not installed yet

---

## 🎯 **Simple 3-Step Guide to Run Your Website**

### **Step 1: Fix MongoDB Connection (Required)**

You need to create your own MongoDB database because the current credentials don't work.

**Option A: Use MongoDB Atlas (Free, Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Create a new cluster (choose FREE tier)
4. Create a database user with username and password
5. Get your connection string
6. Open `fyp main\user\backend\.env`
7. Replace the `MONGO_URI` line with your connection string

**Option B: Use Local MongoDB**
1. Install MongoDB Community Server
2. Update `MONGO_URI` to: `mongodb://localhost:27017/ivotepk`

---

### **Step 2: Start Backend Server**

Open Command Prompt and run:

```bash
cd "C:\Users\HS TRADER\Downloads\fyp main\user\backend"
node server.js
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════╗
║         iVotePK - Intelligent Voting System          ║
║  Server running on port 5000                         ║
╚═══════════════════════════════════════════════════════╝
```

**Keep this terminal window open!**

---

### **Step 3: Start Frontend**

Open a **NEW** Command Prompt and run:

```bash
cd "C:\Users\HS TRADER\Downloads\fyp main\user"
npm start
```

Your browser will automatically open to http://localhost:3000

**Keep this terminal window open too!**

---

## ✅ **That's It! Your Website is Running!**

Visit: http://localhost:3000

---

## 🔧 **Optional: Add AI Module Later**

The AI fraud detection is optional. To add it:

1. Install Python from https://www.python.org/downloads/
2. Check "Add Python to PATH" during installation
3. Open a **third** Command Prompt:
   ```bash
   cd "C:\Users\HS TRADER\Downloads\fyp main\user\backend\ai_fraud_detection"
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

---

## 📝 **What You Need to Do NOW**

### **CRITICAL: Fix MongoDB**

The current MongoDB connection doesn't work. You have 2 options:

**Quick Option:** Create a free MongoDB Atlas account
1. Go to: https://www.mongodb.com/cloud/atlas/register
2. Sign up
3. Create free cluster
4. Get connection string
5. Update `.env` file

**Then you can run the website!**

---

## 🎉 **After Fixing MongoDB**

Just run these 2 commands in separate terminals:

**Terminal 1:**
```bash
cd "C:\Users\HS TRADER\Downloads\fyp main\user\backend"
node server.js
```

**Terminal 2:**
```bash
cd "C:\Users\HS TRADER\Downloads\fyp main\user"
npm start
```

**Your website will work! 🚀**

---

## 💡 **Why It's Not Working Now**

The MongoDB credentials in your `.env` file are not valid:
```
MONGO_URI=mongodb+srv://HUSSAIN:hussain786@cluster0...
```

This is causing "bad auth: authentication failed" error.

**Solution:** Create your own MongoDB database and update the connection string!

---

## 📞 **Need Help?**

1. Create MongoDB Atlas account (5 minutes)
2. Update `.env` with your connection string
3. Run `node server.js` in backend folder
4. Run `npm start` in user folder
5. Website opens at http://localhost:3000

**That's all you need to do!** ✅
