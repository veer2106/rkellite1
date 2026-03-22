# Table Management System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESTAURANT MANAGEMENT SYSTEM                  │
│                     Table Management Module                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         TWO SECTIONS                             │
├──────────────────────────────┬──────────────────────────────────┤
│      🏨 LODGE-DINE          │    ☕ CAFE-RESTAURANT            │
│                              │                                  │
│  Captain: captain1           │  Captain: captain2               │
│  Email: captain1@...         │  Email: captain2@...             │
│  Access: Lodge-Dine ONLY     │  Access: Cafe-Restaurant ONLY    │
│                              │                                  │
│  Tables: LD-01 to LD-10      │  Tables: CR-01 to CR-10          │
│  Special: LD-11, LD-VIP-01   │  Special: CR-11, CR-BAR-01       │
│  Total: 12+ tables           │  Total: 13+ tables               │
└──────────────────────────────┴──────────────────────────────────┘
```

## Feature Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                     USER AUTHENTICATION                         │
└──────────────┬─────────────────────────────────────────────────┘
               │
               ├─── Admin/Manager ──────┐
               │                        │
               ├─── Captain ────────────┼──> Limited to own section
               │                        │
               └─── Other Staff ────────┘
                                        │
                                        ▼
┌────────────────────────────────────────────────────────────────┐
│                      TABLES PAGE UI                             │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Section Toggle: [🏨 Lodge-Dine] [☕ Cafe-Restaurant]   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐                           │
│  │ + Add Table  │  │ Bulk Setup   │  (Admin/Manager only)     │
│  └──────────────┘  └──────────────┘                           │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Statistics: Total: 12 | Available: 10 | Occupied: 2   │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Table Grid (filtered by selected section)              │ │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐             │ │
│  │  │LD-1│ │LD-2│ │LD-3│ │LD-4│ │LD-5│ │LD-6│             │ │
│  │  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘             │ │
│  │  ┌────┐ ┌────┐ ┌─────┐ ┌─────┐                         │ │
│  │  │LD-7│ │LD-8│ │LD-11│ │VIP-1│                         │ │
│  │  └────┘ └────┘ └─────┘ └─────┘                         │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

## Add Table Modal Flow

```
User Clicks "+ Add Table"
         │
         ▼
┌─────────────────────────────────┐
│     ADD TABLE MODAL             │
├─────────────────────────────────┤
│                                 │
│ Table Number: [LD-12____]       │  ← User Input
│                                 │
│ Section: [Lodge-Dine ▼]         │  ← Dropdown
│                                 │
│ Seats: [6_____]                 │  ← Number Input
│                                 │
│ Location: [Rooftop____]         │  ← Text Input
│                                 │
│ [Add Table] [Cancel]            │
└─────────────────────────────────┘
         │
         ▼
    Click "Add Table"
         │
         ▼
┌─────────────────────────────────┐
│  Frontend Validation            │
│  • Check required fields        │
│  • Validate input format        │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  API Call                       │
│  POST /api/tables               │
│  {                              │
│    tableNumber: "LD-12",        │
│    section: "lodge-dine",       │
│    seats: 6,                    │
│    location: "Rooftop"          │
│  }                              │
└─────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Backend Processing             │
│  • Check authorization          │
│  • Validate section             │
│  • Check duplicates             │
│  • Create table in DB           │
│  • Log audit trail              │
└─────────────────────────────────┘
         │
         ▼
    ┌───────┴───────┐
    │               │
Success         Error
    │               │
    ▼               ▼
Show Success    Show Error
Toast           Toast
    │
    ▼
Refresh Table List
    │
    ▼
Display New Table
```

## Database Schema

```
┌──────────────────────────────────────────────────────────────┐
│                       Tables Table                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  id              UUID (Primary Key)                          │
│  tableNumber     VARCHAR  (e.g., "LD-12", "CR-VIP-01")       │
│  section         ENUM('lodge-dine', 'cafe-restaurant')       │
│  seats           INTEGER (1-20)                              │
│  location        VARCHAR (e.g., "Rooftop", "Patio")          │
│  status          ENUM('available', 'occupied', etc.)         │
│  currentOrderId  UUID (Foreign Key to Orders)                │
│  isActive        BOOLEAN                                     │
│  createdAt       TIMESTAMP                                   │
│  updatedAt       TIMESTAMP                                   │
│                                                               │
│  UNIQUE INDEX: (tableNumber, section)                        │
│  INDEX: section                                              │
│  INDEX: status                                               │
└──────────────────────────────────────────────────────────────┘

