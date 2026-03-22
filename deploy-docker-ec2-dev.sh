#!/bin/bash

# 🚀 Docker Deployment Script for RK Ellite Restaurant DEV on AWS EC2
# Usage: export DEV_EC2_IP=your.new.dev.ip && bash deploy-docker-ec2-dev.sh

set -e

# Configuration - UPDATE THESE
EC2_IP="${DEV_EC2_IP:?Error: Set DEV_EC2_IP=your.dev.ec2.ip first}"
EC2_USER="ec2-user"
SSH_KEY="cafe.pem"
APP_DIR="restaurant-cafe"

echo "🚀 Starting DEV Docker deployment to EC2 $EC2_IP"
echo "📍 Dev Backend: $EC2_IP:5005"
echo "📱 Dev Frontend: $EC2_IP:3002"

run_on_ec2() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$@"
}

# Step 1: Docker
echo "🐳 Step 1: Docker setup..."
run_on_ec2 << 'EOF'
sudo yum install -y docker || sudo apt install -y docker.io
sudo systemctl start docker
sudo usermod -aG docker $USER
EOF

# Step 2: Docker Compose
echo "🐳 Step 2: Docker Compose..."
run_on_ec2 << 'EOF'
sudo curl -L https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
EOF

# Step 3: Repo
echo "📂 Step 3: Repo update..."
run_on_ec2 << EOF
cd ~ 
[ -d $APP_DIR ] && cd $APP_DIR && git pull || (git clone https://github.com/veereshpaidcoders/restaurant-cafe.git $APP_DIR && cd $APP_DIR)
git checkout main
EOF

# Step 4: .env.dev from template
echo "⚙️ Step 4: .env.dev..."
run_on_ec2 << EOF
cd $APP_DIR
cp .env.dev.example .env
sed -i "s/YOUR_DEV_EC2_IP/$EC2_IP/g" .env
chmod 600 .env
cat .env
EOF

# Step 5: Create nginx.dev.conf if needed
echo "🌐 Step 5: Nginx dev config..."
run_on_ec2 << 'EOF'
mkdir -p nginx
cat > nginx/nginx.dev.conf << NGINX
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
server_name localhost;

        location /api/ {
            proxy_pass http://localhost:5005;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection upgrade;
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }

        location / {
            proxy_pass http://localhost:3002;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
    }
}
NGINX
EOF

# Step 6: Stop & Start Dev
echo "🔄 Step 6: Docker dev up..."
run_on_ec2 << 'EOF'
cd $APP_DIR
docker compose -f docker-compose.dev.yml down || true
docker compose -f docker-compose.dev.yml build --no-cache
docker compose -f docker-compose.dev.yml up -d
sleep 20
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs --tail=20
EOF

echo "✅ DEV Deployment complete!"
echo "🌐 Backend: http://$EC2_IP:5005/api/health"
echo "📱 Frontend: http://$EC2_IP:3002"
echo "🐳 Logs: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && docker compose -f docker-compose.dev.yml logs -f'"
