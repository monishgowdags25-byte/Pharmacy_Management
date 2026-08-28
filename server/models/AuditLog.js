const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
    // null = system-triggered action
  },
  action: {
    type: String,
    required: [true, 'Audit action is required'],
    trim: true,
    index: true,
    enum: [
      'LOGIN', 'LOGOUT',
      'CREATE_MEDICINE', 'UPDATE_MEDICINE', 'DEACTIVATE_MEDICINE',
      'CREATE_PURCHASE', 'COMPLETE_PURCHASE', 'CANCEL_PURCHASE',
      'CREATE_SALE', 'CANCEL_SALE',
      'ADJUST_STOCK',
      'CREATE_RETURN',
      'VERIFY_PRESCRIPTION',
      'CREATE_USER', 'CHANGE_ROLE',
      'SYSTEM'
    ]
  },
  entity: { type: String, trim: true },
  entityId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, trim: true },
  ipAddress: { type: String, trim: true },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
