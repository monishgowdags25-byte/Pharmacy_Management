const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: ['LOW_STOCK', 'OUT_OF_STOCK', 'EXPIRING_SOON', 'EXPIRED', 'SYSTEM'],
    index: true
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  // Reference to the entity that triggered (batch._id, medicine._id, etc.)
  entityType: { type: String, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  // Deduplication key — same batch/medicine should not create duplicate alerts
  dedupeKey: { type: String, trim: true, unique: true, sparse: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
