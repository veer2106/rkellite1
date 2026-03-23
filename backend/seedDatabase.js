const { sequelize } = require('./config/database');
const User = require('./models/User');
const Order = require('./models/Order');
const MenuItem = require('./models/MenuItem');
const InventoryItem = require('./models/InventoryItem');
const Table = require('./models/Table');
const Customer = require('./models/Customer');

const seedData = async () => {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('✓ Database synced');

    // Create admin user
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@restaurant.com',
      password: 'Admin!2024@cafe',
      role: 'admin',
      phone: '+1234567890',
      isActive: true,
      department: 'Management',
      hireDate: new Date(),
      salary: 50000
    });
    console.log('✓ Admin user created');

    // Create sample staff
    await User.bulkCreate([
      {
        firstName: 'John',
        lastName: 'Manager',
        email: 'manager@restaurant.com',
        password: 'Manager!2024@cafe',
        role: 'manager',
        phone: '+1234567891',
        department: 'Management'
      },
      {
        firstName: 'Sarah',
        lastName: 'Cashier',
        email: 'cashier@restaurant.com',
        password: 'Cashier!2024@cafe',
        role: 'cashier',
        phone: '+1234567892',
        department: 'Front Desk'
      },
      {
        firstName: 'Mike',
        lastName: 'Waiter',
        email: 'waiter@restaurant.com',
        password: 'Waiter!2024@cafe',
        role: 'waiter',
        phone: '+1234567893',
        department: 'Service'
      },
      {
        firstName: 'Chef',
        lastName: 'Gordon',
        email: 'chef@restaurant.com',
        password: 'Chef!2024@cafe',
        role: 'chef',
        phone: '+1234567894',
        department: 'Kitchen'
      },
      {
        firstName: 'Captain',
        lastName: 'One',
        email: 'captain1@restaurant.com',
        password: 'Captain1!2024@cafe',
        role: 'captain',
        section: 'lodge-dine',
        phone: '+1234567895',
        department: 'Lodge-Dine Section',
        isActive: true,
        hireDate: new Date()
      },
      {
        firstName: 'Captain',
        lastName: 'Two',
        email: 'captain2@restaurant.com',
        password: 'Captain2!2024@cafe',
        role: 'captain',
        section: 'cafe-restaurant',
        phone: '+1234567896',
        department: 'Cafe-Restaurant Section',
        isActive: true,
        hireDate: new Date()
      }
    ], { individualHooks: true });
    console.log('✓ Sample staff created (including 2 captains with section access)');

    // Create menu items - Indian Vegetarian
    await MenuItem.bulkCreate([
      // Starters
      { name: 'Paneer Tikka', description: 'Grilled cottage cheese marinated in spices', category: 'starters', price: 250, cost: 80, image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Veg Samosa', description: 'Crispy pastry filled with spiced potatoes and peas (2 pcs)', category: 'starters', price: 80, cost: 20, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800', isAvailable: true, isVegetarian: true, isVegan: true },
      { name: 'Hara Bhara Kabab', description: 'Spinach and peas patties with aromatic spices', category: 'starters', price: 180, cost: 50, image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Aloo Tikki Chaat', description: 'Potato patties topped with yogurt, chutneys and sev', category: 'starters', price: 120, cost: 35, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=800', isAvailable: true, isVegetarian: true, isVegan: false },

      // Main Course
      { name: 'Palak Paneer', description: 'Cottage cheese in creamy spinach gravy', category: 'mains', price: 280, cost: 90, image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Dal Makhani', description: 'Black lentils cooked in butter and cream', category: 'mains', price: 240, cost: 70, image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Chole Bhature', description: 'Spiced chickpeas with fried bread', category: 'mains', price: 200, cost: 60, image: 'https://picsum.photos/seed/cholebhature/800/800', isAvailable: true, isVegetarian: true, isVegan: true },
      { name: 'Vegetable Biryani', description: 'Fragrant basmati rice with mixed vegetables', category: 'mains', price: 320, cost: 100, image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800', isAvailable: true, isVegetarian: true, isVegan: true },
      { name: 'Paneer Butter Masala', description: 'Cottage cheese in rich tomato-butter gravy', category: 'mains', price: 290, cost: 95, image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Aloo Gobi', description: 'Potato and cauliflower curry with Indian spices', category: 'mains', price: 180, cost: 50, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800', isAvailable: true, isVegetarian: true, isVegan: true },

      // Breads
      { name: 'Butter Naan', description: 'Soft leavened bread brushed with butter', category: 'breads', price: 50, cost: 15, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Garlic Naan', description: 'Naan bread topped with garlic and coriander', category: 'breads', price: 60, cost: 18, image: 'https://picsum.photos/seed/garlicnaan/800/800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Tandoori Roti', description: 'Whole wheat bread from clay oven', category: 'breads', price: 35, cost: 10, image: 'https://picsum.photos/seed/tandooriroti/800/800', isAvailable: true, isVegetarian: true, isVegan: true },

      // Rice
      { name: 'Jeera Rice', description: 'Basmati rice tempered with cumin', category: 'rice', price: 150, cost: 40, image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800', isAvailable: true, isVegetarian: true, isVegan: true },
      { name: 'Plain Rice', description: 'Steamed basmati rice', category: 'rice', price: 120, cost: 30, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800', isAvailable: true, isVegetarian: true, isVegan: true },

      // Desserts
      { name: 'Gulab Jamun', description: 'Soft milk dumplings in sugar syrup (2 pcs)', category: 'desserts', price: 80, cost: 25, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Rasmalai', description: 'Cottage cheese patties in sweetened milk (2 pcs)', category: 'desserts', price: 100, cost: 30, image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Kulfi', description: 'Traditional Indian ice cream', category: 'desserts', price: 70, cost: 20, image: 'https://images.unsplash.com/photo-1582716401301-b2407dc7563d?w=800', isAvailable: true, isVegetarian: true, isVegan: false },

      // Beverages
      { name: 'Masala Chai', description: 'Indian spiced tea', category: 'beverages', price: 40, cost: 10, image: 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Mango Lassi', description: 'Sweet mango yogurt drink', category: 'beverages', price: 80, cost: 25, image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Sweet Lassi', description: 'Sweet yogurt drink', category: 'beverages', price: 60, cost: 20, image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=800', isAvailable: true, isVegetarian: true, isVegan: false },
      { name: 'Fresh Lime Soda', description: 'Refreshing lime and soda water', category: 'beverages', price: 50, cost: 15, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800', isAvailable: true, isVegetarian: true, isVegan: true }
    ]);
    console.log('✓ Menu items created');

    // Create inventory items - Indian Ingredients
    await InventoryItem.bulkCreate([
      { name: 'Paneer', category: 'Dairy', unit: 'kg', currentStock: 40, minStock: 15, unitPrice: 320, sku: 'INV-PANEER-001' },
      { name: 'Basmati Rice', category: 'Grains', unit: 'kg', currentStock: 100, minStock: 30, unitPrice: 120, sku: 'INV-RICE-001' },
      { name: 'Whole Wheat Flour', category: 'Grains', unit: 'kg', currentStock: 80, minStock: 25, unitPrice: 40, sku: 'INV-FLOUR-001' },
      { name: 'Spinach', category: 'Vegetables', unit: 'kg', currentStock: 25, minStock: 10, unitPrice: 60, sku: 'INV-SPINACH-001' },
      { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', currentStock: 50, minStock: 20, unitPrice: 40, sku: 'INV-TOMATO-001' },
      { name: 'Potatoes', category: 'Vegetables', unit: 'kg', currentStock: 60, minStock: 25, unitPrice: 30, sku: 'INV-POTATO-001' },
      { name: 'Black Lentils (Urad Dal)', category: 'Pulses', unit: 'kg', currentStock: 35, minStock: 15, unitPrice: 150, sku: 'INV-DAL-001' },
      { name: 'Chickpeas (Chole)', category: 'Pulses', unit: 'kg', currentStock: 40, minStock: 20, unitPrice: 120, sku: 'INV-CHOLE-001' },
      { name: 'Ghee', category: 'Dairy', unit: 'liters', currentStock: 20, minStock: 10, unitPrice: 550, sku: 'INV-GHEE-001' },
      { name: 'Yogurt', category: 'Dairy', unit: 'liters', currentStock: 30, minStock: 15, unitPrice: 80, sku: 'INV-YOGURT-001' },
      { name: 'Indian Spice Mix', category: 'Spices', unit: 'kg', currentStock: 15, minStock: 5, unitPrice: 400, sku: 'INV-SPICE-001' },
      { name: 'Mango Pulp', category: 'Fruits', unit: 'kg', currentStock: 25, minStock: 10, unitPrice: 150, sku: 'INV-MANGO-001' }
    ]);
    console.log('✓ Inventory items created');

    // Create tables for both sections - 10 tables per section (20 total)
    await Table.bulkCreate([
      // Lodge-Dine Section Tables (10 tables)
      { tableNumber: 'LD-01', section: 'lodge-dine', seats: 2, status: 'available', location: 'Main Hall' },
      { tableNumber: 'LD-02', section: 'lodge-dine', seats: 2, status: 'available', location: 'Main Hall' },
      { tableNumber: 'LD-03', section: 'lodge-dine', seats: 4, status: 'available', location: 'Main Hall' },
      { tableNumber: 'LD-04', section: 'lodge-dine', seats: 4, status: 'available', location: 'Main Hall' },
      { tableNumber: 'LD-05', section: 'lodge-dine', seats: 4, status: 'available', location: 'Window Side' },
      { tableNumber: 'LD-06', section: 'lodge-dine', seats: 6, status: 'available', location: 'Window Side' },
      { tableNumber: 'LD-07', section: 'lodge-dine', seats: 6, status: 'available', location: 'Corner' },
      { tableNumber: 'LD-08', section: 'lodge-dine', seats: 8, status: 'available', location: 'Private Room' },
      { tableNumber: 'LD-09', section: 'lodge-dine', seats: 4, status: 'available', location: 'Center' },
      { tableNumber: 'LD-10', section: 'lodge-dine', seats: 2, status: 'available', location: 'Bar Area' },

      // Cafe-Restaurant Section Tables (10 tables)
      { tableNumber: 'CR-01', section: 'cafe-restaurant', seats: 2, status: 'available', location: 'Patio' },
      { tableNumber: 'CR-02', section: 'cafe-restaurant', seats: 2, status: 'available', location: 'Patio' },
      { tableNumber: 'CR-03', section: 'cafe-restaurant', seats: 4, status: 'available', location: 'Patio' },
      { tableNumber: 'CR-04', section: 'cafe-restaurant', seats: 4, status: 'available', location: 'Garden View' },
      { tableNumber: 'CR-05', section: 'cafe-restaurant', seats: 4, status: 'available', location: 'Garden View' },
      { tableNumber: 'CR-06', section: 'cafe-restaurant', seats: 6, status: 'available', location: 'Indoor' },
      { tableNumber: 'CR-07', section: 'cafe-restaurant', seats: 6, status: 'available', location: 'Indoor' },
      { tableNumber: 'CR-08', section: 'cafe-restaurant', seats: 8, status: 'available', location: 'Banquet Hall' },
      { tableNumber: 'CR-09', section: 'cafe-restaurant', seats: 2, status: 'available', location: 'Bar Counter' },
      { tableNumber: 'CR-10', section: 'cafe-restaurant', seats: 4, status: 'available', location: 'Terrace' }
    ]);
    console.log('✓ 20 Tables created (10 per section) with section isolation');

    // Create sample customers
    await Customer.bulkCreate([
      {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '+1234567895',
        loyaltyPoints: 500,
        loyaltyTier: 'silver',
        totalSpent: 250.50,
        totalOrders: 12
      },
      {
        firstName: 'Bob',
        lastName: 'Smith',
        email: 'bob@example.com',
        phone: '+1234567896',
        loyaltyPoints: 1200,
        loyaltyTier: 'gold',
        totalSpent: 850.75,
        totalOrders: 28
      },
      {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+1234567897',
        loyaltyPoints: 150,
        loyaltyTier: 'bronze',
        totalSpent: 125.00,
        totalOrders: 5
      }
    ]);
    console.log('✓ Sample customers created');

    console.log('\n✓ Database seeding completed successfully!');
    console.log('\nDefault login credentials:');
    console.log('Email: admin@restaurant.com');
    console.log('Password: Admin!2024@cafe');

    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
