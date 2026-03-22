const { Booking, Room, Customer, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Generate booking number
const generateBookingNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BK${year}${month}${day}${random}`;
};

// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Private (Admin)
exports.getBookings = async (req, res) => {
    try {
        const { status, roomId, startDate, endDate, page = 1, limit = 50 } = req.query;

        let where = {};

        if (status) where.bookingStatus = status;
        if (roomId) where.roomId = roomId;

        if (startDate && endDate) {
            where.checkInDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const bookings = await Booking.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [['checkInDate', 'DESC']],
            include: [
                {
                    model: Room,
                    as: 'room',
                    attributes: ['id', 'roomNumber', 'roomType', 'floor']
                },
                {
                    model: Customer,
                    as: 'customer',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        logger.info('Bookings fetched successfully', { count: bookings.rows.length });

        res.status(200).json({
            success: true,
            count: bookings.rows.length,
            total: bookings.count,
            pages: Math.ceil(bookings.count / parseInt(limit)),
            currentPage: parseInt(page),
            data: bookings.rows
        });
    } catch (error) {
        logger.error('Error fetching bookings', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch bookings',
            error: error.message
        });
    }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private (Admin)
exports.getBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [
                {
                    model: Room,
                    as: 'room'
                },
                {
                    model: Customer,
                    as: 'customer'
                },
                {
                    model: User,
                    as: 'creator',
                    attributes: ['id', 'firstName', 'lastName']
                }
            ]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        logger.info('Booking fetched successfully', { bookingId: booking.id });

        res.status(200).json({
            success: true,
            data: booking
        });
    } catch (error) {
        logger.error('Error fetching booking', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking',
            error: error.message
        });
    }
};

// @desc    Create booking
// @route   POST /api/bookings
// @access  Private (Admin)
exports.createBooking = async (req, res) => {
    try {
        const {
            roomId,
            guestName,
            guestEmail,
            guestPhone,
            checkInDate,
            checkOutDate,
            numberOfGuests,
            advancePayment,
            specialRequests
        } = req.body;

        // Check if room exists and is available
        const room = await Room.findByPk(roomId);
        if (!room) {
            return res.status(404).json({
                success: false,
                message: 'Room not found'
            });
        }

        // Check if room is already booked for the selected dates
        const existingBooking = await Booking.findOne({
            where: {
                roomId,
                bookingStatus: {
                    [Op.in]: ['confirmed', 'checked-in']
                },
                [Op.or]: [
                    {
                        checkInDate: {
                            [Op.between]: [new Date(checkInDate), new Date(checkOutDate)]
                        }
                    },
                    {
                        checkOutDate: {
                            [Op.between]: [new Date(checkInDate), new Date(checkOutDate)]
                        }
                    },
                    {
                        [Op.and]: [
                            { checkInDate: { [Op.lte]: new Date(checkInDate) } },
                            { checkOutDate: { [Op.gte]: new Date(checkOutDate) } }
                        ]
                    }
                ]
            }
        });

        if (existingBooking) {
            return res.status(400).json({
                success: false,
                message: 'Room is already booked for the selected dates'
            });
        }

        // Calculate number of nights and total amount
        const checkIn = new Date(checkInDate);
        const checkOut = new Date(checkOutDate);
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const totalAmount = parseFloat(room.pricePerNight) * nights;
        const balance = totalAmount - parseFloat(advancePayment || 0);

        // Create booking
        const booking = await Booking.create({
            bookingNumber: generateBookingNumber(),
            roomId,
            guestName,
            guestEmail,
            guestPhone,
            numberOfGuests,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            numberOfNights: nights,
            pricePerNight: room.pricePerNight,
            totalAmount,
            advancePayment: advancePayment || 0,
            balanceAmount: balance,
            paymentStatus: balance <= 0 ? 'paid' : (advancePayment > 0 ? 'partial' : 'pending'),
            specialRequests,
            createdBy: req.user.id,
            ...req.body
        });

        // Update room status to reserved immediately on booking
        await room.update({ status: 'reserved' });

        logger.info('Booking created successfully', {
            bookingId: booking.id,
            bookingNumber: booking.bookingNumber,
            roomId: room.id
        });

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            data: booking
        });
    } catch (error) {
        logger.error('Error creating booking', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to create booking',
            error: error.message
        });
    }
};

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Private (Admin)
exports.updateBooking = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await booking.update(req.body);

        logger.info('Booking updated successfully', { bookingId: booking.id });

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            data: booking
        });
    } catch (error) {
        logger.error('Error updating booking', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update booking',
            error: error.message
        });
    }
};

// @desc    Check-in guest
// @route   PUT /api/bookings/:id/checkin
// @access  Private (Admin)
exports.checkInGuest = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [{ model: Room, as: 'room' }]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.bookingStatus = 'checked-in';
        booking.actualCheckInTime = new Date();
        await booking.save();

        // Update room status
        await booking.room.update({ status: 'occupied' });

        logger.info('Guest checked in successfully', {
            bookingId: booking.id,
            roomId: booking.roomId
        });

        res.status(200).json({
            success: true,
            message: 'Guest checked in successfully',
            data: booking
        });
    } catch (error) {
        logger.error('Error checking in guest', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to check in guest',
            error: error.message
        });
    }
};

// @desc    Check-out guest
// @route   PUT /api/bookings/:id/checkout
// @access  Private (Admin)
exports.checkOutGuest = async (req, res) => {
    try {
        const booking = await Booking.findByPk(req.params.id, {
            include: [{ model: Room, as: 'room' }]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.bookingStatus = 'checked-out';
        booking.actualCheckOutTime = new Date();
        await booking.save();

        // Update room status to cleaning
        await booking.room.update({ status: 'cleaning' });

        logger.info('Guest checked out successfully', {
            bookingId: booking.id,
            roomId: booking.roomId
        });

        res.status(200).json({
            success: true,
            message: 'Guest checked out successfully',
            data: booking
        });
    } catch (error) {
        logger.error('Error checking out guest', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to check out guest',
            error: error.message
        });
    }
};

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private (Admin)
exports.cancelBooking = async (req, res) => {
    try {
        const { cancellationReason } = req.body;
        const booking = await Booking.findByPk(req.params.id, {
            include: [{ model: Room, as: 'room' }]
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        booking.bookingStatus = 'cancelled';
        booking.cancellationReason = cancellationReason;
        booking.cancelledAt = new Date();
        await booking.save();

        // Update room status to available if it was reserved
        if (booking.room.status === 'reserved' || booking.room.status === 'occupied') {
            await booking.room.update({ status: 'available' });
        }

        logger.info('Booking cancelled successfully', {
            bookingId: booking.id,
            roomId: booking.roomId
        });

        res.status(200).json({
            success: true,
            message: 'Booking cancelled successfully',
            data: booking
        });
    } catch (error) {
        logger.error('Error cancelling booking', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to cancel booking',
            error: error.message
        });
    }
};

// @desc    Get booking statistics
// @route   GET /api/bookings/stats/overview
// @access  Private (Admin)
exports.getBookingStats = async (req, res) => {
    try {
        const totalBookings = await Booking.count();
        const confirmedBookings = await Booking.count({ where: { bookingStatus: 'confirmed' } });
        const checkedInBookings = await Booking.count({ where: { bookingStatus: 'checked-in' } });
        const checkedOutBookings = await Booking.count({ where: { bookingStatus: 'checked-out' } });
        const cancelledBookings = await Booking.count({ where: { bookingStatus: 'cancelled' } });

        // Today's check-ins and check-outs
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCheckIns = await Booking.count({
            where: {
                checkInDate: {
                    [Op.between]: [today, tomorrow]
                },
                bookingStatus: 'confirmed'
            }
        });

        const todayCheckOuts = await Booking.count({
            where: {
                checkOutDate: {
                    [Op.between]: [today, tomorrow]
                },
                bookingStatus: 'checked-in'
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalBookings,
                confirmedBookings,
                checkedInBookings,
                checkedOutBookings,
                cancelledBookings,
                todayCheckIns,
                todayCheckOuts
            }
        });
    } catch (error) {
        logger.error('Error fetching booking stats', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to fetch booking statistics',
            error: error.message
        });
    }
};
