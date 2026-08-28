const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Supplier name is required'],
    trim: true,
    index: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Supplier phone number is required'],
    trim: true
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
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Supplier', supplierSchema);
