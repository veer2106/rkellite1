const express = require('express');
const router = express.Router();
const {
    getBookings,
    getBooking,
    createBooking,
    updateBooking,
    checkInGuest,
    checkOutGuest,
    cancelBooking,
    getBookingStats
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Statistics route
router.get('/stats/overview', getBookingStats);

// CRUD routes
router.route('/')
    .get(getBookings)
    .post(createBooking);

router.route('/:id')
    .get(getBooking)
    .put(updateBooking);

// Booking action routes
router.put('/:id/checkin', checkInGuest);
router.put('/:id/checkout', checkOutGuest);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
