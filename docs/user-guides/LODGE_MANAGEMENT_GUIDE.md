# Lodge Management System Documentation

## Overview
A professional and comprehensive lodge management system has been integrated into the RK Ellite application, providing complete room management and booking capabilities.

---

## 🏨 Features Implemented

### 1. Room Management
- **6 Rooms Created** with different configurations
- Real-time room status tracking
- Multi-floor support (Floors 1-3)
- Room type classification (Standard, Deluxe, Suite, Family, Executive)
- Amenities tracking
- Price management per room type

### 2. Room Status Management
- **Available** - Ready for booking
- **Occupied** - Currently occupied by guests
- **Reserved** - Reserved for future check-in
- **Cleaning** - Under cleaning
- **Maintenance** - Under maintenance

### 3. Booking System
- Complete booking lifecycle management
- Guest information capture
- Check-in/Check-out tracking
- Payment tracking (Advance, Balance, Full)
- Booking cancellation with reasons
- No-show tracking

---

## 📊 Room Details

### Room 101 - Standard
- **Floor:** 1
- **Capacity:** 2 guests
- **Bed Type:** Double
- **Price:** ₹1,500/night
- **Amenities:** WiFi, AC, TV, Attached Bathroom, Hot Water

### Room 102 - Deluxe
- **Floor:** 1
- **Capacity:** 2 guests
- **Bed Type:** Queen
- **Price:** ₹2,500/night
- **Amenities:** WiFi, AC, LED TV, Mini Fridge, Attached Bathroom, Hot Water, Balcony

### Room 201 - Suite
- **Floor:** 2
- **Capacity:** 3 guests
- **Bed Type:** King
- **Price:** ₹4,000/night
- **Amenities:** WiFi, AC, Smart TV, Mini Fridge, Sofa, Work Desk, Attached Bathroom, Hot Water, Balcony, Coffee Maker

### Room 202 - Family
- **Floor:** 2
- **Capacity:** 4 guests
- **Bed Type:** Queen
- **Price:** ₹3,500/night
- **Amenities:** WiFi, AC, LED TV, Mini Fridge, Attached Bathroom, Hot Water, Extra Mattress

### Room 301 - Executive
- **Floor:** 3
- **Capacity:** 2 guests
- **Bed Type:** King
- **Price:** ₹3,000/night
- **Amenities:** WiFi, AC, Smart TV, Mini Fridge, Work Desk, Ergonomic Chair, Attached Bathroom, Hot Water, Coffee Maker, Newspaper

### Room 302 - Deluxe
- **Floor:** 3
- **Capacity:** 2 guests
- **Bed Type:** Queen
- **Price:** ₹2,800/night
- **Amenities:** WiFi, AC, LED TV, Mini Fridge, Attached Bathroom, Hot Water, Balcony, City View

---

## 🔐 Access Control

### Admin Access Only
The Lodge Management section (Rooms) is **exclusively accessible to admin users**.

**Navigation Filter:**
- ✅ Admin: Full access to all sections including Rooms
- ❌ Captain: Limited to POS, Orders, Tables
- ❌ Supervisor: Limited to Orders, Inventory, Staff
- ❌ Other Roles: No access to Rooms section

---

## 📁 Technical Implementation

### Backend Components

#### 1. Models
**Room Model** (`backend/models/Room.js`)
- Complete room information management
- Status tracking
- Amenities as array
- Pricing and capacity management
- Maintenance tracking

**Booking Model** (`backend/models/Booking.js`)
- Guest information
- Check-in/Check-out dates and times
- Payment tracking
- Booking status lifecycle
- Cancellation management

#### 2. Controllers
**Room Controller** (`backend/controllers/roomController.js`)
- `getRooms()` - List all rooms with filters
- `getRoom()` - Get single room details
- `createRoom()` - Create new room
- `updateRoom()` - Update room information
- `updateRoomStatus()` - Change room status
- `deleteRoom()` - Soft delete room
- `getRoomStats()` - Get statistics (total, available, occupied, occupancy rate)

