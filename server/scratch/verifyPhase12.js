/**
 * Phase 12 Verification Script — Notifications & Audit Logs
 * Run from: server/ directory
 * Usage: node scratch/verifyPhase12.js
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const AuditLog   = require('../models/AuditLog');
const Notification = require('../models/Notification');
const { generateInventoryNotifications } = require('../services/notificationService');
const { recordAuditLog } = require('../controllers/auditLogController');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmacare';

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  /* ── 1. Write a test audit log ── */
  console.log('── 1. Writing test audit log …');
  await recordAuditLog({
    userId: null,
    action: 'SYSTEM',
    entity: 'Script',
    description: 'Phase 12 verification test run',
  });
  const lastLog = await AuditLog.findOne({ action: 'SYSTEM' }).sort('-timestamp');
  if (lastLog) {
    console.log(`   ✅ Audit log created at ${lastLog.timestamp.toISOString()}`);
  } else {
    console.error('   ❌ Audit log creation failed');
  }

  /* ── 2. Generate inventory notifications ── */
  console.log('\n── 2. Generating inventory notifications (threshold: 90 days) …');
  const before = await Notification.countDocuments();
  await generateInventoryNotifications(90);
  const after = await Notification.countDocuments();
  console.log(`   ✅ Notifications before: ${before}, after: ${after}`);

  /* ── 3. Verify deduplication — second run should not create duplicates ── */
  console.log('\n── 3. Verifying deduplication …');
  await generateInventoryNotifications(90);
  const afterDupe = await Notification.countDocuments();
  if (afterDupe === after) {
    console.log(`   ✅ Deduplication works — count stayed at ${after}`);
  } else {
    console.error(`   ❌ Deduplication failed — count went from ${after} to ${afterDupe}`);
  }

  /* ── 4. Count by type ── */
  const byType = await Notification.aggregate([
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);
  console.log('\n── 4. Notification breakdown by type:');
  byType.forEach(t => console.log(`   ${t._id}: ${t.count}`));

  /* ── 5. Audit log count ── */
  const totalLogs = await AuditLog.countDocuments();
  console.log(`\n── 5. Total audit log entries: ${totalLogs}`);

  console.log('\n🎉 Phase 12 verification complete.\n');
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
