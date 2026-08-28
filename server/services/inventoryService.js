const Batch = require('../models/Batch');
const InventoryLog = require('../models/InventoryLog');

const inventoryService = {
  /**
   * Check if non-expired active stock is sufficient for requested quantity
   * @param {String} medicineId 
   * @param {Number} quantity 
   * @returns {Promise<Boolean>}
   */
  checkStockAvailability: async (medicineId, quantity) => {
    if (quantity <= 0) return false;
    
    const activeBatches = await Batch.find({
      medicine: medicineId,
      currentQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    });

    const totalAvailable = activeBatches.reduce((acc, curr) => acc + curr.currentQuantity, 0);
    return totalAvailable >= quantity;
  },

  /**
   * Central FEFO deduction logic (First Expiry, First Out)
   * Deducts quantity in order of expiration, ensuring expired stock is skipped.
   * Throws error and aborts operations if total stock is insufficient.
   * 
   * @param {String} medicineId - Target Medicine ObjectId
   * @param {Number} quantity - Units to deduct
   * @param {String} userId - User ID recording transaction
   * @param {String} type - Log type enum
   */
  deductStockFEFO: async (medicineId, quantity, userId, type = 'SALE') => {
    if (quantity <= 0) {
      throw new Error('Deduction quantity must be greater than zero');
    }

    // 1. Fetch eligible non-expired active batches, sorted by earliest expiry first (FEFO)
    const activeBatches = await Batch.find({
      medicine: medicineId,
      currentQuantity: { $gt: 0 },
      expiryDate: { $gt: new Date() }
    }).sort({ expiryDate: 1 });

    // 2. Assert sufficiency
    const totalAvailable = activeBatches.reduce((acc, curr) => acc + curr.currentQuantity, 0);
    if (totalAvailable < quantity) {
      throw new Error(`Insufficient stock available. Requested: ${quantity}, Available: ${totalAvailable}`);
    }

    // 3. Subtract stock and log changes
    let remainingToDeduct = quantity;
    const deductions = [];
    for (let batch of activeBatches) {
      if (remainingToDeduct <= 0) break;

      const previousQty = batch.currentQuantity;
      let deductAmount = 0;

      if (batch.currentQuantity >= remainingToDeduct) {
        deductAmount = remainingToDeduct;
        batch.currentQuantity -= remainingToDeduct;
        remainingToDeduct = 0;
      } else {
        deductAmount = batch.currentQuantity;
        remainingToDeduct -= batch.currentQuantity;
        batch.currentQuantity = 0;
      }

      await batch.save();

      deductions.push({
        batchId: batch._id,
        batchNumber: batch.batchNumber,
        quantityDeducted: deductAmount
      });

      // Create ledger log entry
      const log = new InventoryLog({
        medicine: medicineId,
        batch: batch._id,
        type: type,
        quantity: deductAmount,
        previousQuantity: previousQty,
        newQuantity: batch.currentQuantity,
        user: userId
      });
      await log.save();
    }

    return deductions;
  },

  /**
   * Increase or register batch inventory (Purchase receipt)
   * 
   * @param {String} medicineId 
   * @param {String} batchNumber 
   * @param {Number} quantity 
   * @param {String} supplierId 
   * @param {Date} expiryDate 
   * @param {Date} mfgDate 
   * @param {Number} purchasePrice 
   * @param {Number} sellingPrice 
   * @param {String} userId 
   */
  addStock: async (
    medicineId, batchNumber, quantity, supplierId, 
    expiryDate, mfgDate, purchasePrice, sellingPrice, userId
  ) => {
    if (quantity <= 0) {
      throw new Error('Quantity to insert must be greater than zero');
    }

    // Find if batch number exists for this medicine
    let batch = await Batch.findOne({ medicine: medicineId, batchNumber: batchNumber });
    let previousQty = 0;

    if (batch) {
      previousQty = batch.currentQuantity;
      batch.currentQuantity += quantity;
      
      // Update batch fields if provided
      if (expiryDate) batch.expiryDate = expiryDate;
      if (mfgDate) batch.manufacturingDate = mfgDate;
      if (purchasePrice) batch.purchasePrice = purchasePrice;
      if (sellingPrice) batch.sellingPrice = sellingPrice;
    } else {
      batch = new Batch({
        medicine: medicineId,
        batchNumber,
        supplier: supplierId,
        manufacturingDate: mfgDate,
        expiryDate,
        purchasePrice,
        sellingPrice,
        quantityPurchased: quantity,
        currentQuantity: quantity
      });
    }

    await batch.save();

    // Create ledger entry
    const log = new InventoryLog({
      medicine: medicineId,
      batch: batch._id,
      type: 'PURCHASE',
      quantity: quantity,
      previousQuantity: previousQty,
      newQuantity: batch.currentQuantity,
      user: userId
    });
    await log.save();

    return batch;
  }
};

module.exports = inventoryService;
