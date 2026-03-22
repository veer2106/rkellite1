const { Reservation, Table } = require('../models');
const QRCode = require('qrcode');
const { Op } = require('sequelize');

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private
exports.getReservations = async (req, res) => {
  try {
    const { status, date, page = 1, limit = 50 } = req.query;
    
    let where = {};
    
    if (status) where.status = status;
    if (date) where.reservationDate = date;

    const offset = (page - 1) * limit;

    const reservations = await Reservation.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['reservationDate', 'DESC'], ['reservationTime', 'DESC']]
    });

    res.json({
      success: true,
      count: reservations.count,
      page: parseInt(page),
      pages: Math.ceil(reservations.count / limit),
      data: reservations.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private
exports.getReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Public
exports.createReservation = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      numberOfGuests,
      reservationDate,
      reservationTime,
      specialRequests,
      occasion
    } = req.body;

    // Generate reservation number
    const reservationNumber = `RES-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Generate QR Code
    const qrData = JSON.stringify({
      reservationNumber,
      customerName,
      date: reservationDate,
      time: reservationTime
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const reservation = await Reservation.create({
      reservationNumber,
      customerName,
      customerPhone,
      customerEmail,
      numberOfGuests,
      reservationDate,
      reservationTime,
      specialRequests,
      occasion,
      qrCode
    });

    res.status(201).json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private
exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    const updatedReservation = await reservation.update(req.body);

    res.json({
      success: true,
      data: updatedReservation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private
exports.updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    reservation.status = status;
    await reservation.save();

    res.json({
      success: true,
      data: reservation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel reservation
// @route   DELETE /api/reservations/:id
// @access  Public/Private
exports.cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.json({
      success: true,
      message: 'Reservation cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get available tables
// @route   GET /api/reservations/tables/available
// @access  Private
exports.getAvailableTables = async (req, res) => {
  try {
    const { date, time, guests } = req.query;

    const tables = await Table.findAll({
      where: {
        status: 'available',
        seats: { [Op.gte]: guests },
        isActive: true
      },
      order: [['seats', 'ASC']]
    });

    res.json({
      success: true,
      count: tables.length,
      data: tables
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
