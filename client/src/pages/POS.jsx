import React, { useState, useEffect } from 'react';
import medicineService from '../services/medicineService';
import inventoryService from '../services/inventoryService';
import saleService from '../services/saleService';
import customerService from '../services/customerService';
import prescriptionService from '../services/prescriptionService';
import { useToast } from '../context/ToastContext';
import { 
  ShoppingCart, Search, Trash2, CreditCard, 
  Loader2, Printer, Plus, Minus, AlertCircle 
} from 'lucide-react';
import Modal from '../components/Modal';

const POS = () => {
  const { showToast } = useToast();

  // Catalog State
  const [medicines, setMedicines] = useState([]);
  const [medicineStock, setMedicineStock] = useState({}); // { medId: totalStock }
  const [loading, setLoading] = useState(true);

  // Customer & Prescription dependency states
  const [customers, setCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [verifiedPrescriptions, setVerifiedPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');

  // Search & Cart State
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [cart, setCart] = useState([]);

  // Checkout State
  const [discountInput, setDiscountInput] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Invoice Modal State
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePO, setInvoicePO] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  const loadCatalogData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active medicines catalog
      const medRes = await medicineService.getMedicines({ limit: 300, status: 'Active' });
      if (medRes?.success) {
        setMedicines(medRes.data.medicines);
      }

      // 2. Fetch inventory batches to compute available stock levels
      const batchRes = await inventoryService.getBatches();
      if (batchRes?.success) {
        const stockMap = {};
        batchRes.data.batches.forEach(b => {
          if (b.status === 'EXPIRED') return; // FEFO rule: do not count expired batch stock
          const medId = b.medicine?._id;
          if (medId) {
            stockMap[medId] = (stockMap[medId] || 0) + b.currentQuantity;
          }
        });
        setMedicineStock(stockMap);
      }

      // 3. Fetch customer list
      const custRes = await customerService.getCustomers({ limit: 200 });
      if (custRes?.success) {
        setCustomers(custRes.data.customers);
      }
    } catch (err) {
      showToast('Failed to load medicine stock registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogData();
  }, []);

  // Fetch verified prescriptions when selected customer changes
  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!selectedCustomerId) {
        setVerifiedPrescriptions([]);
        setSelectedPrescriptionId('');
        return;
      }
      try {
        const response = await prescriptionService.getPrescriptions({
          status: 'VERIFIED'
        });
        if (response?.success) {
          // Filter locally by customer to be robust
          const rxList = response.data.prescriptions.filter(r => 
            r.customer?._id === selectedCustomerId
          );
          setVerifiedPrescriptions(rxList);
        }
      } catch (err) {
        showToast('Failed to load verified prescriptions for customer', 'error');
      }
    };
    fetchPrescriptions();
  }, [selectedCustomerId]);

  // Filter medicines on search query change
  useEffect(() => {
    if (!searchQuery) {
      setFilteredMedicines([]);
      return;
    }
    const lower = searchQuery.toLowerCase();
    const matches = medicines.filter(m => 
      m.name.toLowerCase().includes(lower) || 
      m.genericName.toLowerCase().includes(lower) ||
      (m.barcode && m.barcode.toLowerCase().includes(lower))
    );
    setFilteredMedicines(matches.slice(0, 5)); // Limit to top 5 results
  }, [searchQuery, medicines]);

  const handleAddToCart = (medicine) => {
    const stock = medicineStock[medicine._id] || 0;
    if (stock <= 0) {
      showToast(`Medicine "${medicine.name}" is OUT OF STOCK.`, 'warning');
      return;
    }

    const existingIdx = cart.findIndex(item => item._id === medicine._id);
    if (existingIdx !== -1) {
      const currentQty = cart[existingIdx].quantity;
      if (currentQty >= stock) {
        showToast(`Cannot add more. Only ${stock} units are available in active batches.`, 'warning');
        return;
      }
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updated[existingIdx].total = updated[existingIdx].quantity * updated[existingIdx].unitPrice;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          _id: medicine._id,
          name: medicine.name,
          genericName: medicine.genericName,
          unit: medicine.unit || 'Unit',
          unitPrice: medicine.sellingPrice,
          taxRate: medicine.tax || 0,
          prescriptionRequired: medicine.prescriptionRequired || false,
          quantity: 1,
          total: medicine.sellingPrice
        }
      ]);
    }
    setSearchQuery('');
    setFilteredMedicines([]);
  };

  const handleQtyChange = (idx, amount) => {
    const updated = [...cart];
    const item = updated[idx];
    const stock = medicineStock[item._id] || 0;
    const newQty = item.quantity + amount;

    if (newQty <= 0) {
      handleRemoveItem(idx);
      return;
    }

    if (newQty > stock) {
      showToast(`Only ${stock} units are available in active stock.`, 'warning');
      return;
    }

    item.quantity = newQty;
    item.total = newQty * item.unitPrice;
    setCart(updated);
  };

  const handleDirectQtyChange = (idx, value) => {
    const updated = [...cart];
    const item = updated[idx];
    const stock = medicineStock[item._id] || 0;
    const newQty = parseInt(value, 10);

    if (isNaN(newQty) || newQty <= 0) {
      return;
    }

    if (newQty > stock) {
      showToast(`Only ${stock} units are available in active stock.`, 'warning');
      item.quantity = stock;
    } else {
      item.quantity = newQty;
    }
    item.total = item.quantity * item.unitPrice;
    setCart(updated);
  };

  const handleRemoveItem = (idx) => {
    setCart(cart.filter((_, i) => i !== idx));
  };

  // Calculations
  const subtotal = cart.reduce((acc, curr) => acc + curr.total, 0);
  const taxAmount = cart.reduce((acc, curr) => acc + (curr.total * (curr.taxRate / 100)), 0);
  const discountAmount = Number(discountInput || 0);
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount);

  // Check if any cart item requires prescription
  const cartRequiresPrescription = cart.some(item => item.prescriptionRequired);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      showToast('POS Cart is empty.', 'warning');
      return;
    }

    if (cartRequiresPrescription && !selectedCustomerId) {
      showToast('Prescription-required drugs cannot be sold to walk-in customers without profiles. Select customer first.', 'warning');
      return;
    }

    if (cartRequiresPrescription && !selectedPrescriptionId) {
      showToast('Please select a verified doctor prescription to dispense restricted medicines.', 'warning');
      return;
    }

    const payload = {
      customerId: selectedCustomerId || null,
      discountAmount,
      taxAmount,
      paymentMethod,
      prescriptionId: selectedPrescriptionId || null,
      items: cart.map(item => ({
        medicineId: item._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxAmount: item.total * (item.taxRate / 100)
      }))
    };

    setCheckoutLoading(true);
    try {
      const response = await saleService.createSale(payload);
      if (response?.success) {
        showToast('POS Sale completed successfully!', 'success');
        
        // Load details for print invoice overlay
        setInvoiceLoading(true);
        setInvoiceOpen(true);
        const saleId = response.data.sale._id;
        
        const detailRes = await saleService.getSaleById(saleId);
        if (detailRes?.success) {
          setInvoicePO(detailRes.data.sale);
          setInvoiceItems(detailRes.data.items);
        }
        
        // Reset POS Desk
        setCart([]);
        setDiscountInput('0');
        setPaymentMethod('CASH');
        setSelectedCustomerId('');
        setSelectedPrescriptionId('');
        loadCatalogData(); // Reload stock
      }
    } catch (err) {
      showToast(err.message || 'Checkout failed', 'error');
    } finally {
      setCheckoutLoading(false);
      setInvoiceLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
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
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Retail POS Billing Register</h1>
        <p className="text-sm text-slate-500">Search medicines catalog, verify stock expiry, and execute instant checkouts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Cart & Search */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Autocomplete Selector */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm relative">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Medicine Search Lookup</h3>
            
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by brand name, generic formula, barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:bg-white text-xs pl-11 pr-4 py-3 rounded-xl transition focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            {/* Results dropdown */}
            {filteredMedicines.length > 0 && (
              <div className="absolute left-5 right-5 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-slate-100 animate-in slide-in-from-top-3 duration-200">
                {filteredMedicines.map(med => {
                  const stock = medicineStock[med._id] || 0;
                  return (
                    <button
                      key={med._id}
                      onClick={() => handleAddToCart(med)}
                      className="w-full text-left p-3.5 hover:bg-slate-50 flex justify-between items-center transition"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">
                          {med.name} ({med.strength})
                          {med.prescriptionRequired && (
                            <span className="ml-2 inline-flex bg-rose-50 text-rose-700 text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded border border-rose-100/50">Rx Required</span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-0.5 block italic">{med.genericName}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-slate-700 block">${med.sellingPrice.toFixed(2)}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          stock === 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-primary-50 text-primary-700 border border-primary-100/30'
                        }`}>
                          {stock} available
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Grid */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm space-y-4 min-h-[400px] flex flex-col justify-between">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Register Cart</h3>
              <span className="bg-primary-50 text-primary-700 border border-primary-100/30 text-xs font-bold px-3 py-1 rounded-xl">
                {cart.length} {cart.length === 1 ? 'Product' : 'Products'}
              </span>
            </div>

            {/* Cart Items list */}
            {cart.length === 0 ? (
              <div className="text-center py-20 flex-1 flex flex-col justify-center items-center">
                <ShoppingCart className="h-12 w-12 text-slate-200 mb-3" />
                <p className="text-slate-400 text-sm font-medium">Cart is empty. Search products above to add.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-1">
                {cart.map((item, idx) => (
                  <div key={item._id} className={`p-3 rounded-2xl border flex items-center justify-between gap-4 transition ${
                    item.prescriptionRequired ? 'bg-rose-50/20 border-rose-100' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="space-y-0.5 max-w-[200px]">
                      <p className="text-xs font-bold text-slate-800 leading-tight">
                        {item.name}
                        {item.prescriptionRequired && (
                          <span className="ml-1 text-[8px] font-extrabold uppercase text-rose-500">Rx</span>
                        )}
                      </p>
                      <span className="text-[9px] text-slate-400 block italic leading-none">{item.genericName}</span>
                    </div>

                    {/* Qty increment controls */}
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleQtyChange(idx, -1)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => handleDirectQtyChange(idx, e.target.value)}
                        className="w-12 text-center bg-white border border-slate-200 rounded-lg py-0.5 text-xs font-bold text-slate-700 focus:outline-none"
                      />
                      <button
                        onClick={() => handleQtyChange(idx, 1)}
                        className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 transition"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Pricing */}
                    <div className="text-right w-24">
                      <span className="text-[10px] text-slate-400 block">Unit: ${item.unitPrice.toFixed(2)}</span>
                      <span className="font-extrabold text-slate-800 text-sm">${item.total.toFixed(2)}</span>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>

        {/* Right Side: Checkout sums panel */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide pb-2 border-b border-slate-100">Checkout Summary</h3>
            
            <div className="space-y-4 text-xs">
              
              {/* Customer Selection dropdown */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Select Customer</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                >
                  <option value="">Walk-in Customer (No profile)</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.phone || 'No phone'})</option>
                  ))}
                </select>
              </div>

              {/* Prescription alert & dropdown selection */}
              {cartRequiresPrescription && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-2xl space-y-2.5 animate-in fade-in duration-300">
                  <div className="flex items-start space-x-2 text-rose-700">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold leading-normal">
                      RESTRICTED MEDICINES IN CART REQUIRE A VERIFIED DOCTOR PRESCRIPTION.
                    </p>
                  </div>
                  
                  {selectedCustomerId ? (
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-rose-600 uppercase">Select Verified Rx</label>
                      <select
                        value={selectedPrescriptionId}
                        onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-200 rounded-lg text-[11px] text-slate-700 focus:outline-none"
                      >
                        <option value="">Choose doctor prescription</option>
                        {verifiedPrescriptions.map(rx => (
                          <option key={rx._id} value={rx._id}>
                            {rx.prescriptionNumber} (Dr. {rx.doctorName})
                          </option>
                        ))}
                      </select>
                      {verifiedPrescriptions.length === 0 && (
                        <p className="text-[9px] text-rose-500/80 italic mt-1 font-semibold">
                          No verified prescriptions found for this customer profile.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[9px] text-rose-500 font-semibold italic">
                      Please select a customer profile first to view their verified prescriptions.
                    </p>
                  )}
                </div>
              )}

              {/* Subtotal */}
              <div className="flex justify-between text-slate-500 font-semibold pt-2">
                <span>Items Subtotal</span>
                <span className="text-slate-800 font-bold">${subtotal.toFixed(2)}</span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-slate-500 font-semibold">
                <span>Estimated Tax GST/VAT</span>
                <span className="text-slate-800 font-bold">+${taxAmount.toFixed(2)}</span>
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
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method selectors */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {['CASH', 'CARD', 'UPI', 'OTHER'].map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 rounded-xl text-[10px] font-bold border transition ${
                        paymentMethod === m
                          ? 'bg-primary-50 text-primary-700 border-primary-200 ring-2 ring-primary-100'
                          : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100 text-slate-800 font-extrabold text-sm">
                <span>Grand Total</span>
                <span className="text-primary-600 text-lg font-extrabold">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Complete Sale button */}
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading || cart.length === 0 || (cartRequiresPrescription && !selectedPrescriptionId)}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-600/10 hover:shadow-primary-600/20 transition flex items-center justify-center space-x-1.5 focus:outline-none disabled:opacity-50"
            >
              {checkoutLoading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <>
                  <CreditCard className="h-4.5 w-4.5" />
                  <span>Complete POS Sale</span>
                </>
              )}
            </button>

          </div>
        </div>

      </div>

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
              {invoicePO.prescription && (
                <div className="flex justify-between text-rose-600">
                  <span className="font-semibold">Linked Prescription:</span>
                  <span className="font-bold font-mono">{invoicePO.prescription.prescriptionNumber}</span>
                </div>
              )}
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

export default POS;
