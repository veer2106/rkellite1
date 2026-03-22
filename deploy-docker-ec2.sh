#!/bin/bash

# 🚀 Docker Deployment Script for RK Ellite Restaurant on AWS EC2
# This script will deploy your application using Docker and Docker Compose

set -e  # Exit on error

# Configuration
EC2_IP="13.233.0.43"
EC2_USER="ec2-user"
SSH_KEY="/Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/cafe.pem"
GITHUB_REPO="https://github.com/veereshpaidcoders/restaurant-cafe.git"
BRANCH="feature-1"
APP_DIR="restaurant-cafe"

echo "🚀 Starting Docker deployment to EC2..."
echo "📍 EC2 IP: $EC2_IP"
echo "📦 Branch: $BRANCH"
echo ""

# Function to run commands on EC2
run_on_ec2() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$@"
}

# Step 1: Check if Docker is installed
echo "🐳 Step 1/7: Checking Docker installation..."
run_on_ec2 << 'EOF'
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user
else
    echo "Docker already installed"
    sudo systemctl start docker || true
fi
EOF

# Step 2: Install Docker Compose
echo "🐳 Step 2/7: Installing Docker Compose..."
run_on_ec2 << 'EOF'
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi
docker-compose --version
EOF

# Step 3: Clone/Update repository
echo "📂 Step 3/7: Cloning/Updating repository..."
run_on_ec2 << EOF
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    git clone $GITHUB_REPO
    cd $APP_DIR
    git checkout $BRANCH
fi
EOF

# Step 4: Create .env file
echo "⚙️  Step 4/7: Creating environment file..."
run_on_ec2 << 'ENVEOF'
cd restaurant-cafe
cat > .env << 'INNEREOF'
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=cafe_user
DB_PASSWORD=VeerDag@123456
DB_NAME=restaurant_db

# Application Configuration
NODE_ENV=production
PORT=5001
CLIENT_URL=http://13.233.0.43:3000

# JWT Configuration
JWT_SECRET=ChangeThisToSomethingSecure12345678cafe
JWT_EXPIRY=7d

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# AWS Configuration
AWS_REGION=ap-south-1
INNEREOF
chmod 600 .env
ENVEOF

# Step 5: Stop existing containers
echo "🛑 Step 5/7: Stopping existing containers..."
run_on_ec2 << 'EOF'
cd restaurant-cafe
sudo docker-compose down || true
EOF

# Step 6: Build and start Docker containers
echo "🏗️  Step 6/7: Building and starting Docker containers..."
run_on_ec2 << 'EOF'
cd restaurant-cafe
sudo docker-compose build
sudo docker-compose up -d
sleep 10
sudo docker-compose ps
EOF

# Step 7: Show container logs
echo "📋 Step 7/7: Checking container status..."
run_on_ec2 << 'EOF'
cd restaurant-cafe
echo ""
echo "Container Status:"
sudo docker-compose ps
echo ""
echo "Recent Logs:"
sudo docker-compose logs --tail=50
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   Backend API: http://13.233.0.43:5001"
echo "   Frontend: http://13.233.0.43:3000"
echo ""
echo "📋 Useful commands:"
echo "   Check logs: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && sudo docker-compose logs -f'"
echo "   Restart: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && sudo docker-compose restart'"
echo "   Stop: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && sudo docker-compose down'"
echo ""
