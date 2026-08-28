import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Loader2, ArrowUpRight, ArrowDownLeft, Calendar, 
  User, PlusCircle, AlertCircle 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';

const Batches = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('expiryDate');

  // Stock Adjustment State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('INCREASE');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const response = await inventoryService.getBatches({
        search,
        status: statusFilter
      });
      if (response?.success) {
        setBatches(response.data.batches);
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch inventory batches', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [search, statusFilter]);

  const handleOpenAdjust = (batchItem) => {
    setAdjustBatch(batchItem);
    setAdjustQty('');
    setAdjustType('INCREASE');
    setAdjustReason('');
    setAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();

    if (!adjustQty || adjustQty <= 0) {
      showToast('Please specify a positive adjustment quantity', 'warning');
      return;
    }

    if (!adjustReason) {
      showToast('Please provide a reason for the adjustment', 'warning');
      return;
    }

    setAdjustLoading(true);
    try {
      const response = await inventoryService.adjustStock({
        batchId: adjustBatch._id,
        quantity: Number(adjustQty),
        type: adjustType,
        reason: adjustReason
      });

      if (response?.success) {
        showToast('Stock adjusted successfully!', 'success');
        setAdjustOpen(false);
        fetchBatches();
      }
    } catch (err) {
      showToast(err.message || 'Stock adjustment failed', 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const statusBadge = (status) => {
    const maps = {
      EXPIRED: 'bg-rose-50 text-rose-700 border-rose-100',
      EXPIRING_SOON: 'bg-amber-50 text-amber-700 border-amber-100',
      LOW_STOCK: 'bg-orange-50 text-orange-700 border-orange-100',
      OUT_OF_STOCK: 'bg-slate-100 text-slate-500 border-slate-200',
      IN_STOCK: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
    return (
      <span className={`inline-flex items-center font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        maps[status] || maps.IN_STOCK
      }`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const columns = [
    {
      header: 'Batch Number',
      accessor: 'batchNumber',
      render: (row) => <span className="font-extrabold text-slate-800 font-mono tracking-tight">{row.batchNumber}</span>
    },
    {
      header: 'Medicine',
      accessor: 'medicine',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-700 leading-none">{row.medicine?.name || 'Unassigned'}</p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1 italic">{row.medicine?.genericName}</span>
        </div>
      )
    },
    {
      header: 'Supplier',
      accessor: 'supplier',
      render: (row) => (
        <span className="text-slate-500 font-medium">{row.supplier?.companyName || row.supplier?.name || 'Local'}</span>
      )
    },
    {
      header: 'MFG / Expiry Dates',
      render: (row) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-400 font-medium">
            <Calendar className="h-3 w-3 shrink-0" />
            <span>Mfg: {new Date(row.manufacturingDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-500 font-semibold">
            <Calendar className="h-3 w-3 shrink-0 text-amber-500" />
            <span>Exp: {new Date(row.expiryDate).toLocaleDateString()}</span>
          </div>
        </div>
      )
    },
    {
      header: 'Quantity',
      accessor: 'currentQuantity',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-700">{row.currentQuantity}</span>
          <span className="text-slate-400 font-medium text-xs ml-1">/ {row.quantityPurchased} units</span>
        </div>
      )
    },
    {
      header: 'Expiry Status',
      accessor: 'status',
      render: (row) => statusBadge(row.status)
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        ['ADMIN', 'INVENTORY_MANAGER'].includes(user?.role) && (
          <button
            onClick={() => handleOpenAdjust(row)}
            className="inline-flex items-center space-x-1 p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 rounded-xl transition font-bold text-xs"
            title="Adjust Stock"
          >
            <Settings2 className="h-4 w-4" />
            <span>Adjust</span>
          </button>
        )
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Active Batches Catalog</h1>
        <p className="text-sm text-slate-500">List specific inventory batches, manufacturing codes, and expiry logs.</p>
      </div>

      {/* Filter bar */}
      <SearchFilter
        searchPlaceholder="Filter by batch code, medicine..."
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        filters={[
          {
            value: statusFilter,
            options: [
              { label: 'All Batch Statuses', value: '' },
              { label: 'In Stock', value: 'IN_STOCK' },
              { label: 'Low Stock only', value: 'LOW_STOCK' },
              { label: 'Out of Stock', value: 'OUT_OF_STOCK' },
              { label: 'Expiring Soon only', value: 'EXPIRING_SOON' },
              { label: 'Expired only', value: 'EXPIRED' }
            ],
            onChange: (val) => setStatusFilter(val)
          }
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={batches}
        loading={loading}
      />

      {/* Manual Stock Adjustment Modal */}
      <Modal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} title="Batch Manual Stock Adjustment" size="md">
        {adjustBatch && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wide">Adjust Target</span>
              <h4 className="font-bold text-slate-800 leading-snug">{adjustBatch.medicine?.name}</h4>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Batch Code: <span className="text-slate-800 font-bold">{adjustBatch.batchNumber}</span> | Stock: <span className="text-primary-600 font-bold">{adjustBatch.currentQuantity}</span>
              </p>
            </div>

            {/* Direction toggle */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAdjustType('INCREASE')}
                className={`py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border focus:outline-none ${
                  adjustType === 'INCREASE'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-100'
                    : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <ArrowUpRight className="h-4 w-4 stroke-[3]" />
                <span>Increase Stock</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('DECREASE')}
                className={`py-3 rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border focus:outline-none ${
                  adjustType === 'DECREASE'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-100'
                    : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4 stroke-[3]" />
                <span>Decrease Stock</span>
              </button>
            </div>

            {/* Quantity */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Adjustment Count</label>
              <input
                type="number"
                placeholder="Enter adjustment units count..."
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Justification / Reason</label>
              <textarea
                placeholder="Explain the stock adjustment context..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={adjustLoading}
              className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md transition"
            >
              {adjustLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span>Confirm Stock Adjustment</span>
              )}
            </button>
          </form>
        )}
      </Modal>

    </div>
  );
};

export default Batches;
const Settings2 = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
