# Deploy on EC2 without Docker (native Node + PostgreSQL + Nginx)

Stack: **Node.js** (PM2) → **PostgreSQL** on the host → **Nginx** on port 80 → proxies to **127.0.0.1:5001**.

## Prerequisites

- Amazon Linux 2023 (or similar) EC2 with SSH access
- Security group: **22** (SSH), **80** (HTTP), **443** (HTTPS optional)

## 1. Install system packages (run on the server)

```bash
# Node.js 20 LTS
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs git nginx

# PostgreSQL 15
sudo dnf install -y postgresql15 postgresql15-server
sudo postgresql-setup --initdb
sudo systemctl enable postgresql --now

# PM2 globally
sudo npm install -g pm2
```

## 2. Create database and user

```bash
sudo -u postgres psql << 'SQL'
CREATE USER cafe_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';
CREATE DATABASE restaurant_db OWNER cafe_user;
GRANT ALL PRIVILEGES ON DATABASE restaurant_db TO cafe_user;
\c restaurant_db
GRANT ALL ON SCHEMA public TO cafe_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO cafe_user;
SQL
```

Edit `pg_hba.conf` if needed so local connections use `md5`/`scram-sha-256` (default on AL2023).

## 3. Clone app and build

```bash
cd ~
git clone https://github.com/veer2106/rkellite1.git
cd rkellite1

cp .env.host.example .env
nano .env   # set DB_PASSWORD, JWT_SECRET, CLIENT_URL (your domain or http://EC2_IP)

npm install
cd frontend && npm install && cd ..
npm run build:prod
```

`build:prod` builds the React app with `REACT_APP_API_URL=/api` and copies `frontend/build` → `public/` (served by Express).

## 4. Seed database (first time)

```bash
npm run seed
# or: node backend/seedDatabase.js
```

## 5. Run with PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command with sudo
```

Check: `curl -s http://127.0.0.1:5001/api/health`

## 6. Nginx (reverse proxy)

```bash
sudo cp nginx/nginx.host-no-docker.conf.example /etc/nginx/conf.d/rkellite.conf
# Remove distro default in conf.d (if present)
sudo rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true
sudo nginx -t && sudo systemctl enable nginx --now
```

### Amazon Linux / Fedora nginx: Fedora 404 page instead of your app

The stock **`/etc/nginx/nginx.conf`** includes a **`server { ... root /usr/share/nginx/html; ... }`** block (not only `conf.d/`). That block conflicts with `server_name _;` and nginx may **ignore** `conf.d/rkellite.conf`, so you see the default **404.html** from `/usr/share/nginx/html/`.

**Fix:** disable that embedded server block (backup first), then reload:

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
# Comment out the entire first `server { ... }` block inside `http { }` that sets root /usr/share/nginx/html
# Or use: sudo sed -i '/^    server {$/,/^    }$/s/^/# /' /etc/nginx/nginx.conf   # verify with sudo nginx -t
sudo nginx -t && sudo systemctl reload nginx
```

The repo’s **`nginx.host-no-docker.conf.example`** uses `listen 80 default_server;` so it becomes the only active site once the stock block is removed.

**Quick fix script** (run on the server after `cd ~/rkellite1`):

```bash
bash scripts/fix-nginx-welcome-page.sh
```

Open **http://YOUR_EC2_IP** — traffic goes **80 → Nginx → 5001** (API + static).

## 7. HTTPS (optional)

```bash
sudo dnf install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Useful commands

| Action | Command |
|--------|---------|
| Logs | `pm2 logs rkellite-api` |
| Restart | `pm2 restart rkellite-api` |
| After git pull | `npm install && cd frontend && npm install && cd .. && npm run build:prod && pm2 restart rkellite-api` |
| Nginx reload | `sudo nginx -t && sudo systemctl reload nginx` |

## Automated script

From your laptop (SSH + key), run:

```bash
export EC2_IP=13.233.0.43
export SSH_KEY=./cafe.pem
bash scripts/deploy-native-ec2.sh
```

Or copy `scripts/deploy-native-ec2.sh` to the server and run it there after editing variables.
