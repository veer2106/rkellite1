const express = require('express');
const router = express.Router();
const {
  getReservations,
  getReservation,
  createReservation,
  updateReservation,
  updateReservationStatus,
  cancelReservation,
  getAvailableTables
} = require('../controllers/reservationController');
const { protect } = require('../middleware/auth');

router.get('/tables/available', protect, getAvailableTables);

router.route('/')
  .get(protect, getReservations)
  .post(createReservation);

router.route('/:id')
  .get(protect, getReservation)
  .put(protect, updateReservation)
  .delete(cancelReservation);

router.put('/:id/status', protect, updateReservationStatus);

module.exports = router;
