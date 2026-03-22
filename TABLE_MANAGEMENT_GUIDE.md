# Table Management Guide

## Overview
The Restaurant Management System now supports **section-specific table creation** with two distinct sections:
- **Lodge-Dine Section** (LD)
- **Cafe-Restaurant Section** (CR)

## Features

### ✅ 20 Tables Pre-configured
- **10 tables** for Lodge-Dine (LD-01 to LD-10)
- **10 tables** for Cafe-Restaurant (CR-01 to CR-10)

### ✅ Section Isolation
- Tables are completely isolated by section
- Captains can only see and manage tables in their assigned section
- Database enforces unique constraint on `tableNumber + section`

### ✅ Two Ways to Add Tables

#### 1. **Individual Table Creation** (New Feature! ✨)
Perfect for adding specific tables one at a time.

**Access:** Admin & Manager only

**How to Use:**
1. Navigate to **Tables** page
2. Select the section (Lodge-Dine or Cafe-Restaurant)
3. Click **"+ Add Table"** button
4. Fill in the form:
   - **Table Number**: Custom identifier (e.g., LD-11, CR-VIP-01)
   - **Section**: Lodge-Dine or Cafe-Restaurant
   - **Seats**: Number of seats (1-20)
   - **Location**: Physical location (e.g., Patio, Window Side, Private Room)
5. Click **"Add Table"**

**Example Use Cases:**
- Adding a VIP table: `CR-VIP-01`
- Adding an outdoor table: `LD-PATIO-01`
- Adding special seating: `CR-BAR-01`

**API Endpoint:**
```bash
POST /api/tables
Authorization: Bearer <token>
Content-Type: application/json

{
  "tableNumber": "LD-11",
  "section": "lodge-dine",
  "seats": 6,
  "location": "Terrace"
}
```

#### 2. **Bulk Table Setup**
Perfect for setting up or resetting all tables at once.

**Access:** Admin & Manager only

**How to Use:**
1. Navigate to **Tables** page
2. Click **"Bulk Setup"** button
3. Configure:
   - **Section**: Choose section
   - **Number of Tables**: Total count
   - **Seats Per Table**: Default seat count
4. Click **"Create/Update Tables"**

**What it does:**
- Creates numbered tables (1, 2, 3, ...)
- Updates existing tables
- Deactivates tables beyond the count

**API Endpoint:**
```bash
POST /api/tables/setup
Authorization: Bearer <token>
Content-Type: application/json

{
  "section": "lodge-dine",
  "numberOfTables": 15,
  "seatsPerTable": 4
}
```

## Table Naming Conventions

### Recommended Format

**Lodge-Dine Tables:**
- Standard: `LD-01`, `LD-02`, ... `LD-10`
- Special: `LD-VIP-01`, `LD-TERRACE-01`, `LD-WINDOW-01`

**Cafe-Restaurant Tables:**
- Standard: `CR-01`, `CR-02`, ... `CR-10`
- Special: `CR-BAR-01`, `CR-PATIO-01`, `CR-GARDEN-01`

### Why This Format?
- **LD/CR prefix**: Quickly identifies section
- **Numeric suffix**: Easy sorting and reference
- **Descriptive names**: For special areas (VIP, Patio, etc.)

## Table Properties

| Property | Type | Description |
|----------|------|-------------|
| `tableNumber` | String | Unique identifier within section |
| `section` | Enum | `lodge-dine` or `cafe-restaurant` |
| `seats` | Integer | Number of seats (1-20) |
| `location` | String | Physical location in restaurant |
| `status` | Enum | `available`, `occupied`, `reserved`, `cleaning` |
| `isActive` | Boolean | Whether table is in use |

## Table Statuses

- 🟢 **Available**: Ready for customers
- 🔴 **Occupied**: Has an active order
- 🟡 **Reserved**: Reserved for upcoming customer
- 🔵 **Cleaning**: Being cleaned/sanitized

## Role-Based Access

