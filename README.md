# RK Ellite - Restaurant Management System

A comprehensive, professional restaurant management software with complete features for modern restaurant operations.

## 🎯 Features

### Core Features
- **POS System** - Point of Sale with billing & order management
- **Inventory Management** - Stock control & supplier management
- **Table Reservations** - QR code ordering & table management
- **Online Ordering** - Delivery integration & order tracking
- **Menu Management** - Dynamic pricing & menu customization
- **Sales Analytics** - Reports, insights & business intelligence
- **Staff Management** - Scheduling, payroll & performance tracking
- **Customer CRM** - Loyalty programs & customer engagement

## 🏗️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Sequelize** - ORM
- **JWT** - Authentication
- **Socket.IO** - Real-time updates

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Redux** - State management
- **Axios** - HTTP client
- **Chart.js** - Data visualization

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- npm or yarn

### Setup

1. **Clone and install dependencies**
```bash
npm run install-all
```

2. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup database**
```bash
# Create PostgreSQL database
createdb restaurant_db

# Run migrations
npm run migrate
```

4. **Start development servers**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

### Production on EC2 (no Docker)

Use **Node + PostgreSQL + Nginx + PM2** on the server. Full steps:

- **[docs/deployment/DEPLOY_HOST_NO_DOCKER.md](docs/deployment/DEPLOY_HOST_NO_DOCKER.md)**

Quick paths:

```bash
# On server after clone: install deps, build, PM2
cp .env.host.example .env   # then edit DB password, JWT, URLs
npm run build:prod
pm2 start ecosystem.config.cjs
```

```bash
# From your laptop (SSH): clone/update + install script
export EC2_IP=YOUR_IP
export SSH_KEY=./cafe.pem
bash scripts/deploy-native-ec2.sh
```

## 🚀 Usage

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **API Documentation**: http://localhost:5001/api/docs

### Default Admin Login
- Email: admin@restaurant.com
- Password: admin123 (Change after first login)

## 📁 Project Structure

```
restaurant-management-system/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── redux/       # State management
│   │   ├── services/    # API services
│   │   ├── utils/       # Utilities
│   │   └── App.js       # Root component
│   └── public/          # Static files
└── package.json
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting
- Helmet.js security headers

## � Logging System

The application includes a comprehensive logging system for monitoring and debugging:

### Log Levels
- **ERROR** - Critical errors that need immediate attention
- **WARN** - Warning messages for potential issues
- **INFO** - General informational messages (default)
- **DEBUG** - Detailed debugging information

### Configuration
Configure logging via environment variables in `.env`:
```bash
LOG_LEVEL=INFO                    # Set log level (ERROR, WARN, INFO, DEBUG)
ENABLE_FILE_LOGGING=false         # Enable file logging (recommended for production)
```

### Features
- **Console Logging** - Color-coded console output for development
- **File Logging** - Structured JSON logs in `backend/logs/` directory
  - `combined.log` - All log entries
  - `error.log` - Error-level logs only
  - `YYYY-MM-DD.log` - Daily log files
- **Automatic HTTP Request Logging** - All API requests with duration and status
- **Database Query Logging** - SQL queries in debug mode
- **Audit Trail** - User actions tracked in database (view in Reports → Audit History)
- **Error Stack Traces** - Detailed error information for debugging

### What Gets Logged
- Server startup and shutdown
- User authentication (login/register/logout)
- Database operations (create/update/delete)
- API requests and responses
- Socket.IO connections
- Errors and exceptions
- Menu and inventory changes
- Order creation and updates

### Viewing Logs
- **Development**: Check terminal console
- **Production**: Review log files in `backend/logs/`
- **Audit History**: View user actions in Reports section (frontend)

## �📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### POS & Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Cancel order

### Inventory
- `GET /api/inventory` - List items
- `POST /api/inventory` - Add item
- `PUT /api/inventory/:id` - Update item
- `POST /api/inventory/restock` - Restock items

### Menu Management
- `GET /api/menu` - Get menu
- `POST /api/menu/items` - Add menu item
- `PUT /api/menu/items/:id` - Update item
- `DELETE /api/menu/items/:id` - Remove item

### Reservations
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PUT /api/reservations/:id` - Update reservation

### Reports & Analytics
- `GET /api/reports/sales` - Sales reports
- `GET /api/reports/inventory` - Inventory reports
- `GET /api/reports/staff` - Staff reports

## 🛠️ Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Database Migrations
```bash
# Create migration
npm run migrate:create

# Run migrations
npm run migrate

# Rollback
npm run migrate:undo
```

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Support

For support, email support@restaurant-system.com or open an issue.
