import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import dashboardService from '../services/dashboardService';
import { useToast } from '../context/ToastContext';
import { 
  TrendingUp, Users, Package, AlertTriangle, 
  Plus, Receipt, RefreshCw, FileText, ShoppingCart, 
  RotateCcw, DollarSign, Layers, CheckCircle2, ArrowUpRight 
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardService.getSummary();
      if (response?.success) {
        setSummary(response.data);
      }
    } catch (err) {
      showToast('Failed to load real-time dashboard analytics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSyncData = () => {
    setSyncing(true);
    fetchDashboardData().then(() => {
      setSyncing(false);
      showToast('Dashboard metrics synchronized successfully!', 'success');
    });
  };

  if (loading || !summary) {
    return (
      <div className="flex justify-center items-center py-28 animate-in fade-in">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-10 w-10 text-primary-600 animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-semibold">Aggregating database statistics...</p>
        </div>
      </div>
    );
  }

  const { kpi, salesTrend, topSellingMedicines, recentActivities } = summary;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-slate-500">Real-time health of your pharmacy warehouse and retail outlet.</p>
        </div>
        <div className="flex items-center space-x-2.5 sm:space-x-3">
          <button
            onClick={handleSyncData}
            disabled={syncing}
            className="flex items-center space-x-2 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 font-bold text-xs px-4 sm:px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Data'}</span>
          </button>
          
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 sm:px-5 py-2.5 rounded-xl shadow-sm shadow-primary-600/20 hover:shadow-primary-600/30 transition active:scale-95 focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        
        {/* Card 1: Revenue */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between erp-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today's Revenue</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">${kpi.todaySales.toFixed(2)}</h3>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3" /> Dispensed Today
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between erp-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Today's Invoices</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{kpi.todayOrders} Orders</h3>
            <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Retail Checkouts
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Stock Units */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between erp-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Active Stock</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{kpi.totalStock} Units</h3>
            <span className="text-[10px] font-bold text-purple-600">
              {kpi.totalMedicines} Catalogs
            </span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100">
            <Package className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Low Stock Alarms */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between erp-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Low Stock Alerts</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-amber-600">{kpi.lowStock} Items</h3>
            <span className="text-[10px] font-bold text-rose-600">
              {kpi.outOfStock} Out of Stock
            </span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 5: Expiry Alarms */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex items-start justify-between erp-card-hover">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Expiry Alerts</span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-rose-600">{kpi.expiringSoon} Expiring</h3>
            <span className="text-[10px] font-bold text-rose-700">
              {kpi.expired} Expired Batches
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Layers className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Charts & Analytics sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Side: Recharts Sales Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Sales Trend (Last 7 Days)</h2>
              <p className="text-xs text-slate-400 mt-0.5">Daily retail checkouts revenue performance.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-primary-50 text-primary-700 border border-primary-100 rounded-xl">
              Live Feed
            </span>
          </div>

          {/* Recharts Area Chart */}
          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  formatter={(val) => [`$${Number(val).toFixed(2)}`, 'Sales Revenue']}
                  labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '1rem', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                    fontSize: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#16a34a" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#salesGrad)" 
                  activeDot={{ r: 6, fill: '#16a34a', stroke: '#ffffff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Top Selling Products listing */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">Top Selling Medicines</h2>
              <button 
                onClick={() => navigate('/medicines')}
                className="text-[11px] font-bold text-primary-600 hover:text-primary-700 flex items-center"
              >
                View All <ArrowUpRight className="h-3 w-3 ml-0.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-5">Ranked by quantities dispensed in checkouts.</p>

            <div className="space-y-3.5">
              {topSellingMedicines.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">No checkout records logged yet.</p>
              ) : (
                topSellingMedicines.map((med, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-2.5 hover:bg-slate-50/80 rounded-xl transition border border-transparent hover:border-slate-100">
                    <div className="flex items-center space-x-2.5 truncate">
                      <span className="h-6 w-6 bg-primary-50 text-primary-700 font-extrabold flex items-center justify-center rounded-lg text-[10px] shrink-0 border border-primary-100">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate max-w-[130px] sm:max-w-[160px]">{med.name}</span>
                    </div>
                    <span className="font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                      {med.quantity} Sold
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4">
            <span>Suppliers: {kpi.totalSuppliers} Active</span>
            <span>Customers: {kpi.totalCustomers}</span>
          </div>
        </div>

      </div>

      {/* Double-Panel Recent Activities feed list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        
        {/* Recent sales checkouts logs */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Sales Invoices</h2>
            <button onClick={() => navigate('/sales')} className="text-xs font-bold text-primary-600 hover:text-primary-700">
              Sales Ledger →
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivities.recentSales.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No completed checkouts logged today.</p>
            ) : (
              recentActivities.recentSales.map(sale => (
                <div key={sale._id} className="flex justify-between items-center text-xs p-2 hover:bg-slate-50 rounded-xl transition">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{sale.invoiceNumber}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      Cashier: {sale.user?.name || 'Staff'} • {sale.customer?.name || 'Walk-in Customer'}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800">${sale.totalAmount.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent purchases log */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Procurement Receipts</h2>
            <button onClick={() => navigate('/purchases')} className="text-xs font-bold text-primary-600 hover:text-primary-700">
              Purchases →
            </button>
          </div>
          
          <div className="space-y-3">
            {recentActivities.recentPurchases.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">No restock agreements drafted yet.</p>
            ) : (
              recentActivities.recentPurchases.map(po => (
                <div key={po._id} className="flex justify-between items-center text-xs p-2 hover:bg-slate-50 rounded-xl transition">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{po.purchaseNumber}</span>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      Supplier: {po.supplier?.companyName || po.supplier?.name || 'Generic'} • <span className="font-bold uppercase text-emerald-600">{po.status}</span>
                    </p>
                  </div>
                  <span className="font-bold text-slate-800">${po.grandTotal.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
