# 🚀 Local Development - Application Running

**Date:** March 15, 2026  
**Status:** ✅ Application successfully started locally

---

## ✅ Current Status

### Backend Server
- **Status:** ✅ Running
- **Port:** 5001
- **URL:** http://localhost:5001
- **Environment:** development
- **Database:** restaurant_db (PostgreSQL 15)
- **API Health:** http://localhost:5001/api/health

### Frontend Application
- **Status:** ✅ Running
- **Port:** 3000
- **URL:** http://localhost:3000
- **Network URL:** http://192.168.29.207:3000
- **Build:** Development (not optimized)

### Database
- **Type:** PostgreSQL 15.17 (Homebrew)
- **Status:** ✅ Running
- **Database:** restaurant_db
- **User:** postgres
- **Host:** localhost:5432

---

## 🔐 Login Credentials

### Admin User
- **Email:** admin@restaurant.com
- **Password:** Admin!2024@cafe

### Other Test Users
Check `backend/seedDatabase.js` for additional test users (manager, cashier, waiter, chef)

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application UI |
| **Backend API** | http://localhost:5001/api | REST API endpoints |
| **Health Check** | http://localhost:5001/api/health | API status check |

---

## 📝 What Was Fixed

### Issue Found
The root `.env` file had production AWS RDS configuration:
```
DB_HOST=your-rds-endpoint.amazonaws.com
NODE_ENV=production
```

### Solution Applied
Updated root `.env` to local development settings:
```
DB_HOST=localhost
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=VeerDag@123456
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 🛠️ How to Run

### Start Both Services (Current Method)

**Terminal 1 - Backend:**
```bash
cd /Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/frontend
npm start
```

### Alternative: Use Package Scripts

```bash
# Start backend only
npm start

# Start frontend only (from root)
npm run client

# Start backend in watch mode
npm run dev
```

---

## 📁 Configuration Files

### Root .env (Current - Local Development)
```properties
NODE_ENV=development
PORT=5001
JWT_SECRET=admin@123456
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=VeerDag@123456
FRONTEND_URL=http://localhost:3000
```

### Backend .env
```properties
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=VeerDag@123456
JWT_SECRET=admin@123456
PORT=5001
FRONTEND_URL=http://localhost:3000
```

### Frontend .env
```properties
REACT_APP_API_URL=http://localhost:5001/api
DB_USER=postgres
```

---

## 🔍 Verify Running Services

### Check Backend
```bash
curl http://localhost:5001/api/health
# Should return: {"status":"OK","message":"Restaurant Management System API"}
```

### Check Frontend
```bash
curl -I http://localhost:3000
# Should return: HTTP/1.1 200 OK
```

### Check Database
```bash
psql -U postgres -d restaurant_db -c "SELECT COUNT(*) FROM \"Users\";"
# Should show user count
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port 5001 is in use
lsof -i :5001

# Check PostgreSQL is running
pg_isready -U postgres

# Check database exists
psql -U postgres -l | grep restaurant_db
```

### Frontend Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Clear npm cache
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Issues
```bash
# Verify PostgreSQL is running
brew services list | grep postgresql

# Start PostgreSQL if not running
brew services start postgresql@15

# Test connection
psql -U postgres -c "SELECT version();"
```

---

## 🔄 Stop the Application

### Stop Both Services
Press `Ctrl + C` in both terminal windows

### Or Use Process Kill
```bash
# Find and kill processes
lsof -ti:5001 | xargs kill -9  # Backend
lsof -ti:3000 | xargs kill -9  # Frontend
```

---

## 📦 Database Management

### Seed Database
```bash
npm run seed
```

### Reset Database
```bash
psql -U postgres -c "DROP DATABASE restaurant_db;"
psql -U postgres -c "CREATE DATABASE restaurant_db;"
npm run seed
```

### Backup Database
```bash
pg_dump -U postgres restaurant_db > backup_$(date +%Y%m%d).sql
```

---

## 🚀 Development Workflow

1. **Start PostgreSQL** (if not running)
   ```bash
   brew services start postgresql@15
   ```

2. **Start Backend** (Terminal 1)
   ```bash
   npm start
   ```

3. **Start Frontend** (Terminal 2)
   ```bash
   npm run client
   ```

4. **Access Application**
   - Open browser: http://localhost:3000
   - Login with admin credentials

5. **Development**
   - Frontend changes auto-reload (webpack hot reload)
   - Backend changes require restart (or use `npm run dev` with nodemon)

---

## 📊 Tech Stack (Local)

- **Frontend:** React 18.2.0 (development server)
- **Backend:** Node.js v24.11.1 + Express
- **Database:** PostgreSQL 15.17 (Homebrew)
- **Process Manager:** None (direct npm start)
- **Port Mapping:** 
  - 3000 → Frontend
  - 5001 → Backend
  - 5432 → PostgreSQL

---

## ⚡ Next Steps

### For Development
- ✅ Application is ready for development
- Make changes to code (auto-reload for frontend)
- Test features locally
- Use browser DevTools for debugging

### For Production Deployment
- See `DEPLOYMENT_SUCCESS.md` for AWS deployment
- Use PM2 for process management
- Build frontend for production (`npm run build`)
- Configure Nginx reverse proxy

---

**Status:** ✅ Everything is running smoothly!  
**Access:** http://localhost:3000  
**Login:** admin@restaurant.com / Admin!2024@cafe