**Booking Controller** (`backend/controllers/bookingController.js`)
- `getBookings()` - List all bookings
- `getBooking()` - Get single booking
- `createBooking()` - Create new booking with validation
- `updateBooking()` - Update booking
- `checkInGuest()` - Check-in process
- `checkOutGuest()` - Check-out process
- `cancelBooking()` - Cancel with reason
- `getBookingStats()` - Statistics dashboard

#### 3. Routes
**Room Routes** (`backend/routes/roomRoutes.js`)
```
GET    /api/rooms              - Get all rooms
GET    /api/rooms/stats/overview - Get room statistics
POST   /api/rooms              - Create room
GET    /api/rooms/:id          - Get room by ID
PUT    /api/rooms/:id          - Update room
DELETE /api/rooms/:id          - Delete room
PUT    /api/rooms/:id/status   - Update room status
```

**Booking Routes** (`backend/routes/bookingRoutes.js`)
```
GET    /api/bookings              - Get all bookings
GET    /api/bookings/stats/overview - Get booking statistics
POST   /api/bookings              - Create booking
GET    /api/bookings/:id          - Get booking by ID
PUT    /api/bookings/:id          - Update booking
PUT    /api/bookings/:id/checkin  - Check-in guest
PUT    /api/bookings/:id/checkout - Check-out guest
PUT    /api/bookings/:id/cancel   - Cancel booking
```

#### 4. Database Tables

**Rooms Table:**
- id (UUID, Primary Key)
- roomNumber (String, Unique)
- roomType (ENUM: standard, deluxe, suite, family, executive)
- floor (Integer)
- capacity (Integer)
- pricePerNight (Decimal)
- status (ENUM: available, occupied, maintenance, cleaning, reserved)
- amenities (Array of Strings)
- bedType (ENUM: single, double, queen, king, twin)
- hasBalcony, hasWindow, smokingAllowed (Boolean)
- lastCleanedAt, lastMaintenanceAt (Date)
- description, notes (Text)
- isActive (Boolean)
- createdAt, updatedAt (Timestamps)

**Bookings Table:**
- id (UUID, Primary Key)
- bookingNumber (String, Unique)
- roomId (Foreign Key to Rooms)
- customerId (Foreign Key to Customers)
- guestName, guestEmail, guestPhone, guestAddress
- numberOfGuests (Integer)
- checkInDate, checkOutDate (Date)
- actualCheckInTime, actualCheckOutTime (Date)
- numberOfNights (Integer)
- pricePerNight, totalAmount, advancePayment, balanceAmount (Decimal)
- paymentStatus (ENUM: pending, partial, paid, refunded)
- paymentMethod (ENUM: cash, card, upi, bank-transfer, other)
- bookingStatus (ENUM: confirmed, checked-in, checked-out, cancelled, no-show)
- specialRequests, notes (Text)
- idProofType, idProofNumber (String)
- purpose (ENUM: business, leisure, family, other)
- source (ENUM: walk-in, phone, online, agent, other)
- createdBy (Foreign Key to Users)
- cancellationReason (Text)
- cancelledAt (Date)
- createdAt, updatedAt (Timestamps)

### Frontend Components

#### 1. Rooms Page (`frontend/src/pages/Rooms.js`)
**Features:**
- Statistics dashboard showing:
  - Total rooms
  - Available rooms
  - Occupied rooms
  - Occupancy rate percentage
- Room grid view with cards
- Status-based filtering
- Real-time status updates
- Quick status change buttons
- Amenities display
- Room information display

**Status Management Buttons:**
- Mark Available
- Set to Cleaning
- Set to Maintenance

#### 2. Navigation Integration
- Added to `App.js` routing
- Integrated in `Layout.js` with HomeModernIcon
- Admin-only visibility enforced

---

## 🚀 Usage Guide

### For Administrators

#### Accessing Lodge Management
1. Login as admin user
2. Navigate to "Rooms" in the sidebar menu
3. View the dashboard with statistics

