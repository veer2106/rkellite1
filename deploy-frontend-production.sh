#!/bin/bash

# ============================================================================
# Frontend Production Deployment Script
# Cafe Delicacy Restaurant - Frontend Deployment
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EC2_IP="13.232.173.130"
EC2_USER="ec2-user"
SSH_KEY="/Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/cafe.pem"
APP_DIR="restaurant-cafe"
FRONTEND_PORT=3000

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Frontend Production Deployment${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Step 1: Build Frontend
echo -e "${YELLOW}📦 Step 1: Building React Frontend...${NC}"
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd restaurant-cafe/frontend
echo "Building production bundle..."
npm run build
echo "✅ Build completed!"
ls -lh build/ | head -10
ENDSSH

echo -e "${GREEN}✅ Frontend built successfully!${NC}"
echo ""

# Step 2: Install serve (if not already installed)
echo -e "${YELLOW}📦 Step 2: Installing serve package globally...${NC}"
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
if ! command -v serve &> /dev/null; then
    echo "Installing serve globally..."
    sudo npm install -g serve
else
    echo "serve is already installed"
fi
serve --version
ENDSSH

echo -e "${GREEN}✅ Serve package ready!${NC}"
echo ""

# Step 3: Start Frontend with PM2
echo -e "${YELLOW}🚀 Step 3: Starting Frontend with PM2...${NC}"
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
cd restaurant-cafe/frontend

# Stop existing frontend process if running
if pm2 list | grep -q "restaurant-frontend"; then
    echo "Stopping existing frontend process..."
    pm2 stop restaurant-frontend
    pm2 delete restaurant-frontend
fi

# Start frontend with PM2
echo "Starting frontend on port 3000..."
pm2 start "npx serve -s build -l 3000" --name restaurant-frontend

# Save PM2 configuration
pm2 save

# Show status
pm2 status
pm2 logs restaurant-frontend --lines 20 --nostream
ENDSSH

echo -e "${GREEN}✅ Frontend started successfully!${NC}"
echo ""

# Step 4: Verify Frontend is Running
echo -e "${YELLOW}🔍 Step 4: Verifying Frontend...${NC}"
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'ENDSSH'
sleep 3
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is responding on port 3000"
else
    echo "❌ Frontend is not responding"
    exit 1
fi
ENDSSH

echo -e "${GREEN}✅ Frontend verified!${NC}"
echo ""

# Step 5: Check PM2 Status
echo -e "${YELLOW}📊 Step 5: PM2 Process Status...${NC}"
ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" "pm2 status"
echo ""

echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}✅ Frontend Deployment Complete!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${GREEN}Frontend Access:${NC}"
echo -e "  Local (on EC2):  ${BLUE}http://localhost:3000${NC}"
echo -e "  Public IP:       ${BLUE}http://$EC2_IP:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  Next Steps:${NC}"
echo "  1. Open port 3000 in EC2 Security Group"
echo "  2. Install and configure Nginx for reverse proxy"
echo "  3. Setup SSL certificates with Let's Encrypt"
echo "  4. Configure domain routing in Nginx"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  View logs:    ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 logs restaurant-frontend'"
echo "  Restart:      ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 restart restaurant-frontend'"
echo "  Stop:         ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 stop restaurant-frontend'"
echo "  Status:       ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'pm2 status'"
echo ""
