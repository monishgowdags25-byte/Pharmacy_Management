const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true,
    index: true
  },
  genericName: {
    type: String,
    required: [true, 'Generic name is required'],
    trim: true,
    index: true
  },
  brand: {
    type: String,
    trim: true,
    index: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category reference is required']
  },
  manufacturer: {
    type: String,
    trim: true
  },
  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: {
      values: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Ointment', 'Drops', 'Inhaler', 'Other'],
      message: '{VALUE} is not a valid dosage form'
    }
  },
  strength: {
    type: String,
    required: [true, 'Strength specification is required'], // e.g. "500mg", "10ml"
    trim: true
  },
  unit: {
    type: String,
    required: [true, 'Packaging unit is required'], // e.g. "Box", "Bottle", "Strip"
    trim: true
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  purchasePrice: {
    type: Number,
    required: [true, 'Purchase price is required'],
    min: [0, 'Purchase price cannot be negative']
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Selling price is required'],
    min: [0, 'Selling price cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax percentage cannot be negative']
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: [0, 'Reorder level cannot be negative']
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Medicine', medicineSchema);
