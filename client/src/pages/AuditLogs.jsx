import React, { useState, useEffect } from 'react';
import auditLogService from '../services/auditLogService';
import { useToast } from '../context/ToastContext';
import {
  Shield, Search, Filter, Loader2, User, Calendar, Tag
} from 'lucide-react';
import DemoDataButton from '../components/DemoDataButton';

const ACTION_META = {
  LOGIN:                { label: 'Login',                color: 'bg-emerald-100 text-emerald-700' },
  LOGOUT:               { label: 'Logout',               color: 'bg-slate-100 text-slate-600' },
  CREATE_MEDICINE:      { label: 'Create Medicine',      color: 'bg-blue-100 text-blue-700' },
  UPDATE_MEDICINE:      { label: 'Update Medicine',      color: 'bg-cyan-100 text-cyan-700' },
  DEACTIVATE_MEDICINE:  { label: 'Deactivate Medicine',  color: 'bg-rose-100 text-rose-700' },
  CREATE_PURCHASE:      { label: 'Create Purchase',      color: 'bg-purple-100 text-purple-700' },
  COMPLETE_PURCHASE:    { label: 'Complete Purchase',    color: 'bg-purple-100 text-purple-700' },
  CANCEL_PURCHASE:      { label: 'Cancel Purchase',      color: 'bg-orange-100 text-orange-700' },
  CREATE_SALE:          { label: 'New Sale',             color: 'bg-green-100 text-green-700' },
  CANCEL_SALE:          { label: 'Cancel Sale',          color: 'bg-rose-100 text-rose-700' },
  ADJUST_STOCK:         { label: 'Stock Adjustment',     color: 'bg-amber-100 text-amber-700' },
  CREATE_RETURN:        { label: 'Return',               color: 'bg-orange-100 text-orange-700' },
  VERIFY_PRESCRIPTION:  { label: 'Verify Prescription',  color: 'bg-teal-100 text-teal-700' },
  CREATE_USER:          { label: 'Create User',          color: 'bg-indigo-100 text-indigo-700' },
  CHANGE_ROLE:          { label: 'Change Role',          color: 'bg-violet-100 text-violet-700' },
  SYSTEM:               { label: 'System',               color: 'bg-slate-100 text-slate-600' },
};

const ACTION_OPTIONS = Object.entries(ACTION_META).map(([value, { label }]) => ({ value, label }));

const fmt = (d) => d.toISOString().slice(0, 10);

const AuditLogs = () => {
  const { showToast } = useToast();
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch]       = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate]     = useState(fmt(new Date()));

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (search)       params.search    = search;
      if (actionFilter) params.action    = actionFilter;
      if (startDate)    params.startDate = startDate;
      if (endDate)      params.endDate   = endDate + 'T23:59:59.999Z';

      const res = await auditLogService.getAuditLogs(params);
      if (res?.success) {
        setLogs(res.data.logs);
        setPagination(res.data.pagination);
      }
    } catch { showToast('Failed to load audit logs', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLogs(); }, [page, search, actionFilter, startDate, endDate]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500">System-wide record of all critical business events.</p>
        </div>
        <div className="flex items-center">
          <DemoDataButton 
            type="audit-logs" 
            onSuccess={fetchLogs} 
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[220px]">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Search</label>
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text" placeholder="Search description, entity, action…"
                  value={searchInput} onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                />
              </div>
              <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition">
                Search
              </button>
            </div>
          </form>

          {/* Action Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">Action</label>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none">
              <option value="">All Actions</option>
              {ACTION_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* Date Range */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">From</label>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase block">To</label>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setPage(1); }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none" />
          </div>

          {/* Clear */}
          <button onClick={() => { setSearch(''); setSearchInput(''); setActionFilter(''); setStartDate(''); setEndDate(fmt(new Date())); setPage(1); }}
            className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition">
            Clear
          </button>
        </div>

        {pagination && (
          <p className="text-[10px] text-slate-400 font-medium mt-3">{pagination.totalCount} total records</p>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/50 shadow-sm overflow-hidden">
        {loading
          ? <div className="flex justify-center items-center py-16"><Loader2 className="h-8 w-8 text-primary-600 animate-spin" /></div>
          : logs.length === 0
          ? <div className="py-16 text-center text-slate-400 text-sm italic">No audit logs found.</div>
          : <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Entity</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {logs.map(log => {
                      const meta = ACTION_META[log.action] || { label: log.action, color: 'bg-slate-100 text-slate-600' };
                      return (
                        <tr key={log._id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${meta.color}`}>
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{log.user?.name || <span className="italic text-slate-400">System</span>}</td>
                          <td className="px-4 py-3 font-medium text-slate-500 text-[10px]">{log.user?.role || '—'}</td>
                          <td className="px-4 py-3 font-medium text-slate-500">{log.entity || '—'}</td>
                          <td className="px-4 py-3 text-slate-500">{log.description || '—'}</td>
                          <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">{log.ipAddress || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

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
            </>
        }
      </div>
    </div>
  );
};

export default AuditLogs;
