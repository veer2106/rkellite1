# 🔧 Login Troubleshooting Guide

**Last Updated:** March 14, 2026  
**Status:** ✅ Backend API Working | Frontend Configuration Updated

---

## ✅ Current Status

### What's Working
- ✅ Backend API is online and responding
- ✅ Login API endpoint is functional (`/api/auth/login`)
- ✅ Database is seeded with user accounts
- ✅ Frontend is compiled and running
- ✅ DNS is configured correctly
- ✅ Nginx reverse proxy is working

### Configuration Updates Made
- ✅ Frontend API URL: `http://api.cafe-delicacy-restaurant.com/api`
- ✅ Backend CORS: Configured for domain access
- ✅ Database: Connected with correct credentials
- ✅ PM2: Both services running

---

## 🧪 Test Results

### 1. Backend API Test ✅
```bash
curl -X POST http://api.cafe-delicacy-restaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"Admin!2024@cafe"}'
```

**Result:** HTTP 200 OK
```json
{
  "success": true,
  "data": {
    "id": "d742badd-4c90-49d8-b487-9466023c1dab",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@restaurant.com",
    "role": "admin",
    "token": "eyJhbGciOi..."
  }
}
```

### 2. Frontend Accessibility ✅
- **URL:** http://cafe-delicacy-restaurant.com
- **Status:** HTTP 200 OK
- **Webpack:** Compiled successfully

---

## 🔍 Common Login Issues & Solutions

### Issue 1: "Invalid credentials" or "Login failed"

**Possible Causes:**
- Incorrect email or password
- Database not seeded
- User account inactive

**Solutions:**

1. **Verify Credentials:**
   ```
   Email: admin@restaurant.com
   Password: Admin!2024@cafe
   ```
   ⚠️ Password is case-sensitive!

2. **Check if user exists in database:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   PGPASSWORD=postgres123 psql -U postgres -d restaurant_db \
     -c "SELECT email, role, \"isActive\" FROM users WHERE email = 'admin@restaurant.com';"
   ```

3. **Reseed database if needed:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   cd restaurant-cafe
   DB_PASSWORD=postgres123 node backend/seedDatabase.js
   pm2 restart restaurant-backend
   ```

### Issue 2: Network Error / Cannot connect to server

**Possible Causes:**
- Backend not running
- Wrong API URL in frontend
- CORS issues
- Firewall blocking requests

**Solutions:**

1. **Check backend status:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   pm2 status
   pm2 logs restaurant-backend
   ```

2. **Verify API URL:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   cat restaurant-cafe/frontend/.env
   ```
   Should show: `REACT_APP_API_URL=http://api.cafe-delicacy-restaurant.com/api`

3. **Test API directly:**
   ```bash
   curl http://api.cafe-delicacy-restaurant.com/api/health
   ```
   Should return: `{"status":"OK","message":"Restaurant Management System API"}`

4. **Restart services:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   pm2 restart all
   ```

### Issue 3: Token not persisting / Keeps logging out

**Possible Causes:**
- localStorage not working
- Token expiring too quickly
- Browser cache issues

**Solutions:**

1. **Clear browser cache:**
   - Open Developer Tools (F12)
   - Go to Application tab
   - Clear Storage
   - Refresh page

2. **Check localStorage:**
   - Open Console (F12)
   - Type: `localStorage.getItem('token')`
   - Should show a JWT token after login

3. **Check token expiration:**
   - Current setting: 30 days
   - Token includes expiry in payload

### Issue 4: CORS Error in Console

**Error Message:** 
```
Access to XMLHttpRequest at 'http://api.cafe-delicacy-restaurant.com/api/auth/login' 
from origin 'http://cafe-delicacy-restaurant.com' has been blocked by CORS policy
```

**Solutions:**

1. **Verify backend CORS configuration:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   cat restaurant-cafe/backend/.env | grep FRONTEND_URL
   ```
   Should show: `FRONTEND_URL=http://cafe-delicacy-restaurant.com`

2. **Restart backend:**
   ```bash
   pm2 restart restaurant-backend
   ```

### Issue 5: Frontend shows old/cached version

**Symptoms:**
- Login not working after configuration changes
- Old API URL being used
- Changes not reflected

**Solutions:**

1. **Hard refresh browser:**
   - Chrome/Edge: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
   - Firefox: `Ctrl + F5` (Windows/Linux) or `Cmd + Shift + R` (Mac)

2. **Clear browser cache completely**

3. **Restart frontend:**
   ```bash
   ssh -i cafe.pem ec2-user@65.2.124.30
   pm2 restart restaurant-frontend
   ```

---

## 🛠️ Quick Fixes

### Fix 1: Complete Service Restart

```bash
ssh -i cafe.pem ec2-user@65.2.124.30
pm2 restart all
pm2 logs
```

### Fix 2: Rebuild Environment

```bash
ssh -i cafe.pem ec2-user@65.2.124.30

# Update frontend .env
echo 'REACT_APP_API_URL=http://api.cafe-delicacy-restaurant.com/api' > restaurant-cafe/frontend/.env

# Update backend .env
cat > restaurant-cafe/backend/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_NAME=restaurant_db
DB_USER=postgres
DB_PASSWORD=postgres123
JWT_SECRET=VeerDag@123456-jwt-secret-cafe-delicacy
PORT=5001
FRONTEND_URL=http://cafe-delicacy-restaurant.com
NODE_ENV=production
EOF

# Restart services
pm2 delete all
cd restaurant-cafe/backend && DB_PASSWORD=postgres123 NODE_ENV=production pm2 start npm --name restaurant-backend -- run server
cd ../frontend && REACT_APP_API_URL=http://api.cafe-delicacy-restaurant.com/api pm2 start npm --name restaurant-frontend -- start
pm2 save
```

