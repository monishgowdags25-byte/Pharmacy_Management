const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine',
    required: [true, 'Medicine reference is required'],
    index: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: [true, 'Batch reference is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT_INCREASE', 'ADJUSTMENT_DECREASE'],
    required: [true, 'Log transaction type is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Log quantity is required'],
    min: [0.01, 'Quantity must be positive']
  },
  previousQuantity: {
    type: Number,
    required: [true, 'Previous quantity is required'],
    min: [0, 'Previous quantity cannot be negative']
  },
  newQuantity: {
    type: Number,
    required: [true, 'New quantity is required'],
    min: [0, 'New quantity cannot be negative']
  },
  reason: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'ADJUSTMENT_INCREASE' || this.type === 'ADJUSTMENT_DECREASE';
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Staff user signature is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
