const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnNumber: {
    type: String,
    required: [true, 'Return slip number is required'],
    unique: true,
    trim: true,
    index: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale',
    required: [true, 'Sale reference is required']
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer'
  },
  reason: {
    type: String,
    required: [true, 'Reason for return is required'],
    trim: true
  },
  refundMethod: {
    type: String,
    enum: ['CASH', 'CARD', 'UPI', 'OTHER'],
    default: 'CASH'
  },
  refundAmount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [0, 'Refund amount cannot be negative']
  },
  status: {
    type: String,
    enum: ['Completed', 'Pending'],
    default: 'Completed'
  },
  returnDate: {
    type: Date,
    required: [true, 'Return date is required'],
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user signature is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Return', returnSchema);
