# 🚀 RK Ellite - Quick Deployment Reference

## 📋 Server Information
```
IP Address:    13.233.0.43
Domain:        cafe-delicacy-restaurant.com
SSH Key:       cafe.pem
SSH User:      ec2-user
Region:        ap-south-1 (Mumbai)
OS:            Amazon Linux 2023
```

## 🔐 Login Credentials

### SSH Access
```bash
ssh -i cafe.pem ec2-user@13.233.0.43
```

### Application Admin
```
Email:    admin@restaurant.com
Password: admin123
```

### Database
```
Host:     localhost
Port:     5432
Database: restaurant_db
User:     postgres
Password: VeerDag@123456
```

## 🌐 Access URLs

```
HTTP:     http://cafe-delicacy-restaurant.com
HTTP IP:  http://13.233.0.43
API:      http://cafe-delicacy-restaurant.com/api
```

## 📊 Service Management

### Check All Services
```bash
# PM2 Backend
pm2 status

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Restart Services
```bash
# Backend Only
pm2 restart rk-ellite-backend

# Nginx
sudo systemctl restart nginx

# PostgreSQL
sudo systemctl restart postgresql

# All Services
pm2 restart all && sudo systemctl restart nginx
```

### View Logs
```bash
# Backend Logs
pm2 logs rk-ellite-backend

# Nginx Access Logs
sudo tail -f /var/log/nginx/rk-ellite-access.log

# Nginx Error Logs
sudo tail -f /var/log/nginx/rk-ellite-error.log

# PostgreSQL Logs
sudo journalctl -u postgresql -f
```

## 🔄 Application Updates

### Update Code from GitHub
```bash
# SSH to server
ssh -i cafe.pem ec2-user@13.233.0.43

# Navigate to project
cd ~/restaurant-cafe

# Pull latest changes
git pull origin feature-1

# Install new dependencies
npm install
cd backend && npm install

# Rebuild frontend
cd ../frontend
GENERATE_SOURCEMAP=false npm run build

# Set permissions
chmod -R 755 build/
chmod +x /home/ec2-user
chmod +x /home/ec2-user/restaurant-cafe
chmod +x /home/ec2-user/restaurant-cafe/frontend

# Restart backend
pm2 restart rk-ellite-backend

# Reload Nginx
sudo systemctl reload nginx
```

## 🧪 Health Checks

### Quick Verification
```bash
# Check if everything is running
ssh -i cafe.pem ec2-user@13.233.0.43 << 'EOF'
echo "PM2 Backend:"
pm2 status | grep rk-ellite-backend

echo ""
echo "Nginx:"
curl -s http://localhost/ | grep -o "<title>.*</title>"

echo ""
echo "Backend API:"
curl -s http://localhost/api/menu | head -5

echo ""
echo "Database:"
PGPASSWORD='VeerDag@123456' psql -h localhost -U postgres -d restaurant_db -c "SELECT COUNT(*) FROM users;"
EOF
```

### Test from Your Computer
```bash
# Test domain accessibility
curl -I http://cafe-delicacy-restaurant.com

# Test API
curl http://cafe-delicacy-restaurant.com/api/menu

# Test frontend
curl http://cafe-delicacy-restaurant.com | grep "RK Ellite"
```

## 🛠️ Common Operations

### Database Backup
```bash
ssh -i cafe.pem ec2-user@13.233.0.43
PGPASSWORD='VeerDag@123456' pg_dump -h localhost -U postgres restaurant_db > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
PGPASSWORD='VeerDag@123456' psql -h localhost -U postgres restaurant_db < backup_YYYYMMDD.sql
```

### Check Disk Space
```bash
df -h /
```

### Check Memory Usage
```bash
free -h
```

### Check CPU Usage
```bash
top -bn1 | head -15
```

## 🔒 SSL Certificate Installation (Optional)

### Automated Installation
```bash
# On your local machine
chmod +x setup-ssl.sh
./setup-ssl.sh
```

### Manual Installation
```bash
# SSH to server
ssh -i cafe.pem ec2-user@13.233.0.43

# Install Certbot
sudo yum install -y python3-pip
sudo pip3 install certbot certbot-nginx

