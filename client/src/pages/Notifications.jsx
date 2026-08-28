import React, { useState, useEffect } from 'react';
import notificationService from '../services/notificationService';
import { useToast } from '../context/ToastContext';
import {
  Bell, AlertTriangle, Package, Layers, CheckCircle2,
  RefreshCw, Loader2, CheckCheck, Settings
} from 'lucide-react';
import DemoDataButton from '../components/DemoDataButton';

const TYPE_META = {
  LOW_STOCK:     { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-amber-50',  text: 'text-amber-600',  badge: 'bg-amber-100 text-amber-700',  label: 'Low Stock' },
  OUT_OF_STOCK:  { icon: <Package      className="h-4 w-4" />, bg: 'bg-rose-50',   text: 'text-rose-600',   badge: 'bg-rose-100 text-rose-700',    label: 'Out of Stock' },
  EXPIRING_SOON: { icon: <Layers       className="h-4 w-4" />, bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700', label: 'Expiring Soon' },
  EXPIRED:       { icon: <AlertTriangle className="h-4 w-4" />, bg: 'bg-red-50',   text: 'text-red-700',    badge: 'bg-red-100 text-red-800',      label: 'Expired' },
  SYSTEM:        { icon: <Bell         className="h-4 w-4" />, bg: 'bg-blue-50',   text: 'text-blue-600',   badge: 'bg-blue-100 text-blue-700',    label: 'System' },
};

const Notifications = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(true);
  const [generating, setGenerating]       = useState(false);
  const [page, setPage]                   = useState(1);
  const [pagination, setPagination]       = useState(null);
  const [typeFilter, setTypeFilter]       = useState('');
  const [unreadOnly, setUnreadOnly]       = useState(false);
  const [threshold, setThreshold]         = useState(90);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications({
        page, limit: 20,
        ...(typeFilter  ? { type: typeFilter }      : {}),
        ...(unreadOnly  ? { unreadOnly: 'true' }   : {})
      });
      if (res?.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
        setPagination(res.data.pagination);
      }
    } catch { showToast('Failed to load notifications', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, [page, typeFilter, unreadOnly]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await notificationService.generate(threshold);
      showToast('Inventory scan complete. Alerts generated!', 'success');
      setPage(1);
      fetchNotifications();
    } catch { showToast('Generation failed', 'error'); }
    finally { setGenerating(false); }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { showToast('Failed to mark as read', 'error'); }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read.', 'success');
    } catch { showToast('Failed to mark all as read', 'error'); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500">Stock alerts, expiry warnings, and system messages.</p>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <DemoDataButton 
            type="notifications" 
            onSuccess={fetchNotifications} 
          />
          <button onClick={handleMarkAllRead} disabled={unreadCount === 0}
            className="flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-40">
            <CheckCheck className="h-4 w-4" /><span>Mark All Read</span>
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition">
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span>Scan Inventory</span>
          </button>
        </div>
      </div>

      {/* Threshold & Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Expiry Threshold (days)</label>
          <div className="flex items-center space-x-2">
            <input type="number" min="1" max="365" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
              className="w-24 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none" />
            <span className="text-xs text-slate-400 font-medium">days before expiry</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase">Filter by Type</label>
          <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
            <option value="">All Types</option>
            {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-slate-600">
          <input type="checkbox" checked={unreadOnly} onChange={e => { setUnreadOnly(e.target.checked); setPage(1); }}
            className="h-4 w-4 accent-primary-600" />
          <span>Unread Only</span>
        </label>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden">
        {loading
          ? <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 text-primary-600 animate-spin" /></div>
          : notifications.length === 0
          ? <div className="py-16 text-center text-slate-400 text-sm italic">No notifications found.</div>
          : <div className="divide-y divide-slate-100">
              {notifications.map(n => {
                const meta = TYPE_META[n.type] || TYPE_META.SYSTEM;
                return (
                  <div key={n._id} className={`flex items-start gap-4 px-5 py-4 transition ${n.read ? 'opacity-60' : 'bg-slate-50/50'}`}>
                    <div className={`p-2.5 rounded-xl ${meta.bg} ${meta.text} flex-shrink-0 mt-0.5`}>{meta.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${meta.badge}`}>{meta.label}</span>
                        {!n.read && <span className="h-2 w-2 bg-primary-500 rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm font-bold text-slate-700">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.read && (
                      <button onClick={() => handleMarkRead(n._id)}
                        className="flex-shrink-0 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
        }

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 text-xs">
            <span className="text-slate-400 font-medium">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex space-x-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-bold transition">Prev</button>
              <button onClick={() => setPage(p => Math.min(pagination.totalPages, p+1))} disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-bold transition">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
