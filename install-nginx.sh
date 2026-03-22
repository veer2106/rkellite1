#!/bin/bash

# Nginx Setup Script for Cafe Delicacy Restaurant
# This script installs and configures Nginx as a reverse proxy

set -e

echo "🔧 Installing and Configuring Nginx..."
echo "========================================"

# Step 1: Install Nginx
echo ""
echo "📦 Installing Nginx..."
sudo yum install -y nginx

# Step 2: Create Nginx configuration for the application
echo ""
echo "⚙️  Creating Nginx configuration..."

sudo tee /etc/nginx/conf.d/restaurant.conf > /dev/null << 'EOF'
# Frontend - Main domain and www
server {
    listen 80;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend - App subdomain
server {
    listen 80;
    server_name app.cafe-delicacy-restaurant.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Backend API
server {
    listen 80;
    server_name api.cafe-delicacy-restaurant.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Step 3: Test Nginx configuration
echo ""
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Step 4: Enable and start Nginx
echo ""
echo "🚀 Starting Nginx..."
sudo systemctl enable nginx
sudo systemctl restart nginx

echo ""
echo "✅ Nginx installation and configuration complete!"
echo ""
echo "📊 Your application is now accessible at:"
echo "   - http://cafe-delicacy-restaurant.com (Frontend)"
echo "   - http://www.cafe-delicacy-restaurant.com (Frontend)"
echo "   - http://app.cafe-delicacy-restaurant.com (Frontend)"
echo "   - http://api.cafe-delicacy-restaurant.com (Backend API)"
echo ""
echo "🔐 Next step: Install SSL certificates"
echo "   Run: sudo yum install -y certbot python3-certbot-nginx"
echo "   Then: sudo certbot --nginx -d cafe-delicacy-restaurant.com -d www.cafe-delicacy-restaurant.com -d app.cafe-delicacy-restaurant.com -d api.cafe-delicacy-restaurant.com"
