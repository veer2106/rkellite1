#!/bin/bash

# 🚀 EC2 Deployment Script for RK Ellite Restaurant
# This script will deploy your application to EC2 with Docker, Nginx, and SSL

set -e  # Exit on error

# Configuration
EC2_IP="13.233.0.43"
EC2_USER="ec2-user"
SSH_KEY="/Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/cafe.pem"
DOMAIN="cafe-delicacy-restaurant.com"
APP_SUBDOMAIN="app.cafe-delicacy-restaurant.com"
API_SUBDOMAIN="api.cafe-delicacy-restaurant.com"
GITHUB_REPO="https://github.com/veereshpaidcoders/restaurant-cafe.git"
BRANCH="feature-1"

echo "🚀 Starting deployment to EC2..."
echo "📍 EC2 IP: $EC2_IP"
echo "🌐 Domain: $DOMAIN"
echo ""

# Function to run commands on EC2
run_on_ec2() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$@"
}

# Step 1: Update system and install dependencies
echo "📦 Step 1/8: Installing system dependencies..."
run_on_ec2 << 'EOF'
sudo yum update -y
sudo yum install -y git curl wget
EOF

# Step 2: Install Docker
echo "🐳 Step 2/8: Installing Docker..."
run_on_ec2 << 'EOF'
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user
EOF

# Step 3: Install Docker Compose
echo "🐳 Step 3/8: Installing Docker Compose..."
run_on_ec2 << 'EOF'
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
EOF

# Step 4: Clone repository
echo "📂 Step 4/8: Cloning repository..."
run_on_ec2 << EOF
rm -rf restaurant-cafe
git clone $GITHUB_REPO
cd restaurant-cafe
git checkout $BRANCH
EOF

# Step 5: Create .env file
echo "⚙️  Step 5/8: Creating environment file..."
run_on_ec2 << 'EOF'
cat > restaurant-cafe/.env << 'ENVEOF'
# Database Configuration
DB_HOST=db
DB_PORT=5432
DB_USER=cafe_user
DB_PASSWORD=VeerDag@123456
DB_NAME=restaurant_db

# Application Configuration
NODE_ENV=production
PORT=5001
CLIENT_URL=https://app.cafe-delicacy-restaurant.com

# JWT Configuration
JWT_SECRET=ChangeThisToSomethingSecure12345678cafe
JWT_EXPIRY=7d

# Redis Configuration (if using)
REDIS_HOST=redis
REDIS_PORT=6379

# SMTP Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# AWS Configuration
AWS_REGION=ap-south-1
ENVEOF
chmod 600 restaurant-cafe/.env
EOF

# Step 6: Build and start Docker containers
echo "🏗️  Step 6/8: Building and starting Docker containers..."
run_on_ec2 << 'EOF'
cd restaurant-cafe
# Need to use newgrp to apply docker group
sg docker -c "docker-compose build"
sg docker -c "docker-compose up -d"
sg docker -c "docker-compose ps"
EOF

# Step 7: Install and configure Nginx
echo "🌐 Step 7/8: Installing and configuring Nginx..."
run_on_ec2 << 'EOF'
sudo yum install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Create Nginx configuration
sudo tee /etc/nginx/conf.d/cafe-delicacy.conf > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com app.cafe-delicacy-restaurant.com api.cafe-delicacy-restaurant.com;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx
EOF

# Step 8: Install SSL certificates
echo "🔒 Step 8/8: Installing SSL certificates..."
run_on_ec2 << 'EOF'
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Stop nginx temporarily for standalone certbot
sudo systemctl stop nginx

# Get SSL certificate
sudo certbot certonly --standalone \
  -d cafe-delicacy-restaurant.com \
  -d www.cafe-delicacy-restaurant.com \
  -d app.cafe-delicacy-restaurant.com \
  -d api.cafe-delicacy-restaurant.com \
  --non-interactive \
  --agree-tos \
  --email admin@cafe-delicacy-restaurant.com \
  || echo "⚠️  SSL certificate installation failed. You may need to do this manually."

# Update Nginx config for HTTPS
sudo tee /etc/nginx/conf.d/cafe-delicacy.conf > /dev/null << 'NGINXEOF'
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com app.cafe-delicacy-restaurant.com api.cafe-delicacy-restaurant.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com app.cafe-delicacy-restaurant.com api.cafe-delicacy-restaurant.com;

    ssl_certificate /etc/letsencrypt/live/cafe-delicacy-restaurant.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cafe-delicacy-restaurant.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API routes
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

# Start nginx
sudo systemctl start nginx
sudo systemctl reload nginx
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your application should be accessible at:"
echo "   https://cafe-delicacy-restaurant.com"
echo "   https://app.cafe-delicacy-restaurant.com"
echo "   https://api.cafe-delicacy-restaurant.com/api/health"
echo ""
echo "📋 Next steps:"
echo "   1. Wait 2-3 minutes for services to start"
echo "   2. Test the endpoints above"
echo "   3. Check logs: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd restaurant-cafe && docker-compose logs'"
echo ""
