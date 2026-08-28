import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

const SearchFilter = ({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange = () => {},
  filters = [], // [{ key, value, label, options: [{ label, value }], onChange }]
  onClear = null
}) => {
  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3.5 sm:gap-4 justify-between items-stretch md:items-center w-full">
      {/* Search Input */}
      <div className="relative flex-1 max-w-full md:max-w-md">
        <label htmlFor="search-filter-input" className="sr-only">{searchPlaceholder}</label>
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          id="search-filter-input"
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-slate-800 font-medium"
        />
      </div>

      {/* Filters selectors */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 justify-start md:justify-end">
        {filters.map((filter, idx) => (
          <div key={idx} className="relative flex-1 sm:flex-initial min-w-[130px]">
            <select
              aria-label={filter.label || `Filter option ${idx + 1}`}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary-500 focus:bg-white transition focus-visible:ring-2 focus-visible:ring-primary-500 cursor-pointer"
            >
              {filter.options.map((opt, oIdx) => (
                <option key={oIdx} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/70 transition px-3 py-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchFilter;
