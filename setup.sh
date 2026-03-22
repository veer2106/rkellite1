#!/bin/bash

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="restaurant_db"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"
BACKEND_PORT="5001"
FRONTEND_PORT="3000"
ENV_FILE=".env"

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════╗"
echo "║   🍽️  Restaurant Cafe Management System            ║"
echo "║         Automated Setup & Installation              ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check system requirements
log_info "Step 1: Checking system requirements..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi
NODE_VERSION=$(node --version)
log_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi
NPM_VERSION=$(npm --version)
log_success "npm found: v$NPM_VERSION"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    log_error "PostgreSQL is not installed. Installing PostgreSQL..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v brew &> /dev/null; then
            log_error "Homebrew is required for macOS. Please install Homebrew first."
            echo "Visit: https://brew.sh"
            exit 1
        fi
        log_info "Installing PostgreSQL via Homebrew..."
        brew install postgresql@15
        brew services start postgresql@15
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        log_info "Installing PostgreSQL via apt..."
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
    else
        log_error "Unsupported OS. Please install PostgreSQL manually."
        exit 1
    fi
fi
PG_VERSION=$(psql --version)
log_success "PostgreSQL found: $PG_VERSION"

# Step 2: Create environment files
log_info "Step 2: Setting up environment files..."

# Create backend .env if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
    log_info "Creating backend $ENV_FILE..."
    cat > "$ENV_FILE" << EOF
# Database Configuration
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=restaurant_pwd_2024!

# JWT Configuration
JWT_SECRET=restaurant_jwt_secret_key_2024!
JWT_EXPIRE=30d

# Server Configuration
PORT=$BACKEND_PORT
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:$FRONTEND_PORT
EOF
    log_success "Backend .env created"
else
    log_warning "Backend .env already exists, skipping creation"
fi

# Create frontend .env if it doesn't exist
if [ ! -f "frontend/.env" ]; then
    log_info "Creating frontend .env..."
    cat > "frontend/.env" << EOF
REACT_APP_API_URL=http://localhost:$BACKEND_PORT/api
EOF
    log_success "Frontend .env created"
else
    log_warning "Frontend .env already exists, skipping creation"
fi

# Step 3: Setup PostgreSQL Database
log_info "Step 3: Setting up PostgreSQL database..."

# Start PostgreSQL if it's not running
if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql@15 2>/dev/null || true
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo systemctl start postgresql 2>/dev/null || true
fi

# Wait for PostgreSQL to start
sleep 2

# Create PostgreSQL user if it doesn't exist
if ! psql -U postgres -c "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1; then
    log_info "Creating PostgreSQL user: $DB_USER..."
    psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD 'restaurant_pwd_2024!' SUPERUSER;" 2>/dev/null || true
    log_success "PostgreSQL user created"
else
    log_warning "PostgreSQL user already exists"
fi

# Create database if it doesn't exist
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    log_info "Creating PostgreSQL database: $DB_NAME..."
    psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
    log_success "PostgreSQL database created"
else
    log_warning "PostgreSQL database already exists"
fi

# Step 4: Install dependencies
log_info "Step 4: Installing dependencies..."

log_info "Installing backend dependencies..."
npm install --legacy-peer-deps > /dev/null 2>&1 || npm install
log_success "Backend dependencies installed"

log_info "Installing frontend dependencies..."
cd frontend && npm install --legacy-peer-deps > /dev/null 2>&1 || npm install
cd ..
log_success "Frontend dependencies installed"

# Step 5: Seed database
log_info "Step 5: Seeding database with sample data..."
node backend/seedDatabase.js > /dev/null 2>&1 && log_success "Database seeded successfully" || log_warning "Database seeding encountered an issue, but continuing..."

# Step 6: Display startup information
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          ✓ Setup Complete Successfully!             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

log_info "System Information:"
echo "  Backend Port:        $BACKEND_PORT"
echo "  Frontend Port:       $FRONTEND_PORT"
echo "  Database:            $DB_NAME"
echo "  Node Version:        $NODE_VERSION"
echo "  npm Version:         v$NPM_VERSION"
echo ""

log_info "Configuration Files:"
echo "  Backend Config:      ./$ENV_FILE"
echo "  Frontend Config:     ./frontend/.env"
echo ""

log_info "Default Login Credentials:"
echo "  Email:               admin@restaurant.com"
echo "  Password:            Admin!2024@cafe"
echo ""

log_info "Alternative Users:"
echo "  Manager:             manager@restaurant.com / Manager!2024@cafe"
echo "  Cashier:             cashier@restaurant.com / Cashier!2024@cafe"
echo "  Waiter:              waiter@restaurant.com / Waiter!2024@cafe"
echo "  Chef:                chef@restaurant.com / Chef!2024@cafe"
echo ""

log_info "Starting Application..."
echo ""

# Step 7: Start the application
log_info "Launching servers in 2 seconds..."
sleep 2

# Start backend in background
log_info "Starting backend server on http://localhost:$BACKEND_PORT..."
npm run server > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start frontend
log_info "Starting frontend server on http://localhost:$FRONTEND_PORT..."
cd frontend && npm start

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
