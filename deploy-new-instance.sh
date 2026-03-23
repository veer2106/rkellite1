#!/bin/bash
# Deploy RK Ellite to NEW AWS instance (Docker + Nginx in containers)
# Same setup as prod: db, redis, api, nginx in Docker
#
# Usage:
#   export EC2_IP=13.233.0.43
#   export SSH_KEY=./cafe.pem
#   bash deploy-new-instance.sh
#
# Or for the existing prod box in one command:
#   bash deploy-prod-instance.sh
#
# Deploy WITHOUT building (use existing image on the server):
#   - Build locally, then: docker save restaurant-cafe_api:latest -o api.tar
#   - scp api.tar ec2-user@IP:~ && ssh in: docker load -i api.tar
#   - Or: docker push/pull from a registry, then set API_IMAGE
#   export SKIP_BUILD=1
#   export API_IMAGE=youruser/rkellite:latest   # optional: docker pull before up
#   bash deploy-new-instance.sh
#
# Optional: full "yum update" before installs (slow; only if you need it):
#   export FULL_YUM_UPDATE=1

set -e

EC2_IP="${EC2_IP:?Set EC2_IP=your.ec2.public.ip}"
SSH_KEY="${SSH_KEY:-cafe.pem}"
EC2_USER="${EC2_USER:-ec2-user}"
APP_DIR="${APP_DIR:-restaurant-cafe}"
# Default: rkellite1 (smaller repo). Override: export GITHUB_REPO=...
GITHUB_REPO="${GITHUB_REPO:-https://github.com/veer2106/rkellite1.git}"
BRANCH="${BRANCH:-main}"

echo "🚀 Deploying to new instance $EC2_IP"
echo "   Repo: $GITHUB_REPO (branch: $BRANCH)"
echo ""
echo "⏱️  Expected time (normal — not stuck):"
echo "   Step 1 yum/git     ~1–3 min"
echo "   Step 2 Docker      ~2–5 min (first time)"
echo "   Step 4 git clone   ~2–10 min (shallow clone)"
echo "   Step 6 docker build ~10–25 min (npm install + frontend build)"
echo "   If Step 1 shows no text for 60+ sec: check SSH / security group / instance running."
echo ""
if [ "${SKIP_BUILD:-}" = "1" ] || [ "${SKIP_BUILD:-}" = "true" ]; then
  echo "   Mode: SKIP_BUILD (no docker build — image must exist or be pulled)"
  [ -n "${API_IMAGE:-}" ] && echo "   API_IMAGE: $API_IMAGE"
fi
echo ""

# Remote script via stdin — MUST use `bash -s` or SSH can hang waiting (no remote command).
run_on_ec2_script() {
    # ConnectTimeout: fail fast if host unreachable | LogLevel: less SSH noise
    ssh -T -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
        -o ServerAliveInterval=30 -o ServerAliveCountMax=10 \
        "$EC2_USER@$EC2_IP" bash -s
}

# Single remote command (string or args)
run_on_ec2_cmd() {
    ssh -T -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
        -o ServerAliveInterval=30 -o ServerAliveCountMax=10 \
        "$EC2_USER@$EC2_IP" "$@"
}

# Step 1: Install git and Docker
# NOTE: We skip "yum update -y" by default — it can take 10–30+ min with almost no output.
#       Set FULL_YUM_UPDATE=1 if you really want a full system update first.
echo "📦 Step 1: Dependencies (git)..."
echo "   …connecting (first line from server may take 10–40s)…"
# Unquoted EOF so FULL_YUM_UPDATE expands locally before SSH sends the script
run_on_ec2_script << EOF
set -e
exec >&2  # print to stderr so lines show immediately (unbuffered-ish)
echo "   → Server: starting Step 1"
echo "   → Installing git (often 1–3 min; yum may look silent)..."
if [ "${FULL_YUM_UPDATE:-}" = "1" ]; then
  echo "   → FULL_YUM_UPDATE=1: running yum update (can take 15–30 min)..."
  sudo yum update -y
fi
sudo yum install -y git 2>&1
echo "   → git OK"
EOF

