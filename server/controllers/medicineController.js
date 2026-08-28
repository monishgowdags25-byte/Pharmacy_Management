const Medicine = require('../models/Medicine');
const Batch = require('../models/Batch');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');


const medicineController = {
  /**
   * Fetch paginated and filtered medicines
   * GET /api/medicines
   */
  getMedicines: async (req, res, next) => {
    try {
      const { 
        search, 
        category, 
        status, 
        dosageForm, 
        prescriptionRequired,
        sort = '-createdAt', 
        page = 1, 
        limit = 10 
      } = req.query;

      // Build filter query
      const query = {};

      // Search (Name, Generic Name, Brand, Barcode)
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { genericName: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
          { barcode: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter options
      if (category) query.category = category;
      if (status) query.status = status;
      if (dosageForm) query.dosageForm = dosageForm;
      if (prescriptionRequired !== undefined) {
        query.prescriptionRequired = prescriptionRequired === 'true';
      }

      // Pagination calculation
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      // Sorting
      let sortQuery = {};
      if (sort) {
        const isDesc = sort.startsWith('-');
        const field = isDesc ? sort.substring(1) : sort;
        sortQuery[field] = isDesc ? -1 : 1;
      }

      // Query database
      const medicines = await Medicine.find(query)
        .populate('category', 'name')
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Medicine.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Medicines fetched successfully', {
        medicines,
        pagination: {
          totalCount,
          totalPages,
          page: pageNum,
          limit: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch single medicine by ID
   * GET /api/medicines/:id
   */
  getMedicineById: async (req, res, next) => {
    try {
      const medicine = await Medicine.findById(req.params.id).populate('category', 'name');
      
      if (!medicine) {
        return sendError(res, 'Medicine not found', 404);
      }

      // Also grab stock quantities from associated Batches
      const batches = await Batch.find({ medicine: medicine._id });
      const totalStock = batches.reduce((acc, curr) => acc + curr.currentQuantity, 0);

      const medJSON = medicine.toJSON();
      medJSON.totalStock = totalStock;
      medJSON.batches = batches;

      return sendSuccess(res, 'Medicine details fetched successfully', { medicine: medJSON });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new medicine
   * POST /api/medicines
   */
  createMedicine: async (req, res, next) => {
    try {
      const { 
        name, genericName, brand, category, manufacturer, 
        dosageForm, strength, unit, prescriptionRequired, 
        purchasePrice, sellingPrice, tax, reorderLevel, barcode, status 
      } = req.body;

      // Validate required fields
      if (!name || !genericName || !category || !dosageForm || !strength || !unit || purchasePrice === undefined || sellingPrice === undefined) {
        return sendError(res, 'Please fill in all required catalog fields', 400);
      }

      // Validate numeric bounds
      if (purchasePrice < 0 || sellingPrice < 0) {
        return sendError(res, 'Prices cannot be negative values', 400);
      }

      // Check unique barcode if provided
      if (barcode) {
        const existingBarcode = await Medicine.findOne({ barcode });
        if (existingBarcode) {
          return sendError(res, 'A product with this barcode already exists in inventory', 400);
        }
      }

      // Create medicine
      const medicine = new Medicine({
        name,
        genericName,
        brand,
        category,
        manufacturer,
        dosageForm,
        strength,
        unit,
        prescriptionRequired,
        purchasePrice,
        sellingPrice,
        tax,
        reorderLevel,
        barcode,
        status
      });

      await medicine.save();

      // Populate category before returning
      await medicine.populate('category', 'name');

      await recordAuditLog({
        userId: req.user?._id,
        action: 'CREATE_MEDICINE',
        entity: 'Medicine',
        entityId: medicine._id,
        description: `Medicine "${medicine.name}" created`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Medicine created successfully', { medicine }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update medicine
   * PUT /api/medicines/:id
   */
  updateMedicine: async (req, res, next) => {
    try {
      const medicineId = req.params.id;
      const { 
        name, genericName, brand, category, manufacturer, 
        dosageForm, strength, unit, prescriptionRequired, 
        purchasePrice, sellingPrice, tax, reorderLevel, barcode, status 
      } = req.body;

      const medicine = await Medicine.findById(medicineId);
      if (!medicine) {
        return sendError(res, 'Medicine not found', 404);
      }

      // Check unique barcode
      if (barcode && barcode !== medicine.barcode) {
        const existingBarcode = await Medicine.findOne({ barcode, _id: { $ne: medicineId } });
        if (existingBarcode) {
          return sendError(res, 'Another medicine already possesses this barcode', 400);
        }
        medicine.barcode = barcode;
      }

      // Update fields if provided
      if (name) medicine.name = name;
      if (genericName) medicine.genericName = genericName;
      if (brand !== undefined) medicine.brand = brand;
      if (category) medicine.category = category;
      if (manufacturer !== undefined) medicine.manufacturer = manufacturer;
      if (dosageForm) medicine.dosageForm = dosageForm;
      if (strength) medicine.strength = strength;
      if (unit) medicine.unit = unit;
      if (prescriptionRequired !== undefined) medicine.prescriptionRequired = prescriptionRequired;
      if (purchasePrice !== undefined) {
        if (purchasePrice < 0) return sendError(res, 'Purchase price cannot be negative', 400);
        medicine.purchasePrice = purchasePrice;
      }
      if (sellingPrice !== undefined) {
        if (sellingPrice < 0) return sendError(res, 'Selling price cannot be negative', 400);
        medicine.sellingPrice = sellingPrice;
      }
      if (tax !== undefined) medicine.tax = tax;
      if (reorderLevel !== undefined) medicine.reorderLevel = reorderLevel;
      if (status) medicine.status = status;

      await medicine.save();
      await medicine.populate('category', 'name');

      await recordAuditLog({
        userId: req.user?._id,
        action: 'UPDATE_MEDICINE',
        entity: 'Medicine',
        entityId: medicine._id,
        description: `Medicine "${medicine.name}" updated`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Medicine catalog updated successfully', { medicine });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete medicine (checks database integrity for active stock)
   * DELETE /api/medicines/:id
   */
  deleteMedicine: async (req, res, next) => {
    try {
      const medicineId = req.params.id;

      // Database Integrity check: prevent deletion of medicines with active inventory batches holding stock
      const activeBatchesCount = await Batch.countDocuments({ 
        medicine: medicineId, 
        currentQuantity: { $gt: 0 } 
      });

      if (activeBatchesCount > 0) {
        return sendError(res, `Cannot delete medicine. There are ${activeBatchesCount} active inventory batches containing stock.`, 400);
      }

      // Otherwise we delete it, as well as clearing zero-qty batch records associated with it
      await Batch.deleteMany({ medicine: medicineId });
      const medicine = await Medicine.findByIdAndDelete(medicineId);
      
      if (!medicine) {
        return sendError(res, 'Medicine not found', 404);
      }

      await recordAuditLog({
        userId: req.user?._id,
        action: 'DEACTIVATE_MEDICINE',
        entity: 'Medicine',
        entityId: medicineId,
        description: `Medicine "${medicine.name}" deleted`,
        ipAddress: req.ip
      });

      return sendSuccess(res, 'Medicine and empty history batches deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = medicineController;
