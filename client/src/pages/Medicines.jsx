import React, { useState, useEffect } from 'react';
import medicineService from '../services/medicineService';
import categoryService from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit, Trash2, Eye, CheckCircle2, 
  AlertCircle, Loader2, Package 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import DemoDataButton from '../components/DemoDataButton';

const dosageFormOptions = [
  { label: 'All Dosage Forms', value: '' },
  { label: 'Tablet', value: 'Tablet' },
  { label: 'Capsule', value: 'Capsule' },
  { label: 'Syrup', value: 'Syrup' },
  { label: 'Injection', value: 'Injection' },
  { label: 'Ointment', value: 'Ointment' },
  { label: 'Drops', value: 'Drops' },
  { label: 'Inhaler', value: 'Inhaler' },
  { label: 'Other', value: 'Other' },
];

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const Medicines = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dosageFilter, setDosageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Form Drawer Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedMedId, setSelectedMedId] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [unit, setUnit] = useState('Box');
  const [prescriptionRequired, setPrescriptionRequired] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [tax, setTax] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(10);
  const [barcode, setBarcode] = useState('');
  const [status, setStatus] = useState('Active');

  // Details Modal State
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailedMed, setDetailedMed] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [medToDelete, setMedToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const response = await medicineService.getMedicines({
        search,
        category: categoryFilter,
        dosageForm: dosageFilter,
        status: statusFilter,
        sort,
        page,
        limit: 8
      });
      if (response?.success) {
        setMedicines(response.data.medicines);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch medicines catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      if (response?.success) {
        setCategories(response.data.categories);
      }
    } catch (err) {
      console.error('Error fetching categories list:', err);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [search, categoryFilter, dosageFilter, statusFilter, sort, page]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreateDrawer = () => {
    setEditMode(false);
    setSelectedMedId(null);
    setName('');
    setGenericName('');
    setBrand('');
    setCategory(categories[0]?._id || '');
    setManufacturer('');
    setDosageForm('Tablet');
    setStrength('');
    setUnit('Box');
    setPrescriptionRequired(false);
    setPurchasePrice(0);
    setSellingPrice(0);
    setTax(0);
    setReorderLevel(10);
    setBarcode('');
    setStatus('Active');
    setFormOpen(true);
  };

  const handleOpenEditDrawer = (med) => {
    setEditMode(true);
    setSelectedMedId(med._id);
    setName(med.name);
    setGenericName(med.genericName);
    setBrand(med.brand || '');
    setCategory(med.category?._id || med.category || '');
    setManufacturer(med.manufacturer || '');
    setDosageForm(med.dosageForm);
    setStrength(med.strength);
    setUnit(med.unit);
    setPrescriptionRequired(med.prescriptionRequired);
    setPurchasePrice(med.purchasePrice);
    setSellingPrice(med.sellingPrice);
    setTax(med.tax || 0);
    setReorderLevel(med.reorderLevel || 10);
    setBarcode(med.barcode || '');
    setStatus(med.status);
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !genericName || !category || !dosageForm || !strength || !unit) {
      showToast('Please fill in all required catalog fields.', 'warning');
      return;
    }

    if (purchasePrice < 0 || sellingPrice < 0) {
      showToast('Prices cannot be negative values.', 'error');
      return;
    }

    const payload = {
      name, genericName, brand, category, manufacturer,
      dosageForm, strength, unit, prescriptionRequired,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      tax: Number(tax),
      reorderLevel: Number(reorderLevel),
      barcode, status
    };

    setActionLoading(true);
    try {
      if (editMode) {
        const response = await medicineService.updateMedicine(selectedMedId, payload);
        if (response?.success) {
          showToast('Medicine catalog updated successfully!', 'success');
          setFormOpen(false);
          fetchMedicines();
        }
      } else {
        const response = await medicineService.createMedicine(payload);
        if (response?.success) {
          showToast('Medicine registered successfully!', 'success');
          setFormOpen(false);
          fetchMedicines();
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = async (medId) => {
    setDetailsLoading(true);
    setDetailsOpen(true);
    try {
      const response = await medicineService.getMedicineById(medId);
      if (response?.success) {
        setDetailedMed(response.data.medicine);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch medicine details.', 'error');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleTriggerDelete = (med) => {
    setMedToDelete(med);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await medicineService.deleteMedicine(medToDelete._id);
      if (response?.success) {
        showToast('Medicine deleted successfully.', 'success');
        setDeleteOpen(false);
        fetchMedicines();
      }
    } catch (err) {
      showToast(err.message || 'Decline deletion. Verify active batches contain stock.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEdit = user && ['ADMIN', 'INVENTORY_MANAGER'].includes(user.role);

  // DataTable column maps
  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 leading-none">{row.name}</p>
          <span className="text-[10px] font-semibold text-slate-400 mt-1 block italic">{row.genericName}</span>
        </div>
      )
    },
    {
      header: 'Dosage Form',
      accessor: 'dosageForm',
      render: (row) => (
        <span className="text-slate-500 font-medium">{row.dosageForm} ({row.strength})</span>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: (row) => (
        <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
          {row.category?.name || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Selling Price',
      accessor: 'sellingPrice',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-700">${row.sellingPrice.toFixed(2)}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center space-x-1 font-bold text-xs ${
          row.status === 'Active' ? 'text-emerald-600' : 'text-rose-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${
            row.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'
          }`}></span>
          <span>{row.status}</span>
        </span>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <div className="space-x-1.5">
          <button
            onClick={() => handleOpenDetails(row._id)}
            className="inline-flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="View Details"
          >
            <Eye className="h-4.5 w-4.5" />
          </button>
          {canEdit && (
            <>
              <button
                onClick={() => handleOpenEditDrawer(row)}
                className="inline-flex p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                title="Edit Medicine"
              >
                <Edit className="h-4.5 w-4.5" />
              </button>
              <button
                onClick={() => handleTriggerDelete(row)}
                className="inline-flex p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50/50 rounded-lg transition"
                title="Delete Medicine"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // Map Category Filter options dynamically from database categories
  const categoryFilterOptions = [
    { label: 'All Categories', value: '' },
    ...categories.map(c => ({ label: c.name, value: c._id }))
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Medicine Catalogue</h1>
          <p className="text-sm text-slate-500">Add, edit, search, and manage master pharmaceutical formulations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="medicines" 
            onSuccess={() => { fetchMedicines(); fetchCategories(); }} 
          />
          {canEdit && (
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
            >
              <Plus className="h-4.5 w-4.5 stroke-[3]" />
              <span>Register Medicine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Deck */}
      <SearchFilter
        searchPlaceholder="Search by name, generic, barcode..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          { value: categoryFilter, options: categoryFilterOptions, onChange: (val) => { setCategoryFilter(val); setPage(1); } },
          { value: dosageFilter, options: dosageFormOptions, onChange: (val) => { setDosageFilter(val); setPage(1); } },
          { value: statusFilter, options: statusOptions, onChange: (val) => { setStatusFilter(val); setPage(1); } },
        ]}
        onClear={() => {
          setSearch('');
          setCategoryFilter('');
          setDosageFilter('');
          setStatusFilter('');
          setSort('-createdAt');
          setPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={medicines}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
        onSort={(s) => setSort(s)}
        currentSort={sort}
      />

      {/* Form Dialog Modal */}
      <Modal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={editMode ? 'Edit Medicine Catalogue Item' : 'Register New Medicine Item'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Brand/Trade Name</label>
              <input
                type="text"
                placeholder="e.g. Tylenol"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            {/* Generic Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Generic Formula Name</label>
              <input
                type="text"
                placeholder="e.g. Paracetamol"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category selection */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Therapeutic Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white"
                required
              >
                <option value="" disabled>Select category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Dosage Form */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dosage Form</label>
              <select
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white"
                required
              >
                {dosageFormOptions.filter(d => d.value !== '').map((d, idx) => (
                  <option key={idx} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Strength */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Strength</label>
              <input
                type="text"
                placeholder="e.g. 500mg, 10ml"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Manufacturer */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Pfizer"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>

            {/* Unit */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Packaging Unit</label>
              <input
                type="text"
                placeholder="e.g. Box, Bottle"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            {/* Barcode */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Barcode / SKU</label>
              <input
                type="text"
                placeholder="e.g. 8901234567"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Purchase Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Purchase Cost ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            {/* Selling Price */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Retail Price ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            {/* Tax */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tax %</label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>

            {/* Reorder Level */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Reorder Threshold</label>
              <input
                type="number"
                placeholder="10"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 py-2">
            {/* Prescription Required checkbox */}
            <div className="flex items-center space-x-2.5">
              <input
                type="checkbox"
                id="prescriptionRequired"
                checked={prescriptionRequired}
                onChange={(e) => setPrescriptionRequired(e.target.checked)}
                className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="prescriptionRequired" className="text-xs text-slate-600 font-bold uppercase tracking-wide">Prescription Required</label>
            </div>

            {/* Status selection */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-bold text-slate-500 uppercase">Status:</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span>{editMode ? 'Save Catalog Updates' : 'Add to Catalogue'}</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Details Slide Drawer Modal */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Medicine Inventory Overview" size="lg">
        {detailsLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedMed ? (
          <div className="space-y-6">
            {/* Header section */}
            <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 leading-none">{detailedMed.name}</h3>
                <span className="text-xs font-semibold text-slate-400 mt-1 block italic">{detailedMed.genericName}</span>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                detailedMed.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {detailedMed.status}
              </span>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Dosage Form</span>
                <p className="font-bold text-slate-700">{detailedMed.dosageForm} ({detailedMed.strength})</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Category</span>
                <p className="font-bold text-slate-700">{detailedMed.category?.name || 'Unassigned'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Unit Package</span>
                <p className="font-bold text-slate-700">{detailedMed.unit}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Retail Price</span>
                <p className="font-bold text-slate-700">${detailedMed.sellingPrice.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Purchase Cost</span>
                <p className="font-bold text-slate-700">${detailedMed.purchasePrice.toFixed(2)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Tax Rate</span>
                <p className="font-bold text-slate-700">{detailedMed.tax || 0}%</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Barcode / SKU</span>
                <p className="font-bold text-slate-700">{detailedMed.barcode || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Reorder Margin</span>
                <p className="font-bold text-slate-700">{detailedMed.reorderLevel} Items</p>
              </div>
              <div className="space-y-0.5 flex items-center space-x-1 pt-3">
                {detailedMed.prescriptionRequired ? (
                  <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded text-[10px]">
                    <AlertCircle className="h-3 w-3 shrink-0" />
                    <span>RX REQUIRED</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded text-[10px]">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    <span>OVER THE COUNTER</span>
                  </span>
                )}
              </div>
            </div>

            {/* Total Stock status */}
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-50 text-primary-600 p-2.5 rounded-xl border border-primary-100/30">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase">Available In-Stock</h4>
                  <p className="font-extrabold text-slate-800 text-base">{detailedMed.totalStock} {detailedMed.unit}s</p>
                </div>
              </div>
              <div>
                {detailedMed.totalStock <= detailedMed.reorderLevel ? (
                  <span className="bg-rose-50 text-rose-700 border border-rose-100 text-[10px] font-bold px-3 py-1.5 rounded-xl">LOW STOCK WARNING</span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold px-3 py-1.5 rounded-xl">STOCK ADEQUATE</span>
                )}
              </div>
            </div>

            {/* Active Batches Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Associated Batches</h4>
              {detailedMed.batches?.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center border border-dashed rounded-xl">
                  No active stock batches registered for this medicine.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {detailedMed.batches?.map((b, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded-xl text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-700 block">{b.batchNumber}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Exp: {new Date(b.expiryDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800">{b.currentQuantity} Qty</span>
                        <span className="text-[9px] text-slate-400 mt-0.5 block uppercase font-bold tracking-wider">
                          Cost: ${b.purchasePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Medicine"
        message={`Are you sure you want to permanently delete "${medToDelete?.name}"? You can only delete catalog items that have no active inventory batches holding stock.`}
        confirmText="Delete permanently"
        type="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default Medicines;
