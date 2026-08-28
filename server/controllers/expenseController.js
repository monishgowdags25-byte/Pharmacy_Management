const Expense = require('../models/Expense');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const expenseController = {
  /**
   * Fetch all expenses paginated with search and range filters
   * GET /api/expenses
   */
  getExpenses: async (req, res, next) => {
    try {
      const { search, category, startDate, endDate, sort = '-date', page = 1, limit = 10 } = req.query;

      const query = {};

      if (category) query.category = category;

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { expenseNumber: { $regex: search, $options: 'i' } }
        ];
      }

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;

      const expenses = await Expense.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

      const totalCount = await Expense.countDocuments(query);
      const totalPages = Math.ceil(totalCount / limitNum);

      return sendSuccess(res, 'Expenses fetched successfully', {
        expenses,
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
   * Create new expense voucher
   * POST /api/expenses
   */
  createExpense: async (req, res, next) => {
    try {
      const { title, description, amount, category, date } = req.body;

      // Validations
      if (!title) return sendError(res, 'Expense title is required', 400);
      if (!category) return sendError(res, 'Expense category is required', 400);
      if (amount === undefined || amount < 0) {
        return sendError(res, 'Expense amount must be greater than or equal to zero', 400);
      }

      // Generate unique expense slip code number
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const expenseNumber = `EXP-${todayStr}-${randomSuffix}`;

      const expense = new Expense({
        expenseNumber,
        title,
        description,
        amount: Number(amount),
        category,
        date: date ? new Date(date) : new Date()
      });
      await expense.save();

      return sendSuccess(res, 'Expense created successfully', expense, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update expense record voucher
   * PUT /api/expenses/:id
   */
  updateExpense: async (req, res, next) => {
    try {
      const { title, description, amount, category, date } = req.body;

      const expense = await Expense.findById(req.params.id);
      if (!expense) return sendError(res, 'Expense record not found', 404);

      if (amount !== undefined && amount < 0) {
        return sendError(res, 'Expense amount cannot be negative', 400);
      }

      expense.title = title || expense.title;
      expense.description = description !== undefined ? description : expense.description;
      expense.amount = amount !== undefined ? Number(amount) : expense.amount;
      expense.category = category || expense.category;
      if (date) expense.date = new Date(date);

      await expense.save();

      return sendSuccess(res, 'Expense record updated successfully', expense);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete expense voucher record
   * DELETE /api/expenses/:id
   */
  deleteExpense: async (req, res, next) => {
    try {
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (!expense) return sendError(res, 'Expense record not found', 404);

      return sendSuccess(res, 'Expense record deleted successfully', { id: expense._id });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = expenseController;
