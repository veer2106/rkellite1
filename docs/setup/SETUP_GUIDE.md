# Restaurant Cafe Management System - Comprehensive Setup Guide

**Version:** 1.0.0  
**Last Updated:** March 7, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (Automated)](#quick-start-automated)
3. [Manual Setup](#manual-setup)
4. [Configuration](#configuration)
5. [Database Management](#database-management)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)
8. [API Documentation](#api-documentation)
9. [Project Structure](#project-structure)
10. [Development Workflow](#development-workflow)

---

## Prerequisites

### System Requirements

| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | v16+ | JavaScript runtime |
| npm | v8+ | Package manager |
| PostgreSQL | v13+ | Database |
| Git | Latest | Version control |
| Bash/Shell | Any | Script execution |

### Operating System Support

- ✅ **macOS** - Full support (Intel & Apple Silicon)
- ✅ **Linux** - Full support (Ubuntu, Debian, CentOS)
- ✅ **Windows** - Full support (via WSL2)

### Installation Links

- **Node.js:** https://nodejs.org/
- **PostgreSQL:** https://www.postgresql.org/download/
- **Git:** https://git-scm.com/downloads
- **Homebrew (macOS):** https://brew.sh

---

## Quick Start (Automated)

The **recommended approach** - fully automated with zero manual intervention:

```bash
# 1. Clone repository
git clone https://github.com/veereshpaidcoders/restaurant-cafe.git
cd restaurant-cafe

# 2. Make setup script executable
chmod +x setup.sh

# 3. Run automated setup
./setup.sh
```

### What Happens Automatically

The `setup.sh` script performs the following steps:

1. ✅ **System Checks**
   - Verifies Node.js installation
   - Verifies npm installation
   - Checks PostgreSQL availability
   - Auto-installs PostgreSQL if missing (macOS/Linux)

2. ✅ **Environment Setup**
   - Creates `.env` files with secure defaults
   - Generates JWT secrets
   - Configures database credentials

3. ✅ **Database Initialization**
   - Starts PostgreSQL service
   - Creates PostgreSQL user
   - Creates database
   - Runs migrations

4. ✅ **Dependencies Installation**
   - Installs backend npm packages
   - Installs frontend npm packages
   - Resolves peer dependencies

5. ✅ **Data Seeding**
   - Populates database with sample data
   - Creates default users
   - Adds menu items, inventory, tables

6. ✅ **Application Launch**
   - Starts backend server (port 5001)
   - Starts frontend server (port 3000)
   - Opens browser automatically

### Expected Output

```
╔════════════════════════════════════════════════════╗
║   🍽️  Restaurant Cafe Management System            ║
║         Automated Setup & Installation              ║
╚════════════════════════════════════════════════════╝

ℹ️  Step 1: Checking system requirements...
✓ Node.js found: v24.11.1
✓ npm found: v11.2.1
✓ PostgreSQL found: PostgreSQL 15.2
...
✓ Backend dependencies installed
✓ Frontend dependencies installed
✓ Database seeded successfully

╔════════════════════════════════════════════════════╗
║          ✓ Setup Complete Successfully!             ║
╚════════════════════════════════════════════════════╝

ℹ️  Backend:   http://localhost:5001
ℹ️  Frontend:  http://localhost:3000
```

---

## Manual Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/veereshpaidcoders/restaurant-cafe.git
cd restaurant-cafe
```

### Step 2: Install System Dependencies

#### macOS (Homebrew)

```bash
# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Verify installation
node --version  # v16 or higher
npm --version   # v8 or higher
psql --version  # PostgreSQL 15 or higher
```

#### Linux (Ubuntu/Debian)

```bash
# Update package manager
sudo apt-get update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install -y postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
node --version
npm --version
psql --version
```

#### Windows (WSL2)

```bash
# Inside WSL2 terminal, follow Linux instructions above
# Then configure PostgreSQL:
sudo service postgresql start
sudo -u postgres psql
```

### Step 3: Initialize PostgreSQL Database

```bash
# Connect to PostgreSQL as default user
psql -U postgres

# Inside psql prompt:
-- Create database user
CREATE USER postgres WITH PASSWORD 'restaurant_pwd_2024!' SUPERUSER;

-- Create application database
CREATE DATABASE restaurant_db OWNER postgres;

-- Grant privileges
ALTER DATABASE restaurant_db OWNER TO postgres;

-- Exit psql
\q
```

### Step 4: Configure Environment Variables

#### Backend Configuration

Create `.env` file in project root:

```bash
cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=restaurant_pwd_2024!

# JWT Configuration
JWT_SECRET=your_secure_random_secret_key_here_change_in_production
JWT_EXPIRE=30d

# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Optional: Email Configuration
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password

# Optional: Stripe Configuration
# STRIPE_SECRET_KEY=sk_test_...
# STRIPE_PUBLIC_KEY=pk_test_...
EOF
```

#### Frontend Configuration

Create `frontend/.env` file:

```bash
cat > frontend/.env << 'EOF'
REACT_APP_API_URL=http://localhost:5001/api
EOF
```

### Step 5: Install Dependencies

```bash
# Install backend dependencies
npm install --legacy-peer-deps

# Install frontend dependencies
cd frontend
npm install --legacy-peer-deps
cd ..
```

### Step 6: Initialize Database

```bash
# Run migrations and seed initial data
node backend/seedDatabase.js
```

### Step 7: Start Application

#### Option A: Separate Terminals

```bash
# Terminal 1 - Backend Server
npm run server

# Terminal 2 - Frontend Server
cd frontend
npm start
```

#### Option B: Single Terminal (Background)

```bash
# Start backend in background
npm run server &

# Start frontend in foreground
cd frontend
npm start
```

---

## Configuration

### Environment Variables Reference

#### Backend `.env`

| Variable | Default | Required | Description | Security |
|----------|---------|----------|-------------|----------|
| DB_HOST | localhost | Yes | PostgreSQL hostname | Internal |
| DB_PORT | 5432 | Yes | PostgreSQL port | Internal |
| DB_NAME | restaurant_db | Yes | Database name | Internal |
| DB_USER | postgres | Yes | Database user | Internal |
| DB_PASSWORD | - | Yes | Database password | **CRITICAL - Change!** |
| JWT_SECRET | - | Yes | JWT signing key | **CRITICAL - Change!** |
| JWT_EXPIRE | 30d | No | Token expiration | Low |
| PORT | 5001 | No | Backend server port | Low |
| NODE_ENV | development | No | Execution environment | Low |
| FRONTEND_URL | http://localhost:3000 | No | Frontend URL for CORS | Low |

#### Frontend `.env`

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| REACT_APP_API_URL | http://localhost:5001/api | Yes | Backend API endpoint |

### Changing Credentials

**Database Password:**
```bash
psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'new_secure_password';"
```

**JWT Secret:**
Generate using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then update `.env`:
```bash
JWT_SECRET=<generated_hash>
```

---

## Database Management

### PostgreSQL Commands

```bash
# Connect to database
psql -U postgres -d restaurant_db

# List all databases
\l

# List all users
\du

# Connect to specific database
\c restaurant_db

# List all tables
\dt

# Show database size
SELECT pg_size_pretty(pg_database_size('restaurant_db'));

# Backup database
pg_dump -U postgres -d restaurant_db > backup.sql

# Restore database
psql -U postgres -d restaurant_db < backup.sql

# Exit psql
\q
```

### Reset Database

```bash
# Seed with fresh data (WARNING: Deletes existing data)
node backend/seedDatabase.js

# Manual reset
psql -U postgres -c "DROP DATABASE restaurant_db;"
psql -U postgres -c "CREATE DATABASE restaurant_db OWNER postgres;"
node backend/seedDatabase.js
```

---

## Troubleshooting

### Common Issues

#### 1. **PostgreSQL Connection Error**

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Start PostgreSQL
# macOS:
brew services start postgresql@15

# Linux:
sudo systemctl start postgresql
```

#### 2. **Port Already in Use**

```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solution:**
```bash
# Kill process using port 5001
lsof -i :5001
kill -9 <PID>

# Or use different port
PORT=5002 npm run server
```

#### 3. **Module Not Found Error**

```
Error: Cannot find module 'sequelize'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### 4. **Database Seeding Fails**

```
Error: role "postgres" does not exist
```

**Solution:**
```bash
# Create missing PostgreSQL role
psql -U postgres -c "CREATE ROLE postgres WITH SUPERUSER;"

# Or reset database
node backend/seedDatabase.js
```

#### 5. **Frontend Cannot Connect to Backend**

```
Error: Network request failed
```

**Verify:**
1. Backend is running on port 5001
2. `frontend/.env` has `REACT_APP_API_URL=http://localhost:5001/api`
3. Backend CORS is properly configured
4. No firewall blocking port 5001

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `.env` with production credentials
- [ ] Change `JWT_SECRET` to secure random value
- [ ] Change database password
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up CDN for static assets
- [ ] Enable database backups
- [ ] Configure monitoring and logging
- [ ] Set up error tracking (Sentry, etc.)

### Environment Setup for Production

```bash
cat > .env.production << 'EOF'
# Production Database
DB_HOST=prod-db-host.com
DB_PORT=5432
DB_NAME=restaurant_prod
DB_USER=prod_user
DB_PASSWORD=<secure-password>

# Security
JWT_SECRET=<long-random-secure-key>
NODE_ENV=production

# Server
PORT=5001
FRONTEND_URL=https://your-domain.com

# SSL/TLS
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
EOF
```

### Docker Deployment (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
EXPOSE 5001
CMD ["npm", "run", "server"]
```

```bash
# Build and run
docker build -t restaurant-cafe .
docker run -p 5001:5001 --env-file .env.production restaurant-cafe
```

---

## API Documentation

### Base URL
```
http://localhost:5001/api
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@restaurant.com",
  "password": "Admin!2024@cafe"
}

Response: 200 OK
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { ... }
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": { ... }
}
```

### Menu Endpoints

```http
GET /api/menu                    # List all menu items
POST /api/menu                   # Create menu item
GET /api/menu/:id                # Get menu item
PUT /api/menu/:id                # Update menu item
DELETE /api/menu/:id             # Delete menu item
```

### Order Endpoints

```http
GET /api/orders                  # List orders
POST /api/orders                 # Create order
GET /api/orders/:id              # Get order details
PUT /api/orders/:id              # Update order
DELETE /api/orders/:id           # Cancel order
```

### Inventory Endpoints

```http
GET /api/inventory               # List inventory items
POST /api/inventory              # Create item
GET /api/inventory/:id           # Get item details
PUT /api/inventory/:id           # Update item
DELETE /api/inventory/:id        # Delete item
```

---

## Project Structure

```
restaurant-cafe/
├── backend/
│   ├── config/              # Database configuration
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Express middleware
│   ├── models/              # Sequelize models
│   ├── routes/              # API routes
│   ├── utils/               # Utility functions
│   ├── logs/                # Application logs
│   ├── server.js            # Express server entry
│   ├── seedDatabase.js      # Database seeding script
│   └── package.json
│
├── frontend/
│   ├── public/              # Static files
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── redux/           # Redux store
│   │   ├── services/        # API services
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── package.json
│   └── .env
│
├── .env                     # Backend environment
├── .gitignore
├── setup.sh                 # Automated setup script
├── SETUP_GUIDE.md          # This file
├── README.md
└── package.json
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Backend with hot reload
npm run server

# Terminal 2: Frontend with hot reload
cd frontend && npm start
```

### Making Database Changes

1. Create new model in `backend/models/`
2. Update `backend/seedDatabase.js` if needed
3. Reset database:
   ```bash
   node backend/seedDatabase.js
   ```

### Creating New API Endpoints

1. Create controller in `backend/controllers/`
2. Create routes in `backend/routes/`
3. Import and use in `backend/server.js`
4. Test with curl or Postman

### Updating Frontend

1. Create component in `frontend/src/components/`
2. Create page in `frontend/src/pages/`
3. Add route in `frontend/src/App.js`
4. Frontend auto-reloads on save

---

## Support and Resources

- **GitHub Issues:** https://github.com/veereshpaidcoders/restaurant-cafe/issues
- **Documentation:** See README.md and API_DOCUMENTATION.md
- **Bug Reports:** Submit with reproduction steps
- **Feature Requests:** Create GitHub issue with details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | March 7, 2026 | Initial release with automated setup |

---

**Last Updated:** March 7, 2026  
**Maintainer:** Restaurant Cafe Development Team
