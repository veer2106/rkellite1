const { Table, Order } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private
exports.getTables = async (req, res) => {
    try {
        const { section, status, isActive } = req.query;

        let where = {};
        if (section) where.section = section;
        if (status) where.status = status;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        // Section-based filtering for captains
        if (req.user.role === 'captain' && req.user.section) {
            where.section = req.user.section;
        }

        const tables = await Table.findAll({
            where,
            order: [
                ['section', 'ASC'],
                ['tableNumber', 'ASC']
            ],
            include: [
                {
                    model: Order,
                    as: 'currentOrder',
                    required: false,
                    where: {
                        status: {
                            [Op.notIn]: ['completed', 'cancelled']
                        }
                    }
                }
            ]
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private
exports.getTable = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || !UUID_REGEX.test(id)) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }
        const table = await Table.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'currentOrder',
                    required: false
                }
            ]
        });

        if (!table) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        // Section-based access control for captains
        if (req.user.role === 'captain' && req.user.section) {
            if (table.section !== req.user.section) {
                return res.status(403).json({
                    success: false,
                    message: `Access denied. You can only access ${req.user.section} section tables.`
                });
            }
        }

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get table availability by section and table number
// @route   GET /api/tables/availability/:section/:tableNumber
// @access  Private
exports.getTableAvailability = async (req, res) => {
    try {
        const { section, tableNumber } = req.params;

        const table = await Table.findOne({
            where: {
                section,
                tableNumber,
                isActive: true
            },
            include: [
                {
                    model: Order,
                    as: 'currentOrder',
                    required: false,
                    where: {
                        status: {
                            [Op.notIn]: ['completed', 'cancelled']
                        }
                    }
                }
            ]
        });

        if (!table) {
            return res.json({
                success: true,
                available: true,
                message: 'Table does not exist yet, can be created'
            });
        }

        const isAvailable = table.status === 'available' && !table.currentOrder;

        res.json({
            success: true,
            available: isAvailable,
            table: table,
            message: isAvailable
                ? 'Table is available'
                : `Table is ${table.status}${table.currentOrder ? ' with an active order' : ''}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create a new table for a specific section
// @route   POST /api/tables
// @access  Private/Admin/Manager
exports.createTable = async (req, res) => {
    try {
        const { tableNumber, section, seats, location } = req.body;

        // Validation
        if (!tableNumber || !section) {
            return res.status(400).json({
                success: false,
                message: 'Table number and section are required'
            });
        }

        if (!['lodge-dine', 'cafe-restaurant'].includes(section)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section. Must be lodge-dine or cafe-restaurant'
            });
        }

        // Check if table with same number and section already exists
        const existingTable = await Table.findOne({
            where: { tableNumber, section }
        });

        if (existingTable) {
            return res.status(400).json({
                success: false,
                message: `Table ${tableNumber} already exists in ${section} section`
            });
        }

        // Create new table
        const newTable = await Table.create({
            tableNumber,
            section,
            seats: seats || 4,
            location: location || 'Main Hall',
            status: 'available',
            isActive: true
        });

        logger.info('Table created', {
            tableId: newTable.id,
            tableNumber: newTable.tableNumber,
            section: newTable.section,
            userId: req.user?.id
        });

        res.status(201).json({
            success: true,
            message: `Table ${tableNumber} created successfully in ${section} section`,
            data: newTable
        });
    } catch (error) {
        logger.error('Error creating table', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create or update tables for a section
// @route   POST /api/tables/setup
// @access  Private/Admin
exports.setupTables = async (req, res) => {
    try {
        const { section, numberOfTables, seatsPerTable = 4 } = req.body;

        if (!section || !numberOfTables) {
            return res.status(400).json({
                success: false,
                message: 'Section and numberOfTables are required'
            });
        }

        if (!['lodge-dine', 'cafe-restaurant'].includes(section)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid section. Must be lodge-dine or cafe-restaurant'
            });
        }

        // Get existing tables for this section
        const existingTables = await Table.findAll({
            where: { section }
        });

        const existingTableNumbers = existingTables.map(t => parseInt(t.tableNumber));
        const createdTables = [];
        const updatedTables = [];

        // Create or update tables
        for (let i = 1; i <= numberOfTables; i++) {
            const tableNumber = i.toString();

            const [table, created] = await Table.findOrCreate({
                where: {
                    section,
                    tableNumber
                },
                defaults: {
                    seats: seatsPerTable,
                    status: 'available',
                    isActive: true
                }
            });

            if (created) {
                createdTables.push(table);
            } else {
                // Update existing table
                await table.update({
                    seats: seatsPerTable,
                    isActive: true
                });
                updatedTables.push(table);
            }
        }

        // Deactivate tables beyond the new count
        if (existingTableNumbers.length > numberOfTables) {
            const tablesToDeactivate = existingTableNumbers
                .filter(num => num > numberOfTables)
                .map(num => num.toString());

            await Table.update(
                { isActive: false },
                {
                    where: {
                        section,
                        tableNumber: {
                            [Op.in]: tablesToDeactivate
                        }
                    }
                }
            );
        }

        logger.info('Tables setup completed', {
            section,
            numberOfTables,
            created: createdTables.length,
            updated: updatedTables.length,
            userId: req.user?.id
        });

        res.json({
            success: true,
            message: `Successfully set up ${numberOfTables} tables for ${section}`,
            data: {
                section,
                numberOfTables,
                created: createdTables.length,
                updated: updatedTables.length
            }
        });
    } catch (error) {
        logger.error('Error setting up tables', { error: error.message });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update table details
// @route   PUT /api/tables/:id
// @access  Private/Admin/Manager
exports.updateTable = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        const { tableNumber, section, seats, location } = req.body;

        const updates = {};
        if (tableNumber !== undefined && tableNumber.trim()) {
            const newNum = String(tableNumber).trim();
            const existing = await Table.findOne({
                where: {
                    section: section || table.section,
                    tableNumber: newNum,
                    id: { [Op.ne]: table.id }
                }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: `Table ${newNum} already exists in ${section || table.section} section`
                });
            }
            updates.tableNumber = newNum;
        }
        if (section !== undefined && ['lodge-dine', 'cafe-restaurant'].includes(section)) {
            if (updates.tableNumber === undefined) {
                const existing = await Table.findOne({
                    where: {
                        section,
                        tableNumber: table.tableNumber,
                        id: { [Op.ne]: table.id }
                    }
                });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: `Table ${table.tableNumber} already exists in ${section} section`
                    });
                }
            }
            updates.section = section;
        }
        if (seats !== undefined) {
            const num = parseInt(seats, 10);
            if (!isNaN(num) && num >= 1 && num <= 20) updates.seats = num;
        }
        if (location !== undefined) updates.location = location;

        const updated = await table.update(updates);

        logger.info('Table updated', {
            tableId: table.id,
            tableNumber: updated.tableNumber,
            section: updated.section,
            userId: req.user?.id
        });

        res.json({
            success: true,
            data: updated
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private
exports.updateTableStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        // If setting to available, clear current order
        if (status === 'available') {
            await table.update({
                status,
                currentOrderId: null
            });
        } else {
            await table.update({ status });
        }

        logger.info('Table status updated', {
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            status,
            userId: req.user?.id
        });

        res.json({
            success: true,
            data: table
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private/Admin
exports.deleteTable = async (req, res) => {
    try {
        const table = await Table.findByPk(req.params.id);

        if (!table) {
            return res.status(404).json({ success: false, message: 'Table not found' });
        }

        // Check if table has an active order
        if (table.currentOrderId) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete table with an active order'
            });
        }

        await table.destroy();

        logger.info('Table deleted', {
            tableId: table.id,
            tableNumber: table.tableNumber,
            section: table.section,
            userId: req.user?.id
        });

        res.json({
            success: true,
            message: 'Table deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get current active order for a table
// @route   GET /api/tables/order-for-table
// @query   section, tableNumber OR tableId
// @access  Private
exports.getCurrentOrderForTable = async (req, res) => {
    try {
        const { section, tableNumber, tableId } = req.query;

        let table = null;

        // Prefer tableId lookup (most reliable)
        if (tableId) {
            table = await Table.findByPk(tableId);
            if (!table) {
                return res.status(404).json({
                    success: false,
                    message: 'Table not found'
                });
            }
        } else if (section && tableNumber !== undefined && tableNumber !== '') {
            const tableNumStr = String(tableNumber).trim();
            table = await Table.findOne({
                where: {
                    section,
                    [Op.or]: [
                        { tableNumber: tableNumStr },
                        { tableNumber: tableNumber }
                    ],
                    isActive: true
                }
            });
        }

        if (!table) {
            return res.status(400).json({
                success: false,
                message: 'tableId or both section and tableNumber are required'
            });
        }

        const tableNumStr = String(table.tableNumber || '').trim();

        // Method 1: Get order via Table.currentOrderId
        if (table.currentOrderId) {
            const order = await Order.findByPk(table.currentOrderId);
            if (order && !['completed', 'cancelled'].includes(order.status)) {
                return res.json({
                    success: true,
                    data: { orderId: order.id, order }
                });
            }
        }

        // Method 2: Find active order by section + tableNumber (fallback)
        const orders = await Order.findAll({
            where: {
                orderType: 'dine-in',
                section: table.section,
                status: { [Op.notIn]: ['completed', 'cancelled'] }
            },
            order: [['createdAt', 'DESC']]
        });

        const order = orders.find(o =>
            String(o.tableNumber || '').trim() === tableNumStr ||
            o.tableNumber === table.tableNumber
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'No active order found for this table'
            });
        }

        res.json({
            success: true,
            data: { orderId: order.id, order }
        });
    } catch (error) {
        logger.error('getCurrentOrderForTable failed', { error: error.message, section: req.query.section, tableNumber: req.query.tableNumber });
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get table configuration for both sections
// @route   GET /api/tables/config
// @access  Private
exports.getTableConfig = async (req, res) => {
    try {
        const lodgeDineTables = await Table.count({
            where: { section: 'lodge-dine', isActive: true }
        });

        const cafeRestaurantTables = await Table.count({
            where: { section: 'cafe-restaurant', isActive: true }
        });

        res.json({
            success: true,
            data: {
                'lodge-dine': lodgeDineTables,
                'cafe-restaurant': cafeRestaurantTables
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = exports;
