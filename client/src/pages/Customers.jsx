import React, { useState, useEffect } from 'react';
import customerService from '../services/customerService';
import saleService from '../services/saleService';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Eye, Loader2, User, Phone, Mail, 
  MapPin, Calendar, Clock, DollarSign, FileText, Printer 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import DemoDataButton from '../components/DemoDataButton';

const Customers = () => {
  const { showToast } = useToast();
  
  // Data lists
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Profile details modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedCustomer, setDetailedCustomer] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '', phone: '', email: '', address: '', dateOfBirth: '', gender: 'Male', notes: ''
  });

  // Invoice detailed print view popup modal
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePO, setInvoicePO] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await customerService.getCustomers({ search, page, limit: 10 });
      if (response?.success) {
        setCustomers(response.data.customers);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      showToast('Failed to load customers catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, page]);

  const handleOpenDetails = async (cId) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await customerService.getCustomerById(cId);
      if (response?.success) {
        setDetailedCustomer(response.data.customer);
        setPurchaseHistory(response.data.purchaseHistory);
      }
    } catch (err) {
      showToast('Failed to fetch customer profile details', 'error');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenInvoice = async (saleId) => {
    setInvoiceLoading(true);
    setInvoiceOpen(true);
    try {
      const response = await saleService.getSaleById(saleId);
      if (response?.success) {
        setInvoicePO(response.data.sale);
        setInvoiceItems(response.data.items);
      }
    } catch (err) {
      showToast('Failed to fetch invoice details', 'error');
      setInvoiceOpen(false);
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!formValues.name) {
      showToast('Customer name is required', 'warning');
      return;
    }

    setFormLoading(true);
    try {
      const response = await customerService.createCustomer(formValues);
      if (response?.success) {
        showToast('Customer profile registered successfully!', 'success');
        setFormOpen(false);
        setFormValues({ name: '', phone: '', email: '', address: '', dateOfBirth: '', gender: 'Male', notes: '' });
        fetchCustomers();
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'name',
      render: (row) => (
        <div className="flex items-center space-x-3">
          <div className="bg-slate-100 p-2 rounded-xl text-slate-500 font-bold shrink-0">
            <User className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="font-extrabold text-slate-800 block leading-none">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Points Balance: {row.points}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Contact coordinates',
      accessor: 'phone',
      render: (row) => (
        <div>
          <span className="text-slate-700 font-semibold block">{row.phone || 'N/A'}</span>
          <span className="text-[10px] text-slate-400 mt-1 block leading-none">{row.email || ''}</span>
        </div>
      )
    },
    {
      header: 'Address',
      accessor: 'address',
      render: (row) => <span className="text-slate-500 font-medium truncate max-w-[200px] block">{row.address || 'N/A'}</span>
    },
    {
      header: 'Registration Date',
      accessor: 'createdAt',
      render: (row) => <span className="text-slate-400 font-medium text-xs">{new Date(row.createdAt).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row._id)}
          className="inline-flex p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
          title="View Details History"
        >
          <Eye className="h-4.5 w-4.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Customer Directory</h1>
          <p className="text-sm text-slate-500">Register new customer profiles, log accounts notes, and check past invoices.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="customers" 
            onSuccess={fetchCustomers} 
          />
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Filter bars */}
      <SearchFilter
        searchPlaceholder="Find customer by name, contact phone, or email..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        onClear={() => {
          setSearch('');
          setPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Register Customer Form Modal */}
      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)} title="Register Customer Profile" size="md">
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Customer Name</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={formValues.name}
              onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Contact Phone</label>
              <input
                type="text"
                placeholder="e.g. +1 555-0100"
                value={formValues.phone}
                onChange={(e) => setFormValues({ ...formValues, phone: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Email Address</label>
              <input
                type="email"
                placeholder="e.g. john@doe.com"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Date of Birth</label>
              <input
                type="date"
                value={formValues.dateOfBirth}
                onChange={(e) => setFormValues({ ...formValues, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Gender</label>
              <select
                value={formValues.gender}
                onChange={(e) => setFormValues({ ...formValues, gender: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Home Address</label>
            <input
              type="text"
              placeholder="e.g. 100 Main St, NY"
              value={formValues.address}
              onChange={(e) => setFormValues({ ...formValues, address: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase">Internal Memos / Notes</label>
            <textarea
              placeholder="Customer allergies, chronic drug records..."
              value={formValues.notes}
              onChange={(e) => setFormValues({ ...formValues, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
              rows="2"
            ></textarea>
          </div>

          <button
            type="submit"
            disabled={formLoading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
          >
            {formLoading ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <span>Register Account</span>
            )}
          </button>
        </form>
      </Modal>

      {/* Customer Profile detailed history drawer/modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Customer Profile File Details" size="lg">
        {detailLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedCustomer ? (
          <div className="space-y-6">
            
            {/* Top Coordinate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs text-slate-600">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Customer Coordinates</h4>
                <p className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-800">{detailedCustomer.name}</span>
                </p>
                {detailedCustomer.phone && (
                  <p className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{detailedCustomer.phone}</span>
                  </p>
                )}
                {detailedCustomer.email && (
                  <p className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{detailedCustomer.email}</span>
                  </p>
                )}
                {detailedCustomer.address && (
                  <p className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{detailedCustomer.address}</span>
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 text-xs text-slate-600">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Demographics & Notes</h4>
                {detailedCustomer.dateOfBirth && (
                  <p className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>DOB: {new Date(detailedCustomer.dateOfBirth).toLocaleDateString()}</span>
                  </p>
                )}
                <p className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>Gender: {detailedCustomer.gender || 'N/A'}</span>
                </p>
                {detailedCustomer.notes && (
                  <div className="pt-1.5 border-t border-slate-200 text-[10px] italic text-slate-400">
                    Memo: "{detailedCustomer.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Purchase history list */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Past Checkouts Ledger</h3>
              
              {purchaseHistory.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">No sales transactions logged for this profile.</p>
                </div>
              ) : (
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                  {purchaseHistory.map(sale => (
                    <div key={sale._id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4 transition">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-slate-800 block">{sale.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400 block">{new Date(sale.saleDate).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-right">
                          <span className="font-extrabold text-slate-700 block">${sale.totalAmount.toFixed(2)}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded uppercase mt-0.5 inline-block">
                            {sale.paymentMethod}
                          </span>
                        </div>
                        <button
                          onClick={() => handleOpenInvoice(sale._id)}
                          className="p-1.5 hover:bg-primary-50 text-slate-400 hover:text-primary-600 rounded-lg transition"
                          title="Print Receipt"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}
      </Modal>

      {/* Inner Invoice detailed print view popup modal */}
      <Modal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Invoice Receipt" size="md">
        {invoiceLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : invoicePO ? (
          <div className="space-y-6 print:p-0 print:m-0 print:border-none print-area">
            
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">PHARMACARE REGISTRY</h2>
              <p className="text-[10px] text-slate-400 font-medium">100 Health Avenue, Pharmacy Division</p>
              <p className="text-[10px] text-slate-400 font-medium">Phone: +1 555-0199</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Invoice Number:</span>
                <span className="font-bold text-slate-700 font-mono">{invoicePO.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Date:</span>
                <span className="font-bold text-slate-700">{new Date(invoicePO.saleDate).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Cashier Rep:</span>
                <span className="font-bold text-slate-700">{invoicePO.user?.name}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2 text-xs">
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start py-0.5">
                  <div>
                    <span className="font-bold text-slate-700 block">{item.medicine?.name}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Batch: {item.batchNumber}</span>
                  </div>
                  <div className="flex space-x-6 items-center">
                    <span className="text-slate-500">{item.quantity} * ${item.unitPrice.toFixed(2)}</span>
                    <span className="font-bold text-slate-700 text-right w-12">${item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <div className="w-48 space-y-1.5 text-xs font-semibold">
                {invoicePO.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount</span>
                    <span className="text-rose-500">-${invoicePO.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoicePO.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax GST/VAT</span>
                    <span>+${invoicePO.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-1 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span>${invoicePO.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="text-center pt-4 border-t border-dashed border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Payment Method: {invoicePO.paymentMethod}</span>
              <p className="text-[10px] text-slate-400 font-semibold italic mt-2">Thank you for choosing PharmaCare!</p>
            </div>

            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setInvoiceOpen(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition focus:outline-none"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
              >
                <Printer className="h-4.5 w-4.5" />
                <span>Print Invoice</span>
              </button>
            </div>

          </div>
        ) : null}
      </Modal>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

    </div>
  );
};

export default Customers;
