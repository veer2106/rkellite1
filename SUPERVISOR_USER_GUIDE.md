# Supervisor User Documentation

## User Created Successfully ✅

### Login Credentials
- **Email:** supervisor@cafedelicacy.com
- **Password:** supervisor123
- **Role:** Supervisor

---

## Access Permissions

The Supervisor role has been configured with access to the following sections:

### 1. 📋 Orders
- View all orders from both sections (Lodge-Dine and Cafe-Restaurant)
- Monitor order status and timeline
- Track order performance metrics
- View order durations and timestamps

### 2. 📦 Inventory
- Manage inventory items
- Track stock levels
- Update inventory quantities
- Monitor low stock alerts
- Add/Edit inventory items

### 3. 👥 Staff
- View staff members
- Manage staff information
- Monitor staff schedules
- Update staff details

---

## Navigation Restrictions

The Supervisor user will **only** see these three sections in the navigation menu:
- Orders
- Inventory  
- Staff

All other sections (Dashboard, POS, Tables, Menu, Reservations, Customers, Reports) are hidden from the supervisor role.

---

## User Profile

- **Name:** Supervisor User
- **Department:** Operations
- **Badge:** Purple "Supervisor" badge displayed in the header
- **Section Access:** All sections (not restricted to Lodge-Dine or Cafe-Restaurant)

---

## How to Login

1. Navigate to http://localhost:3000/login
2. Enter email: `supervisor@cafedelicacy.com`
3. Enter password: `supervisor123`
4. Click "Login"

You will be redirected to the Orders page (default landing page for supervisors).

---

## Technical Details

### Database Changes
- Added 'supervisor' to the `enum_Users_role` type
- Created new user record in the Users table

### Code Changes
- Updated `backend/models/User.js` - Added 'supervisor' to role enum
- Updated `frontend/src/components/Layout.js` - Added supervisor navigation filter
- Created `backend/createSupervisor.js` - User creation script

### Files Created
- `backend/createSupervisor.js` - Script to create supervisor user
- `backend/migrations/add_supervisor_role_and_user.sql` - SQL migration reference

---

## Future Enhancements

If you need to modify supervisor permissions in the future:

1. Edit the navigation filter in `frontend/src/components/Layout.js`
2. Look for the `getFilteredNavigation()` function
3. Modify the array in the supervisor check:
   ```javascript
   if (user?.role === 'supervisor') {
     return navigation.filter(item =>
       item.name === 'Orders' ||
       item.name === 'Inventory' ||
       item.name === 'Staff'
       // Add more sections here
     );
   }
   ```

---

## Password Reset

To reset the supervisor password, you can:

1. Use the database directly:
   ```sql
   UPDATE "Users" 
   SET password = '$2a$10$...' -- bcrypt hash
   WHERE email = 'supervisor@cafedelicacy.com';
   ```

2. Or create a password reset script similar to `createSupervisor.js`

---

## Notes

- The supervisor role is independent of sections (not tied to Lodge-Dine or Cafe-Restaurant)
- Supervisor can view and manage data from all sections
- Password is hashed using bcrypt with salt rounds of 10
- User status is active by default

---

**Created:** March 15, 2026  
**Last Updated:** March 15, 2026
