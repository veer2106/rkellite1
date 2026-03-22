const { Room, Booking } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private (Admin)
exports.getRooms = async (req, res) => {
    try {
        const { status, roomType, floor, available, startDate, endDate } = req.query;

        let where = {};

        if (status) where.status = status;
        if (roomType) where.roomType = roomType;
        if (floor) where.floor = parseInt(floor);
        where.isActive = true;

        // Check availability for specific dates
        if (available === 'true' && startDate && endDate) {
            const bookedRooms = await Booking.findAll({
                where: {
                    bookingStatus: {
                        [Op.in]: ['confirmed', 'checked-in']
                    },
                    [Op.or]: [
                        {
                            checkInDate: {
                                [Op.between]: [new Date(startDate), new Date(endDate)]
                            }
                        },
                        {
                            checkOutDate: {
                                [Op.between]: [new Date(startDate), new Date(endDate)]
                            }
                        },
                        {
                            [Op.and]: [
                                { checkInDate: { [Op.lte]: new Date(startDate) } },
                                { checkOutDate: { [Op.gte]: new Date(endDate) } }
                            ]
                        }
                    ]
                },
                attributes: ['roomId']
            });

            const bookedRoomIds = bookedRooms.map(b => b.roomId);
            where.id = { [Op.notIn]: bookedRoomIds };
        }

        const rooms = await Room.findAll({
            where,
            order: [['floor', 'ASC'], ['roomNumber', 'ASC']],
            include: [
                {
                    model: Booking,
                    as: 'bookings',
                    where: {
                        bookingStatus: {
                            [Op.in]: ['confirmed', 'checked-in']
                        }
                    },
                    required: false,
                    limit: 1,
                    order: [['checkInDate', 'DESC']]
                }
            ]
        });

        logger.info('Rooms fetched successfully', { count: rooms.length });

        res.status(200).json({
            success: true,
            count: rooms.length,
            data: rooms
        });
    } catch (error) {
        logger.error('Error fetching rooms', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch rooms',
            error: error.message
        });
    }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private (Admin)
exports.getRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id, {
            include: [
                {
                    model: Booking,
                    as: 'bookings',
                    order: [['checkInDate', 'DESC']],
                    limit: 10
                }
            ]
        });

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        logger.info('Room fetched successfully', { roomId: room.id });

        res.status(200).json({
            success: true,
            data: room
        });
    } catch (error) {
        logger.error('Error fetching room', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room',
            error: error.message
        });
    }
};

// @desc    Create room
// @route   POST /api/rooms
// @access  Private (Admin)
exports.createRoom = async (req, res) => {
    try {
        const room = await Room.create(req.body);

        logger.info('Room created successfully', { roomId: room.id, roomNumber: room.roomNumber });

        res.status(201).json({
            success: true,
            message: 'Room created successfully',
            data: room
        });
    } catch (error) {
        logger.error('Error creating room', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to create room',
            error: error.message
        });
    }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private (Admin)
exports.updateRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        await room.update(req.body);

        logger.info('Room updated successfully', { roomId: room.id });

        res.status(200).json({
            success: true,
            message: 'Room updated successfully',
            data: room
        });
    } catch (error) {
        logger.error('Error updating room', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update room',
            error: error.message
        });
    }
};

// @desc    Update room status
// @route   PUT /api/rooms/:id/status
// @access  Private (Admin)
exports.updateRoomStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const room = await Room.findByPk(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        const previousStatus = room.status;
        room.status = status;

        // Update maintenance/cleaning timestamps
        if (status === 'maintenance') {
            room.lastMaintenanceAt = new Date();
        } else if (status === 'cleaning') {
            room.lastCleanedAt = new Date();
        }

        await room.save();

        logger.info('Room status updated', {
            roomId: room.id,
            previousStatus,
            newStatus: status
        });

        res.status(200).json({
            success: true,
            message: 'Room status updated successfully',
            data: room
        });
    } catch (error) {
        logger.error('Error updating room status', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update room status',
            error: error.message
        });
    }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin)
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByPk(req.params.id);

        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Soft delete by setting isActive to false
        await room.update({ isActive: false });

        logger.info('Room deleted successfully', { roomId: room.id });

        res.status(200).json({
            success: true,
            message: 'Room deleted successfully'
        });
    } catch (error) {
        logger.error('Error deleting room', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to delete room',
            error: error.message
        });
    }
};

// @desc    Get room statistics
// @route   GET /api/rooms/stats/overview
// @access  Private (Admin)
exports.getRoomStats = async (req, res) => {
    try {
        const totalRooms = await Room.count({ where: { isActive: true } });
        const availableRooms = await Room.count({ where: { status: 'available', isActive: true } });
        const occupiedRooms = await Room.count({ where: { status: 'occupied', isActive: true } });
        const maintenanceRooms = await Room.count({ where: { status: 'maintenance', isActive: true } });
        const cleaningRooms = await Room.count({ where: { status: 'cleaning', isActive: true } });
        const reservedRooms = await Room.count({ where: { status: 'reserved', isActive: true } });

        const occupancyRate = totalRooms > 0
            ? ((occupiedRooms / totalRooms) * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            data: {
                totalRooms,
                availableRooms,
                occupiedRooms,
                maintenanceRooms,
                cleaningRooms,
                reservedRooms,
                occupancyRate: parseFloat(occupancyRate)
            }
        });
    } catch (error) {
        logger.error('Error fetching room stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch room statistics',
            error: error.message
        });
    }
};
