const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuItem = sequelize.define('MenuItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.ENUM('lodge-dine', 'cafe-restaurant', 'both'),
    allowNull: true,
    defaultValue: 'both'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2)
  },
  image: {
    type: DataTypes.STRING
  },
  isAvailable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  isVegetarian: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVegan: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isGlutenFree: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  spicyLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  preparationTime: {
    type: DataTypes.INTEGER, // in minutes
    defaultValue: 15
  },
  calories: {
    type: DataTypes.INTEGER
  },
  ingredients: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  allergens: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  popularity: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

module.exports = MenuItem;
