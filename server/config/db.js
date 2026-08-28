const mongoose = require('mongoose');
const dns = require('dns');

// Ensure reliable SRV DNS resolution for MongoDB Atlas across Windows network stacks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Use default system DNS if custom servers cannot be set
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/pharmacare';
  
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Ensure your MongoDB server is running. Backend server is continuing in disconnected mode.');
  }
};

module.exports = connectDB;
