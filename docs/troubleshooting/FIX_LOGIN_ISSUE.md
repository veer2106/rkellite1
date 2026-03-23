# 🔧 Fix Login Issue - Step by Step

## Problem Identified

The **backend API is working perfectly** (we confirmed this with curl tests), but your **browser can't login** because the frontend JavaScript is configured to connect to `http://localhost:5001/api` instead of using the correct domain.

When you built the frontend on your local machine, it was configured for development (localhost). Now that it's deployed, it needs to use relative URLs.

---

## Solution: Rebuild Frontend with Correct Configuration

### Step 1: SSH into your EC2 server

```bash
ssh -i cafe.pem ec2-user@13.233.0.43
```

### Step 2: Check current API configuration

```bash
cat ~/restaurant-cafe/frontend/src/services/api.js
```

You'll probably see something like:
```javascript
baseURL: 'http://localhost:5001/api',
```

### Step 3: Update the API configuration

```bash
cat > ~/restaurant-cafe/frontend/src/services/api.js << 'EOF'
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
EOF
```

✅ **Key change:** `baseURL: '/api'` instead of `'http://localhost:5001/api'`

### Step 4: Rebuild the frontend

```bash
cd ~/restaurant-cafe/frontend
npm run build
```

This will take 1-2 minutes. Wait for it to complete.

### Step 5: Reload Nginx

```bash
sudo systemctl reload nginx
```

### Step 6: Verify the fix

Test the login API through Nginx:

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@restaurant.com","password":"Admin!2024@cafe"}'
```

Should return: `{"success":true, ...}`

---

## Step 7: Test in Your Browser

### IMPORTANT: Clear Your Browser Cache

The old JavaScript is cached in your browser. You MUST do a hard refresh:

**Windows/Linux:**
- Press `Ctrl + Shift + R`
- Or `Ctrl + F5`

**Mac:**
- Press `Cmd + Shift + R`

**Or use Incognito/Private mode:**
- `Ctrl + Shift + N` (Windows/Linux)
- `Cmd + Shift + N` (Mac)

### Try Logging In

1. Go to: `http://cafe-delicacy-restaurant.com`
2. Enter credentials:
   - **Email:** `admin@restaurant.com`
   - **Password:** `Admin!2024@cafe`
3. Click "Sign In"

---

## Still Not Working? Debug in Browser Console

If login still fails after rebuilding and hard refresh:

### Step 1: Open Browser Developer Tools

- Press `F12`
- Or right-click → "Inspect"

### Step 2: Go to Console Tab

Look for **red error messages**

### Step 3: Go to Network Tab

1. Click "Network" tab
2. Try logging in again
3. Look for the `login` request
4. Click on it
5. Check:
   - **Request URL:** Should be `http://cafe-delicacy-restaurant.com/api/auth/login`
   - **Status Code:** Should be `200`
   - **Response:** Should show `{"success": true}`

### Common Issues:

#### Issue 1: Request URL shows `http://localhost:5001/api/auth/login`
**Cause:** Browser still using cached old JavaScript  
**Fix:** Do a HARD refresh (Ctrl+Shift+R) or clear all browser cache

#### Issue 2: Status Code 404
**Cause:** Nginx routing issue  
**Fix:** Check Nginx configuration

#### Issue 3: Status Code 401 or "Invalid credentials"
**Cause:** Wrong password  
**Fix:** Make sure password is exactly: `Admin!2024@cafe` (case-sensitive)

#### Issue 4: CORS error
**Cause:** CORS headers missing  
**Fix:** Already configured, shouldn't happen

---

## Alternative: Quick Test in Browser Console

If you want to test the API directly from your browser without logging in:

1. Open the website: `http://cafe-delicacy-restaurant.com`
2. Press `F12` to open console
3. Paste this command:

```javascript
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@restaurant.com',
    password: 'Admin!2024@cafe'
  })
})
.then(r => r.json())
.then(data => console.log('Login result:', data))
.catch(err => console.error('Login error:', err));
```

**Expected result:**
```javascript
Login result: {
  success: true,
  data: {
    id: "...",
    firstName: "Admin",
    lastName: "User",
    email: "admin@restaurant.com",
    role: "admin",
    token: "eyJhbG..."
  }
}
```

If this works, then the API is fine and the issue is with the React app's configuration.

---

## Summary

**Root Cause:** Frontend was built with `localhost:5001` API configuration

**Fix:** Rebuild frontend with relative URL (`/api`) and clear browser cache

**After Fix:** Do a hard refresh (Ctrl+Shift+R) in your browser

---

## Need Help?

If you're still having issues after following these steps, please share:

1. **Browser console errors** (screenshot of Console tab)
2. **Network request details** (screenshot of Network tab showing the login request)
3. **Result of the fetch() test** (from browser console)

This will help diagnose the exact issue.

---

**Created:** March 16, 2026  
**For:** cafe-delicacy-restaurant.com login issue  
**Status:** Backend working ✅ | Frontend needs rebuild 🔧
