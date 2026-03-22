# Table Management System Documentation

## Overview

The Table Management System allows you to configure and manage tables for both the Lodge-Dine and Cafe-Restaurant sections. It includes table occupancy tracking to prevent double-booking and automatic table status updates.

## Features

### 1. **Configurable Tables Per Section**
- Set the number of tables for Lodge-Dine section
- Set the number of tables for Cafe-Restaurant section
- Configure seats per table
- Tables are numbered automatically (1, 2, 3, etc.)

### 2. **Table Status Management**
Four status types:
- **Available** - Table is ready for customers
- **Occupied** - Table has an active order
- **Reserved** - Table is reserved for a customer
- **Cleaning** - Table is being cleaned

### 3. **Table Occupancy Protection**
- When a dine-in order is created for a table, it becomes "Occupied"
- No other orders can use that table until the current order is completed or cancelled
- Tables are automatically freed when orders are completed/cancelled

### 4. **Real-Time Table Availability**
- Check table availability before creating orders
- View occupied tables with their current order numbers
- See available vs occupied statistics

## API Endpoints

### GET /api/tables
Get all tables with optional filters
```javascript
Query Parameters:
- section: 'lodge-dine' | 'cafe-restaurant'
- status: 'available' | 'occupied' | 'reserved' | 'cleaning'
- isActive: boolean
```

### GET /api/tables/config
Get table configuration for both sections
```javascript
Response:
{
  "success": true,
  "data": {
    "lodge-dine": 10,
    "cafe-restaurant": 15
  }
}
```

### GET /api/tables/availability/:section/:tableNumber
Check if a specific table is available
```javascript
Example: GET /api/tables/availability/lodge-dine/5

Response:
{
  "success": true,
  "available": true,
  "message": "Table is available"
}
```

### POST /api/tables/setup
Setup tables for a section (Admin/Manager only)
```javascript
Request Body:
{
  "section": "lodge-dine",
  "numberOfTables": 10,
  "seatsPerTable": 4
}

Response:
{
  "success": true,
  "message": "Successfully set up 10 tables for lodge-dine",
  "data": {
    "section": "lodge-dine",
    "numberOfTables": 10,
    "created": 5,
    "updated": 5
  }
}
```

### PUT /api/tables/:id/status
Update table status
```javascript
Request Body:
{
  "status": "cleaning"
}
```

### DELETE /api/tables/:id
Delete a table (Admin/Manager only)
- Cannot delete tables with active orders

## Database Schema

### Table Model
```javascript
{
  id: UUID (Primary Key),
  tableNumber: String (Table number like "1", "2", etc.),
  section: ENUM('lodge-dine', 'cafe-restaurant'),
  seats: Integer (Number of seats, default: 4),
  status: ENUM('available', 'occupied', 'reserved', 'cleaning'),
  location: String (Optional),
  qrCode: Text (Optional, for QR code ordering),
  currentOrderId: UUID (Reference to Orders table),
  isActive: Boolean (Default: true),
  createdAt: DateTime,
  updatedAt: DateTime
}

Indexes:
- Unique composite index on [tableNumber, section]
```

### Order Model Updates
```javascript
Added fields:
- section: ENUM('lodge-dine', 'cafe-restaurant')
- tableNumber: String

Relationships:
- Order hasMany Tables (through currentOrderId)
- Table hasOne Order (current order)
```

## Usage Guide

### Setting Up Tables

1. **Navigate to Tables Page**
   - Click "Tables" in the sidebar navigation
   - Select the section (Lodge-Dine or Cafe-Restaurant)

2. **Click "Setup Tables"**
   - Choose the section
   - Enter number of tables (1-100)
   - Enter seats per table (1-20)
   - Click "Create/Update Tables"

3. **Result**
   - Tables are created numbered 1 to N
   - Existing tables are updated
   - Tables beyond the count are deactivated

### Creating Orders with Tables

1. **In POS System**
   - Select order type as "Dine-In"
   - Choose section (Lodge-Dine or Cafe-Restaurant)
   - Enter table number
   - Add items to cart
   - Submit order

2. **Table Validation**
   - System checks if table is available
   - If table is occupied, shows error with current order number
   - If available, creates order and marks table as occupied

3. **Automatic Table Update**
   - Table status changes to "Occupied"
   - Table's currentOrderId is set to the new order
   - Table shows in occupied status on Tables page

### Completing Orders

1. **Update Order Status to "Completed"**
   - Go to Orders page
   - Update order status to "Completed"

2. **Automatic Table Release**
   - Table status changes to "Available"
   - currentOrderId is cleared
   - Table is ready for next customer

### Manual Table Management

1. **Mark Table as Cleaning**
   - Go to Tables page
   - Click on occupied table
   - Click "Mark as Cleaning"
   - Table status changes to "Cleaning"

2. **Mark Table as Available**
   - Click on cleaning table
   - Click "Done Cleaning"
   - Table becomes available

## Frontend Components

