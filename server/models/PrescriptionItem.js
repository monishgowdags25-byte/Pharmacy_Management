const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema({
  prescription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
    required: [true, 'Prescription reference is required']
  },
  medicineName: {
    type: String,
    required: [true, 'Medicine name is required'],
    trim: true
  },
  medicine: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Medicine' // Link to catalog item
  },
  dosage: {
    type: String,
    required: [true, 'Dosage instructions are required'], // e.g. "1-0-1", "twice daily"
    trim: true
  },
  frequency: {
    type: String,
    trim: true // e.g. "Every 8 hours"
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'], // e.g. "5 days"
    trim: true
  },
  instructions: {
    type: String,
    trim: true // e.g. "Take post meals"
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PrescriptionItem', prescriptionItemSchema);
