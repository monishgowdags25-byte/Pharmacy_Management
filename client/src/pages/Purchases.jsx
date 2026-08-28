import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import purchaseService from '../services/purchaseService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Eye, CheckCircle2, XCircle, FileText, 
  Loader2, ClipboardList, DollarSign, Calendar, Printer 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import DemoDataButton from '../components/DemoDataButton';

const Purchases = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({ totalCost: 0, draftCount: 0, completedCount: 0 });

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Detail Modal State
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedPO, setDetailedPO] = useState(null);
  const [detailedItems, setDetailedItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await purchaseService.getPurchases({
        search,
        status: statusFilter,
        page,
        limit: 10
      });

      if (response?.success) {
        setPurchases(response.data.purchases);
        setPagination(response.data.pagination);

        // Fetch metrics locally from search results for summary deck
        // (For fully completed values we'd aggregate them)
        let total = 0;
        let drafts = 0;
        let completed = 0;
        
        response.data.purchases.forEach(p => {
          if (p.status === 'COMPLETED') {
            total += p.grandTotal;
            completed++;
          } else if (p.status === 'DRAFT') {
            drafts++;
          }
        });

        setMetrics({ totalCost: total, draftCount: drafts, completedCount: completed });
      }
    } catch (err) {
      showToast(err.message || 'Failed to load purchases history', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [search, statusFilter, page]);

  const handleOpenDetails = async (poId) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await purchaseService.getPurchaseById(poId);
      if (response?.success) {
        setDetailedPO(response.data.purchase);
        setDetailedItems(response.data.items);
      }
    } catch (err) {
      showToast('Failed to fetch purchase details invoice', 'error');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCompleteOrder = async (poId) => {
    setActionLoading(true);
    try {
      const response = await purchaseService.completePurchase(poId);
      if (response?.success) {
        showToast('Purchase completed. Active stock has been restocked!', 'success');
        setDetailOpen(false);
        fetchPurchases();
      }
    } catch (err) {
      showToast(err.message || 'Failed to complete order stock ingestion', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (poId) => {
    setActionLoading(true);
    try {
      const response = await purchaseService.cancelPurchase(poId);
      if (response?.success) {
        showToast('Purchase order has been cancelled.', 'success');
        setDetailOpen(false);
        fetchPurchases();
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel order', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status) => {
    const maps = {
      DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
      COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100'
    };
    return (
      <span className={`inline-flex font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${
        maps[status] || maps.DRAFT
      }`}>
        {status}
      </span>
    );
  };

  const columns = [
    {
      header: 'Purchase ID',
      accessor: 'purchaseNumber',
      render: (row) => (
        <div>
          <span className="font-extrabold text-slate-800 font-mono block leading-none">{row.purchaseNumber}</span>
          <span className="text-[10px] text-slate-400 font-semibold mt-1 block">Inv: {row.invoiceNumber}</span>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => <span className="text-slate-700 font-semibold">{row.supplier?.companyName || row.supplier?.name}</span>
    },
    {
      header: 'Order Date',
      accessor: 'purchaseDate',
      render: (row) => <span className="text-slate-500 font-medium">{new Date(row.purchaseDate).toLocaleDateString()}</span>
    },
    {
      header: 'Grand Total',
      accessor: 'grandTotal',
      render: (row) => <span className="font-bold text-slate-700">${row.grandTotal.toFixed(2)}</span>
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
          title="View Invoice"
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
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Procurement Orders</h1>
          <p className="text-sm text-slate-500">Draft supplier purchase agreements, verify invoice receipts, and restock batches.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <DemoDataButton 
            type="purchases" 
            onSuccess={fetchPurchases} 
          />
          <button
            onClick={() => navigate('/purchases/create')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>New Purchase</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Grand Restocks (Completed)</h4>
            <p className="text-2xl font-extrabold text-slate-800">${metrics.totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl border border-emerald-100/30">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Draft Orders</h4>
            <p className="text-2xl font-extrabold text-amber-500">{metrics.draftCount}</p>
          </div>
          <div className="bg-amber-50 text-amber-500 p-3 rounded-2xl border border-amber-100/30">
            <ClipboardList className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Committed Orders</h4>
            <p className="text-2xl font-extrabold text-blue-500">{metrics.completedCount}</p>
          </div>
          <div className="bg-blue-50 text-blue-500 p-3 rounded-2xl border border-blue-100/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Search Filters */}
      <SearchFilter
        searchPlaceholder="Filter by PO code, supplier invoice number..."
        searchValue={search}
        onSearchChange={(val) => { setSearch(val); setPage(1); }}
        filters={[
          {
            value: statusFilter,
            options: [
              { label: 'All Purchase Statuses', value: '' },
              { label: 'Draft Orders only', value: 'DRAFT' },
              { label: 'Committed restocks only', value: 'COMPLETED' },
              { label: 'Cancelled orders only', value: 'CANCELLED' }
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
        data={purchases}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => setPage(p)}
      />

      {/* Details Invoice Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Procurement Purchase Order Invoice" size="lg">
        {detailLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedPO ? (
          <div className="space-y-6">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Purchase Order</span>
                <h3 className="text-lg font-bold text-slate-800 font-mono">{detailedPO.purchaseNumber}</h3>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">
                  Supplier Invoice: <span className="text-slate-800 font-bold">{detailedPO.invoiceNumber}</span>
                </span>
              </div>
              <div className="text-right flex flex-col items-end">
                {statusBadge(detailedPO.status)}
                <span className="text-[10px] text-slate-400 mt-2 block font-semibold">
                  Date: {new Date(detailedPO.purchaseDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Supplier Coordinates</span>
                <p className="font-extrabold text-slate-700">{detailedPO.supplier?.companyName || detailedPO.supplier?.name}</p>
                <p className="text-slate-500">{detailedPO.supplier?.address || 'N/A'}</p>
                <p className="text-slate-500">Phone: {detailedPO.supplier?.phone}</p>
                {detailedPO.supplier?.vatNumber && <p className="text-slate-500">VAT/GST: {detailedPO.supplier?.vatNumber}</p>}
              </div>
              <div className="space-y-1 text-right">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide">Signatures</span>
                <p className="text-slate-500">Created by: <span className="font-semibold text-slate-700">{detailedPO.createdBy?.name}</span></p>
                <p className="text-slate-500">Payment: <span className={`font-semibold ${
                  detailedPO.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-rose-500'
                }`}>{detailedPO.paymentStatus}</span></p>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-3">Medicine Description</th>
                    <th className="p-3">Batch Number</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Price</th>
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {detailedItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 align-top">
                        <span className="font-bold text-slate-700 block">{item.medicine?.name}</span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block italic">{item.medicine?.genericName}</span>
                      </td>
                      <td className="p-3 align-top font-mono font-bold text-slate-500">{item.batchNumber}</td>
                      <td className="p-3 align-top font-semibold">{item.quantity} {item.medicine?.unit || 'Units'}</td>
                      <td className="p-3 align-top font-semibold">${item.purchasePrice.toFixed(2)}</td>
                      <td className="p-3 align-top text-right font-bold text-slate-700">${item.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations summaries */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal</span>
                  <span>${detailedPO.subtotal.toFixed(2)}</span>
                </div>
                {detailedPO.tax > 0 && (
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>VAT/GST Tax</span>
                    <span>+${detailedPO.tax.toFixed(2)}</span>
                  </div>
                )}
                {detailedPO.discount > 0 && (
                  <div className="flex justify-between text-slate-500 font-semibold">
                    <span>Discount Deduction</span>
                    <span className="text-rose-500">-${detailedPO.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-100 text-slate-800 font-extrabold text-sm">
                  <span>Grand Total</span>
                  <span>${detailedPO.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Order Note */}
            {detailedPO.notes && (
              <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 italic border border-slate-100">
                Notes: "{detailedPO.notes}"
              </div>
            )}

            {/* Actions for draft orders */}
            {detailedPO.status === 'DRAFT' && (
              <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => handleCancelOrder(detailedPO._id)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Cancel Order</span>
                </button>
                <button
                  onClick={() => handleCompleteOrder(detailedPO._id)}
                  disabled={actionLoading}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Complete & Restock</span>
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

export default Purchases;
