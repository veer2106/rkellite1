const { sequelize } = require('./config/database');
const User = require('./models/User');

async function createSupervisor() {
    try {
        await sequelize.authenticate();
        console.log('Database connected');

        // Check if supervisor already exists
        const existingSupervisor = await User.findOne({
            where: { email: 'supervisor@cafedelicacy.com' }
        });

        if (existingSupervisor) {
            console.log('Supervisor user already exists!');
            console.log('Email: supervisor@cafedelicacy.com');
            console.log('You may need to reset the password if needed.');
            process.exit(0);
        }

        // Create supervisor user
        const supervisor = await User.create({
            firstName: 'Supervisor',
            lastName: 'User',
            email: 'supervisor@cafedelicacy.com',
            password: 'supervisor123', // This will be hashed automatically by the model hook
            phone: '+1234567890',
            role: 'supervisor',
            section: null, // Supervisor has access to all sections
            isActive: true,
            department: 'Operations',
            hireDate: new Date()
        });

        console.log('\n✅ Supervisor user created successfully!');
        console.log('-----------------------------------');
        console.log('Email: supervisor@cafedelicacy.com');
        console.log('Password: supervisor123');
        console.log('Role: supervisor');
        console.log('Access: Orders, Inventory, Staff');
        console.log('-----------------------------------\n');

        process.exit(0);
    } catch (error) {
        console.error('Error creating supervisor:', error);
        process.exit(1);
    }
}

createSupervisor();
