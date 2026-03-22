const express = require('express');
const router = express.Router();
const {
    getRooms,
    getRoom,
    createRoom,
    updateRoom,
    updateRoomStatus,
    deleteRoom,
    getRoomStats
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');

// Protect all routes
router.use(protect);

// Statistics route
router.get('/stats/overview', getRoomStats);

// CRUD routes
router.route('/')
    .get(getRooms)
    .post(createRoom);

router.route('/:id')
    .get(getRoom)
    .put(updateRoom)
    .delete(deleteRoom);

// Status update route
router.put('/:id/status', updateRoomStatus);

module.exports = router;
