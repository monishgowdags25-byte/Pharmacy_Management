const dotenv = require('dotenv');
const path = require('path');

// Load environment variables if present
dotenv.config();

const app = require('../server/server');

module.exports = app;