### Admin & Manager
- ✅ View all tables (both sections)
- ✅ Add individual tables
- ✅ Bulk setup tables
- ✅ Update table status
- ✅ Delete tables
- ✅ Switch between sections

### Captain
- ✅ View only their section's tables
- ✅ Update table status
- ❌ Cannot add tables
- ❌ Cannot delete tables
- ❌ Cannot switch sections

### Other Staff (Waiter, Cashier, Chef)
- ✅ View all tables
- ✅ Update table status
- ❌ Cannot add/delete tables

## Current Table Configuration

### Lodge-Dine Section (10 Tables)
| Table | Seats | Location |
|-------|-------|----------|
| LD-01 | 2 | Main Hall |
| LD-02 | 2 | Main Hall |
| LD-03 | 4 | Main Hall |
| LD-04 | 4 | Main Hall |
| LD-05 | 4 | Window Side |
| LD-06 | 6 | Window Side |
| LD-07 | 6 | Corner |
| LD-08 | 8 | Private Room |
| LD-09 | 4 | Center |
| LD-10 | 2 | Bar Area |

### Cafe-Restaurant Section (10 Tables)
| Table | Seats | Location |
|-------|-------|----------|
| CR-01 | 2 | Patio |
| CR-02 | 2 | Patio |
| CR-03 | 4 | Patio |
| CR-04 | 4 | Garden View |
| CR-05 | 4 | Garden View |
| CR-06 | 6 | Indoor |
| CR-07 | 6 | Indoor |
| CR-08 | 8 | Banquet Hall |
| CR-09 | 2 | Bar Counter |
| CR-10 | 4 | Terrace |

## API Endpoints Summary

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/tables` | All authenticated | Get all tables (filtered by section for captains) |
| GET | `/api/tables/:id` | All authenticated | Get single table |
| GET | `/api/tables/config` | All authenticated | Get table count per section |
| GET | `/api/tables/availability/:section/:tableNumber` | All authenticated | Check table availability |
| **POST** | **`/api/tables`** | **Admin, Manager** | **Create individual table** ⭐ NEW |
| POST | `/api/tables/setup` | Admin, Manager | Bulk setup tables |
| PUT | `/api/tables/:id/status` | All authenticated | Update table status |
| DELETE | `/api/tables/:id` | Admin, Manager | Delete table |

## Examples

### Adding a VIP Table for Lodge-Dine
```javascript
// Frontend usage
const newTable = {
  tableNumber: 'LD-VIP-01',
  section: 'lodge-dine',
  seats: 8,
  location: 'VIP Lounge'
};

await api.post('/tables', newTable);
```

### Adding a Bar Counter Table for Cafe-Restaurant
```javascript
const barTable = {
  tableNumber: 'CR-BAR-01',
  section: 'cafe-restaurant',
  seats: 2,
  location: 'Bar Counter'
};

await api.post('/tables', barTable);
```

### Checking Table Availability
```javascript
const { data } = await api.get('/tables/availability/lodge-dine/LD-11');
if (data.available) {
  console.log('Table is available!');
}
```

## Best Practices

1. **Naming Convention**: Use section prefixes (LD/CR) for clarity
2. **Sequential Numbers**: Keep standard tables numbered sequentially
3. **Descriptive Names**: Use descriptive names for special areas
4. **Seat Count**: Be realistic about seating capacity
5. **Location Details**: Provide clear location information
6. **Section Consistency**: Always verify the correct section is selected

## Troubleshooting

### "Table already exists" Error
- Each `tableNumber` must be unique within a section
- You can have `LD-01` and `CR-01` (different sections) ✅
- You cannot have two `LD-01` tables (same section) ❌

### Captain Cannot Add Tables
- This is intentional - only Admin and Manager can add tables
- Captains can only view and manage status of their section's tables

### Table Not Showing
- Check if table is active (`isActive: true`)
- Verify you're viewing the correct section
- Refresh the page to reload table list

## Updates

- **March 15, 2026**: Added individual table creation feature
- **March 15, 2026**: Initial table configuration with 20 tables (10 per section)