CONSTRAINT: Unique combination of (tableNumber + section)
✅ Can have: LD-01 AND CR-01 (different sections)
❌ Cannot have: Two LD-01 tables (same section)
```

## API Endpoints

```
┌─────────────────────────────────────────────────────────────┐
│                    Table API Endpoints                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  GET    /api/tables                                         │
│         → Get all tables (filtered by section for captains) │
│         Auth: All authenticated users                       │
│                                                              │
│  GET    /api/tables/:id                                     │
│         → Get single table                                  │
│         Auth: All authenticated users                       │
│                                                              │
│  GET    /api/tables/config                                  │
│         → Get table count per section                       │
│         Auth: All authenticated users                       │
│                                                              │
│  GET    /api/tables/availability/:section/:tableNumber      │
│         → Check if table is available                       │
│         Auth: All authenticated users                       │
│                                                              │
│  ⭐ POST  /api/tables (NEW!)                                │
│         → Create individual table                           │
│         Auth: Admin, Manager only                           │
│         Body: { tableNumber, section, seats, location }     │
│                                                              │
│  POST   /api/tables/setup                                   │
│         → Bulk create/update tables                         │
│         Auth: Admin, Manager only                           │
│                                                              │
│  PUT    /api/tables/:id/status                              │
│         → Update table status                               │
│         Auth: All authenticated users                       │
│                                                              │
│  DELETE /api/tables/:id                                     │
│         → Delete table                                      │
│         Auth: Admin, Manager only                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Access Control Matrix

```
┌──────────────┬──────────┬──────────┬──────────┬──────────────┐
│   Action     │  Admin   │ Manager  │ Captain  │ Other Staff  │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ View Tables  │    ✅    │    ✅    │  ✅ Own  │      ✅      │
│              │   All    │   All    │ Section  │     All      │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Add Table    │    ✅    │    ✅    │    ❌    │      ❌      │
│ (Individual) │          │          │          │              │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Bulk Setup   │    ✅    │    ✅    │    ❌    │      ❌      │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Update       │    ✅    │    ✅    │    ✅    │      ✅      │
│ Status       │          │          │  (Own)   │              │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Delete Table │    ✅    │    ✅    │    ❌    │      ❌      │
├──────────────┼──────────┼──────────┼──────────┼──────────────┤
│ Switch       │    ✅    │    ✅    │    ❌    │      ✅      │
│ Sections     │          │          │ Locked   │              │
└──────────────┴──────────┴──────────┴──────────┴──────────────┘
```

## Section Isolation Implementation

```
                    ┌──────────────┐
                    │  API Request │
                    └──────┬───────┘
                           │
                           ▼
                ┌──────────────────────┐
                │  Auth Middleware     │
                │  Extract user info   │
                └──────────┬───────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Check User Role             │
            └──┬─────────────────────┬─────┘
               │                     │
         ┌─────▼────┐          ┌────▼─────┐
         │  Captain │          │  Others  │
         └─────┬────┘          └────┬─────┘
               │                     │
               ▼                     ▼
    ┌──────────────────┐   ┌─────────────────┐
    │ Apply Section    │   │ No Filter       │
    │ Filter           │   │ (All sections)  │
    │ WHERE section =  │   │                 │
    │ user.section     │   │                 │
    └──────────────────┘   └─────────────────┘
               │                     │
               └──────────┬──────────┘
                          ▼
                ┌──────────────────┐
                │ Return Tables    │
                └──────────────────┘
```

## File Structure

```
restaurant-cafe/
├── backend/
│   ├── controllers/
│   │   └── tableController.js         ⭐ Added createTable()
│   ├── routes/
│   │   └── tableRoutes.js             ⭐ Added POST /
│   └── models/
│       └── Table.js                   ✅ Already had section field
│
├── frontend/
│   └── src/
│       └── pages/
│           └── Tables.js              ⭐ Added modal & form
│
├── docs/
│   ├── TABLE_MANAGEMENT_GUIDE.md      ⭐ Comprehensive guide
│   ├── SECTION_SPECIFIC_TABLES_       ⭐ Quick reference
│   │   QUICKSTART.md
│   └── TABLE_SYSTEM_ARCHITECTURE.md   ⭐ This file
│
└── test-add-table.sh                  ⭐ Test script
```

## Success Indicators

```
✅ 20 tables created (10 per section)
✅ Section isolation enforced at DB level
✅ Individual table creation working
✅ Bulk setup working
✅ Captain access control working
✅ UI modal functional
✅ Real-time table updates
✅ Duplicate prevention working
✅ Audit logging implemented
✅ Both servers running (ports 5001, 3000)
✅ All tests passing
```

---

**System Status**: ✅ Production Ready  
**Last Updated**: March 15, 2026  
**Feature**: Section-Specific Table Management
