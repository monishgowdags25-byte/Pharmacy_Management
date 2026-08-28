import React, { useState, useCallback } from 'react';
import reportService from '../services/reportService';
import { useToast } from '../context/ToastContext';
import {
  BarChart2, ShoppingCart, Package, TrendingUp, Pill,
  Truck, Download, RefreshCw, Loader2
} from 'lucide-react';
import DemoDataButton from '../components/DemoDataButton';

/* ─────────── CSV helpers ─────────── */
const toCSV = (rows, headers) => {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const headerRow = headers.map(h => escape(h.label)).join(',');
  const dataRows  = rows.map(r => headers.map(h => escape(r[h.key])).join(','));
  return [headerRow, ...dataRows].join('\r\n');
};
const downloadCSV = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

/* ─────────── Date presets ─────────── */
const PRESETS = [
  { label: 'Today',      getValue: () => { const t = new Date(); return { startDate: fmt(t), endDate: fmt(t) }; } },
  { label: 'Yesterday',  getValue: () => { const t = new Date(); t.setDate(t.getDate()-1); return { startDate: fmt(t), endDate: fmt(t) }; } },
  { label: 'This Week',  getValue: () => { const t = new Date(); const d = new Date(t); d.setDate(d.getDate() - d.getDay()); return { startDate: fmt(d), endDate: fmt(t) }; } },
  { label: 'This Month', getValue: () => { const t = new Date(); const d = new Date(t.getFullYear(), t.getMonth(), 1); return { startDate: fmt(d), endDate: fmt(t) }; } },
];
const fmt = (d) => d.toISOString().slice(0, 10);

/* ─────────── Sub-components ─────────── */
const SummaryCard = ({ label, value, accent = 'text-primary-600', bg = 'bg-primary-50' }) => (
  <div className={`${bg} rounded-2xl p-4 space-y-1`}>
    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</p>
    <p className={`text-xl font-extrabold ${accent}`}>{value}</p>
  </div>
);

