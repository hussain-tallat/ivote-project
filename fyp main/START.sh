#!/bin/bash

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║         iVotePK - Intelligent Voting System          ║"
echo "║              Quick Start Launcher                     ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

echo "🚀 Starting iVotePK System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed!"
    echo "Please install Python from https://www.python.org/"
    exit 1
fi

echo "✅ Node.js and Python detected"
echo ""

# Install backend dependencies
if [ ! -d "user/backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd user/backend
    npm install
    cd ../..
    echo ""
fi

# Install frontend dependencies
if [ ! -d "user/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd user
    npm install
    cd ..
    echo ""
fi

# Setup Python environment
if [ ! -d "user/backend/ai_fraud_detection/venv" ]; then
    echo "📦 Setting up Python environment..."
    cd user/backend/ai_fraud_detection
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ../../..
    echo ""
fi

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║  Starting 3 servers:                                 ║"
echo "║  1. Backend Server (Port 5000)                       ║"
echo "║  2. AI Module (Port 5001)                            ║"
echo "║  3. Frontend (Port 3000)                             ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Start Backend in new terminal
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/user/backend\" && npm run dev"'
    sleep 2
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/user/backend/ai_fraud_detection\" && source venv/bin/activate && python app.py"'
    sleep 2
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/user\" && npm start"'
else
    # Linux
    gnome-terminal -- bash -c "cd user/backend && npm run dev; bash" &
    sleep 2
    gnome-terminal -- bash -c "cd user/backend/ai_fraud_detection && source venv/bin/activate && python app.py; bash" &
    sleep 2
    gnome-terminal -- bash -c "cd user && npm start; bash" &
fi

echo ""
echo "✅ All servers are starting..."
echo ""
echo "🌐 Access points:"
echo "   Backend:  http://localhost:5000"
echo "   AI API:   http://localhost:5001"
echo "   Frontend: http://localhost:3000"
echo ""
echo "📝 Default Credentials:"
echo "   Admin:  admin@ivotepk.com / admin123456"
echo "   Voter:  voter1@test.com / voter123"
echo ""
echo "⚠️  Keep all terminal windows open!"
echo ""
