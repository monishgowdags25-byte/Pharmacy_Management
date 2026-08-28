const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    index: true
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/, 'Please fill a valid email address']
  },
  address: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  points: {
    type: Number,
    default: 0,
    min: [0, 'Points balance cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);
