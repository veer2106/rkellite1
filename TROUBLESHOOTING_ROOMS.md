# Troubleshooting: "Failed to fetch rooms" Error

## Quick Fix Steps:

### 1. **Check if you're logged in as Admin**
The Rooms section is **only accessible to admin users**.

**Steps:**
1. Go to http://localhost:3000/login
2. Login with admin credentials:
   - **Email:** `admin@cafedelicacy.com`
   - **Password:** `admin123`
3. After login, navigate to the Rooms section

### 2. **Verify Backend Server is Running**
Check terminal output to ensure backend is on port 5001:
```
✓ Server started successfully {"port":5001}
```

### 3. **Check Browser Console**
Open browser DevTools (F12) → Console tab
Look for any error messages when accessing `/rooms` page

### 4. **Common Issues & Solutions:**

#### Issue: "Failed to fetch rooms"
**Possible Causes:**
- Not logged in
- Logged in as non-admin user (captain, supervisor, etc.)
- Backend server not running
- Network error

**Solution:**
1. Ensure backend server is running (port 5001)
2. Clear browser cache and reload
3. Logout and login again as admin
4. Check browser console for specific error

#### Issue: Rooms section not visible in menu
**Cause:** You're not logged in as admin

**Solution:**
Only admin users can see the "Rooms" menu item. Login as:
- Email: `admin@cafedelicacy.com`
- Password: `admin123`

#### Issue: API returns 401 Unauthorized
**Cause:** Authentication token expired or invalid

**Solution:**
1. Logout
2. Login again
3. Navigate to Rooms page

### 5. **Manual API Test**
If you want to test the API manually:

1. **Login and get token:**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cafedelicacy.com","password":"admin123"}'
```

2. **Copy the token from response**

3. **Test rooms endpoint:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  http://localhost:5001/api/rooms
```

### 6. **Verify Rooms in Database**
```bash
psql -d restaurant_db -c 'SELECT "roomNumber", "roomType", status FROM "Rooms";'
```

Expected output: 6 rooms (101, 102, 201, 202, 301, 302)

### 7. **Check Server Logs**
When you navigate to the Rooms page, check the backend terminal for request logs.
You should see:
```
GET /api/rooms
GET /api/rooms/stats/overview
```

If you see errors, they will indicate the problem.

### 8. **Restart Servers** (If nothing works)
```bash
# Kill both servers
lsof -ti:5001 | xargs kill -9
lsof -ti:3000 | xargs kill -9

# Start backend
cd backend && npm start

# In another terminal, start frontend
cd frontend && npm start
```

---

## Current Status:
✅ Backend server: Running on port 5001  
✅ Frontend server: Running on port 3000  
✅ Database: 6 rooms created  
✅ Routes: Properly configured  

## Access Requirements:
- **Role:** Admin only
- **URL:** http://localhost:3000/rooms
- **Login:** admin@cafedelicacy.com / admin123

---

## If Problem Persists:

1. **Check browser Network tab** (F12 → Network)
   - Look for the `/api/rooms` request
   - Check status code (should be 200)
   - Check response

2. **Look at the error message in browser console**
   - It will give you the specific reason

3. **Common Error Messages:**
   - "Network Error" → Backend not running
   - "401 Unauthorized" → Not logged in or token expired
   - "403 Forbidden" → Not an admin user
   - "404 Not Found" → Route not properly configured

---

**Most Likely Solution:**  
Log out and log back in as admin user (`admin@cafedelicacy.com` / `admin123`), then navigate to Rooms page.
