const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const supplierController = {
  /**
   * Fetch all suppliers
   * GET /api/suppliers
   */
  getSuppliers: async (req, res, next) => {
    try {
      const { search, status } = req.query;

      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } }
        ];
      }

      if (status) {
        query.status = status;
      }

      const suppliers = await Supplier.find(query).sort({ name: 1 });

      return sendSuccess(res, 'Suppliers fetched successfully', { suppliers });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch single supplier with purchase history
   * GET /api/suppliers/:id
   */
  getSupplierById: async (req, res, next) => {
    try {
      const supplierId = req.params.id;
      const supplier = await Supplier.findById(supplierId);

      if (!supplier) {
        return sendError(res, 'Supplier not found', 404);
      }

      // Fetch purchase history for this supplier
      const purchases = await Purchase.find({ supplier: supplierId })
        .sort({ purchaseDate: -1 })
        .limit(10); // Limit to last 10 purchases

      const supplierJSON = supplier.toJSON();
      supplierJSON.purchases = purchases;

      return sendSuccess(res, 'Supplier details fetched successfully', { supplier: supplierJSON });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Register new supplier
   * POST /api/suppliers
   */
  createSupplier: async (req, res, next) => {
    try {
      const { 
        name, companyName, contactPerson, phone, 
        email, address, vatNumber, paymentTerms, status, notes 
      } = req.body;

      if (!name || !phone) {
        return sendError(res, 'Supplier name and phone number are required', 400);
      }

      const supplier = new Supplier({
        name,
        companyName,
        contactPerson,
        phone,
        email,
        address,
        vatNumber,
        paymentTerms,
        status,
        notes
      });

      await supplier.save();

      return sendSuccess(res, 'Supplier registered successfully', { supplier }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update supplier details
   * PUT /api/suppliers/:id
   */
  updateSupplier: async (req, res, next) => {
    try {
      const supplierId = req.params.id;
      const { 
        name, companyName, contactPerson, phone, 
        email, address, vatNumber, paymentTerms, status, notes 
      } = req.body;

      const supplier = await Supplier.findById(supplierId);
      if (!supplier) {
        return sendError(res, 'Supplier not found', 404);
      }

      if (name) supplier.name = name;
      if (companyName !== undefined) supplier.companyName = companyName;
      if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
      if (phone) supplier.phone = phone;
      if (email !== undefined) supplier.email = email;
      if (address !== undefined) supplier.address = address;
      if (vatNumber !== undefined) supplier.vatNumber = vatNumber;
      if (paymentTerms !== undefined) supplier.paymentTerms = paymentTerms;
      if (status) supplier.status = status;
      if (notes !== undefined) supplier.notes = notes;

      await supplier.save();

      return sendSuccess(res, 'Supplier details updated successfully', { supplier });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete supplier (checking integrity constraints for existing purchase orders)
   * DELETE /api/suppliers/:id
   */
  deleteSupplier: async (req, res, next) => {
    try {
      const supplierId = req.params.id;

      // Database Integrity check: prevent deletion of suppliers linked to existing purchases
      const purchaseCount = await Purchase.countDocuments({ supplier: supplierId });
      if (purchaseCount > 0) {
        return sendError(res, `Cannot delete supplier. There are ${purchaseCount} purchase invoice transactions registered for this supplier.`, 400);
      }

      const supplier = await Supplier.findByIdAndDelete(supplierId);
      if (!supplier) {
        return sendError(res, 'Supplier not found', 404);
      }

      return sendSuccess(res, 'Supplier record deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = supplierController;
