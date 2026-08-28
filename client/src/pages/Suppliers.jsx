import React, { useState, useEffect } from 'react';
import supplierService from '../services/supplierService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit, Trash2, Eye, Mail, Phone, MapPin, 
  CreditCard, ShieldAlert, Loader2, BookOpen, User 
} from 'lucide-react';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import DemoDataButton from '../components/DemoDataButton';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
];

const Suppliers = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Search/Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [status, setStatus] = useState('Active');
  const [notes, setNotes] = useState('');

  // Details Modal State
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailedSupplier, setDetailedSupplier] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await supplierService.getSuppliers({
        search,
        status: statusFilter
      });
      if (response?.success) {
        setSuppliers(response.data.suppliers);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch suppliers directory', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, statusFilter]);

  const handleOpenCreateDrawer = () => {
    setEditMode(false);
    setSelectedSupplierId(null);
    setName('');
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setVatNumber('');
    setPaymentTerms('');
    setStatus('Active');
    setNotes('');
    setFormOpen(true);
  };

  const handleOpenEditDrawer = (supplier) => {
    setEditMode(true);
    setSelectedSupplierId(supplier._id);
    setName(supplier.name);
    setCompanyName(supplier.companyName || '');
    setContactPerson(supplier.contactPerson || '');
    setPhone(supplier.phone);
    setEmail(supplier.email || '');
    setAddress(supplier.address || '');
    setVatNumber(supplier.vatNumber || '');
    setPaymentTerms(supplier.paymentTerms || '');
    setStatus(supplier.status);
    setNotes(supplier.notes || '');
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !phone) {
      showToast('Supplier name and phone number are required.', 'warning');
      return;
    }

    const payload = {
      name, companyName, contactPerson, phone,
      email, address, vatNumber, paymentTerms, status, notes
    };

    setActionLoading(true);
    try {
      if (editMode) {
        const response = await supplierService.updateSupplier(selectedSupplierId, payload);
        if (response?.success) {
          showToast('Supplier details updated successfully!', 'success');
          setFormOpen(false);
          fetchSuppliers();
        }
      } else {
        const response = await supplierService.createSupplier(payload);
        if (response?.success) {
          showToast('Supplier registered successfully!', 'success');
          setFormOpen(false);
          fetchSuppliers();
        }
      }
    } catch (err) {
      showToast(err.message || 'Operation failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = async (supplierId) => {
    setDetailsLoading(true);
    setDetailsOpen(true);
    try {
      const response = await supplierService.getSupplierById(supplierId);
      if (response?.success) {
        setDetailedSupplier(response.data.supplier);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch supplier details.', 'error');
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleTriggerDelete = (supplier) => {
    setSupplierToDelete(supplier);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const response = await supplierService.deleteSupplier(supplierToDelete._id);
      if (response?.success) {
        showToast('Supplier deleted successfully.', 'success');
        setDeleteOpen(false);
        fetchSuppliers();
      }
    } catch (err) {
      showToast(err.message || 'Decline deletion. Ensure supplier has no registered purchases.', 'error');
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Suppliers Directory</h1>
          <p className="text-sm text-slate-500">Manage distributors, wholesalers, company details, and history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="suppliers" 
            onSuccess={fetchSuppliers} 
          />
          {canEdit && (
            <button
              onClick={handleOpenCreateDrawer}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
            >
              <Plus className="h-4.5 w-4.5 stroke-[3]" />
              <span>Register Supplier</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <SearchFilter
        searchPlaceholder="Search by contact name, company name..."
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        filters={[
          { value: statusFilter, options: statusOptions, onChange: (val) => setStatusFilter(val) }
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* Suppliers Grid cards */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-slate-200/50 max-w-xl mx-auto">
          <User className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 text-lg">No Suppliers Registered</h3>
          <p className="text-slate-400 text-sm mt-1 mb-6">Log supplier information to trace stock orders and acquisitions.</p>
          {canEdit && (
            <button
              onClick={handleOpenCreateDrawer}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md transition"
            >
              Add First Supplier
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((s) => (
            <div key={s._id} className="bg-white rounded-3xl p-6 border border-slate-200/50 shadow-sm flex flex-col justify-between group hover:border-primary-500/20 hover:shadow-md transition duration-300">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight leading-tight">{s.companyName || s.name}</h3>
                    {s.companyName && (
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 uppercase tracking-wide">
                        Contact: {s.name}
                      </span>
                    )}
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                  }`}>
                    {s.status}
                  </span>
                </div>

                {/* Contact Coordinates */}
                <div className="space-y-2 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0 truncate" />
                      <span className="truncate">{s.email}</span>
                    </div>
                  )}
                  {s.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 truncate" />
                      <span className="truncate">{s.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Operations */}
              <div className="flex items-center justify-end space-x-2 pt-4 mt-6 border-t border-slate-100">
                <button
                  onClick={() => handleOpenDetails(s._id)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                  title="View Purchase History"
                >
                  <Eye className="h-4 w-4" />
                </button>
                {canEdit && (
                  <>
                    <button
                      onClick={() => handleOpenEditDrawer(s)}
                      className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition"
                      title="Edit Supplier"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleTriggerDelete(s)}
                      className="p-2 text-rose-400 hover:text-rose-600 bg-rose-50/50 hover:bg-rose-100/50 rounded-xl transition"
                      title="Delete Supplier"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <Modal 
        isOpen={formOpen} 
        onClose={() => setFormOpen(false)} 
        title={editMode ? 'Edit Supplier Details' : 'Register New Supplier'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Contact Full Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
                required
              />
            </div>

            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
              <input
                type="text"
                placeholder="e.g. Pfizer Distributors Ltd."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
              <input
                type="email"
                placeholder="e.g. sales@pfizer.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* GST/VAT */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">GST / VAT Number</label>
              <input
                type="text"
                placeholder="e.g. VAT8910123"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>

            {/* Payment terms */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Payment Terms</label>
              <input
                type="text"
                placeholder="e.g. Net 30, COD"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Physical Address</label>
            <input
              type="text"
              placeholder="e.g. 100 Main St, Warehouse Zone A"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Internal Notes</label>
            <textarea
              placeholder="Special instructions, discounts details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
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
              <span>{editMode ? 'Save Details' : 'Register Supplier'}</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Details Slide Drawer Modal */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Supplier Account Profile" size="lg">
        {detailsLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedSupplier ? (
          <div className="space-y-6">
            {/* Header section */}
            <div className="pb-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-800 leading-none">{detailedSupplier.companyName || detailedSupplier.name}</h3>
                {detailedSupplier.companyName && (
                  <span className="text-xs font-semibold text-slate-400 mt-1 block">Contact Rep: {detailedSupplier.name}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                detailedSupplier.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
              }`}>
                {detailedSupplier.status}
              </span>
            </div>

            {/* Spec grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Phone Number</span>
                <p className="font-bold text-slate-700">{detailedSupplier.phone}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Email Address</span>
                <p className="font-bold text-slate-700 truncate">{detailedSupplier.email || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">GST/VAT Number</span>
                <p className="font-bold text-slate-700">{detailedSupplier.vatNumber || 'N/A'}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Payment Terms</span>
                <p className="font-bold text-slate-700">{detailedSupplier.paymentTerms || 'N/A'}</p>
              </div>
              <div className="col-span-2 space-y-0.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Warehouse Address</span>
                <p className="font-bold text-slate-700 leading-relaxed">{detailedSupplier.address || 'N/A'}</p>
              </div>
              {detailedSupplier.notes && (
                <div className="col-span-2 space-y-0.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">Supplier Notes</span>
                  <p className="text-slate-600 font-medium leading-relaxed italic">{detailedSupplier.notes}</p>
                </div>
              )}
            </div>

            {/* Purchases history Section */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 flex items-center space-x-1.5">
                <BookOpen className="h-4 w-4" />
                <span>Purchase Invoices History</span>
              </h4>
              {detailedSupplier.purchases?.length === 0 ? (
                <p className="text-slate-400 text-xs py-5 text-center border border-dashed rounded-xl">
                  No purchase order history registered for this distributor yet.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {detailedSupplier.purchases?.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border rounded-xl text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-700 block">{p.purchaseNumber}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(p.purchaseDate).toLocaleDateString()}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block">${p.totalAmount.toFixed(2)}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${
                          p.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500'
                        }`}>{p.status}</span>
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
        title="Delete Supplier"
        message={`Are you sure you want to permanently delete supplier "${supplierToDelete?.companyName || supplierToDelete?.name}"? You can only delete suppliers with no active purchase transaction histories.`}
        confirmText="Delete permanently"
        type="danger"
        loading={deleteLoading}
      />

    </div>
  );
};

export default Suppliers;
