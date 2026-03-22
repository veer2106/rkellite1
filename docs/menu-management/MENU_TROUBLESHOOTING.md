# 🔧 Menu Item Add/Edit/Delete - Troubleshooting Guide

**Date:** March 15, 2026  
**Issue:** Failing to add/edit/delete menu items  
**Status:** ✅ Enhanced Error Handling Implemented

---

## 🎯 Common Issues & Solutions

### Issue 1: "Not authorized, no token" ❌

**Symptom:** Error message shows "Not authorized, no token"

**Cause:** User is not logged in or token has expired

**Solution:**
```
1. Go to http://localhost:3000
2. If not on login page, logout first
3. Login with:
   - Email: admin@restaurant.com
   - Password: Admin!2024@cafe
4. Try adding menu item again
```

---

### Issue 2: "Forbidden" or "Not authorized" ❌

**Symptom:** Error message shows user doesn't have permission

**Cause:** Logged in user doesn't have admin/manager role

**Solution:**
```
1. Logout
2. Login with admin account:
   - Email: admin@restaurant.com
   - Password: Admin!2024@cafe
3. Admin and Manager roles can add/edit/delete menu items
```

---

### Issue 3: Validation Errors ❌

**Symptom:** Error message about missing or invalid fields

**Required Fields:**
- ✅ **Name** - Cannot be empty
- ✅ **Category** - Must select from dropdown
- ✅ **Price** - Must be a valid number

**Optional Fields:**
- ⚪ Description
- ⚪ Cost
- ⚪ Availability (defaults to checked/true)

**Solution:**
```
1. Make sure Name is filled
2. Select a category from dropdown (not empty)
3. Enter a valid price (numbers only)
4. Cost is optional
5. Click Add Item or Update Item
```

---

### Issue 4: Backend Not Running ❌

**Symptom:** Cannot connect to server

**Check:**
```bash
lsof -ti:5001
```

**If empty, start backend:**
```bash
cd /Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe
npm start
```

---

### Issue 5: Frontend Not Running ❌

**Symptom:** Cannot access http://localhost:3000

**Check:**
```bash
lsof -ti:3000
```

**If empty, start frontend:**
```bash
cd /Users/veershettydagade/Documents/restaurant-proj/restaurant-cafe/frontend
npm start
```

---

## 🔍 Debugging Steps

### Step 1: Check Browser Console
```
1. Open browser (Chrome/Firefox)
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Try adding menu item
5. Look for error messages (now includes detailed errors)
```

### Step 2: Check Network Tab
```
1. Open Developer Tools (F12)
2. Go to Network tab
3. Filter by "XHR" or "Fetch"
4. Try adding menu item
5. Click on the POST request to /api/menu
6. Check:
   - Request Headers (should have Authorization: Bearer ...)
   - Request Payload (your form data)
   - Response (error message if any)
```

### Step 3: Verify Login Status
```
1. Open Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Look at Local Storage
4. Check if "token" exists
5. If not, login again
```

### Step 4: Check Backend Logs
```
Look at the terminal running backend (npm start)
Errors will appear there if validation fails
```

---

## ✅ Updated Error Handling

### What's New:
The Menu.js file now includes:

1. **Better Error Messages:**
```javascript
// Instead of generic "Failed to add menu item"
// Now shows specific error from backend:
const errorMessage = error.response?.data?.message || error.message || 'Failed to add menu item';
toast.error(errorMessage);
```

2. **Console Logging:**
```javascript
console.error('Error adding menu item:', error);
// Check browser console for detailed error info
```

3. **Data Validation:**
```javascript
const payload = {
  ...formData,
  price: parseFloat(formData.price) || 0,
  cost: formData.cost ? parseFloat(formData.cost) : null
};
// Ensures price is a number, cost can be null
```

---

## 🧪 Test Scenarios

### Test 1: Add Menu Item (Success)
```
1. Login as admin
2. Navigate to Menu Management
3. Click "Add Item"
4. Fill in:
   - Name: "Test Cappuccino"
   - Category: "Beverages" (from dropdown)
   - Price: 80
   - Cost: 30
   - Availability: Checked
5. Click "Add Item"
6. Should see: ✅ "Menu item added successfully"
```

### Test 2: Add Menu Item (Missing Category)
```
1. Click "Add Item"
2. Fill in:
   - Name: "Test Item"
   - Price: 50
   - (Leave category empty)
3. Click "Add Item"
4. Should see validation error (browser will prevent submission)
```

