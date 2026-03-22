const { sequelize } = require('./config/database');
const { Room, Booking } = require('./models');

async function seedRooms() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // Sync the database to create tables
        console.log('Syncing database schema...');
        await sequelize.sync({ alter: true });
        console.log('Database schema synced (Rooms and Bookings tables created)');

        // Check if rooms already exist
        const existingRooms = await Room.count();
        if (existingRooms > 0) {
            console.log(`Found ${existingRooms} existing rooms. Skipping seed.`);
            console.log('If you want to re-seed, please delete existing rooms first.');
            process.exit(0);
        }

        // Create 6 rooms with different configurations
        const rooms = [
            {
                roomNumber: '101',
                roomType: 'standard',
                floor: 1,
                capacity: 2,
                pricePerNight: 1500.00,
                bedType: 'double',
                amenities: ['WiFi', 'AC', 'TV', 'Attached Bathroom', 'Hot Water'],
                description: 'Comfortable standard room with all basic amenities',
                hasBalcony: false,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            },
            {
                roomNumber: '102',
                roomType: 'deluxe',
                floor: 1,
                capacity: 2,
                pricePerNight: 2500.00,
                bedType: 'queen',
                amenities: ['WiFi', 'AC', 'LED TV', 'Mini Fridge', 'Attached Bathroom', 'Hot Water', 'Balcony'],
                description: 'Spacious deluxe room with balcony and premium amenities',
                hasBalcony: true,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            },
            {
                roomNumber: '201',
                roomType: 'suite',
                floor: 2,
                capacity: 3,
                pricePerNight: 4000.00,
                bedType: 'king',
                amenities: ['WiFi', 'AC', 'Smart TV', 'Mini Fridge', 'Sofa', 'Work Desk', 'Attached Bathroom', 'Hot Water', 'Balcony', 'Coffee Maker'],
                description: 'Luxurious suite with separate living area and premium facilities',
                hasBalcony: true,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            },
            {
                roomNumber: '202',
                roomType: 'family',
                floor: 2,
                capacity: 4,
                pricePerNight: 3500.00,
                bedType: 'queen',
                amenities: ['WiFi', 'AC', 'LED TV', 'Mini Fridge', 'Attached Bathroom', 'Hot Water', 'Extra Mattress'],
                description: 'Perfect for families with space for up to 4 guests',
                hasBalcony: false,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            },
            {
                roomNumber: '301',
                roomType: 'executive',
                floor: 3,
                capacity: 2,
                pricePerNight: 3000.00,
                bedType: 'king',
                amenities: ['WiFi', 'AC', 'Smart TV', 'Mini Fridge', 'Work Desk', 'Ergonomic Chair', 'Attached Bathroom', 'Hot Water', 'Coffee Maker', 'Newspaper'],
                description: 'Executive room designed for business travelers',
                hasBalcony: false,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            },
            {
                roomNumber: '302',
                roomType: 'deluxe',
                floor: 3,
                capacity: 2,
                pricePerNight: 2800.00,
                bedType: 'queen',
                amenities: ['WiFi', 'AC', 'LED TV', 'Mini Fridge', 'Attached Bathroom', 'Hot Water', 'Balcony', 'City View'],
                description: 'Deluxe room with beautiful city view from the balcony',
                hasBalcony: true,
                hasWindow: true,
                smokingAllowed: false,
                status: 'available',
                isActive: true
            }
        ];

        // Create rooms
        const createdRooms = await Room.bulkCreate(rooms);

        console.log('\n✅ Lodge rooms created successfully!');
        console.log('═══════════════════════════════════════════════════\n');

        createdRooms.forEach((room, index) => {
            console.log(`Room ${index + 1}:`);
            console.log(`  Room Number: ${room.roomNumber}`);
            console.log(`  Type: ${room.roomType}`);
            console.log(`  Floor: ${room.floor}`);
            console.log(`  Capacity: ${room.capacity} guests`);
            console.log(`  Price per Night: ₹${room.pricePerNight}`);
            console.log(`  Bed Type: ${room.bedType}`);
            console.log(`  Status: ${room.status}`);
            console.log(`  Amenities: ${room.amenities.join(', ')}`);
            console.log('');
        });

        console.log('═══════════════════════════════════════════════════');
        console.log('Total rooms created: 6');
        console.log('All rooms are currently available for booking');
        console.log('Access: Admin only');
        console.log('═══════════════════════════════════════════════════\n');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding rooms:', error);
        process.exit(1);
    }
}

seedRooms();
