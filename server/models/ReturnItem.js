const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  return: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Return',
    required: [true, 'Return reference is required']
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine reference is required']
  },
  batchNumber: {
    type: String,
    required: [true, 'Batch number is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal is required'],
    min: [0, 'Subtotal cannot be negative']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ReturnItem', returnItemSchema);
