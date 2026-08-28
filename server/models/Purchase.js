const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: {
    type: String,
    required: [true, 'Purchase order number is required'],
    unique: true,
    trim: true,
    index: true
  },
  invoiceNumber: {
    type: String,
    required: [true, 'Invoice number is required'],
    trim: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier reference is required']
  },
  purchaseDate: {
    type: Date,
    required: [true, 'Purchase date is required'],
    default: Date.now
  },
  subtotal: {
    type: Number,
    required: [true, 'Subtotal amount is required'],
    min: [0, 'Subtotal amount cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax amount cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount amount cannot be negative']
  },
  grandTotal: {
    type: Number,
    required: [true, 'Grand total is required'],
    min: [0, 'Grand total cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Partial'],
    default: 'Unpaid'
  },
  status: {
    type: String,
    enum: ['DRAFT', 'COMPLETED', 'CANCELLED'],
    default: 'DRAFT'
  },
  notes: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user signature is required']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);
