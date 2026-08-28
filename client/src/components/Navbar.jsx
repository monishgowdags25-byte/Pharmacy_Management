import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, User, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Navbar = ({ toggleSidebar }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [quickSearch, setQuickSearch] = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!quickSearch.trim()) return;
    // Navigate to medicines search with the query
    navigate(`/medicines?search=${encodeURIComponent(quickSearch.trim())}`);
  };

  return (
    <header 
      role="banner"
      className="glass sticky top-0 z-30 h-16 border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between transition-all"
    >
      
      {/* Left controls: Mobile Menu & Search Bar */}
      <div className="flex items-center space-x-3 sm:space-x-4 flex-1 max-w-md">
        <button
          onClick={toggleSidebar}
          aria-label="Toggle navigation sidebar menu"
          className="p-2 hover:bg-slate-100/80 rounded-xl text-slate-600 hover:text-slate-900 lg:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition active:scale-95"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Global Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full hidden sm:block">
          <label htmlFor="navbar-global-search" className="sr-only">Quick Search Catalogue</label>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            id="navbar-global-search"
            type="text"
            placeholder="Search catalog, batches, customers..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            className="w-full bg-slate-50/90 border border-slate-200 hover:border-slate-300 focus:border-primary-500 focus:bg-white text-xs pl-10 pr-12 py-2 rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 bg-slate-100 rounded border border-slate-200">
            ↵
          </kbd>
        </form>
      </div>

      {/* Right controls: Notifications, User Pill */}
      <div className="flex items-center space-x-2.5 sm:space-x-4">
        
        {/* Notifications Icon Button */}
        <button 
          onClick={() => navigate('/notifications')}
          aria-label="View system notifications and alerts"
          className="relative p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition active:scale-95 border border-slate-200/60"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
        </button>

        {/* User Card */}
        <button
          onClick={() => navigate('/profile')}
          aria-label="Open staff user profile"
          className="flex items-center space-x-3 pl-3 sm:pl-4 border-l border-slate-200 text-left hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-xl p-1 transition"
        >
          <div className="hidden sm:block text-right">
            <p className="text-xs font-bold text-slate-700 leading-tight truncate max-w-[120px]">
              {user?.name || 'Staff User'}
            </p>
            <span className="text-[9px] font-extrabold text-primary-600 tracking-wider uppercase block">
              {user?.role?.replace('_', ' ') || 'PHARMACY'}
            </span>
          </div>
          <div className="bg-primary-50 text-primary-700 p-2 rounded-xl border border-primary-100 font-bold text-xs flex items-center justify-center h-8 w-8">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
          </div>
        </button>
      </div>

    </header>
  );
};

export default Navbar;
