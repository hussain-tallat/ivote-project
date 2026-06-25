@echo off
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║         iVotePK - Intelligent Voting System          ║
echo ║              Quick Start Launcher                     ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

echo 🚀 Starting iVotePK System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed!
    echo Please install Python from https://www.python.org/
    pause
    exit /b 1
)

echo ✅ Node.js and Python detected
echo.

REM Check if dependencies are installed
if not exist "user\backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd user\backend
    call npm install
    cd ..\..
    echo.
)

if not exist "user\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd user
    call npm install
    cd ..
    echo.
)

if not exist "user\backend\ai_fraud_detection\venv" (
    echo 📦 Setting up Python environment...
    cd user\backend\ai_fraud_detection
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
    cd ..\..\..
    echo.
)

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║  Opening 2 terminals for:                            ║
echo ║  1. Backend Server (Port 5000)                       ║
echo ║  2. Frontend (Port 3000)                             ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ⏳ Starting servers in 3 seconds...
timeout /t 3 /nobreak >nul

REM Start Backend
start "iVotePK Backend" cmd /k "cd user\backend && npm run dev"

REM Wait a bit
timeout /t 2 /nobreak >nul

REM Start Frontend
start "iVotePK Frontend" cmd /k "cd user && npm start"

echo.
echo ✅ All servers are starting...
echo.
echo 🌐 Access points:
echo    Backend:  http://localhost:5000
echo    Frontend: http://localhost:3000
echo.
echo 📝 Default Credentials:
echo    Admin:  admin@ivotepk.com / admin123456
echo    Voter:  voter1@test.com / voter123
echo.
echo ⚠️  Keep all terminal windows open!
echo.
pause
