import React, { useState, useEffect } from 'react';
import categoryService from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, FolderPlus, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';

const Categories = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal & Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [catToDelete, setCatToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response?.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch categories list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditMode(false);
    setName('');
    setDescription('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (cat) => {
    setEditMode(true);
    setSelectedCatId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      showToast('Category name is required.', 'warning');
      return;
    }

    setActionLoading(true);
    try {
      if (editMode) {
        const response = await categoryService.updateCategory(selectedCatId, { name, description });
        if (response?.success) {
          showToast('Therapeutic category updated successfully!', 'success');
          setModalOpen(false);
          fetchCategories();
        }
      } else {
        const response = await categoryService.createCategory({ name, description });
        if (response?.success) {
          showToast('Therapeutic category created successfully!', 'success');
          setModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerDelete = (cat) => {
    setCatToDelete(cat);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await categoryService.deleteCategory(catToDelete._id);
      if (response?.success) {
        showToast('Category deleted successfully.', 'success');
        setDeleteOpen(false);
        fetchCategories();
      }
    } catch (err) {
      showToast(err.message || 'Decline deletion. Ensure category is empty.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEdit = user && ['ADMIN', 'INVENTORY_MANAGER'].includes(user.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Therapeutic Classes</h1>
          <p className="text-sm text-slate-500">Manage medicine classification lists and item allocations.</p>
        </div>
        {canEdit && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Add Category</span>
          </button>
        )}
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/50 max-w-xl mx-auto">
          <FolderPlus className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No Categories Setup</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Create therapeutic classes to classify medicines in the store.</p>
          {canEdit && (
            <button
              onClick={handleOpenCreateModal}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition"
            >
              Add First Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <div key={cat._id} className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-between group hover:border-primary-500/20 hover:shadow-md transition duration-300">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{cat.name}</h3>
                  <span className="bg-primary-50 text-primary-700 text-[10px] font-bold px-2 py-1 rounded-full border border-primary-100/30">
                    {cat.medicineCount} {cat.medicineCount === 1 ? 'Med' : 'Meds'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-medium line-clamp-3">
                  {cat.description || 'No descriptive details registered for this therapeutic class.'}
                </p>
              </div>

              {/* Action buttons */}
              {canEdit && (
                <div className="flex items-center justify-end space-x-2 pt-5 mt-4 border-t border-slate-50">
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                    title="Edit Category"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleTriggerDelete(cat)}
                    className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-100/50 rounded-xl transition"
                    title="Delete Category"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editMode ? 'Edit Category' : 'Create Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Category Name</label>
            <input
              type="text"
              placeholder="e.g. Analgesics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
            <textarea
              placeholder="Provide therapeutic description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>{editMode ? 'Save Changes' : 'Create Category'}</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Category"
        message={`Are you sure you want to permanently delete the category "${catToDelete?.name}"? Make sure there are no medicines assigned to this category.`}
        confirmText="Delete permanently"
        type="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default Categories;
