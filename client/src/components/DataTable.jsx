import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  pagination = null,
  onPageChange = () => {},
  onSort = null,
  currentSort = ''
}) => {
  const handleSort = (field) => {
    if (!onSort) return;
    const isDesc = currentSort === `-${field}`;
    const nextSort = isDesc ? field : `-${field}`;
    onSort(nextSort);
  };

  return (
    <div className="w-full space-y-4">
      {/* Table container with responsive overflow scroll */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {columns.map((col, idx) => (
                  <th 
                    key={idx} 
                    scope="col"
                    className={`p-3.5 sm:p-4 font-bold select-none ${col.className || ''}`}
                  >
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.sortField || col.accessor)}
                        aria-label={`Sort by ${col.header}`}
                        className="flex items-center space-x-1 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded p-0.5 uppercase font-bold"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </button>
                    ) : (
                      <span>{col.header}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
              {loading ? (
                // Render Loading Skeleton Rows
                Array.from({ length: pagination?.limit || 5 }).map((_, rIdx) => (
                  <tr key={rIdx} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="p-3.5 sm:p-4">
                        <div className="h-4 bg-slate-100 rounded-md w-3/4"></div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                // Empty state row
                <tr>
                  <td colSpan={columns.length} className="text-center p-12 text-slate-500 font-medium">
                    <p className="text-sm">No matching records found.</p>
                    <span className="text-xs text-slate-400 mt-1 block">Try clearing filters or search criteria</span>
                  </td>
                </tr>
              ) : (
                // Data Rows
                data.map((row, rIdx) => (
                  <tr key={row._id || rIdx} className="hover:bg-slate-50/70 transition-colors">
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} className={`p-3.5 sm:p-4 align-middle font-medium ${col.className || ''}`}>
                        {col.render 
                          ? col.render(row) 
                          : row[col.accessor] !== undefined 
                            ? String(row[col.accessor]) 
                            : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-1">
          <span className="text-xs text-slate-500 font-semibold text-center sm:text-left">
            Showing Page <span className="text-slate-800 font-bold">{pagination.page}</span> of <span className="text-slate-800 font-bold">{pagination.totalPages}</span> ({pagination.totalCount} total items)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              aria-label="Previous page"
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-sm">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              aria-label="Next page"
              className="p-2 border border-slate-200 rounded-xl bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
