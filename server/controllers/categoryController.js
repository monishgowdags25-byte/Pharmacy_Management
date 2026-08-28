const Category = require('../models/Category');
const Medicine = require('../models/Medicine');
const { sendSuccess, sendError } = require('../utils/apiResponse');

const categoryController = {
  /**
   * Fetch all categories with dynamic medicine count
   * GET /api/categories
   */
  getCategories: async (req, res, next) => {
    try {
      const { search } = req.query;

      // Build query for aggregation if search parameter is present
      const matchStage = {};
      if (search) {
        matchStage.name = { $regex: search, $options: 'i' };
      }

      // Aggregate categories and lookup medicine counts
      const categories = await Category.aggregate([
        { $match: matchStage },
        {
          $lookup: {
            from: 'medicines', // Pluralized collection name
            localField: '_id',
            foreignField: 'category',
            as: 'medicines'
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            createdAt: 1,
            updatedAt: 1,
            medicineCount: { $size: '$medicines' }
          }
        },
        { $sort: { name: 1 } }
      ]);

      return sendSuccess(res, 'Categories fetched successfully', { categories });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new category
   * POST /api/categories
   */
  createCategory: async (req, res, next) => {
    try {
      const { name, description } = req.body;

      if (!name) {
        return sendError(res, 'Category name is required', 400);
      }

      // Check duplicate
      const duplicate = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
      if (duplicate) {
        return sendError(res, 'Category with this name already exists', 400);
      }

      const category = new Category({ name, description });
      await category.save();

      return sendSuccess(res, 'Category created successfully', { category }, 201);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update category
   * PUT /api/categories/:id
   */
  updateCategory: async (req, res, next) => {
    try {
      const { name, description } = req.body;
      const categoryId = req.params.id;

      const category = await Category.findById(categoryId);
      if (!category) {
        return sendError(res, 'Category not found', 404);
      }

      // Check duplicate name
      if (name && name !== category.name) {
        const duplicate = await Category.findOne({ 
          name: { $regex: `^${name}$`, $options: 'i' },
          _id: { $ne: categoryId }
        });
        if (duplicate) {
          return sendError(res, 'Another category with this name already exists', 400);
        }
        category.name = name;
      }

      if (description !== undefined) category.description = description;

      await category.save();

      return sendSuccess(res, 'Category updated successfully', { category });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete category (with integrity checks)
   * DELETE /api/categories/:id
   */
  deleteCategory: async (req, res, next) => {
    try {
      const categoryId = req.params.id;

      // Check database integrity constraint: do not delete categories with registered medicines
      const medicineCount = await Medicine.countDocuments({ category: categoryId });
      if (medicineCount > 0) {
        return sendError(res, `Cannot delete category. There are ${medicineCount} medicines assigned to this category.`, 400);
      }

      const category = await Category.findByIdAndDelete(categoryId);
      if (!category) {
        return sendError(res, 'Category not found', 404);
      }

      return sendSuccess(res, 'Category deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};

module.exports = categoryController;