const TableGrid = ({ columns, data, loading }) => (
  <div className="rounded-2xl border border-slate-100 overflow-hidden">
    <table className="w-full text-xs text-left border-collapse">
      <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
        <tr>{columns.map(c => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-slate-600">
        {loading
          ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>
          : data.length === 0
          ? <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400 italic">No records in this date range.</td></tr>
          : data.map((row, i) =>
              <tr key={i} className="hover:bg-slate-50/50">
                {columns.map(c => <td key={c.key} className="px-4 py-2.5 font-medium">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>)}
              </tr>
            )}
      </tbody>
    </table>
  </div>
);

/* ─────────── TABS ─────────── */
const TABS = [
  { id: 'sales',       label: 'Sales',         Icon: BarChart2 },
  { id: 'purchases',   label: 'Purchases',      Icon: ShoppingCart },
  { id: 'inventory',   label: 'Inventory',      Icon: Package },
  { id: 'profit',      label: 'Profit',         Icon: TrendingUp },
  { id: 'medicines',   label: 'Medicines',      Icon: Pill },
  { id: 'suppliers',   label: 'Suppliers',      Icon: Truck },
];

/* ─────────── MAIN ─────────── */
const Reports = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('sales');
  const [startDate, setStartDate] = useState(fmt(new Date()));
  const [endDate,   setEndDate]   = useState(fmt(new Date()));
  const [activePreset, setActivePreset] = useState('Today');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    const { startDate: s, endDate: e } = preset.getValue();
    setStartDate(s); setEndDate(e); setActivePreset(preset.label);
  };

  const fetchReport = useCallback(async () => {
    setLoading(true); setData(null);
    try {
      const params = { startDate, endDate };
      let res;
      if (activeTab === 'sales')       res = await reportService.getSalesReport(params);
      else if (activeTab === 'purchases') res = await reportService.getPurchaseReport(params);
      else if (activeTab === 'inventory') res = await reportService.getInventoryReport();
      else if (activeTab === 'profit')    res = await reportService.getProfitReport(params);
      else if (activeTab === 'medicines') res = await reportService.getMedicinePerformance(params);
      else if (activeTab === 'suppliers') res = await reportService.getSupplierReport();
      if (res?.success) setData(res.data);
    } catch { showToast('Failed to generate report', 'error'); }
    finally { setLoading(false); }
  }, [activeTab, startDate, endDate]);

  const handleExport = () => {
    if (!data) return;
    let csv = ''; let filename = `${activeTab}_report_${startDate}.csv`;

    if (activeTab === 'sales' && data.sales) {
      csv = toCSV(data.sales, [
        { key: 'invoiceNumber', label: 'Invoice' },
        { key: 'date', label: 'Date' },
        { key: 'paymentMethod', label: 'Payment' },
        { key: 'totalAmount', label: 'Amount' },
      ]);
    } else if (activeTab === 'purchases' && data.purchases) {
      csv = toCSV(data.purchases, [
        { key: 'purchaseNumber', label: 'PO Number' },
        { key: 'date', label: 'Date' },
        { key: 'supplierName', label: 'Supplier' },
        { key: 'grandTotal', label: 'Amount' },
      ]);
    } else if (activeTab === 'medicines' && data.performanceList) {
      csv = toCSV(data.performanceList, [
        { key: 'medicineName', label: 'Medicine' },
        { key: 'quantitySold', label: 'Qty Sold' },
        { key: 'revenue', label: 'Revenue' },
      ]);
    } else if (activeTab === 'suppliers' && Array.isArray(data)) {
      csv = toCSV(data, [
        { key: 'supplierName', label: 'Supplier' },
        { key: 'purchaseCount', label: 'PO Count' },
        { key: 'purchaseAmount', label: 'Total Spend' },
      ]);
    } else {
      showToast('CSV export not available for this report type.', 'info');
      return;
    }
    downloadCSV(csv, filename);
    showToast('CSV file downloaded.', 'success');
  };

  const $ = (n) => `$${Number(n ?? 0).toFixed(2)}`;

  /* ─── render report content ─── */
  const renderContent = () => {
    if (!data) return (
      <div className="py-16 text-center text-slate-400 text-sm italic">
        Select a date range and click <span className="font-bold text-primary-600">Generate Report</span>.
      </div>
    );

    if (activeTab === 'sales') return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <SummaryCard label="Total Sales"    value={$(data.summary?.totalSales)} bg="bg-emerald-50" accent="text-emerald-600" />
          <SummaryCard label="Transactions"   value={data.summary?.transactions} bg="bg-blue-50" accent="text-blue-600" />
          <SummaryCard label="Tax Collected"  value={$(data.summary?.tax)} bg="bg-amber-50" accent="text-amber-600" />
          <SummaryCard label="Discounts"      value={$(data.summary?.discount)} bg="bg-rose-50" accent="text-rose-600" />
          <SummaryCard label="Net Sales"      value={$(data.summary?.netSales)} bg="bg-primary-50" accent="text-primary-700" />
        </div>
        <TableGrid loading={loading} data={data.sales ?? []} columns={[
          { key: 'invoiceNumber', label: 'Invoice #' },
          { key: 'date', label: 'Date', render: r => new Date(r.date).toLocaleDateString() },
          { key: 'paymentMethod', label: 'Payment' },
          { key: 'totalAmount', label: 'Amount', render: r => $(r.totalAmount) },
        ]} />
      </div>
    );

    if (activeTab === 'purchases') return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard label="Total Purchases" value={$(data.summary?.totalPurchases)} bg="bg-purple-50" accent="text-purple-600" />
          <SummaryCard label="# of Orders"     value={data.summary?.numberOfPurchases} bg="bg-slate-50" accent="text-slate-700" />
        </div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-2">Supplier-wise Breakdown</h4>
        <TableGrid loading={loading} data={data.supplierWise ?? []} columns={[
          { key: 'supplierName', label: 'Supplier' },
          { key: 'count', label: 'Orders' },
          { key: 'amount', label: 'Total Spend', render: r => $(r.amount) },
        ]} />
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mt-4">All Purchase Orders</h4>
        <TableGrid loading={loading} data={data.purchases ?? []} columns={[
          { key: 'purchaseNumber', label: 'PO #' },
          { key: 'date', label: 'Date', render: r => new Date(r.date).toLocaleDateString() },
          { key: 'supplierName', label: 'Supplier' },
          { key: 'grandTotal', label: 'Amount', render: r => $(r.grandTotal) },
        ]} />
      </div>
    );

    if (activeTab === 'inventory') return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <SummaryCard label="Total Stock"    value={`${data.summary?.currentStock} units`} bg="bg-emerald-50" accent="text-emerald-600" />
        <SummaryCard label="Low Stock"      value={data.summary?.lowStock}     bg="bg-amber-50" accent="text-amber-600" />
        <SummaryCard label="Out of Stock"   value={data.summary?.outOfStock}   bg="bg-rose-50" accent="text-rose-600" />
        <SummaryCard label="Expiring Soon"  value={data.summary?.expiring}     bg="bg-orange-50" accent="text-orange-600" />
        <SummaryCard label="Expired"        value={data.summary?.expired}      bg="bg-red-50" accent="text-red-700" />
      </div>
    );

    if (activeTab === 'profit') return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Revenue"        value={$(data.summary?.revenue)}           bg="bg-emerald-50" accent="text-emerald-600" />
          <SummaryCard label="COGS"           value={$(data.summary?.cogs)}              bg="bg-rose-50" accent="text-rose-600" />
          <SummaryCard label="Expenses"       value={$(data.summary?.expenses)}          bg="bg-amber-50" accent="text-amber-600" />
          <SummaryCard label="Est. Net Profit" value={$(data.summary?.estimatedNetProfit)}
            bg={data.summary?.estimatedNetProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}
            accent={data.summary?.estimatedNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 border border-slate-100">
          <p className="font-bold text-slate-700 mb-1">📐 Profit Calculation Formula</p>
          <p>{data.formula}</p>
        </div>
      </div>
    );

    if (activeTab === 'medicines') return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Top 5 Selling Medicines</h4>
            <TableGrid loading={loading} data={data.topSelling ?? []} columns={[
              { key: 'medicineName', label: 'Medicine' },
              { key: 'quantitySold', label: 'Qty Sold' },
              { key: 'revenue', label: 'Revenue', render: r => $(r.revenue) },
            ]} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Lowest 5 Selling Medicines</h4>
            <TableGrid loading={loading} data={data.lowestSelling ?? []} columns={[
              { key: 'medicineName', label: 'Medicine' },
              { key: 'quantitySold', label: 'Qty Sold' },
              { key: 'revenue', label: 'Revenue', render: r => $(r.revenue) },
            ]} />
          </div>
        </div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">All Medicine Performance</h4>
        <TableGrid loading={loading} data={data.performanceList ?? []} columns={[
          { key: 'medicineName', label: 'Medicine' },
          { key: 'quantitySold', label: 'Qty Sold' },
          { key: 'revenue', label: 'Revenue', render: r => $(r.revenue) },
        ]} />
      </div>
    );

    if (activeTab === 'suppliers') return (
      <TableGrid loading={loading} data={Array.isArray(data) ? data : []} columns={[
        { key: 'supplierName', label: 'Supplier' },
        { key: 'purchaseCount', label: 'Purchase Orders' },
        { key: 'purchaseAmount', label: 'Total Spend', render: r => $(r.purchaseAmount) },
      ]} />
    );

    return null;
  };

  const hasDateFilter = !['inventory', 'suppliers'].includes(activeTab);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Business Reports</h1>
          <p className="text-sm text-slate-500">Generate analytics reports across all pharmacy operations.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DemoDataButton 
            type="reports" 
            buttonText="Dump Demo Data"
            onSuccess={fetchReport} 
          />
          <button onClick={fetchReport} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition active:scale-95">
            <RefreshCw className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
          <button onClick={handleExport} disabled={!data} className="flex items-center space-x-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-40">
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => { setActiveTab(id); setData(null); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === id
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Date Range Panel */}
      {hasDateFilter && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Start Date</label>
              <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(''); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">End Date</label>
              <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(''); }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => applyPreset(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    activePreset === p.label
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/50 shadow-sm min-h-[320px]">
        {loading
          ? <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 text-primary-600 animate-spin" /></div>
          : renderContent()
        }
      </div>
    </div>
  );
};

export default Reports;
