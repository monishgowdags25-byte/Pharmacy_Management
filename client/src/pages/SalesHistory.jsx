import React, { useState, useEffect } from 'react';
import saleService from '../services/saleService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, Loader2, DollarSign, Calendar, Printer, 
  Receipt, ShoppingBag 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';

const SalesHistory = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  // Filters State
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Invoice Detail Modal State
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePO, setInvoicePO] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await saleService.getSales({
        search,
        paymentMethod: paymentFilter,
        page,
        limit: 10
      });

      if (response?.success) {
        setSales(response.data.sales);
        setPagination(response.data.pagination);

        // Sum revenue of returned pages
        const sum = response.data.sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        setTotalRevenue(sum);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load sales transactions history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, paymentFilter, page]);

  const handleOpenDetails = async (saleId) => {
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

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      header: 'Invoice Code',
      accessor: 'invoiceNumber',
      render: (row) => <span className="font-extrabold text-slate-800 font-mono tracking-tight">{row.invoiceNumber}</span>
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (row) => <span className="text-slate-500 font-semibold">{row.customer?.name || 'Walk-in Customer'}</span>
    },
    {
      header: 'Date & Time',
      accessor: 'saleDate',
      render: (row) => <span className="text-slate-400 font-medium">{new Date(row.saleDate).toLocaleString()}</span>
    },
    {
      header: 'Grand Total',
      accessor: 'totalAmount',
      render: (row) => <span className="font-extrabold text-slate-700">${row.totalAmount.toFixed(2)}</span>
    },
    {
      header: 'Payment Method',
      accessor: 'paymentMethod',
      render: (row) => (
        <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
          {row.paymentMethod}
        </span>
      )
    },
    {
      header: 'Cashier Rep',
      accessor: 'user',
      render: (row) => <span className="text-slate-500 font-medium">{row.user?.name}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row._id)}
          className="inline-flex p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
          title="Print Invoice"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Sales Registers Ledger</h1>
          <p className="text-sm text-slate-500">Trace cashier retail logs, transaction invoices, and payment stats.</p>
        </div>
      </div>

      {/* Metrics Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total POS Revenue</h4>
            <p className="text-2xl font-extrabold text-slate-800">${totalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100/30">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Sales Records</h4>
            <p className="text-2xl font-extrabold text-blue-500">{pagination?.totalCount || sales.length}</p>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100/30">
            <Receipt className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Deck */}
      <SearchFilter
        searchPlaceholder="Search by invoice number code..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          {
            value: paymentFilter,
            options: [
              { label: 'All Payment Methods', value: '' },
              { label: 'Cash checkout only', value: 'CASH' },
              { label: 'Card checkout only', value: 'CARD' },
              { label: 'UPI checkout only', value: 'UPI' },
              { label: 'Other payment methods', value: 'OTHER' }
            ],
            onChange: (val) => { setPaymentFilter(val); setPage(1); }
          }
        ]}
        onClear={() => {
          setSearch('');
          setPaymentFilter('');
          setPage(1);
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={sales}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Invoice Modal print layout overlay */}
      <Modal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Print Sales Invoice Receipt" size="md">
        {invoiceLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : invoicePO ? (
          <div className="space-y-6 print:p-0 print:m-0 print:border-none print-area">
            
            {/* Pharmacy Receipt Branding */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <h2 className="text-lg font-extrabold text-slate-800 tracking-tight">PHARMACARE REGISTRY</h2>
              <p className="text-[10px] text-slate-400 font-medium">100 Health Avenue, Pharmacy Division</p>
              <p className="text-[10px] text-slate-400 font-medium">Phone: +1 555-0199</p>
            </div>

            {/* Invoice Meta */}
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
              <div className="flex justify-between">
                <span className="text-slate-400 font-semibold">Customer Account:</span>
                <span className="font-bold text-slate-700">{invoicePO.customer?.name || 'Walk-in Customer'}</span>
              </div>
            </div>

            {/* Sale Items Table */}
            <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400 font-bold uppercase text-[9px] pb-1 border-b border-slate-100">
                <span>Description [Batch]</span>
                <div className="flex space-x-8">
                  <span>Qty * Price</span>
                  <span>Total</span>
                </div>
              </div>
              
              {invoiceItems.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start hover:bg-slate-50/50 py-0.5">
                  <div className="max-w-[180px]">
                    <span className="font-bold text-slate-700 block">{item.medicine?.name}</span>
                    <span className="text-[9px] text-slate-400 block font-semibold mt-0.5">Batch: {item.batchNumber}</span>
                  </div>
                  <div className="flex space-x-6 items-center">
                    <span className="text-slate-500">{item.quantity} * ${item.unitPrice.toFixed(2)}</span>
                    <span className="font-bold text-slate-700 text-right w-12">${item.subtotal.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Sum Calculations */}
            <div className="flex justify-end pt-1">
              <div className="w-48 space-y-1.5 text-xs">
                {invoicePO.discountAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Discount</span>
                    <span className="font-bold text-rose-500">-${invoicePO.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoicePO.taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Tax GST/VAT</span>
                    <span className="font-bold">+${invoicePO.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-extrabold text-sm pt-1 border-t border-slate-100">
                  <span>Grand Total</span>
                  <span>${invoicePO.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 border-t border-dashed border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Payment Method: {invoicePO.paymentMethod}</span>
              <p className="text-[10px] text-slate-400 font-semibold italic mt-2">Thank you for choosing PharmaCare!</p>
            </div>

            {/* Print action */}
            <div className="flex items-center space-x-3 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => setInvoiceOpen(false)}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition focus:outline-none"
              >
                Close Register
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center space-x-1.5 focus:outline-none"
              >
                <Printer className="h-4.5 w-4.5" />
                <span>Print Invoice</span>
              </button>
            </div>

          </div>
        ) : null}
      </Modal>

      {/* Embedded Print CSS */}
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

export default SalesHistory;
