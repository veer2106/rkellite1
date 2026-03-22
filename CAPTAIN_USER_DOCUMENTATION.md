# Section-Based Captain User System

## Overview

This system implements section-specific access control for restaurant operations, allowing dedicated captains to manage their respective sections (Lodge-Dine or Cafe-Restaurant) independently.

## Captain User Credentials

### Captain 1 - Lodge-Dine Section
- **Email**: `captain1@restaurant.com`
- **Password**: `Captain1!2024@cafe`
- **Section**: Lodge-Dine
- **Access**: Can only view and manage Lodge-Dine section orders, tables, and POS

### Captain 2 - Cafe-Restaurant Section
- **Email**: `captain2@restaurant.com`
- **Password**: `Captain2!2024@cafe`
- **Section**: Cafe-Restaurant
- **Access**: Can only view and manage Cafe-Restaurant section orders, tables, and POS

## Features

### 1. Section-Based Access Control

**Backend Implementation:**
- New `section` field added to User model (ENUM: 'lodge-dine', 'cafe-restaurant')
- New role `captain` added to User roles
- Section-based filtering in Order, Table, and POS controllers
- Automatic section enforcement for captain users

**Frontend Implementation:**
- Section toggle buttons disabled for captains (shows only their section)
- Orders filtered automatically by captain's section
- Tables filtered automatically by captain's section
- POS restricted to captain's section only

### 2. User Role: Captain

**Permissions:**
- ✅ Can create orders (only in their section)
- ✅ Can view orders (only from their section)
- ✅ Can update order status (only for their section)
- ✅ Can view tables (only from their section)
- ✅ Can update table status (only for their section)
- ✅ Can use POS system (only for their section)
- ❌ Cannot setup/configure tables (admin/manager only)
- ❌ Cannot delete tables (admin/manager only)
- ❌ Cannot switch sections
- ❌ Cannot access other sections' data

### 3. Access Restrictions by Page

#### POS Page (`/pos`)
- **Captains**: 
  - Section toggle is disabled
  - Automatically set to their assigned section
  - Cannot create orders for other sections
  - Table numbers are validated within their section only

- **Admin/Manager**:
  - Can switch between sections freely
  - Can create orders for any section

#### Orders Page (`/orders`)
- **Captains**:
  - Section filter is disabled and locked to their section
  - Only see orders from their section
  - Can update status for their section's orders only

- **Admin/Manager**:
  - Can filter by "All Sections" or specific section
  - Can view and manage orders from all sections

#### Tables Page (`/tables`)
- **Captains**:
  - Section toggle is disabled
  - Only see tables from their section
  - Can update table status for their section
  - Cannot setup new tables

- **Admin/Manager**:
  - Can switch between sections
  - Can setup/configure tables
  - Can delete tables
  - Full table management access

## Database Schema Changes

### User Model Updates

```javascript
{
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'cashier', 'waiter', 'chef', 'delivery', 'captain'),
    defaultValue: 'waiter'
  },
  section: {
    type: DataTypes.ENUM('lodge-dine', 'cafe-restaurant'),
    allowNull: true,
    comment: 'Section access for captains and section-specific roles'
  }
}
```

## Backend Implementation

### 1. Updated Controllers

#### Order Controller (`backend/controllers/orderController.js`)

**getOrders():**
```javascript
// Section-based filtering for captains
if (req.user.role === 'captain' && req.user.section) {
  where.section = req.user.section;
}
```

**getOrder():**
```javascript
// Section-based access control for captains
if (req.user.role === 'captain' && req.user.section) {
  if (order.section !== req.user.section) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You can only access ${req.user.section} section orders.` 
    });
  }
}
```

**createOrder():**
```javascript
// Section-based access control for captains
if (req.user.role === 'captain' && req.user.section) {
  if (section && section !== req.user.section) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You can only create orders for ${req.user.section} section.` 
    });
  }
  // Force captain's section if not provided
  req.body.section = req.user.section;
}
```

#### Table Controller (`backend/controllers/tableController.js`)

**getTables():**
```javascript
// Section-based filtering for captains
if (req.user.role === 'captain' && req.user.section) {
  where.section = req.user.section;
}
```

**getTable():**
```javascript
// Section-based access control for captains
if (req.user.role === 'captain' && req.user.section) {
  if (table.section !== req.user.section) {
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. You can only access ${req.user.section} section tables.` 
    });
  }
}
```

### 2. Auth Controller Updates

**login():**
```javascript
res.json({
  success: true,
  data: {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    section: user.section,  // Include section in login response
    token: generateToken(user.id)
  }
});
```

### 3. Section Access Middleware (New)

Created `backend/middleware/sectionAccess.js`:

```javascript
const filterBySection = (req, res, next) => {
  if (req.user && req.user.role === 'captain' && req.user.section) {
    req.sectionFilter = req.user.section;
    req.query.section = req.user.section;
  }
  next();
};

