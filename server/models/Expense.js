const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    required: [true, 'Expense slip number is required'],
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Expense title is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Expense amount is required'],
    min: [0, 'Expense amount cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Expense category is required'],
    enum: {
      values: ['Rent', 'Electricity', 'Salary', 'Maintenance', 'Transportation', 'Utilities', 'Other'],
      message: '{VALUE} is not a valid expense category'
    }
  },
  date: {
    type: Date,
    required: [true, 'Expense date is required'],
    default: Date.now
  },
  isDemo: {
    type: Boolean,
    default: false,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