#### Managing Room Status
1. View all rooms in the grid
2. Each room card shows current status
3. Use quick action buttons to:
   - Mark room as Available (after cleaning/maintenance)
   - Set to Cleaning (after guest checkout)
   - Set to Maintenance (for repairs)

#### Filtering Rooms
Use the dropdown filter to view:
- All Rooms
- Available rooms only
- Occupied rooms only
- Reserved rooms
- Rooms under Maintenance
- Rooms being Cleaned

---

## 📈 Statistics & Reporting

### Real-Time Statistics
- **Total Rooms:** Total number of active rooms
- **Available Rooms:** Rooms ready for booking
- **Occupied Rooms:** Currently occupied rooms
- **Occupancy Rate:** Percentage calculation of occupied vs total rooms

### Booking Statistics
- Total bookings
- Confirmed bookings
- Checked-in guests
- Checked-out guests
- Cancelled bookings
- Today's check-ins
- Today's check-outs

---

## 🔧 API Endpoints Summary

### Room Management APIs
```javascript
// Get all rooms (with optional filters)
GET /api/rooms?status=available&roomType=deluxe&floor=2

// Get room statistics
GET /api/rooms/stats/overview

// Update room status
PUT /api/rooms/:id/status
Body: { status: 'cleaning' }
```

### Booking Management APIs
```javascript
// Create booking
POST /api/bookings
Body: {
  roomId: uuid,
  guestName: string,
  guestPhone: string,
  checkInDate: date,
  checkOutDate: date,
  numberOfGuests: number,
  advancePayment: decimal
}

// Check-in guest
PUT /api/bookings/:id/checkin

// Check-out guest  
PUT /api/bookings/:id/checkout

// Cancel booking
PUT /api/bookings/:id/cancel
Body: { cancellationReason: string }
```

---

## 🛠️ Files Created/Modified

### New Files Created:
1. `backend/models/Room.js` - Room model
2. `backend/models/Booking.js` - Booking model
3. `backend/controllers/roomController.js` - Room logic
4. `backend/controllers/bookingController.js` - Booking logic
5. `backend/routes/roomRoutes.js` - Room routes
6. `backend/routes/bookingRoutes.js` - Booking routes
7. `backend/seedRooms.js` - Database seeding script
8. `frontend/src/pages/Rooms.js` - Rooms page component

### Modified Files:
1. `backend/models/index.js` - Added Room and Booking models
2. `backend/server.js` - Added room and booking routes
3. `frontend/src/App.js` - Added Rooms route
4. `frontend/src/components/Layout.js` - Added Rooms navigation

---

## 🎯 Future Enhancements

### Potential Features:
1. **Booking Management UI** - Create frontend for bookings
2. **Room Calendar View** - Visual calendar for availability
3. **Housekeeping Schedule** - Assign cleaning tasks
4. **Maintenance Tracking** - Track repair history
5. **Revenue Reports** - Booking and revenue analytics
6. **Guest History** - Track returning guests
7. **Online Booking Portal** - Customer-facing booking system
8. **Email Notifications** - Booking confirmations and reminders
9. **Room Service Integration** - Link with restaurant orders
10. **Multi-property Support** - Manage multiple locations

---

## 📝 Notes

- All rooms are initialized with `available` status
- Room status automatically updates during booking lifecycle:
  - **Booking Created** → Room becomes `reserved`
  - **Guest Checks In** → Room becomes `occupied`
  - **Guest Checks Out** → Room becomes `cleaning`
  - **Cleaning Complete** → Admin marks as `available`
  
- Booking numbers are auto-generated in format: `BK{YY}{MM}{DD}{XXXX}`
  - Example: `BK26031500001`

- The system prevents double-booking by checking date conflicts
- Advance payment and balance tracking is built-in
- All financial fields use DECIMAL(10,2) for accuracy

---

## 🔒 Security & Permissions

- All endpoints are protected with authentication middleware
- Only admin users can access room management
- Audit logging captures all room and booking changes
- Soft deletes preserve historical data

---

**Created:** March 15, 2026  
**Version:** 1.0.0  
**Status:** ✅ Fully Implemented and Operational