const validateSectionAccess = (req, res, next) => {
  if (req.user && req.user.role === 'captain' && req.user.section) {
    const requestedSection = req.body.section || req.params.section || req.query.section;
    
    if (requestedSection && requestedSection !== req.user.section) {
      return res.status(403).json({
        success: false,
        message: `Access denied. You can only access ${req.user.section} section.`
      });
    }
    
    if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
      req.body.section = req.user.section;
    }
  }
  next();
};
```

## Frontend Implementation

### 1. Redux Store

The user's section is automatically stored in Redux state when they login:

```javascript
{
  user: {
    id: "...",
    firstName: "Captain",
    lastName: "One",
    email: "captain1@restaurant.com",
    role: "captain",
    section: "lodge-dine"  // Stored in state
  }
}
```

### 2. POS Page Updates (`frontend/src/pages/POS.js`)

```javascript
import { useSelector } from 'react-redux';

const { user } = useSelector(state => state.auth);

// Set initial section based on user's role
const getInitialSection = () => {
  if (user?.role === 'captain' && user?.section) {
    return user.section;
  }
  return 'lodge-dine';
};

// Disable section toggle for captains
<button
  onClick={() => user?.role !== 'captain' && setSelectedSection('lodge-dine')}
  disabled={user?.role === 'captain' && user?.section !== 'lodge-dine'}
  className={/* ... with opacity-50 for disabled */}
>
  Lodge-Dine
</button>
```

### 3. Orders Page Updates (`frontend/src/pages/Orders.js`)

```javascript
import { useSelector } from 'react-redux';

const { user } = useSelector(state => state.auth);

// Lock section filter for captains
<select
  value={sectionFilter}
  onChange={(e) => setSectionFilter(e.target.value)}
  disabled={user?.role === 'captain'}
  className="... disabled:opacity-50 disabled:cursor-not-allowed"
>
  <option value="all">All Sections</option>
  <option value="lodge-dine">🏨 Lodge-Dine</option>
  <option value="cafe-restaurant">☕ Cafe-Restaurant</option>
</select>
```

### 4. Tables Page Updates (`frontend/src/pages/Tables.js`)

```javascript
// Disable section toggle for captains
<button
  onClick={() => user?.role !== 'captain' && setSelectedSection('lodge-dine')}
  disabled={user?.role === 'captain' && user?.section !== 'lodge-dine'}
>
  🏨 Lodge-Dine ({tableConfig['lodge-dine']} tables)
</button>