# Step 2: Docker
echo "🐳 Step 2: Docker..."
run_on_ec2_script << 'EOF'
set -e
if ! command -v docker &> /dev/null; then
  echo "   → Installing Docker (may take a few minutes)..."
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker ec2-user
  echo "   → Docker installed"
else
  echo "   → Docker already present"
fi
sudo systemctl start docker 2>/dev/null || true
echo "   → Docker service OK"
EOF

# Step 3: Docker Compose
echo "🐳 Step 3: Docker Compose..."
run_on_ec2_script << 'EOF'
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
docker compose version 2>/dev/null || docker-compose --version
EOF

# Step 4: Clone/update repo (--depth 1 = much faster than full history)
echo "📂 Step 4: Clone repository..."
echo "   (Large repos can take several minutes — progress will show below)"
run_on_ec2_script << EOF
set -e
exec >&2
cd ~
if [ -d $APP_DIR ]; then
    echo "   → Repo exists, pulling latest..."
    cd $APP_DIR && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
else
    echo "   → Cloning (shallow) — please wait..."
    git clone --depth 1 --branch $BRANCH --single-branch --progress $GITHUB_REPO $APP_DIR
fi
echo "   → Repo ready"
EOF

# Step 5: Create .env
echo "⚙️ Step 5: Create .env..."
run_on_ec2_script << EOF
set -e
cd ~/$APP_DIR
cat > .env << ENVEOF
# Database
DB_HOST=db
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=cafe_user
DB_PASSWORD=VeerDag@123456

# App
NODE_ENV=production
PORT=5001

# URLs
API_URL=http://$EC2_IP
FRONTEND_URL=http://$EC2_IP
CLIENT_URL=http://$EC2_IP

# JWT
JWT_SECRET=ChangeThisToSomethingSecure12345678cafe
JWT_EXPIRE=7d

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis_secure_password

# AWS
AWS_REGION=ap-south-1
ENVEOF
chmod 600 .env
echo "   → .env written"
EOF

# Step 6: Start containers (optional build)
echo "🏗️ Step 6: Start containers..."
if [ "${SKIP_BUILD:-}" = "1" ] || [ "${SKIP_BUILD:-}" = "true" ]; then
  run_on_ec2_cmd bash -lc "cd ~/$APP_DIR && COMPOSE=docker-compose; command -v docker-compose &>/dev/null || COMPOSE='docker compose'; \
    [ -n \"${API_IMAGE:-}\" ] && sudo docker pull \"${API_IMAGE}\" 2>/dev/null || true; \
    sudo \$COMPOSE up -d --no-build db redis api nginx; sleep 15; sudo \$COMPOSE ps"
else
  run_on_ec2_script << 'EOF'
set -e
exec >&2
cd ~/restaurant-cafe
COMPOSE="docker-compose"
if ! command -v docker-compose &>/dev/null; then
  COMPOSE="docker compose"
fi
echo "   → Docker build can take 10–25 min on t3.micro/small — this is normal."
sudo env DOCKER_BUILDKIT=0 $COMPOSE build --no-cache api || sudo docker build -t restaurant-cafe_api .
echo "   → Build finished; starting containers..."
sudo $COMPOSE up -d db redis api nginx
sleep 15
sudo $COMPOSE ps
EOF
fi

# Step 7: Verify
echo "✅ Step 7: Verify deployment..."
run_on_ec2_script << 'EOF'
cd ~/restaurant-cafe
echo "Container status:"
sudo docker-compose ps 2>/dev/null || sudo docker compose ps
echo ""
echo "Testing API..."
curl -s http://localhost:5001/api/health | head -1
echo ""
echo "Testing Nginx..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:80/
echo ""
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application:"
echo "   http://$EC2_IP"
echo "   http://$EC2_IP/api/health"
echo ""
echo "📋 Commands:"
echo "   Logs:  ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && docker-compose logs -f'"
echo "   Restart: ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && docker-compose restart'"
echo ""
echo "📝 Optional: Add domain + SSL"
echo "   1. Point your domain A record to $EC2_IP"
echo "   2. SSH in and run: sudo certbot certonly --nginx -d yourdomain.com"
echo "   3. Update nginx config for HTTPS"
echo ""
