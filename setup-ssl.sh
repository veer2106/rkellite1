#!/bin/bash

# 🔒 SSL Certificate Setup Script for RK Ellite Restaurant
# This script will install Let's Encrypt SSL certificate using Certbot

set -e

EC2_IP="13.233.0.43"
EC2_USER="ec2-user"
SSH_KEY="/Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/cafe.pem"
DOMAIN="cafe-delicacy-restaurant.com"
EMAIL="admin@cafe-delicacy-restaurant.com"

echo "🔒 Starting SSL Certificate Setup..."
echo "📍 Domain: $DOMAIN"
echo "📧 Email: $EMAIL"
echo ""

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_IP" << 'EOF'

echo "📦 Installing Certbot..."
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx

echo "🔒 Obtaining SSL Certificate..."
# Stop nginx temporarily to allow certbot standalone mode
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d cafe-delicacy-restaurant.com \
  -d www.cafe-delicacy-restaurant.com \
  --non-interactive \
  --agree-tos \
  --email admin@cafe-delicacy-restaurant.com \
  --preferred-challenges http

echo "🔧 Updating Nginx configuration for HTTPS..."
sudo tee /etc/nginx/conf.d/rk-ellite.conf > /dev/null << 'NGINXCONF'
# RK Ellite Restaurant - Nginx Configuration with SSL
# Domain: cafe-delicacy-restaurant.com

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com;
    
    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name cafe-delicacy-restaurant.com www.cafe-delicacy-restaurant.com;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/cafe-delicacy-restaurant.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cafe-delicacy-restaurant.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (optional but recommended)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Increase client body size for file uploads
    client_max_body_size 50M;
    
    # Frontend - Serve React app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
    
    # Backend API
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
        
        # Timeouts for long requests
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        access_log off;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Logging
    access_log /var/log/nginx/rk-ellite-access.log;
    error_log /var/log/nginx/rk-ellite-error.log;
}
NGINXCONF

echo "✅ Nginx HTTPS configuration created"

# Update backend .env to use HTTPS
cd restaurant-cafe
sed -i 's|CLIENT_URL=http://cafe-delicacy-restaurant.com|CLIENT_URL=https://cafe-delicacy-restaurant.com|g' .env

echo "🔧 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo "🔄 Starting Nginx..."
    sudo systemctl start nginx
    sudo systemctl enable nginx
    
    echo "🔄 Restarting backend..."
    pm2 restart rk-ellite-backend
    
    echo "✅ SSL Certificate installed successfully!"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

# Setup auto-renewal
echo "🔄 Setting up SSL auto-renewal..."
(crontab -l 2>/dev/null; echo "0 3 * * * sudo certbot renew --quiet --deploy-hook 'sudo systemctl reload nginx'") | crontab -

echo ""
echo "✅ SSL Setup Complete!"
echo ""
echo "🌐 Your application is now available at:"
echo "   https://cafe-delicacy-restaurant.com"
echo "   https://www.cafe-delicacy-restaurant.com"
echo ""
echo "🔒 SSL Certificate will auto-renew every 90 days"

EOF

echo ""
echo "✅ SSL Setup Script Completed!"