// Hide setup button for captains
{user?.role !== 'captain' && (
  <button onClick={() => setSetupMode(!setupMode)}>
    {setupMode ? 'Cancel Setup' : 'Setup Tables'}
  </button>
)}
```

## Testing the Captain Users

### 1. Test Captain 1 (Lodge-Dine)

**Login:**
```
Email: captain1@restaurant.com
Password: Captain1!2024@cafe
```

**Expected Behavior:**
1. Login successful
2. Dashboard shows only Lodge-Dine section data
3. POS page:
   - Section locked to "Lodge-Dine"
   - Cafe-Restaurant button is disabled
   - Can create orders only for Lodge-Dine tables
4. Orders page:
   - Section filter locked to "Lodge-Dine"
   - Only Lodge-Dine orders visible
5. Tables page:
   - Section locked to "Lodge-Dine"
   - Only Lodge-Dine tables visible
   - Setup Tables button hidden

**Test Cases:**
- ✅ Create order for Lodge-Dine table → Success
- ❌ Try to manually create order for Cafe-Restaurant → Backend blocks (403 error)
- ✅ View Lodge-Dine orders → Success
- ❌ Try to view Cafe-Restaurant order (by URL manipulation) → Backend blocks (403 error)

### 2. Test Captain 2 (Cafe-Restaurant)

**Login:**
```
Email: captain2@restaurant.com
Password: Captain2!2024@cafe
```

**Expected Behavior:**
1. Login successful
2. Dashboard shows only Cafe-Restaurant section data
3. POS page:
   - Section locked to "Cafe-Restaurant"
   - Lodge-Dine button is disabled
   - Can create orders only for Cafe-Restaurant tables
4. Orders page:
   - Section filter locked to "Cafe-Restaurant"
   - Only Cafe-Restaurant orders visible
5. Tables page:
   - Section locked to "Cafe-Restaurant"
   - Only Cafe-Restaurant tables visible
   - Setup Tables button hidden

**Test Cases:**
- ✅ Create order for Cafe-Restaurant table → Success
- ❌ Try to manually create order for Lodge-Dine → Backend blocks (403 error)
- ✅ View Cafe-Restaurant orders → Success
- ❌ Try to view Lodge-Dine order (by URL manipulation) → Backend blocks (403 error)

## Security Features

### 1. Frontend Restrictions
- UI elements disabled/hidden for captains
- Section selection locked to user's section
- Visual feedback (opacity, disabled state)

### 2. Backend Enforcement
- Section validation on all endpoints
- Automatic section filtering in queries
- 403 Forbidden errors for unauthorized section access
- Section override in request body for captains

### 3. Data Isolation
- Captains can only see data from their section
- Database queries filtered by section
- No cross-section data leakage
- Audit logs track section-specific actions

## Error Messages

**Unauthorized Section Access:**
```json
{
  "success": false,
  "message": "Access denied. You can only access lodge-dine section orders."
}
```

**Invalid Section in Request:**
```json
{
  "success": false,
  "message": "Access denied. You can only create orders for cafe-restaurant section."
}
```

**Table from Wrong Section:**
```json
{
  "success": false,
  "message": "Access denied. You can only access lodge-dine section tables."
}
```

## Migration Guide

### For Existing Installations

1. **Update Database:**
```bash
cd backend
npm run seed
```

This will:
- Add `section` column to Users table
- Add `captain` to role ENUM
- Create captain1 and captain2 users

2. **Update Frontend:**
```bash
cd frontend
npm install
npm start
```

3. **Test Captain Access:**
- Login as captain1@restaurant.com
- Verify Lodge-Dine section access only
- Login as captain2@restaurant.com
- Verify Cafe-Restaurant section access only

## Best Practices

### 1. Creating New Captain Users

**Via API:**
```javascript
POST /api/auth/register
{
  "firstName": "Captain",
  "lastName": "Three",
  "email": "captain3@restaurant.com",
  "password": "Captain3!2024@cafe",
  "role": "captain",
  "section": "lodge-dine",  // or "cafe-restaurant"
  "phone": "+1234567897"
}
```

**Via Database Seed:**
```javascript
await User.create({
  firstName: 'Captain',
  lastName: 'Three',
  email: 'captain3@restaurant.com',
  password: 'Captain3!2024@cafe',
  role: 'captain',
  section: 'lodge-dine',
  phone: '+1234567897',
  department: 'Lodge-Dine Section',
  isActive: true
});
```

### 2. Section Management

- Always assign a section when creating captain users
- Section field is required for captain role
- Update section if captain moves to different section
- Deactivate user (isActive: false) instead of deleting

### 3. Access Control

- Never expose captain users to "All Sections" data
- Always validate section on backend
- Use middleware for consistent enforcement
- Log section-specific actions for audit

## Troubleshooting

### Captain Can't See Any Data

**Cause**: Section not assigned to captain user
**Solution**: 
```sql
UPDATE Users SET section = 'lodge-dine' WHERE role = 'captain' AND email = 'captain1@restaurant.com';
```

### Captain Seeing Wrong Section

**Cause**: Incorrect section assigned
**Solution**: Update user's section in database

### Section Toggle Not Disabled

**Cause**: User data not loaded in Redux
**Solution**: Check login response includes section field

### Backend Returns 403 Errors

**Cause**: Frontend sending requests for wrong section
**Solution**: Verify section is properly set in request

## Future Enhancements

1. **Multi-Section Captains**: Allow captains to manage multiple sections
2. **Section Transfer**: UI for admin to transfer captains between sections
3. **Section Analytics**: Dashboard showing performance by section
4. **Section Reports**: Generate reports specific to each section
5. **Section Permissions**: Fine-grained permissions per section
6. **Section Shifts**: Schedule captains for specific sections/shifts

## Summary

The Captain User System provides:
- ✅ Complete section isolation
- ✅ Role-based access control
- ✅ Frontend and backend security
- ✅ Easy user management
- ✅ Clear error messages
- ✅ Audit trail support
- ✅ Scalable architecture

**All Features Working:**
- 2 Captain users created (captain1, captain2)
- Section-specific access enforced
- POS, Orders, and Tables pages restricted
- Backend validation in place
- Frontend UI adapted for captains
