const Prescription = require('../models/Prescription');
const PrescriptionItem = require('../models/PrescriptionItem');
const Medicine = require('../models/Medicine');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { recordAuditLog } = require('./auditLogController');

const prescriptionController = {
  /**
   * Fetch all prescriptions paginated
   * GET /api/prescriptions
   */
  getPrescriptions: async (req, res, next) => {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;

      const query = {};
      if (status) query.status = status;

      if (search) {
        query.prescriptionNumber = { $regex: search, $options: 'i' };
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const prescriptions = await Prescription.find(query)
        .populate('customer', 'name phone')
        .sort('-createdAt')
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Prescription.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Prescriptions fetched successfully', {
        prescriptions,
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
   * Fetch single prescription order with items
   * GET /api/prescriptions/:id
   */
  getPrescriptionById: async (req, res, next) => {
    try {
      const prescription = await Prescription.findById(req.params.id)
        .populate('customer', 'name phone email address dateOfBirth notes');

      if (!prescription) {
        return sendError(res, 'Prescription not found', 404);
      }

      const items = await PrescriptionItem.find({ prescription: prescription._id })
        .populate('medicine', 'name genericName unit strength barcode');

      return sendSuccess(res, 'Prescription details fetched successfully', { prescription, items });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Upload new Doctor Prescription (PENDING status by default)
   * POST /api/prescriptions
   */
  createPrescription: async (req, res, next) => {
    try {
      const { 
        customerId, doctorName, doctorRegistrationNumber, 
        prescriptionDate, items 
      } = req.body;

      // Validations
      if (!customerId) return sendError(res, 'Customer reference is required', 400);
      if (!doctorName) return sendError(res, 'Doctor name is required', 400);
      if (!doctorRegistrationNumber) return sendError(res, 'Doctor registration license is required', 400);
      if (!items || items.length === 0) return sendError(res, 'Prescription must contain at least one medicine', 400);

      // Generate unique prescription Rx number
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const prescriptionNumber = `RX-${todayStr}-${randomSuffix}`;

      // Save Prescription Header
      const prescription = new Prescription({
        prescriptionNumber,
        customer: customerId,
        doctorName,
        doctorRegistrationNumber,
        prescriptionDate: prescriptionDate || new Date(),
        status: 'PENDING'
      });
      await prescription.save();

      // Save Prescription Items
      const savedItems = [];
      for (const it of items) {
        const item = new PrescriptionItem({
          prescription: prescription._id,
          medicineName: it.medicineName,
          medicine: it.medicineId || null,
          dosage: it.dosage,
          frequency: it.frequency,
          duration: it.duration,
          instructions: it.instructions,
          quantity: Number(it.quantity || 1)
        });
        await item.save();
        savedItems.push(item);
      }

      return sendSuccess(res, 'Prescription uploaded successfully', { prescription, items: savedItems }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Pharmacist status verification (Approve/Reject prescription)
   * PUT /api/prescriptions/:id/status
   */
  updatePrescriptionStatus: async (req, res, next) => {
    try {
      const { status } = req.body;
      const validStatuses = ['VERIFIED', 'REJECTED'];

      if (!validStatuses.includes(status)) {
        return sendError(res, 'Invalid status selection. Must be VERIFIED or REJECTED.', 400);
      }

      const prescription = await Prescription.findById(req.params.id);
      if (!prescription) return sendError(res, 'Prescription not found', 404);

      if (prescription.status === 'DISPENSED') {
        return sendError(res, 'Already dispensed prescriptions cannot be updated', 400);
      }

      prescription.status = status;
      await prescription.save();

      if (status === 'VERIFIED') {
        await recordAuditLog({
          userId: req.user?._id,
          action: 'VERIFY_PRESCRIPTION',
          entity: 'Prescription',
          entityId: prescription._id,
          description: `Prescription ${prescription.prescriptionNumber} verified`,
          ipAddress: req.ip
        });
      }

      return sendSuccess(res, `Prescription status updated to ${status}`, { prescription });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = prescriptionController;
