#!/bin/bash

# Deploy multiple app instances on same EC2 - different ports, different DBs
# Each instance: own PostgreSQL, own Redis, own API (serving frontend + backend)

set -e

# --- Configuration ---
EC2_IP="${EC2_IP:-YOUR_EC2_IP}"
EC2_USER="${EC2_USER:-ec2-user}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/your-key.pem}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/veereshpaidcoders/restaurant-cafe.git}"
BRANCH="${BRANCH:-feature-1}"
APP_DIR="restaurant-cafe"

# Instances to deploy: "1 2 3" or just "1"
INSTANCES="${INSTANCES:-1 2}"

echo "🚀 Multi-Instance Deployment to EC2"
echo "📍 EC2: $EC2_USER@$EC2_IP"
echo "📦 Branch: $BRANCH"
echo "📋 Instances: $INSTANCES"
echo ""

if [ "$EC2_IP" = "YOUR_EC2_IP" ]; then
  echo "❌ Set EC2_IP (and optionally SSH_KEY) before running."
  echo "   Example: EC2_IP=13.233.0.43 SSH_KEY=./cafe.pem ./deploy-multi-instance.sh"
  exit 1
fi

run_on_ec2() {
  ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_IP" "$@"
}

# Use docker compose (v2) or set COMPOSE_CMD=docker-compose for v1
COMPOSE_CMD="${COMPOSE_CMD:-docker compose}"

# Step 1: Ensure Docker & Compose
echo "🐳 Step 1: Ensuring Docker & Compose..."
run_on_ec2 'bash -s' << 'DOCKER'
if ! command -v docker &>/dev/null; then
  sudo yum install -y docker
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -a -G docker ec2-user
fi
if ! command -v docker-compose &>/dev/null && ! docker compose version &>/dev/null 2>&1; then
  sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
  sudo chmod +x /usr/local/bin/docker-compose
fi
echo "Docker ready"
DOCKER

# Step 2: Clone/Update repo
echo "📂 Step 2: Clone/Update repository..."
run_on_ec2 "bash -s" << REPO
if [ -d "$APP_DIR" ]; then
  cd $APP_DIR && git fetch origin && git checkout $BRANCH && git pull origin $BRANCH
else
  git clone $GITHUB_REPO && cd $APP_DIR && git checkout $BRANCH
fi
REPO

# Step 3: Create env files per instance (from examples if missing)
echo "⚙️  Step 3: Preparing env files..."
for i in $INSTANCES; do
  run_on_ec2 "bash -s" << ENV
cd $APP_DIR
if [ ! -f .env.instance$i ]; then
  if [ -f envs/instance${i}.env.example ]; then
    cp envs/instance${i}.env.example .env.instance$i
    echo "Created .env.instance$i from example - EDIT before production!"
  else
    echo "Missing envs/instance${i}.env.example"
    exit 1
  fi
fi
ENV
done

# Step 4: Stop existing instance containers
echo "🛑 Step 4: Stopping existing instance containers..."
for i in $INSTANCES; do
  run_on_ec2 "cd $APP_DIR && (sudo $COMPOSE_CMD -f docker-compose.multi-instance.yml -p instance$i --env-file .env.instance$i down 2>/dev/null || true)"
done

# Step 5: Build and start each instance
echo "🏗️  Step 5: Build and start instances..."
for i in $INSTANCES; do
  echo "   Building and starting instance $i..."
  run_on_ec2 "cd $APP_DIR && sudo $COMPOSE_CMD -f docker-compose.multi-instance.yml -p instance$i --env-file .env.instance$i build --no-cache"
  run_on_ec2 "cd $APP_DIR && sudo $COMPOSE_CMD -f docker-compose.multi-instance.yml -p instance$i --env-file .env.instance$i up -d"
  sleep 5
done

# Step 6: Status
echo ""
echo "📋 Step 6: Container status..."
for i in $INSTANCES; do
  echo "   --- Instance $i ---"
  run_on_ec2 "cd $APP_DIR && sudo $COMPOSE_CMD -f docker-compose.multi-instance.yml -p instance$i --env-file .env.instance$i ps"
done

echo ""
echo "✅ Multi-instance deployment complete!"
echo ""
echo "🌐 Access (update with your EC2 IP/domain):"
for i in $INSTANCES; do
  run_on_ec2 "grep -E '^API_PORT=|^FRONTEND_URL=' $APP_DIR/.env.instance$i 2>/dev/null || true" | sed 's/^/   Instance '"$i"': /'
done
echo ""
echo "   Example: Instance 1 -> http://$EC2_IP:5001"
echo "            Instance 2 -> http://$EC2_IP:5002"
echo ""
echo "📋 Commands:"
echo "   Logs:    ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && docker compose -f docker-compose.multi-instance.yml -p instance1 --env-file .env.instance1 logs -f'"
echo "   Stop 1:  ssh -i $SSH_KEY $EC2_USER@$EC2_IP 'cd $APP_DIR && docker compose -f docker-compose.multi-instance.yml -p instance1 --env-file .env.instance1 down'"
echo ""
