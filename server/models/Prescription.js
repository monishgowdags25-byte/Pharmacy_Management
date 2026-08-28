const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  prescriptionNumber: {
    type: String,
    required: [true, 'Prescription number is required'],
    unique: true,
    trim: true,
    index: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: [true, 'Customer reference is required']
  },
  doctorName: {
    type: String,
    required: [true, "Doctor's name is required"],
    trim: true
  },
  doctorRegistrationNumber: {
    type: String,
    required: [true, 'Doctor registration number is required'],
    trim: true
  },
  prescriptionDate: {
    type: Date,
    required: [true, 'Prescription date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'DISPENSED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
