const mongoose = require('mongoose');

const batchSchema = new mongoose.Schema({
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true,
    index: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine reference is required']
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier reference is required']
  },
  manufacturingDate: {
    type: Date,
    required: [true, 'Manufacturing date is required']
  },
  expiryDate: {
    type: Date,
    required: [true, 'Expiry date is required'],
    validate: {
      validator: function(value) {
        // Expiry date must be after manufacturing date
        return !this.manufacturingDate || value > this.manufacturingDate;
      },
      message: 'Expiry date must be after manufacturing date'
    }
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
  quantityPurchased: {
    type: Number,
    required: [true, 'Quantity purchased is required'],
    min: [0, 'Quantity purchased cannot be negative']
  },
  currentQuantity: {
    type: Number,
    required: [true, 'Current quantity is required'],
    min: [0, 'Current quantity cannot be negative']
  },
  reorderLevel: {
    type: Number,
    min: [0, 'Reorder level cannot be negative']
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

// Composite Unique Index: batchNumber must be unique for a specific medicine
batchSchema.index({ medicine: 1, batchNumber: 1 }, { unique: true });

module.exports = mongoose.model('Batch', batchSchema);
