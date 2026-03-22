# 🔐 Login Credentials - Cafe Delicacy Restaurant

**Last Updated:** March 14, 2026  
**Environment:** Production (EC2)

---

## 🌐 Application URLs

### Frontend
- **Main:** http://cafe-delicacy-restaurant.com
- **WWW:** http://www.cafe-delicacy-restaurant.com
- **App:** http://app.cafe-delicacy-restaurant.com

### Backend API
- **API:** http://api.cafe-delicacy-restaurant.com
- **Health:** http://api.cafe-delicacy-restaurant.com/api/health
- **Login:** http://api.cafe-delicacy-restaurant.com/api/auth/login

---

## 👥 User Accounts

### 1. Administrator
- **Email:** `admin@restaurant.com`
- **Password:** `Admin!2024@cafe`
- **Role:** Admin
- **Permissions:** Full system access

### 2. Manager
- **Email:** `manager@restaurant.com`
- **Password:** `Manager!2024@cafe`
- **Role:** Manager
- **Permissions:** Staff management, reports, inventory

### 3. Cashier
- **Email:** `cashier@restaurant.com`
- **Password:** `Cashier!2024@cafe`
- **Role:** Cashier
- **Permissions:** POS, orders, payments

### 4. Waiter/Server
- **Email:** `waiter@restaurant.com`
- **Password:** `Waiter!2024@cafe`
- **Role:** Waiter
- **Permissions:** Orders, tables, customers

### 5. Chef
- **Email:** `chef@restaurant.com`
- **Password:** `Chef!2024@cafe`
- **Role:** Chef
- **Permissions:** Kitchen orders, menu, inventory

---

## 🧪 Testing Login via API

### Using cURL

```bash
curl -X POST http://api.cafe-delicacy-restaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin!2024@cafe"
  }'
```

### Expected Response

```json
{
  "success": true,
  "data": {
    "id": "d742badd-4c90-49d8-b487-9466023c1dab",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@restaurant.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Using the Token

```bash
# Store token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Make authenticated request
curl -X GET http://api.cafe-delicacy-restaurant.com/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Credentials

### PostgreSQL
- **Host:** localhost
- **Port:** 5432
- **Database:** restaurant_db
- **User:** postgres
- **Password:** postgres123

### Connection String
```
postgresql://postgres:postgres123@localhost:5432/restaurant_db
```

---

## 🔑 System Credentials

### EC2 SSH Access
```bash
ssh -i cafe.pem ec2-user@65.2.124.30
```

### PM2 Access
```bash
pm2 status
pm2 logs restaurant-backend
pm2 logs restaurant-frontend
```

---

## ⚠️ Security Notes

### Production Recommendations

1. **Change Default Passwords**
   - All user passwords should be changed after first login
   - Use strong, unique passwords for each account

2. **Database Security**
   - Change PostgreSQL password: `postgres123` is weak
   - Restrict database access to localhost only
   - Enable SSL/TLS for database connections

3. **JWT Security**
   - JWT_SECRET should be a long random string
   - Consider shorter token expiration (currently 30 days)
   - Implement token refresh mechanism

4. **SSL/HTTPS**
   - Install SSL certificates (Let's Encrypt)
   - Force HTTPS redirect
   - Update FRONTEND_URL to https://

5. **API Security**
   - Implement rate limiting
   - Add request validation
   - Enable CORS properly
   - Log all authentication attempts

---

## 🔄 Password Reset

### Via Database (Admin Only)

```bash
# SSH to EC2
ssh -i cafe.pem ec2-user@65.2.124.30

# Connect to database
PGPASSWORD=postgres123 psql -U postgres -d restaurant_db

# Update password (bcrypt hashed)
UPDATE users 
SET password = '$2b$10$NEW_HASHED_PASSWORD_HERE'
WHERE email = 'admin@restaurant.com';
```

### Via API (Future Implementation)
- POST /api/auth/forgot-password
- POST /api/auth/reset-password

---

## 📊 User Roles & Permissions

| Role | Dashboard | POS | Orders | Menu | Inventory | Staff | Reports | Settings |
|------|-----------|-----|--------|------|-----------|-------|---------|----------|
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manager | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Cashier | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Waiter | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Chef | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 🆘 Troubleshooting Login Issues

### Issue 1: "Invalid credentials"
**Solution:** 
- Verify email and password are correct
- Check if database was seeded
- Restart backend: `pm2 restart restaurant-backend`

### Issue 2: "Network error"
**Solution:**
- Check backend is running: `pm2 status`
- Verify API URL in frontend/.env
- Check security groups allow port 5001

### Issue 3: "Token expired"
**Solution:**
- Login again to get new token
- Token valid for 30 days by default

### Issue 4: Database not seeded
**Solution:**
```bash
ssh -i cafe.pem ec2-user@65.2.124.30
cd restaurant-cafe
DB_PASSWORD=postgres123 node backend/seedDatabase.js
pm2 restart restaurant-backend
```

---

## 📝 Quick Test Checklist

- [ ] Can access frontend: http://cafe-delicacy-restaurant.com
- [ ] Can access backend: http://api.cafe-delicacy-restaurant.com/api/health
- [ ] Can login as admin
- [ ] Can login as manager
- [ ] Can login as cashier
- [ ] Can access dashboard after login
- [ ] Token persists in browser
- [ ] Logout works correctly

---

**Status:** ✅ All accounts active and tested  
**Environment:** Production  
**Last Login Test:** March 14, 2026, 5:00 PM IST
