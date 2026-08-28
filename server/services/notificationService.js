const Notification = require('../models/Notification');
const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');

/**
 * Scan inventory and create (non-duplicate) notifications
 * for low stock, out-of-stock, expiring soon, and expired batches.
 * @param {number} expiryThresholdDays - days window to flag "expiring soon" (default 90)
 */
const generateInventoryNotifications = async (expiryThresholdDays = 90) => {
  const now = new Date();
  const thresholdDate = new Date();
  thresholdDate.setDate(now.getDate() + expiryThresholdDays);

  const allMedicines = await Medicine.find({ status: 'Active' });
  const allBatches   = await Batch.find({ currentQuantity: { $gt: 0 } });

  // Build stock-per-medicine map
  const stockMap = {};
  allBatches.forEach(b => {
    const key = b.medicine.toString();
    stockMap[key] = (stockMap[key] || 0) + (b.expiryDate > now ? b.currentQuantity : 0);
  });

  const upsertOrSkip = async (dedupeKey, doc) => {
    try {
      await Notification.findOneAndUpdate(
        { dedupeKey },
        { $setOnInsert: doc },
        { upsert: true, new: false }
      );
    } catch (_) { /* duplicate key — skip */ }
  };

  for (const med of allMedicines) {
    const stock = stockMap[med._id.toString()] || 0;

    if (stock === 0) {
      await upsertOrSkip(`OUT_OF_STOCK:${med._id}`, {
        dedupeKey: `OUT_OF_STOCK:${med._id}`,
        type: 'OUT_OF_STOCK',
        title: 'Out of Stock',
        message: `${med.name} is completely out of stock.`,
        entityType: 'Medicine',
        entityId: med._id
      });
    } else if (stock <= med.reorderLevel) {
      await upsertOrSkip(`LOW_STOCK:${med._id}`, {
        dedupeKey: `LOW_STOCK:${med._id}`,
        type: 'LOW_STOCK',
        title: 'Low Stock Alert',
        message: `${med.name} is running low (${stock} units remaining, reorder level: ${med.reorderLevel}).`,
        entityType: 'Medicine',
        entityId: med._id
      });
    }
  }

  // Expiring soon / expired batch alerts
  const allActiveBatches = await Batch.find({ currentQuantity: { $gt: 0 } }).populate('medicine', 'name');
  for (const batch of allActiveBatches) {
    const medName = batch.medicine?.name || 'Unknown Medicine';
    const daysLeft = Math.ceil((batch.expiryDate - now) / (1000 * 60 * 60 * 24));

    if (batch.expiryDate < now) {
      await upsertOrSkip(`EXPIRED:${batch._id}`, {
        dedupeKey: `EXPIRED:${batch._id}`,
        type: 'EXPIRED',
        title: 'Expired Batch',
        message: `${medName} — Batch ${batch.batchNumber} has expired.`,
        entityType: 'Batch',
        entityId: batch._id
      });
    } else if (batch.expiryDate <= thresholdDate) {
      await upsertOrSkip(`EXPIRING_SOON:${batch._id}`, {
        dedupeKey: `EXPIRING_SOON:${batch._id}`,
        type: 'EXPIRING_SOON',
        title: 'Expiring Soon',
        message: `${medName} — Batch ${batch.batchNumber} expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`,
        entityType: 'Batch',
        entityId: batch._id
      });
    }
  }
};

module.exports = { generateInventoryNotifications };
