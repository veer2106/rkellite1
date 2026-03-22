/**
 * Seed MenuCategory table from existing menu items.
 * Run: node backend/seedCategories.js
 */
const { sequelize } = require('./config/database');
const MenuCategory = require('./models/MenuCategory');
const MenuItem = require('./models/MenuItem');

const seedCategories = async () => {
  try {
    await MenuCategory.sync();
    const count = await MenuCategory.count();
    if (count > 0) {
      console.log('✓ MenuCategory already has data, skipping seed');
      process.exit(0);
      return;
    }

    const items = await MenuItem.findAll({
      attributes: ['category'],
      group: ['category'],
      raw: true
    });
    const names = items.map(c => c.category).filter(Boolean);
    const unique = [...new Set(names)];

    for (let i = 0; i < unique.length; i++) {
      await MenuCategory.create({
        name: unique[i],
        sortOrder: i
      });
    }
    console.log(`✓ Seeded ${unique.length} categories:`, unique.join(', '));
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seedCategories();
