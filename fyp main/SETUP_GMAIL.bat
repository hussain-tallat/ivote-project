@echo off
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║                                                       ║
echo ║         iVotePK - Gmail Configuration Setup          ║
echo ║                                                       ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo This script will configure Gmail for sending OTP emails.
echo.
echo ⚠️  BEFORE YOU START:
echo.
echo 1. Enable 2-Factor Authentication on your Gmail
echo 2. Generate App Password at: myaccount.google.com/apppasswords
echo 3. Have your Gmail address and App Password ready
echo.
pause
echo.

set /p GMAIL_ADDRESS="Enter your Gmail address (e.g., yourname@gmail.com): "
echo.
set /p APP_PASSWORD="Enter your Gmail App Password (16 characters, no spaces): "
echo.

echo.
echo Updating .env file...
echo.

cd /d "%~dp0user\backend"

echo PORT=5000> .env
echo MONGO_URI=mongodb+srv://HUSSAIN:hussain786@cluster0.qlovyqz.mongodb.net/ivotepk?retryWrites=true^&w=majority>> .env
echo JWT_SECRET=ivotepk_secure_jwt_secret_key_2024_production_level_system_change_in_prod>> .env
echo JWT_EXPIRE=7d>> .env
echo EMAIL_USER=%GMAIL_ADDRESS%>> .env
echo EMAIL_PASS=%APP_PASSWORD%>> .env
echo FROM_EMAIL=%GMAIL_ADDRESS%>> .env
echo FROM_NAME=iVotePK>> .env
echo NODE_ENV=development>> .env
echo ENCRYPTION_KEY=ivotepk_encryption_key_32_chars_long_secure_key_2024>> .env
echo CLIENT_URL=http://localhost:3000>> .env
echo AI_FRAUD_API=http://localhost:5001>> .env
echo RP_ID=localhost>> .env

echo.
echo ✅ .env file updated successfully!
echo.
echo Your configuration:
echo   Gmail: %GMAIL_ADDRESS%
echo   App Password: %APP_PASSWORD%
echo.
echo.
echo 🔄 Now restart your backend server!
echo.
echo Press Ctrl+C in the backend terminal, then run:
echo   node server.js
echo.
echo OR just close and reopen START.bat
echo.
pause
