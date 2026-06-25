@echo off
REM iVotePK - Complete Startup Guide for Windows
REM Run this script from the project root directory

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║     iVotePK - Intelligent Voting System                   ║
echo ║     Complete Startup Guide (Windows)                      ║
echo ║                                                            ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Check Node.js
echo Checking prerequisites...
node --version > nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js not found. Please install Node.js v14 or higher
    exit /b 1
)
echo ✓ Node.js is installed
for /f "tokens=*" %%i in ('node --version') do echo   Version: %%i
echo.

npm --version > nul 2>&1
if errorlevel 1 (
    echo ⚠️  NPM not found. Please install NPM
    exit /b 1
)
echo ✓ NPM is installed
for /f "tokens=*" %%i in ('npm --version') do echo   Version: %%i
echo.

REM Setup Backend
echo Setting up Backend...
cd /d "user\backend" || exit /b 1

if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)

if not exist ".env" (
    echo ⚠️  .env file not found. Creating with defaults...
    (
        echo PORT=5000
        echo NODE_ENV=development
        echo CLIENT_URL=http://localhost:3000
        echo MONGODB_URI=mongodb://localhost:27017/ivotepk_db
        echo JWT_SECRET=your_jwt_secret_key_change_this
        echo JWT_EXPIRE=7d
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your_email@gmail.com
        echo SMTP_PASS=your_app_password
        echo SENDER_EMAIL=noreply@ivotepk.pk
        echo SENDER_NAME=iVotePK
    ) > .env
    echo ⚠️  .env created. Please update with your actual configuration.
)

echo ✓ Backend ready
cd /d "../.." || exit /b 1

REM Setup Frontend (Voter + Admin)
echo Setting up Frontend...
cd /d "user" || exit /b 1

if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo Frontend ready
cd /d ".." || exit /b 1

echo.
echo ═════════════════════════════════════════════════════════
echo ✓ All dependencies installed successfully!
echo ═════════════════════════════════════════════════════════
echo.

echo To start the application, open 2 separate command prompts:
echo.

echo Terminal 1 - Start Backend [port 5000]:
echo   cd user\backend && npm start
echo.

echo Terminal 2 - Start Frontend [voter + admin, port 3000]:
echo   cd user && npm start
echo.


echo ═════════════════════════════════════════════════════════
echo Application URLs:
echo   Website:    http://localhost:3000
echo   Admin:      http://localhost:3000/admin
echo   Voters:     http://localhost:3000/admin/voters
echo   API:        http://localhost:5000
echo.
echo Important Notes:
echo   1. MongoDB must be running
echo   2. Update .env file with your email credentials
echo   3. Change JWT_SECRET in production
echo   4. First admin must register, then can only login with OTP
echo ═════════════════════════════════════════════════════════
echo.
pause