# Stop Nginx temporarily
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d cafe-delicacy-restaurant.com \
  -d www.cafe-delicacy-restaurant.com \
  --non-interactive \
  --agree-tos \
  --email admin@cafe-delicacy-restaurant.com

# The setup-ssl.sh script will update Nginx configuration automatically
# Or manually update /etc/nginx/conf.d/rk-ellite.conf with SSL settings

# Start Nginx
sudo systemctl start nginx

# Update .env with HTTPS
cd ~/restaurant-cafe
sed -i 's|http://|https://|g' .env

# Restart backend
pm2 restart rk-ellite-backend

# Setup auto-renewal
(crontab -l 2>/dev/null; echo "0 3 * * * sudo certbot renew --quiet --deploy-hook 'sudo systemctl reload nginx'") | crontab -
```

## 🚨 Troubleshooting

### Backend Not Responding
```bash
# Check PM2 logs
pm2 logs rk-ellite-backend --lines 50

# Restart backend
pm2 restart rk-ellite-backend

# If still failing, check database connection
PGPASSWORD='VeerDag@123456' psql -h localhost -U postgres -d restaurant_db -c "SELECT 1;"
```

### Frontend 500 Error
```bash
# Check Nginx error logs
sudo tail -20 /var/log/nginx/rk-ellite-error.log

# Fix permissions
chmod +x /home/ec2-user
chmod +x /home/ec2-user/restaurant-cafe
chmod +x /home/ec2-user/restaurant-cafe/frontend
chmod -R 755 /home/ec2-user/restaurant-cafe/frontend/build

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check pg_hba.conf
sudo cat /var/lib/pgsql/data/pg_hba.conf | grep -v "^#" | grep -v "^$"

# Should show md5 authentication for localhost
# If not, run:
sudo sed -i 's/peer/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo sed -i 's/ident/md5/g' /var/lib/pgsql/data/pg_hba.conf
sudo systemctl reload postgresql
```

### Port 80 Not Accessible
```bash
# Check if Nginx is listening
sudo netstat -tlnp | grep :80

# Check AWS Security Group
# Ensure inbound rule allows HTTP (port 80) from 0.0.0.0/0

# Check firewall (if any)
sudo firewall-cmd --list-all
```

## 📈 Performance Monitoring

### Current Resource Usage
```bash
# Full system overview
ssh -i cafe.pem ec2-user@13.233.0.43 << 'EOF'
echo "=== System Resources ==="
free -h
echo ""
df -h /
echo ""
echo "=== PM2 Processes ==="
pm2 status
echo ""
echo "=== Top Processes ==="
top -bn1 | head -15
EOF
```

### Application Metrics
```bash
# Request count (last 1000 lines)
sudo tail -1000 /var/log/nginx/rk-ellite-access.log | wc -l

# Error count (last 1000 lines)
sudo tail -1000 /var/log/nginx/rk-ellite-error.log | wc -l

# Most accessed endpoints
sudo tail -1000 /var/log/nginx/rk-ellite-access.log | awk '{print $7}' | sort | uniq -c | sort -nr | head -10
```

## 📞 Support Information

### Important Files
```
Application:    ~/restaurant-cafe
Backend:        ~/restaurant-cafe/backend
Frontend Build: ~/restaurant-cafe/frontend/build
Environment:    ~/restaurant-cafe/.env
Nginx Config:   /etc/nginx/conf.d/rk-ellite.conf
Nginx Main:     /etc/nginx/nginx.conf
PM2 Logs:       ~/.pm2/logs/
```

### GitHub Repository
```
Repository: veereshpaidcoders/restaurant-cafe
Branch:     feature-1
```

### Key Features Deployed
- ✅ Restaurant Management (Menu, Orders, POS)
- ✅ Inventory Management
- ✅ Customer Management
- ✅ Room/Lodge Booking System
- ✅ Staff Management
- ✅ Reports & Analytics
- ✅ Role-Based Access Control

---

**Last Updated:** March 16, 2026  
**Status:** ✅ Production Ready  
**Deployment Type:** PM2 (Backend) + Nginx (Static Frontend + Reverse Proxy)