### Tables.js
Main table management component

**Features:**
- Section toggle (Lodge-Dine / Cafe-Restaurant)
- Setup mode for configuring tables
- Grid view of all tables with status colors
- Statistics dashboard (Total, Available, Occupied)
- Status legend
- Click to update table status

**Location:** `frontend/src/pages/Tables.js`

### POS.js Updates
Added table availability checking

**Changes:**
- Validates table number for dine-in orders
- Checks table availability before creating order
- Shows error if table is occupied
- Success message includes table status

**Location:** `frontend/src/pages/POS.js`

## Backend Controllers

### tableController.js
Handles all table operations

**Functions:**
- `getTables()` - Get all tables with filters
- `getTable()` - Get single table details
- `getTableAvailability()` - Check if table is available
- `setupTables()` - Create/update tables for a section
- `updateTableStatus()` - Update table status
- `deleteTable()` - Delete a table
- `getTableConfig()` - Get table counts for both sections

**Location:** `backend/controllers/tableController.js`

### orderController.js Updates
Added table occupancy logic

**Changes:**
- Check table availability before creating dine-in orders
- Associate order with table
- Free table when order is completed/cancelled

**Location:** `backend/controllers/orderController.js`

## Security & Permissions

### Authentication Required
All table endpoints require authentication

### Admin/Manager Only
- POST /api/tables/setup (Creating/updating tables)
- DELETE /api/tables/:id (Deleting tables)

### All Authenticated Users Can:
- View tables
- Check table availability
- Update table status
- Create orders with tables

## Error Handling

### Table Already Occupied
```javascript
Status: 400 Bad Request
{
  "success": false,
  "message": "Table 5 in lodge-dine section is already occupied with order ORD-123. Please choose another table or complete the existing order first."
}
```

### Invalid Section
```javascript
Status: 400 Bad Request
{
  "success": false,
  "message": "Invalid section. Must be lodge-dine or cafe-restaurant"
}
```

### Cannot Delete Table with Active Order
```javascript
Status: 400 Bad Request
{
  "success": false,
  "message": "Cannot delete table with an active order"
}
```

## Best Practices

### 1. Table Setup
- Plan your table layout before setup
- Start with a reasonable number (10-20 tables per section)
- Use standard seat counts (2, 4, 6, 8)

### 2. Order Management
- Always check table availability in POS
- Complete or cancel orders promptly to free tables
- Use table numbers consistently

### 3. Table Status
- Mark tables as "Cleaning" after customers leave
- Only mark as "Available" when table is ready
- Use "Reserved" for phone/online reservations

### 4. Section Organization
- Keep Lodge-Dine and Cafe-Restaurant tables separate
- Number tables consistently (start from 1)
- Don't reuse table numbers across sections

## Testing

### 1. Test Table Setup
```bash
# Setup 10 tables for lodge-dine
POST /api/tables/setup
{
  "section": "lodge-dine",
  "numberOfTables": 10,
  "seatsPerTable": 4
}

# Verify tables created
GET /api/tables?section=lodge-dine
```

### 2. Test Table Occupancy
```bash
# Create order for table 5
POST /api/orders
{
  "orderType": "dine-in",
  "section": "lodge-dine",
  "tableNumber": "5",
  "items": [...]
}

# Try to create another order for same table
POST /api/orders
{
  "orderType": "dine-in",
  "section": "lodge-dine",
  "tableNumber": "5",
  "items": [...]
}
# Should return error: Table already occupied
```

### 3. Test Table Release
```bash
# Complete the order
PUT /api/orders/:orderId/status
{
  "status": "completed"
}

# Check table is now available
GET /api/tables/availability/lodge-dine/5
# Should return: "available": true
```

## Migration Guide

### Existing Databases

If you have existing orders in your database:

1. **Run Database Migration**
   ```bash
   # The Table model will create the tables table
   # Existing orders without section/tableNumber will still work
   ```

2. **Setup Tables**
   - Use the Tables page to setup tables for both sections
   - Existing orders are not affected

3. **New Orders**
   - All new dine-in orders should include section and tableNumber
   - System will validate table availability

## Troubleshooting

### Issue: Table shows as occupied but no active order
**Solution:** Manually update table status to "available"
```javascript
PUT /api/tables/:tableId/status
{ "status": "available" }
```

### Issue: Cannot create order for available table
**Solution:** Check if table exists and is active
```javascript
GET /api/tables/availability/:section/:tableNumber
```

### Issue: Tables not showing in POS
**Solution:** Ensure tables are set up and active
```javascript
GET /api/tables/config
```

## Future Enhancements

### Planned Features
1. Table merging (combine tables for large groups)
2. Table layout designer (visual floor plan)
3. Waitlist management
4. Table transfer (move order to different table)
5. Table time tracking (how long occupied)
6. QR code generation for contactless ordering
7. Table booking/reservations integration

---

**Version:** 1.0  
**Last Updated:** March 15, 2026  
**Status:** Production Ready
