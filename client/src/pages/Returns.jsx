import React, { useState, useEffect } from 'react';
import returnService from '../services/returnService';
import saleService from '../services/saleService';
import { useToast } from '../context/ToastContext';
import { 
  Search, Eye, Loader2, ArrowLeft, ArrowRight, RotateCcw, 
  Trash2, DollarSign, Calendar, FileText, CheckCircle2, AlertCircle 
} from 'lucide-react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const Returns = () => {
  const { showToast } = useToast();

  // Search & Checkout State
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [activeSale, setActiveSale] = useState(null);
  const [saleItems, setSaleItems] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Return Form State
  const [returnItems, setReturnItems] = useState({}); // { itemId: qtyToReturn }
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Registry List State
  const [returnsList, setReturnsList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  // Return slip detailed modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailedSlip, setDetailedSlip] = useState(null);
  const [detailedItems, setDetailedItems] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReturnsList = async () => {
    setListLoading(true);
    try {
      const response = await returnService.getReturns({ page, limit: 10 });
      if (response?.success) {
        setReturnsList(response.data.returns);
        setPagination(response.data.pagination);
      }
    } catch (err) {
      showToast('Failed to load return slips directory', 'error');
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnsList();
  }, [page]);

  const handleInvoiceSearch = async (e) => {
    e.preventDefault();
    if (!invoiceSearch) return;

    setSearchLoading(true);
    setActiveSale(null);
    setSaleItems([]);
    setReturnItems({});
    try {
      // Find sale by invoiceNumber
      const salesRes = await saleService.getSales({ search: invoiceSearch });
      if (salesRes?.success && salesRes.data.sales.length > 0) {
        const saleId = salesRes.data.sales[0]._id;
        const detailsRes = await saleService.getSaleById(saleId);
        if (detailsRes?.success) {
          setActiveSale(detailsRes.data.sale);
          setSaleItems(detailsRes.data.items);
          
          // Pre-populate return quantities map to 0
          const itemsMap = {};
          detailsRes.data.items.forEach(it => {
            itemsMap[it._id] = 0;
          });
          setReturnItems(itemsMap);
        }
      } else {
        showToast('Invoice code not found', 'warning');
      }
    } catch (err) {
      showToast('Failed to search invoice details', 'error');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleQtyChange = (itemId, val, maxVal) => {
    const qty = parseInt(val, 10) || 0;
    if (qty < 0) return;
    if (qty > maxVal) {
      showToast(`Cannot return more than originally sold (${maxVal} units).`, 'warning');
      setReturnItems({ ...returnItems, [itemId]: maxVal });
      return;
    }
    setReturnItems({ ...returnItems, [itemId]: qty });
  };

  // Calculate refund grandTotal based on returnItems quantities
  const refundAmount = saleItems.reduce((acc, curr) => {
    const qty = returnItems[curr._id] || 0;
    return acc + (qty * curr.unitPrice);
  }, 0);

  const handleProcessReturn = async () => {
    // Map items to payload format
    const returningItemsList = [];
    
    saleItems.forEach(item => {
      const qty = returnItems[item._id] || 0;
      if (qty > 0) {
        returningItemsList.push({
          medicineId: item.medicine?._id,
          batchNumber: item.batchNumber,
          quantity: qty,
          unitPrice: item.unitPrice
        });
      }
    });

    if (returningItemsList.length === 0) {
      showToast('Return quantities must be greater than zero for at least one item.', 'warning');
      return;
    }

    if (!reason) {
      showToast('Please enter a reason for returning.', 'warning');
      return;
    }

    const payload = {
      saleId: activeSale._id,
      reason,
      refundMethod,
      refundAmount,
      items: returningItemsList
    };

    setSubmitLoading(true);
    try {
      const response = await returnService.createReturn(payload);
      if (response?.success) {
        showToast('Return processed and stocks restocked if eligible!', 'success');
        
        // Reset Search Workspace
        setActiveSale(null);
        setSaleItems([]);
        setReturnItems({});
        setReason('');
        setInvoiceSearch('');
        
        // Reload registry list
        fetchReturnsList();
      }
    } catch (err) {
      showToast(err.message || 'Returns checkout failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenDetails = async (retId) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const response = await returnService.getReturnById(retId);
      if (response?.success) {
        setDetailedSlip(response.data.return);
        setDetailedItems(response.data.items);
      }
    } catch (err) {
      showToast('Failed to fetch return slip details', 'error');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      header: 'Return slip #',
      accessor: 'returnNumber',
      render: (row) => <span className="font-extrabold text-slate-800 font-mono tracking-tight">{row.returnNumber}</span>
    },
    {
      header: 'Invoice Code',
      accessor: 'sale',
      render: (row) => <span className="font-bold text-slate-500 font-mono text-xs">{row.sale?.invoiceNumber}</span>
    },
    {
      header: 'Refund Amount',
      accessor: 'refundAmount',
      render: (row) => <span className="font-extrabold text-slate-700">${row.refundAmount.toFixed(2)}</span>
    },
    {
      header: 'Refund Method',
      accessor: 'refundMethod',
      render: (row) => <span className="bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">{row.refundMethod}</span>
    },
    {
      header: 'Processing Date',
      accessor: 'returnDate',
      render: (row) => <span className="text-slate-400 font-medium text-xs">{new Date(row.returnDate).toLocaleDateString()}</span>
    },
    {
      header: 'Actions',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={() => handleOpenDetails(row._id)}
          className="inline-flex p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition"
          title="View Slip"
        >
          <Eye className="h-4.5 w-4.5" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Returns & Refunds Register</h1>
        <p className="text-sm text-slate-500">Process invoice returns, credit customer refund vouchers, and restock batches.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Invoice search & Return inputs */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Invoice search lookup panel */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Invoice Search Lookup</h3>
            
            <form onSubmit={handleInvoiceSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter invoice number code e.g. INV-20260827-882"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:bg-white text-xs pl-11 pr-4 py-3 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
              </div>
              <button
                type="submit"
                disabled={searchLoading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition flex items-center space-x-1.5 focus:outline-none"
              >
                {searchLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <span>Search Invoice</span>
                )}
              </button>
            </form>
          </div>

          {/* Return items form panel */}
          {activeSale && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm space-y-5 animate-in fade-in duration-300">
              
              <div className="flex justify-between items-start pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block tracking-wider">Sale Invoice Details</span>
                  <h4 className="text-sm font-bold text-slate-800 font-mono mt-0.5">{activeSale.invoiceNumber}</h4>
                  <span className="text-[10px] text-slate-400 mt-1 block font-semibold">
                    Customer: {activeSale.customer?.name || 'Walk-in Customer'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-400 block uppercase">Originally Sold Date</span>
                  <span className="text-xs text-slate-500 font-semibold mt-1 block">
                    {new Date(activeSale.saleDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-100 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-3">Product [Batch]</th>
                      <th className="p-3">Sold Qty</th>
                      <th className="p-3">Unit Cost</th>
                      <th className="p-3 text-right">Return Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {saleItems.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50">
                        <td className="p-3 align-top">
                          <span className="font-bold text-slate-700 block">{item.medicine?.name}</span>
                          <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Batch: {item.batchNumber}</span>
                        </td>
                        <td className="p-3 align-top font-semibold">{item.quantity} {item.medicine?.unit || 'Units'}</td>
                        <td className="p-3 align-top font-semibold">${item.unitPrice.toFixed(2)}</td>
                        <td className="p-3 align-top text-right">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={returnItems[item._id] || 0}
                            onChange={(e) => handleQtyChange(item._id, e.target.value, item.quantity)}
                            className="w-16 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:outline-none focus:bg-white focus:border-primary-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Refund Method & Reason */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Refund Method</label>
                  <select
                    value={refundMethod}
                    onChange={(e) => setRefundMethod(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                  >
                    <option value="CASH">CASH</option>
                    <option value="CARD">CARD</option>
                    <option value="UPI">UPI</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Reason for return</label>
                  <input
                    type="text"
                    placeholder="e.g. Expired batch, packaging damage..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Right Side: Return Calculator summary */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide pb-2 border-b border-slate-100">Return Refund Slip</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Original Invoice Cost</span>
                <span className="text-slate-700 font-bold">
                  {activeSale ? `$${activeSale.totalAmount.toFixed(2)}` : '$0.00'}
                </span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-slate-800 font-extrabold text-sm">
                <span>Refund Amount Due</span>
                <span className="text-rose-500 text-lg font-extrabold">${refundAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Ingest process slip button */}
            <button
              onClick={handleProcessReturn}
              disabled={submitLoading || !activeSale || refundAmount === 0}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/10 hover:shadow-rose-600/20 transition flex items-center justify-center space-x-1.5 focus:outline-none disabled:opacity-50"
            >
              {submitLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  <RotateCcw className="h-4 w-4" />
                  <span>Process Return Slip</span>
                </>
              )}
            </button>

          </div>
        </div>

      </div>

      {/* Returns log registry lists */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide pb-2 border-b border-slate-100">Return Invoices Registry</h3>
        <DataTable
          columns={columns}
          data={returnsList}
          loading={listLoading}
          pagination={pagination}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* Return Slip details modal popup */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Returned Items Voucher" size="md">
        {detailLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
          </div>
        ) : detailedSlip ? (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Return Slip</span>
                <h3 className="text-base font-bold text-slate-800 font-mono">{detailedSlip.returnNumber}</h3>
                <span className="text-xs text-slate-500 font-semibold mt-1 block">
                  Original Invoice: <span className="font-mono text-slate-800 font-bold">{detailedSlip.sale?.invoiceNumber}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-100 bg-rose-500 font-bold px-2 py-0.5 rounded text-[8px] uppercase tracking-wider">COMPLETED</span>
                <span className="text-[10px] text-slate-400 mt-2 block font-semibold">
                  Date: {new Date(detailedSlip.returnDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Meta coordinates */}
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Customer</span>
                <p className="font-bold text-slate-700">{detailedSlip.customer?.name || 'Walk-in Customer'}</p>
                {detailedSlip.customer?.phone && <p>{detailedSlip.customer.phone}</p>}
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wide block">Processed by</span>
                <p className="font-bold text-slate-700">{detailedSlip.createdBy?.name}</p>
                <p className="text-rose-500 font-bold">Refund Method: {detailedSlip.refundMethod}</p>
              </div>
            </div>

            {/* Returned Items */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {detailedItems.map((item, idx) => (
                <div key={idx} className="p-3 hover:bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-700 block">{item.medicine?.name}</span>
                    <span className="text-[10px] text-slate-400 block font-semibold mt-0.5">Batch: {item.batchNumber}</span>
                  </div>
                  <div className="text-right font-medium">
                    <p className="text-slate-800 font-bold">{item.quantity} returned</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">at ${item.unitPrice.toFixed(2)}/unit</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Voucher Note */}
            <div className="p-3 bg-slate-50 rounded-2xl text-[11px] text-slate-500 italic border border-slate-100">
              Reason: "{detailedSlip.reason}"
            </div>

            {/* Total refund */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-slate-800 font-extrabold text-sm">
              <span>Total Refund Vouchered</span>
              <span className="text-rose-600 text-base font-extrabold">${detailedSlip.refundAmount.toFixed(2)}</span>
            </div>

          </div>
        ) : null}
      </Modal>

    </div>
  );
};

export default Returns;
