import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supplierService from '../services/supplierService';
import medicineService from '../services/medicineService';
import purchaseService from '../services/purchaseService';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Trash2, ArrowLeft, Loader2, Save, 
  CheckCircle2 
} from 'lucide-react';

const CreatePurchase = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Load lists
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Header State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Unpaid');
  const [discount, setDiscount] = useState('0');

  // Items State: row list
  const [items, setItems] = useState([
    { medicineId: '', batchNumber: '', expiryDate: '', quantity: '1', purchasePrice: '0', tax: '0', totalCost: 0 }
  ]);

  const loadDependencies = async () => {
    try {
      const supRes = await supplierService.getSuppliers({ status: 'Active' });
      if (supRes?.success) setSuppliers(supRes.data.suppliers);

      const medRes = await medicineService.getMedicines({ limit: 200, status: 'Active' });
      if (medRes?.success) setMedicines(medRes.data.medicines);
    } catch (err) {
      showToast('Failed to load supplier or medicine dependencies', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  // Handle adding new item row
  const handleAddRow = () => {
    setItems([
      ...items,
      { medicineId: '', batchNumber: '', expiryDate: '', quantity: '1', purchasePrice: '0', tax: '0', totalCost: 0 }
    ]);
  };

  // Handle removing row
  const handleRemoveRow = (idx) => {
    if (items.length === 1) {
      showToast('Purchase must contain at least one item row.', 'warning');
      return;
    }
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
  };

  // Handle row changes
  const handleRowChange = (idx, field, value) => {
    const updated = [...items];
    updated[idx][field] = value;

    // Trigger medicine default auto-fills
    if (field === 'medicineId') {
      const targetMed = medicines.find(m => m._id === value);
      if (targetMed) {
        updated[idx].purchasePrice = String(targetMed.purchasePrice || 0);
        updated[idx].tax = String(targetMed.tax || 0);
      }
    }

    // Calculate row totalCost: qty * price + tax
    const qty = Number(updated[idx].quantity || 0);
    const price = Number(updated[idx].purchasePrice || 0);
    const tax = Number(updated[idx].tax || 0);
    updated[idx].totalCost = qty * price + tax;

    setItems(updated);
  };

  // Compute Invoice Aggregates
  const subtotal = items.reduce((acc, row) => {
    const qty = Number(row.quantity || 0);
    const price = Number(row.purchasePrice || 0);
    return acc + (qty * price);
  }, 0);

  const totalTax = items.reduce((acc, row) => {
    return acc + Number(row.tax || 0);
  }, 0);

  const grandTotal = Math.max(0, subtotal + totalTax - Number(discount || 0));

  const handleSaveOrder = async (commitToStock = false) => {
    if (!supplierId) {
      showToast('Please select a supplier.', 'warning');
      return;
    }
    if (!invoiceNumber) {
      showToast('Please enter the supplier invoice number.', 'warning');
      return;
    }

    // Validations
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.medicineId) {
        showToast(`Row ${i + 1}: Select a medicine.`, 'warning');
        return;
      }
      if (!it.batchNumber) {
        showToast(`Row ${i + 1}: Enter a batch number code.`, 'warning');
        return;
      }
      if (!it.expiryDate || new Date(it.expiryDate) <= new Date()) {
        showToast(`Row ${i + 1}: Enter a valid future expiry date.`, 'warning');
        return;
      }
      if (Number(it.quantity) <= 0) {
        showToast(`Row ${i + 1}: Quantity must be greater than 0.`, 'warning');
        return;
      }
      if (Number(it.purchasePrice) < 0) {
        showToast(`Row ${i + 1}: Price cannot be negative.`, 'warning');
        return;
      }
    }

    const payload = {
      invoiceNumber,
      supplierId,
      purchaseDate,
      subtotal,
      tax: totalTax,
      discount: Number(discount || 0),
      grandTotal,
      paymentStatus,
      notes,
      items
    };

    setSubmitLoading(true);
    try {
      // 1. Create drafted order
      const response = await purchaseService.createPurchase(payload);
      
      if (response?.success) {
        const poId = response.data.purchase._id;
        
        // 2. Commit stock directly if checked
        if (commitToStock) {
          const completeRes = await purchaseService.completePurchase(poId);
          if (completeRes?.success) {
            showToast('Purchase completed. Inventory stock successfully loaded!', 'success');
          }
        } else {
          showToast('Purchase drafted successfully.', 'success');
        }
        
        navigate('/purchases');
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit purchase order', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 animate-in fade-in">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/purchases')}
          className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Create Purchase Order</h1>
          <p className="text-sm text-slate-500">Formulate drafted purchase receipts and ingest stocks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left main grid items */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header configuration */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide pb-2 border-b border-slate-100">Order Configurations</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Supplier Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Select Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  required
                >
                  <option value="">Choose Supplier</option>
                  {suppliers.map(s => (
                    <option key={s._id} value={s._id}>{s.companyName || s.name}</option>
                  ))}
                </select>
              </div>

              {/* Invoice Number */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Supplier Invoice #</label>
                <input
                  type="text"
                  placeholder="e.g. INV-99120"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Order Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Purchase Date</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                />
              </div>

              {/* Payment status */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Payment Coordinates</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Internal Notes</label>
                <input
                  type="text"
                  placeholder="Order notes, references..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none"
                />
              </div>
            </div>

          </div>

          {/* Items grid list */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Purchase Line Items</h3>
              <button
                onClick={handleAddRow}
                className="flex items-center space-x-1.5 text-xs font-bold text-primary-600 hover:text-primary-800 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item Row</span>
              </button>
            </div>

            {/* Line items rows */}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-3 items-end relative">
                  
                  {/* Delete button absolute for mobile, inline for desktop */}
                  <button
                    onClick={() => handleRemoveRow(idx)}
                    className="absolute top-3 right-3 p-1.5 text-rose-400 hover:text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100/50 md:static md:mb-1.5 transition"
                    title="Remove item row"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 w-full text-xs">
                    
                    {/* Medicine */}
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Medicine</label>
                      <select
                        value={item.medicineId}
                        onChange={(e) => handleRowChange(idx, 'medicineId', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      >
                        <option value="">Select medicine</option>
                        {medicines.map(m => (
                          <option key={m._id} value={m._id}>{m.name} ({m.strength})</option>
                        ))}
                      </select>
                    </div>

                    {/* Batch Number */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Batch Code</label>
                      <input
                        type="text"
                        placeholder="e.g. B-120"
                        value={item.batchNumber}
                        onChange={(e) => handleRowChange(idx, 'batchNumber', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-1 sm:col-span-2 md:col-span-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</label>
                      <input
                        type="date"
                        value={item.expiryDate}
                        onChange={(e) => handleRowChange(idx, 'expiryDate', e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Qty Units</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={item.quantity}
                        onChange={(e) => handleRowChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 w-full md:w-80 text-xs">
                    {/* Price */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={item.purchasePrice}
                        onChange={(e) => handleRowChange(idx, 'purchasePrice', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Tax */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Tax ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={item.tax}
                        onChange={(e) => handleRowChange(idx, 'tax', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
                      />
                    </div>

                    {/* Row Total */}
                    <div className="space-y-1 text-right">
                      <label className="text-[10px] font-bold text-slate-400 uppercase block pr-1">Total</label>
                      <span className="font-extrabold text-slate-700 leading-9 pr-1 block">
                        ${(item.totalCost || 0).toFixed(2)}
                      </span>
                    </div>

                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Right side summary calculator panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide pb-2 border-b border-slate-100">Invoice Sums</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Subtotal Items</span>
                <span className="text-slate-700 font-bold">${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>GST / VAT Tax</span>
                <span className="text-slate-700 font-bold">+${totalTax.toFixed(2)}</span>
              </div>

              {/* Discount Input */}
              <div className="space-y-1 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Discount Deduction ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-slate-800 font-extrabold text-sm">
                <span>Grand Total</span>
                <span className="text-primary-600 text-lg font-extrabold">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3 pt-3">
              <button
                onClick={() => handleSaveOrder(false)}
                disabled={submitLoading}
                className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 focus:outline-none"
              >
                <Save className="h-4 w-4" />
                <span>Save as Draft</span>
              </button>
              
              <button
                onClick={() => handleSaveOrder(true)}
                disabled={submitLoading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 hover:shadow-emerald-600/20 transition flex items-center justify-center space-x-1.5 focus:outline-none"
              >
                {submitLoading ? (
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete & Restock</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};

export default CreatePurchase;
