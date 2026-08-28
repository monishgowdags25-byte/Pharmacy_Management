import React, { useState, useEffect } from 'react';
import inventoryService from '../services/inventoryService';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { 
  Package, AlertTriangle, AlertCircle, Clock, 
  Settings2, Eye, Loader2, ArrowUpRight, ArrowDownLeft 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import SearchFilter from '../components/SearchFilter';
import Modal from '../components/Modal';
import DemoDataButton from '../components/DemoDataButton';

const Inventory = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  
  // Data State
  const [batches, setBatches] = useState([]);
  const [summaryList, setSummaryList] = useState([]);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Stock History State
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [activeHistoryMed, setActiveHistoryMed] = useState(null);

  // Stock Adjustment State
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustBatch, setAdjustBatch] = useState(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState('INCREASE');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      // 1. Fetch alerts metrics
      const alertsRes = await inventoryService.getAlerts();
      if (alertsRes?.success) {
        setAlerts(alertsRes.data.alerts);
      }

      // 2. Fetch all active stock batches
      const batchesRes = await inventoryService.getBatches();
      if (batchesRes?.success) {
        const fetchedBatches = batchesRes.data.batches;
        setBatches(fetchedBatches);

        // Group batches by medicine to build aggregate stocks inventory
        const grouped = {};
        fetchedBatches.forEach(b => {
          const med = b.medicine;
          if (!med) return;
          const medId = med._id;
          
          if (!grouped[medId]) {
            grouped[medId] = {
              _id: medId,
              name: med.name,
              genericName: med.genericName,
              unit: med.unit || 'Unit',
              reorderLevel: med.reorderLevel || 10,
              totalStock: 0,
              batches: [],
              expiredCount: 0,
              expiringCount: 0
            };
          }
          grouped[medId].totalStock += b.currentQuantity;
          grouped[medId].batches.push(b);
          
          if (b.status === 'EXPIRED') grouped[medId].expiredCount += b.currentQuantity;
          if (b.status === 'EXPIRING_SOON') grouped[medId].expiringCount += b.currentQuantity;
        });

        setSummaryList(Object.values(grouped));
      }
    } catch (err) {
      showToast(err.message || 'Failed to fetch inventory reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData();
  }, []);

  // Filtered Summary List
  const filteredSummary = summaryList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                          item.genericName.toLowerCase().includes(search.toLowerCase());
    
    if (statusFilter === 'LOW_STOCK') {
      return matchesSearch && item.totalStock <= item.reorderLevel;
    }
    if (statusFilter === 'EXPIRED') {
      return matchesSearch && item.expiredCount > 0;
    }
    if (statusFilter === 'EXPIRING') {
      return matchesSearch && item.expiringCount > 0;
    }
    return matchesSearch;
  });

  const handleOpenHistory = async (med) => {
    setHistoryLoading(true);
    setActiveHistoryMed(med);
    setHistoryOpen(true);
    try {
      const response = await inventoryService.getHistory({ medicineId: med._id });
      if (response?.success) {
        setHistoryLogs(response.data.logs);
      }
    } catch (err) {
      showToast('Failed to load stock audit timeline', 'error');
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

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
        fetchInventoryData();
      }
    } catch (err) {
      showToast(err.message || 'Stock adjustment failed', 'error');
    } finally {
      setAdjustLoading(false);
    }
  };

  const columns = [
    {
      header: 'Medicine',
      accessor: 'name',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 leading-none">{row.name}</p>
          <span className="text-[10px] text-slate-400 font-semibold block mt-1 italic">{row.genericName}</span>
        </div>
      )
    },
    {
      header: 'Packaging Unit',
      accessor: 'unit',
      render: (row) => <span className="text-slate-500 font-medium">{row.unit}</span>
    },
    {
      header: 'Stock Levels',
      accessor: 'totalStock',
      render: (row) => {
        const isLow = row.totalStock <= row.reorderLevel;
        const isOut = row.totalStock === 0;
        return (
          <div>
            <span className={`font-bold text-sm ${
              isOut ? 'text-rose-500' : isLow ? 'text-amber-500' : 'text-slate-700'
            }`}>{row.totalStock}</span>
            <span className="text-slate-400 font-medium text-xs ml-1">available</span>
          </div>
        );
      }
    },
    {
      header: 'Alert Tags',
      render: (row) => {
        const isLow = row.totalStock <= row.reorderLevel;
        const isOut = row.totalStock === 0;
        return (
          <div className="flex flex-wrap gap-1.5">
            {isOut ? (
              <span className="bg-rose-50 text-rose-700 border border-rose-100 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Out of Stock</span>
            ) : isLow ? (
              <span className="bg-amber-50 text-amber-700 border border-amber-100 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Low Stock</span>
            ) : (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">Good Stock</span>
            )}
            {row.expiredCount > 0 && (
              <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded text-[9px]">EXPIRED BATCHES</span>
            )}
            {row.expiringCount > 0 && (
              <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[9px]">EXPIRING SOON</span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Batches',
      render: (row) => (
        <div className="max-w-[180px] overflow-y-auto max-h-16 space-y-1 pr-1 scrollbar-thin">
          {row.batches.map((b, idx) => (
            <div key={idx} className="flex justify-between items-center bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-[10px]">
              <span className="font-semibold text-slate-500 truncate mr-2" title={b.batchNumber}>{b.batchNumber}</span>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="font-bold text-slate-700">{b.currentQuantity}</span>
                {['ADMIN', 'INVENTORY_MANAGER'].includes(user?.role) && (
                  <button
                    onClick={() => handleOpenAdjust(b)}
                    className="text-primary-600 hover:text-primary-800 font-bold hover:underline"
                  >
                    Adjust
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenHistory(row)}
          className="inline-flex items-center space-x-1 p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
          title="Stock Audit Logs"
        >
          <Clock className="h-4.5 w-4.5" />
          <span className="text-xs font-bold px-0.5">Logs</span>
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inventory Stock Ledger</h1>
          <p className="text-sm text-slate-500">Trace medicine balances, reorder levels, batches, and timeline logs.</p>
        </div>
        <div className="flex items-center">
          <DemoDataButton 
            type="inventory" 
            onSuccess={fetchInventoryData} 
          />
        </div>
      </div>

      {/* Alert metrics deck */}
      {alerts && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total Items</h4>
              <p className="text-2xl font-extrabold text-slate-800">{summaryList.length}</p>
            </div>
            <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl border border-blue-100/30">
              <Package className="h-6 w-6" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Low Stock Alert</h4>
              <p className="text-2xl font-extrabold text-amber-500">{alerts.lowStockCount}</p>
            </div>
            <div className="bg-amber-50 text-amber-500 p-3 rounded-2xl border border-amber-100/30">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expiring Soon</h4>
              <p className="text-2xl font-extrabold text-orange-500">{alerts.expiringCount}</p>
            </div>
            <div className="bg-orange-50 text-orange-500 p-3 rounded-2xl border border-orange-100/30">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/50 shadow-sm flex items-center justify-between animate-pulse">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide">Expired Stocks</h4>
              <p className="text-2xl font-extrabold text-rose-500">{alerts.expiredCount}</p>
            </div>
            <div className="bg-rose-50 text-rose-500 p-3 rounded-2xl border border-rose-100/30">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* Search Filters */}
      <SearchFilter
        searchPlaceholder="Filter medicines by name, generic name..."
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        filters={[
          {
            value: statusFilter,
            options: [
              { label: 'All Stock Levels', value: '' },
              { label: 'Low Stock only', value: 'LOW_STOCK' },
              { label: 'Expired Batches only', value: 'EXPIRED' },
              { label: 'Expiring Soon only', value: 'EXPIRING' }
            ],
            onChange: (val) => setStatusFilter(val)
          }
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('');
        }}
      />

      {/* DataTable Summary list */}
      <DataTable
        columns={columns}
        data={filteredSummary}
        loading={loading}
      />

      {/* Stock History log overlay Modal */}
      <Modal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} title={`${activeHistoryMed?.name} - Audit Timeline Log`} size="lg">
        {historyLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : historyLogs.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">No stock mutations logged for this item yet.</p>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {historyLogs.map((log) => (
              <div key={log._id} className="p-3.5 border rounded-2xl flex justify-between items-center hover:bg-slate-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      log.type.startsWith('ADJUSTMENT') 
                        ? 'bg-amber-50 text-amber-700 border border-amber-100'
                        : log.type === 'PURCHASE'
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : log.type === 'SALE'
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {log.type === 'ADJUSTMENT_INCREASE' ? (
                        <ArrowUpRight className="h-2.5 w-2.5 mr-0.5 stroke-[3]" />
                      ) : log.type === 'ADJUSTMENT_DECREASE' ? (
                        <ArrowDownLeft className="h-2.5 w-2.5 mr-0.5 stroke-[3]" />
                      ) : null}
                      <span>{log.type.replace('_', ' ')}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Batch: <span className="text-slate-600">{log.batch?.batchNumber || 'N/A'}</span>
                    </span>
                  </div>
                  {log.reason && (
                    <p className="text-xs text-slate-500 font-medium italic">Reason: "{log.reason}"</p>
                  )}
                  <span className="text-[10px] text-slate-400 block">
                    Logged: {new Date(log.createdAt).toLocaleString()} by {log.user?.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[10px] font-semibold block">Mutation Quantity</span>
                  <span className="font-extrabold text-slate-700 text-sm">{log.quantity} {activeHistoryMed?.unit}s</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {log.previousQuantity} → {log.newQuantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

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

export default Inventory;
