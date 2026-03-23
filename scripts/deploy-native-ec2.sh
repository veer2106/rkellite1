#!/bin/bash
# Deploy RK Ellite natively (no Docker) on EC2 via SSH
# Installs Node, PostgreSQL, Nginx, PM2 and deploys the app
#
# Usage:
#   export EC2_HOST=ec2-13-232-134-214.ap-south-1.compute.amazonaws.com
#   export SSH_KEY=./rkellite.pem
#   bash scripts/deploy-native-ec2.sh
#
# Or with IP:
#   export EC2_HOST=13.232.134.214
#   export SSH_KEY=./rkellite.pem
#   bash scripts/deploy-native-ec2.sh

set -e
EC2_HOST="${EC2_HOST:?Set EC2_HOST (IP or hostname, e.g. ec2-13-232-134-214.ap-south-1.compute.amazonaws.com)}"
SSH_KEY="${SSH_KEY:-./rkellite.pem}"
EC2_USER="${EC2_USER:-ec2-user}"
APP_DIR="${APP_DIR:-rkellite1}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/veer2106/rkellite1.git}"
DB_PASSWORD="${DB_PASSWORD:-VeerDag@123456}"
JWT_SECRET="${JWT_SECRET:-ChangeThisToSomethingSecure12345678cafe}"

echo "🚀 Native deploy (no Docker) → $EC2_USER@$EC2_HOST  (dir: ~/$APP_DIR)"
echo ""

ssh -T -i "$SSH_KEY" -o StrictHostKeyChecking=no -o ConnectTimeout=30 \
  "$EC2_USER@$EC2_HOST" bash -s << REMOTE
set -e
DB_PASSWORD="$DB_PASSWORD"
JWT_SECRET="$JWT_SECRET"
APP_DIR="$APP_DIR"
GITHUB_REPO="$GITHUB_REPO"
EC2_HOST="$EC2_HOST"

cd ~
if [ -d "\$APP_DIR" ]; then
  echo "→ Pulling latest..."
  cd "\$APP_DIR" && git fetch origin && git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
  cd ~
else
  echo "→ Cloning repo..."
  git clone --depth 1 --branch main "\$GITHUB_REPO" "\$APP_DIR" 2>/dev/null || git clone "\$GITHUB_REPO" "\$APP_DIR"
fi
cd ~/\$APP_DIR

# Install git if missing (e.g. minimal AMI)
if ! command -v git &>/dev/null; then
  echo "→ Installing git..."
  sudo dnf install -y git 2>/dev/null || sudo yum install -y git
fi

# Node 20 via NodeSource if node missing
if ! command -v node &>/dev/null; then
  echo "→ Installing Node.js 20, nginx..."
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
  sudo dnf install -y nodejs nginx 2>/dev/null || sudo yum install -y nodejs nginx
fi

# PostgreSQL if missing
if ! command -v psql &>/dev/null; then
  echo "→ Installing PostgreSQL 15..."
  sudo dnf install -y postgresql15 postgresql15-server 2>/dev/null || sudo yum install -y postgresql15 postgresql15-server
  if [ ! -d /var/lib/pgsql/15/data/base ] 2>/dev/null && [ ! -d /var/lib/pgsql/data/base ] 2>/dev/null; then
    echo "→ Initializing PostgreSQL..."
    sudo postgresql-setup --initdb 2>/dev/null || sudo /usr/bin/postgresql-setup initdb 2>/dev/null || true
  fi
  sudo systemctl start postgresql 2>/dev/null || sudo systemctl start postgresql-15 2>/dev/null || true
  sudo systemctl enable postgresql 2>/dev/null || sudo systemctl enable postgresql-15 2>/dev/null || true
  sleep 2
fi

# Create DB and user if not exist
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='cafe_user'" 2>/dev/null | grep -q 1 || {
  echo "→ Creating DB user and database..."
  sudo -u postgres psql << SQL
CREATE USER cafe_user WITH PASSWORD '\$DB_PASSWORD';
CREATE DATABASE restaurant_db OWNER cafe_user;
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO cafe_user;
\\c restaurant_db
GRANT ALL ON SCHEMA public TO cafe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cafe_user;
SQL
}

# Ensure pg_hba allows password auth for local
if sudo grep -q "peer" /var/lib/pgsql/15/data/pg_hba.conf 2>/dev/null || sudo grep -q "peer" /var/lib/pgsql/data/pg_hba.conf 2>/dev/null; then
  echo "→ Configuring PostgreSQL auth (md5 for local)..."
  for f in /var/lib/pgsql/15/data/pg_hba.conf /var/lib/pgsql/data/pg_hba.conf; do
    [ -f "\$f" ] && sudo sed -i.bak 's/peer/md5/g; s/ident/md5/g' "\$f" 2>/dev/null || true
  done
  sudo systemctl reload postgresql 2>/dev/null || sudo systemctl reload postgresql-15 2>/dev/null || true
fi

# PM2
if ! command -v pm2 &>/dev/null; then
  echo "→ Installing PM2..."
  sudo npm install -g pm2
fi

echo "→ npm install (root + frontend)..."
npm install
cd frontend && npm install && cd ..

# .env
echo "→ Creating .env..."
cat > .env << ENVFILE
NODE_ENV=production
PORT=5001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=cafe_user
DB_PASSWORD=\$DB_PASSWORD
FRONTEND_URL=http://localhost:5001
API_URL=http://localhost:5001
CLIENT_URL=http://\$EC2_HOST
JWT_SECRET=\$JWT_SECRET
JWT_EXPIRE=7d
ENVFILE
chmod 600 .env

echo "→ build:prod..."
if npm run 2>/dev/null | grep -q "build:prod"; then
  npm run build:prod
else
  cd frontend && REACT_APP_API_URL=/api npm run build && cd ..
  rm -rf public && mkdir -p public && cp -r frontend/build/. public/
fi

echo "→ Seeding database (if needed)..."
npm run seed 2>/dev/null || node backend/seedDatabase.js 2>/dev/null || echo "   (seed skipped or already done)"

echo "→ PM2 restart/start..."
pm2 delete rkellite-api 2>/dev/null || true
pm2 start ecosystem.config.cjs 2>/dev/null || pm2 start backend/server.js --name rkellite-api
pm2 save
pm2 startup systemd -u \$USER --hp \$HOME 2>/dev/null || true

echo "→ Configuring Nginx..."
sudo cp nginx/nginx.host-no-docker.conf.example /etc/nginx/conf.d/rkellite.conf 2>/dev/null || true
# Remove distro default (serves /usr/share/nginx/html/404.html instead of your app)
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t 2>/dev/null && sudo systemctl enable nginx --now 2>/dev/null || sudo systemctl reload nginx 2>/dev/null || true

echo ""
echo "→ Health check:"
sleep 3
curl -s http://127.0.0.1:5001/api/health || echo "(check: pm2 logs rkellite-api)"
echo ""
REMOTE

echo ""
echo "✅ Deploy complete!"
echo ""
echo "🌐 Access:"
echo "   http://$EC2_HOST"
echo "   http://$EC2_HOST/api/health"
echo ""
echo "📋 Commands:"
echo "   SSH:  ssh -i $SSH_KEY $EC2_USER@$EC2_HOST"
echo "   Logs: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pm2 logs rkellite-api'"
echo ""