### Fix 3: Reseed Database

```bash
ssh -i cafe.pem ec2-user@65.2.124.30
cd restaurant-cafe
DB_PASSWORD=postgres123 node backend/seedDatabase.js
pm2 restart restaurant-backend
```

---

## 📊 Browser Developer Tools Debugging

### Step 1: Open Developer Tools
- Press `F12` or right-click → "Inspect"

### Step 2: Check Network Tab
1. Go to **Network** tab
2. Click on login button
3. Look for `login` request
4. Check:
   - **Status:** Should be `200 OK`
   - **Response:** Should contain `"success": true` and `"token"`
   - **Headers:** Check `Request URL` matches API domain

### Step 3: Check Console Tab
1. Go to **Console** tab
2. Look for errors (red text)
3. Common errors:
   - **CORS errors:** Backend CORS misconfigured
   - **Network errors:** Backend not responding
   - **401 Unauthorized:** Wrong credentials

### Step 4: Check Application Tab
1. Go to **Application** tab
2. Expand **Local Storage**
3. Click on your domain
4. After successful login, should see:
   - `token`: JWT token string
   - Any other user data

---

## 📝 Verification Checklist

Before reporting login issues, verify:

- [ ] Backend is running (`pm2 status` shows "online")
- [ ] Frontend is running (`pm2 status` shows "online")
- [ ] Database is seeded (users table has data)
- [ ] Using correct credentials:
  - Email: `admin@restaurant.com`
  - Password: `Admin!2024@cafe`
- [ ] Frontend .env has correct API_URL
- [ ] Backend .env has correct FRONTEND_URL
- [ ] Browser cache is cleared
- [ ] Developer Console shows no errors
- [ ] Network tab shows API request succeeds (200 OK)

---

## 🔬 Advanced Debugging

### Check Backend Logs

```bash
ssh -i cafe.pem ec2-user@65.2.124.30
pm2 logs restaurant-backend --lines 50
```

Look for:
- Database connection errors
- Authentication errors
- Server startup messages

### Check Frontend Logs

```bash
ssh -i cafe.pem ec2-user@65.2.124.30
pm2 logs restaurant-frontend --lines 50
```

Look for:
- Compilation errors
- Webpack errors
- Runtime errors

### Test Login via cURL

```bash
# Test login API
curl -X POST http://api.cafe-delicacy-restaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@restaurant.com",
    "password": "Admin!2024@cafe"
  }' | jq .

# If successful, extract token
TOKEN=$(curl -s -X POST http://api.cafe-delicacy-restaurant.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"Admin!2024@cafe"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# Test authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://api.cafe-delicacy-restaurant.com/api/auth/me | jq .
```

---

## 🆘 Still Not Working?

### Collect Debug Information

```bash
# SSH to EC2
ssh -i cafe.pem ec2-user@65.2.124.30

# Collect system status
echo "=== PM2 Status ===" && pm2 status && \
echo "=== Backend Logs ===" && pm2 logs restaurant-backend --lines 20 --nostream && \
echo "=== Frontend Logs ===" && pm2 logs restaurant-frontend --lines 20 --nostream && \
echo "=== Backend .env ===" && cat restaurant-cafe/backend/.env && \
echo "=== Frontend .env ===" && cat restaurant-cafe/frontend/.env && \
echo "=== Database Check ===" && PGPASSWORD=postgres123 psql -U postgres -d restaurant_db -c "SELECT COUNT(*) as user_count FROM users;"
```

### Nuclear Option: Complete Reset

⚠️ **Warning: This will delete all data!**

```bash
ssh -i cafe.pem ec2-user@65.2.124.30

# Stop all services
pm2 delete all
pm2 kill

# Reset database
PGPASSWORD=postgres123 psql -U postgres -c "DROP DATABASE IF EXISTS restaurant_db;"
PGPASSWORD=postgres123 psql -U postgres -c "CREATE DATABASE restaurant_db OWNER postgres;"

# Reseed
cd restaurant-cafe
DB_PASSWORD=postgres123 node backend/seedDatabase.js

# Restart services
cd backend && DB_PASSWORD=postgres123 NODE_ENV=production pm2 start npm --name restaurant-backend -- run server
cd ../frontend && REACT_APP_API_URL=http://api.cafe-delicacy-restaurant.com/api pm2 start npm --name restaurant-frontend -- start
pm2 save
```

---

## ✅ Expected Behavior

### Successful Login Flow

1. **User enters credentials:**
   - Email: `admin@restaurant.com`
   - Password: `Admin!2024@cafe`

2. **Frontend sends POST request:**
   - URL: `http://api.cafe-delicacy-restaurant.com/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body: `{"email":"admin@restaurant.com","password":"Admin!2024@cafe"}`

3. **Backend responds:**
   - Status: `200 OK`
   - Body: `{"success":true,"data":{"token":"...","id":"...","email":"..."}}`

4. **Frontend receives response:**
   - Stores token in localStorage
   - Redirects to dashboard
   - Sets Authorization header for future requests

5. **User sees dashboard:**
   - Authenticated as Admin
   - Full access to all features

---

**Last Tested:** March 14, 2026, 5:15 PM IST  
**Status:** ✅ Login API verified working via cURL  
**Action Required:** Test login from browser interface
