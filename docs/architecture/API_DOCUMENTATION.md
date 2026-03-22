# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "role": "waiter"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "waiter",
    "token": "jwt_token"
  }
}
```

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@restaurant.com",
  "password": "admin123"
}
```

### Get Current User
```http
GET /auth/me
```

---

## Orders Endpoints

### Get All Orders
```http
GET /orders?status=pending&page=1&limit=50
```

### Create Order
```http
POST /orders
```

**Request Body:**
```json
{
  "orderType": "dine-in",
  "tableNumber": "5",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "items": [
    {
      "menuItemId": "uuid",
      "name": "Grilled Salmon",
      "price": 24.99,
      "quantity": 2
    }
  ],
  "paymentMethod": "card",
  "notes": "No onions"
}
```

### Update Order Status
```http
PUT /orders/:id/status
```

**Request Body:**
```json
{
  "status": "preparing"
}
```

---

## Menu Endpoints

### Get All Menu Items
```http
GET /menu?category=mains&isAvailable=true
```

### Create Menu Item
```http
POST /menu
```

**Request Body:**
```json
{
  "name": "Grilled Salmon",
  "description": "Fresh Atlantic salmon",
  "category": "mains",
  "price": 24.99,
  "cost": 12.00,
  "isAvailable": true,
  "isVegetarian": false,
  "preparationTime": 20
}
```

### Update Availability
```http
PUT /menu/:id/availability
```

**Request Body:**
```json
{
  "isAvailable": false
}
```

---

## Inventory Endpoints

### Get All Inventory
```http
GET /inventory?lowStock=true
```

### Restock Item
```http
POST /inventory/:id/restock
```

**Request Body:**
```json
{
  "quantity": 50
}
```

### Get Low Stock Alerts
```http
GET /inventory/alerts/low-stock
```

---

## Reservations Endpoints

### Create Reservation
```http
POST /reservations
```

**Request Body:**
```json
{
  "customerName": "Jane Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "jane@example.com",
  "numberOfGuests": 4,
  "reservationDate": "2024-12-25",
  "reservationTime": "19:00",
  "specialRequests": "Window seat please"
}
```

### Update Reservation Status
```http
PUT /reservations/:id/status
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

---

## Customer Endpoints

### Get All Customers
```http
GET /customers?search=john&loyaltyTier=gold
```

### Add Loyalty Points
```http
POST /customers/:id/loyalty/add
```

**Request Body:**
```json
{
  "points": 100
}
```

### Redeem Loyalty Points
```http
POST /customers/:id/loyalty/redeem
```

**Request Body:**
```json
{
  "points": 500
}
```

---

## Staff Endpoints

### Get All Staff
```http
GET /staff?role=waiter&isActive=true
```

### Get Schedules
```http
GET /staff/schedules?date=2024-12-25
```

### Create Schedule
```http
POST /staff/schedules
```

**Request Body:**
```json
{
  "userId": "uuid",
  "date": "2024-12-25",
  "shiftStart": "09:00",
  "shiftEnd": "17:00",
  "shiftType": "morning"
}
```

---

## Reports Endpoints

### Sales Report
```http
GET /reports/sales?startDate=2024-12-01&endDate=2024-12-31&groupBy=day
```

### Menu Report
```http
GET /reports/menu?startDate=2024-12-01&limit=10
```

### Inventory Report
```http
GET /reports/inventory
```

### Dashboard Statistics
```http
GET /reports/dashboard
```

---

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Error Response Format

```json
{
  "success": false,
  "message": "Error message here"
}
```
