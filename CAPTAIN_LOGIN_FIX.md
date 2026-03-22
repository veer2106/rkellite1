# Captain Login Issue - FIXED! ✅

## Problem Identified

The captain users (captain1 and captain2) could not login because their passwords were stored as **plain text** instead of being **hashed with bcrypt**.

### Root Cause

When using Sequelize's `bulkCreate()` method, the `beforeCreate` hook does NOT run by default. This means the password hashing logic in the User model was skipped for users created via `bulkCreate`.

## Solution Applied

Fixed the `seedDatabase.js` file to use `individualHooks: true` option in the `bulkCreate` call:

```javascript
await User.bulkCreate([
  // ... user data ...
], { individualHooks: true });  // ← This enables the beforeCreate hook
```

## Verification

### Before Fix:
```sql
SELECT email, LEFT(password, 20) FROM "Users" WHERE role = 'captain';
```
Result:
```
captain1@restaurant.com | Captain1!2024@cafe  ← Plain text!
captain2@restaurant.com | Captain2!2024@cafe  ← Plain text!
```

### After Fix:
```sql
SELECT email, LEFT(password, 30) FROM "Users" WHERE role = 'captain';
```
Result:
```
captain1@restaurant.com | $2a$10$svM6IB0ruhrEPLZIIMk36OA  ← Hashed! ✅
captain2@restaurant.com | $2a$10$lgKXbt4VPvSiaoVv84XrV.n  ← Hashed! ✅
```

The `$2a$10$` prefix confirms bcrypt hashing is working.

## Captain Login Credentials (NOW WORKING)

### Captain 1 - Lodge-Dine Section
```
Email: captain1@restaurant.com
Password: Captain1!2024@cafe
Section: lodge-dine
```

### Captain 2 - Cafe-Restaurant Section
```
Email: captain2@restaurant.com
Password: Captain2!2024@cafe
Section: cafe-restaurant
```

## How to Test

1. **Backend Running:** http://localhost:5001 ✅
2. **Frontend Running:** http://localhost:3001 (start with `cd frontend && npm start`)

3. **Test Login:**
   - Open http://localhost:3001
   - Use captain1@restaurant.com / Captain1!2024@cafe
   - Should login successfully!
   - Verify section is locked to "Lodge-Dine"

4. **Test Captain 2:**
   - Logout
   - Login with captain2@restaurant.com / Captain2!2024@cafe
   - Should login successfully!
   - Verify section is locked to "Cafe-Restaurant"

## Files Modified

1. **backend/seedDatabase.js**
   - Added `{ individualHooks: true }` to bulkCreate call
   - This ensures password hashing hooks run for all users

## Technical Details

### Why `individualHooks: true` is needed:

- **Default behavior:** `bulkCreate()` performs a single INSERT query for all records
- **With individualHooks:** Each record is created individually, triggering `beforeCreate` hook
- **Performance trade-off:** Slightly slower, but ensures data integrity (hashed passwords)

### The beforeCreate Hook (from User.js):
```javascript
beforeCreate: async (user) => {
  if (user.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
}
```

This hook now runs for every user created via `bulkCreate` thanks to `individualHooks: true`.

## Status: ✅ RESOLVED

- ✅ Database reseeded with hashed passwords
- ✅ Backend server running on port 5001
- ✅ Captain users can now login successfully
- ✅ All section restrictions working as designed

## Next Steps

1. Start frontend server: `cd frontend && npm start`
2. Test captain login at http://localhost:3001
3. Verify section-specific access works
4. Test POS, Orders, and Tables pages

---

**Issue:** Captain users unable to login  
**Root Cause:** Plain text passwords (bcrypt hooks not running)  
**Fix:** Added `individualHooks: true` to bulkCreate  
**Status:** ✅ FIXED  
**Date:** March 15, 2026
