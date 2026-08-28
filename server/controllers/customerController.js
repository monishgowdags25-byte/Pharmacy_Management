const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const customerController = {
  /**
   * Fetch all customers paginated
   * GET /api/customers
   */
  getCustomers: async (req, res, next) => {
    try {
      const { search, sort = '-createdAt', page = 1, limit = 10 } = req.query;

      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const customers = await Customer.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Customer.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Customers fetched successfully', {
        customers,
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
   * Fetch single customer details with purchase history
   * GET /api/customers/:id
   */
  getCustomerById: async (req, res, next) => {
    try {
      const customer = await Customer.findById(req.params.id);
      if (!customer) {
        return sendError(res, 'Customer not found', 404);
      }

      // Fetch purchase history for customer
      const purchaseHistory = await Sale.find({ customer: customer._id })
        .populate('user', 'name')
        .sort('-createdAt');

      return sendSuccess(res, 'Customer details fetched successfully', {
        customer,
        purchaseHistory
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create customer profile
   * POST /api/customers
   */
  createCustomer: async (req, res, next) => {
    try {
      const { name, phone, email, address, dateOfBirth, gender, notes } = req.body;

      if (!name) return sendError(res, 'Customer name is required', 400);

      // Check unique phone number if supplied
      if (phone) {
        const existing = await Customer.findOne({ phone });
        if (existing) {
          return sendError(res, 'Customer with this phone number already exists', 400);
        }
      }

      const customer = new Customer({
        name,
        phone,
        email,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        notes
      });
      await customer.save();

      return sendSuccess(res, 'Customer registered successfully', customer, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update customer profile
   * PUT /api/customers/:id
   */
  updateCustomer: async (req, res, next) => {
    try {
      const { name, phone, email, address, dateOfBirth, gender, notes } = req.body;

      const customer = await Customer.findById(req.params.id);
      if (!customer) return sendError(res, 'Customer not found', 404);

      if (phone && phone !== customer.phone) {
        const existing = await Customer.findOne({ phone });
        if (existing) {
          return sendError(res, 'Customer with this phone number already exists', 400);
        }
        customer.phone = phone;
      }

      customer.name = name || customer.name;
      customer.email = email;
      customer.address = address;
      if (dateOfBirth) customer.dateOfBirth = new Date(dateOfBirth);
      customer.gender = gender;
      customer.notes = notes;

      await customer.save();

      return sendSuccess(res, 'Customer profile updated successfully', customer);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = customerController;