### Test 3: Add Without Login
```
1. Logout or clear token from localStorage
2. Try to add item
3. Should see: ❌ "Not authorized, no token"
4. User redirected to login page
```

### Test 4: Edit Menu Item
```
1. Login as admin
2. Find any menu item
3. Click "Edit"
4. Change name or price
5. Click "Update Item"
6. Should see: ✅ "Menu item updated successfully"
```

### Test 5: Delete Menu Item
```
1. Login as admin
2. Find any menu item
3. Click "Delete"
4. Confirm in modal
5. Should see: ✅ "Menu item deleted successfully"
```

---

## 🔐 Authentication Requirements

### Who Can Add/Edit/Delete Menu Items:
✅ **Admin** (role: 'admin')  
✅ **Manager** (role: 'manager')  
❌ **Cashier** (role: 'cashier') - Cannot modify menu  
❌ **Waiter** (role: 'waiter') - Cannot modify menu  
❌ **Chef** (role: 'chef') - Cannot modify menu  

### Test Accounts:
```javascript
// Admin Account (Full Access)
Email: admin@restaurant.com
Password: Admin!2024@cafe
Role: admin

// Manager Account (Can add/edit/delete menu)
Email: manager@restaurant.com
Password: Manager!2024@cafe
Role: manager

// Cashier Account (Cannot modify menu)
Email: cashier@restaurant.com
Password: Cashier!2024@cafe
Role: cashier
```

---

## 📊 API Endpoints

### Add Menu Item:
```
POST /api/menu
Headers: Authorization: Bearer <token>
Body: {
  "name": "string (required)",
  "description": "string (optional)",
  "category": "string (required)",
  "price": number (required),
  "cost": number (optional),
  "isAvailable": boolean (optional, default true)
}
```

### Update Menu Item:
```
PUT /api/menu/:id
Headers: Authorization: Bearer <token>
Body: Same as POST
```

### Delete Menu Item:
```
DELETE /api/menu/:id
Headers: Authorization: Bearer <token>
```

---

## 🎯 Quick Fixes

### Fix 1: Not Logged In
```
Solution: Login with admin@restaurant.com / Admin!2024@cafe
```

### Fix 2: Token Expired
```
Solution: Logout and login again
```

### Fix 3: Wrong Role
```
Solution: Use admin or manager account
```

### Fix 4: Missing Required Fields
```
Solution: Fill Name, Category, and Price
```

### Fix 5: Backend Not Running
```
Solution: cd to project root && npm start
```

### Fix 6: Frontend Not Running
```
Solution: cd to frontend && npm start
```

---

## 🔍 Error Messages Explained

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| "Not authorized, no token" | Not logged in | Login first |
| "Not authorized to access this route" | Wrong role | Use admin/manager account |
| "Validation error" | Missing required field | Check Name, Category, Price |
| "Menu item not found" | ID doesn't exist | Refresh page |
| "Failed to fetch menu items" | Backend issue | Check backend is running |
| Network error | Cannot connect | Check ports 3000 & 5001 |

---

## 💡 Pro Tips

### Tip 1: Check Token in Console
```javascript
// In browser console:
localStorage.getItem('token')
// Should return a long JWT token
// If null, login again
```

### Tip 2: Verify User Info
```javascript
// In browser console:
JSON.parse(localStorage.getItem('user'))
// Should show user object with role: 'admin' or 'manager'
```

### Tip 3: Test API Directly
```bash
# Get token first by logging in
# Then test API:
curl -X POST http://localhost:5001/api/menu \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "category": "Beverages",
    "price": 50
  }'
```

---

## 🚀 Next Steps

1. **Check Browser Console** for detailed error messages
2. **Verify Login Status** (check localStorage for token)
3. **Try with Admin Account** (admin@restaurant.com)
4. **Check Network Tab** to see API request/response
5. **Review Backend Logs** for server-side errors

---

## 📝 Summary

**Updated Files:**
- ✅ `frontend/src/pages/Menu.js` - Enhanced error handling

**Improvements:**
- ✅ Shows specific error messages from backend
- ✅ Logs errors to console for debugging
- ✅ Validates and parses price/cost as numbers
- ✅ Better user feedback

**Most Common Solution:**
```
Login with: admin@restaurant.com / Admin!2024@cafe
```

---

**Status:** ✅ Error handling improved  
**Next:** Check browser console for specific error message  
**Help:** See error messages above for solutions
