# ⚡ Quick Reference Guides

Fast access to essential information and system status.

---

## 📚 Quick Guides

### [Quick Reference Guide](QUICK_REFERENCE.md)
One-page reference for common operations.
- **Login**: Credentials and access
- **Menu**: Add/Edit/Delete items
- **POS**: Take orders quickly
- **Common Tasks**: Frequent operations
- **Shortcuts**: Keyboard shortcuts

### [Local Development](LOCAL_DEVELOPMENT.md)
Quick guide for local development setup.
- **Prerequisites**: What you need
- **Installation**: Quick setup
- **Running**: Start servers
- **Development**: Dev workflow
- **Debugging**: Common issues

---

## 📊 System Status

### [Application Running](APPLICATION_RUNNING.md)
Current application status and health.
- **Backend**: Port 5001 status
- **Frontend**: Port 3000 status
- **Database**: Connection status
- **Services**: Running services

### [App Running Status](APP_RUNNING_STATUS.md)
Detailed system status information.
- **Server Status**: Uptime, health
- **Active Sessions**: Current users
- **Performance**: Response times
- **Errors**: Recent errors

### [Shutdown Complete](SHUTDOWN_COMPLETE.md)
Shutdown procedures and status.
- **Graceful Shutdown**: Safe stop
- **Service Cleanup**: Resource cleanup
- **Status Check**: Verify shutdown
- **Restart**: How to restart

---

## 🎯 Quick Access

### Common Credentials
**Admin Login:**
- Email: admin@restaurant.com
- Password: Admin!2024@cafe

### Default Ports
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5001
- **Database**: localhost:5432

### Quick Commands
```bash
# Start backend
npm start

# Start frontend
cd frontend && npm start

# Check backend status
lsof -ti:5001

# Check frontend status
lsof -ti:3000
```

---

## 📋 Quick Checklists

### Starting the Application
- [ ] Database is running
- [ ] Environment variables set
- [ ] Backend started (port 5001)
- [ ] Frontend started (port 3000)
- [ ] Can access http://localhost:3000

### Adding a Menu Item
- [ ] Login as Admin/Manager
- [ ] Go to Menu Management
- [ ] Click "Add Item"
- [ ] Fill in name, category, section
- [ ] Set price (required)
- [ ] Set cost (optional)
- [ ] Click "Save"

### Taking an Order (POS)
- [ ] Go to POS page
- [ ] Select section (Lodge-Dine/Cafe)
- [ ] Click items to add to cart
- [ ] Enter customer info
- [ ] Select table (if dine-in)
- [ ] Submit order

---

## 🔍 Quick Troubleshooting

**App won't start?**
→ Check [Local Development](LOCAL_DEVELOPMENT.md)

**Can't login?**
→ Check [Login Troubleshooting](../troubleshooting/LOGIN_TROUBLESHOOTING.md)

**Items not showing in POS?**
→ Check section filter and availability

**Database errors?**
→ Verify PostgreSQL is running

---

[← Back to Documentation Index](../README.md)
