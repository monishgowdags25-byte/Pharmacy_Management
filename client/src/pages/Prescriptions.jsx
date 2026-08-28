import React, { useState, useEffect } from 'react';
import prescriptionService from '../services/prescriptionService';
import customerService from '../services/customerService';
import medicineService from '../services/medicineService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Eye, Loader2, ClipboardList, CheckCircle2, 
  XCircle, FileText, Calendar, PlusCircle, Trash2 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import DemoDataButton from '../components/DemoDataButton';

const Prescriptions = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data lists
  const [prescriptions, setPrescriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Profile details modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedPO, setDetailedPO] = useState(null);
  const [detailedItems, setDetailedItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    customerId: '', doctorName: '', doctorRegistrationNumber: '', prescriptionDate: new Date().toISOString().slice(0, 10),
    items: [{ medicineName: '', medicineId: '', dosage: '1-0-1', frequency: 'Daily', duration: '5 days', instructions: 'After meals', quantity: '10' }]
  });

  const loadDependencies = async () => {
    try {
      const custRes = await customerService.getCustomers({ limit: 100 });
      if (custRes?.success) setCustomers(custRes.data.customers);

      const medRes = await medicineService.getMedicines({ limit: 100, status: 'Active' });
      if (medRes?.success) setMedicines(medRes.data.medicines);
    } catch (err) {
      showToast('Failed to load customers or medicines registry', 'error');
    }
  };

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const response = await prescriptionService.getPrescriptions({ search, status: statusFilter, page, limit: 10 });
      if (response?.success) {
        setPrescriptions(response.data.prescriptions);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      showToast('Failed to load prescriptions list', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
    loadDependencies();
  }, [search, statusFilter, page]);

  const handleOpenDetails = async (rxId) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await prescriptionService.getPrescriptionById(rxId);
      if (response?.success) {
        setDetailedPO(response.data.prescription);
        setDetailedItems(response.data.items);
      }
    } catch (err) {
      showToast('Failed to fetch prescription details', 'error');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUpdateStatus = async (rxId, newStatus) => {
    setActionLoading(true);
    try {
      const response = await prescriptionService.updatePrescriptionStatus(rxId, newStatus);
      if (response?.success) {
        showToast(`Prescription successfully ${newStatus === 'VERIFIED' ? 'Approved' : 'Rejected'}!`, 'success');
        setDetailOpen(false);
        fetchPrescriptions();
      }
    } catch (err) {
      showToast(err.message || 'Failed to verify prescription status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddRow = () => {
    const updated = [...formValues.items];
    updated.push({ medicineName: '', medicineId: '', dosage: '1-0-1', frequency: 'Daily', duration: '5 days', instructions: 'After meals', quantity: '10' });
    setFormValues({ ...formValues, items: updated });
  };

  const handleRemoveRow = (idx) => {
    if (formValues.items.length === 1) {
      showToast('Prescription must contain at least one item.', 'warning');
      return;
    }
    const updated = formValues.items.filter((_, i) => i !== idx);
    setFormValues({ ...formValues, items: updated });
  };

  const handleRowChange = (idx, field, value) => {
    const updated = [...formValues.items];
    updated[idx][field] = value;

    if (field === 'medicineId') {
      const target = medicines.find(m => m._id === value);
      if (target) {
        updated[idx].medicineName = target.name;
      }
    }

    setFormValues({ ...formValues, items: updated });
  };

  const handleCreatePrescription = async (e) => {
    e.preventDefault();
    if (!formValues.customerId) {
      showToast('Select a customer.', 'warning');
      return;
    }
    if (!formValues.doctorName || !formValues.doctorRegistrationNumber) {
      showToast('Enter physician details.', 'warning');
      return;
    }

    // Row validations
    for (let i = 0; i < formValues.items.length; i++) {
      const it = formValues.items[i];
      if (!it.medicineName) {
        showToast(`Row ${i + 1}: Select or input a medicine name.`, 'warning');
        return;
      }
    }

    setFormLoading(true);
    try {
      const response = await prescriptionService.createPrescription(formValues);
      if (response?.success) {
        showToast('Prescription uploaded successfully in PENDING verification state!', 'success');
        setFormOpen(false);
        setFormValues({
          customerId: '', doctorName: '', doctorRegistrationNumber: '', prescriptionDate: new Date().toISOString().slice(0, 10),
          items: [{ medicineName: '', medicineId: '', dosage: '1-0-1', frequency: 'Daily', duration: '5 days', instructions: 'After meals', quantity: '10' }]
        });
        fetchPrescriptions();
      }
    } catch (err) {
      showToast(err.message || 'Prescription creation failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const statusBadge = (status) => {
    const maps = {
      PENDING: 'bg-slate-100 text-slate-600 border-slate-200',
      VERIFIED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      DISPENSED: 'bg-blue-50 text-blue-700 border-blue-100',
      REJECTED: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return (
      <span className={`inline-flex font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
        maps[status] || maps.PENDING
      }`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Prescription Code',
      accessor: 'prescriptionNumber',
      render: (row) => <span className="font-extrabold text-slate-800 font-mono tracking-tight">{row.prescriptionNumber}</span>
    },
    {
      header: 'Customer Name',
      accessor: 'customer',
      render: (row) => <span className="text-slate-700 font-semibold">{row.customer?.name}</span>
    },
    {
      header: 'Doctor Name',
      accessor: 'doctorName',
      render: (row) => <span className="text-slate-500 font-medium">Dr. {row.doctorName}</span>
    },
    {
      header: 'Date Issued',
      accessor: 'prescriptionDate',
      render: (row) => <span className="text-slate-400 font-medium text-xs">{new Date(row.prescriptionDate).toLocaleDateString()}</span>
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => statusBadge(row.status)
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row._id)}
          className="inline-flex p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
          title="Verify Details"
        >
          <Eye className="h-4.5 w-4.5" />
        </button>
      )
    }
  ];

  const userCanVerify = user && ['ADMIN', 'PHARMACIST'].includes(user.role);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Prescription Records</h1>
          <p className="text-sm text-slate-500">Register physician scripts, check verification credentials, and authorize checkouts.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="prescriptions" 
            onSuccess={fetchPrescriptions} 
          />
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Upload Prescription</span>
          </button>
        </div>
      </div>

      {/* Filter logs */}
      <SearchFilter
        searchPlaceholder="Filter prescriptions by RX serial number..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          {
            value: statusFilter,
            options: [
              { label: 'All Verification Statuses', value: '' },
              { label: 'Pending checks only', value: 'PENDING' },
              { label: 'Verified prescriptions only', value: 'VERIFIED' },
              { label: 'Dispensed prescriptions only', value: 'DISPENSED' },
              { label: 'Rejected prescriptions only', value: 'REJECTED' }
            ],
            onChange: (val) => { setStatusFilter(val); setPage(1); }
          }
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('');
          setPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={prescriptions}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Upload Rx Form Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Upload Doctor Prescription Script" size="lg">
        <form onSubmit={handleCreatePrescription} className="space-y-5">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Customer Profile</label>
              <select
                value={formValues.customerId}
                onChange={(e) => setFormValues({ ...formValues, customerId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              >
                <option value="">Select customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.name} ({c.phone || 'No Phone'})</option>
                ))}
              </select>
            </div>
            
            {/* Prescribing date */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Prescription Date</label>
              <input
                type="date"
                value={formValues.prescriptionDate}
                onChange={(e) => setFormValues({ ...formValues, prescriptionDate: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Doctor Name</label>
              <input
                type="text"
                placeholder="Dr. Emily Smith"
                value={formValues.doctorName}
                onChange={(e) => setFormValues({ ...formValues, doctorName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Doctor Registration License #</label>
              <input
                type="text"
                placeholder="MD-449102"
                value={formValues.doctorRegistrationNumber}
                onChange={(e) => setFormValues({ ...formValues, doctorRegistrationNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Rx Items List */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prescribed Medicines</h4>
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center space-x-1 text-xs font-bold text-primary-600 hover:text-primary-800 hover:bg-primary-50 px-2 py-1 rounded transition"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Add row</span>
              </button>
            </div>

            <div className="space-y-3">
              {formValues.items.map((row, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 p-1"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Medicine */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Catalog Drug</label>
                      <select
                        value={row.medicineId}
                        onChange={(e) => handleRowChange(idx, 'medicineId', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      >
                        <option value="">Select medicine (Optional)</option>
                        {medicines.map(m => (
                          <option key={m._id} value={m._id}>{m.name} ({m.strength})</option>
                        ))}
                      </select>
                    </div>

                    {/* Custom Medicine Name input */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine Name (Free-Text)</label>
                      <input
                        type="text"
                        placeholder="Or input brand name manually"
                        value={row.medicineName}
                        onChange={(e) => handleRowChange(idx, 'medicineName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* Dosage */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Dosage</label>
                      <input
                        type="text"
                        value={row.dosage}
                        onChange={(e) => handleRowChange(idx, 'dosage', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    {/* Frequency */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Frequency</label>
                      <input
                        type="text"
                        value={row.frequency}
                        onChange={(e) => handleRowChange(idx, 'frequency', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    {/* Duration */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Duration</label>
                      <input
                        type="text"
                        value={row.duration}
                        onChange={(e) => handleRowChange(idx, 'duration', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qty Units</label>
                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Special Instructions</label>
                    <input
                      type="text"
                      placeholder="Take post meals, avoid dairy..."
                      value={row.instructions}
                      onChange={(e) => handleRowChange(idx, 'instructions', e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>

                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
          >
            {formLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <span>Submit Prescription</span>
            )}
          </button>

        </form>
      </Modal>

      {/* Prescription detailed verify modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Verify Doctor Prescription Credentials" size="md">
        {detailLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedPO ? (
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Doctor Prescription</span>
                <h3 className="text-base font-bold text-slate-800 font-mono">{detailedPO.prescriptionNumber}</h3>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">
                  Customer: <span className="text-slate-800 font-bold">{detailedPO.customer?.name}</span>
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                {statusBadge(detailedPO.status)}
                <span className="text-[10px] text-slate-400 mt-2 block font-semibold">
                  Date Issued: {new Date(detailedPO.prescriptionDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Doctor coordinates */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Physician Credentials</span>
              <p className="font-bold text-slate-700">Dr. {detailedPO.doctorName}</p>
              <p className="text-slate-500 font-semibold">Registration License: <span className="font-mono text-slate-700">{detailedPO.doctorRegistrationNumber}</span></p>
            </div>

            {/* Prescribed Items */}
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Prescribed Medication Lines</span>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100">
                {detailedItems.map((item, idx) => (
                  <div key={idx} className="p-3 hover:bg-slate-50/50 flex justify-between items-start text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block">{item.medicineName}</span>
                      {item.instructions && <span className="text-[10px] text-slate-400 italic mt-0.5 block">Instructions: "{item.instructions}"</span>}
                    </div>
                    <div className="text-right font-medium text-slate-500">
                      <p>{item.dosage} ({item.frequency})</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">{item.duration} [Qty: {item.quantity}]</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions for PENDING verification */}
            {detailedPO.status === 'PENDING' && userCanVerify && (
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleUpdateStatus(detailedPO._id, 'REJECTED')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 focus:outline-none"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Reject Rx</span>
                </button>
                <button
                  onClick={() => handleUpdateStatus(detailedPO._id, 'VERIFIED')}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Verify & Approve</span>
                    </>
                  )}
                </button>
              </div>
            )}

          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default Prescriptions;
