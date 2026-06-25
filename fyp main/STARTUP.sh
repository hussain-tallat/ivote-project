#!/bin/bash

# iVotePK - Complete Startup Guide
# Run this script from the project root directory

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     iVotePK - Intelligent Voting System                   ║"
echo "║     Complete Startup Guide                                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Please install Node.js v14 or higher"
    exit 1
fi
echo -e "${GREEN}✓ Node.js installed: $(node --version)${NC}"

if ! command -v npm &> /dev/null; then
    echo "⚠️  NPM not found. Please install NPM"
    exit 1
fi
echo -e "${GREEN}✓ NPM installed: $(npm --version)${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}Setting up Backend...${NC}"
cd "user/backend" || exit 1

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    cat > .env << 'EOF'
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/ivotepk_db
JWT_SECRET=your_jwt_secret_key_change_this
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SENDER_EMAIL=noreply@ivotepk.pk
SENDER_NAME=iVotePK
EOF
    echo -e "${YELLOW}⚠️  .env created with default values. Please update with your actual configuration.${NC}"
fi

echo -e "${GREEN}✓ Backend ready${NC}"
cd - > /dev/null || exit 1

# Setup Frontend (Voter + Admin)
echo -e "${BLUE}Setting up Frontend...${NC}"
cd "user" || exit 1

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}Frontend ready${NC}"
cd - > /dev/null || exit 1

echo ""
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ All dependencies installed successfully!${NC}"
echo -e "${GREEN}═════════════════════════════════════════════════════════${NC}"
echo ""

# Display startup instructions
echo -e "${BLUE}To start the application, open 2 separate terminal windows:${NC}"
echo ""

echo -e "${YELLOW}Terminal 1 - Start Backend (port 5000):${NC}"
echo -e "${BLUE}cd user/backend && npm start${NC}"
echo ""

echo -e "${YELLOW}Terminal 2 - Start Frontend (voter + admin, port 3000):${NC}"
echo -e "${BLUE}cd user && npm start${NC}"
echo ""



echo -e "${YELLOW}API Documentation:${NC}"
echo "Base URL: http://localhost:5000/api"
echo "- Auth: /auth"
echo "- Vote: /vote"
echo "- Public: /public"
echo "- Admin: /admin"
echo ""

echo -e "${YELLOW}Application URLs:${NC}"
echo "Website: http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo "Voter Management: http://localhost:3000/admin/voters"
echo "API: http://localhost:5000"
echo ""

echo -e "${BLUE}Default Admin Login:${NC}"
echo "Email: admin@ivotepk.pk (or register first)"
echo "Password: (as set during registration)"
echo ""

echo -e "${YELLOW}Important Notes:${NC}"
echo "1. MongoDB must be running (local or Atlas connection)"
echo "2. Update .env file with your email credentials for OTP"
echo "3. JWT_SECRET should be changed in production"
echo "4. First admin must be registered, then can only login with OTP"
echo ""

echo -e "${GREEN}Happy Voting!${NC}"
echo ""
