const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../config/db');

// Import all models
const User = require('../models/User');
const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const Supplier = require('../models/Supplier');
const Batch = require('../models/Batch');

const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('Clearing existing database collections...');
    
    // Clear out collections to avoid duplicate unique keys
    await User.deleteMany({});
    await Category.deleteMany({});
    await Medicine.deleteMany({});
    await Supplier.deleteMany({});
    await Batch.deleteMany({});

    console.log('Database collections cleared.');

    // Development user credentials
    const devUsers = [
      {
        name: 'Admin System',
        email: 'admin@pharmacare.local',
        password: 'Admin@123',
        role: 'ADMIN',
        status: 'Active'
      },
      {
        name: 'Pharmacist Staff',
        email: 'pharmacist@pharmacare.local',
        password: 'Pharmacist@123',
        role: 'PHARMACIST',
        status: 'Active'
      },
      {
        name: 'Inventory Manager',
        email: 'inventory@pharmacare.local',
        password: 'Inventory@123',
        role: 'INVENTORY_MANAGER',
        status: 'Active'
      },
      {
        name: 'Cashier Agent',
        email: 'cashier@pharmacare.local',
        password: 'Cashier@123',
        role: 'CASHIER',
        status: 'Active'
      }
    ];

    console.log('Inserting development seed users...');
    for (const u of devUsers) {
      const user = new User(u);
      await user.save();
    }
    console.log('Development seed users injected successfully.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase
};
