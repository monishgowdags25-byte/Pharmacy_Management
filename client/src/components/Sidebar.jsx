import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, 
  CreditCard, Users, FileText, Settings, 
  LogOut, Activity, User, X, Folder, Truck, Layers, RotateCcw, DollarSign,
  BarChart2, Bell, Shield, SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navigationGroups = [
  {
    title: 'CORE',
    links: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'CASHIER'] },
      { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'CASHIER'] },
    ]
  },
  {
    title: 'CATALOG & STOCK',
    links: [
      { path: '/medicines', label: 'Medicines', icon: Package, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'] },
      { path: '/categories', label: 'Categories', icon: Folder, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'] },
      { path: '/inventory', label: 'Inventory Stock', icon: Package, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'] },
      { path: '/batches', label: 'Medicine Batches', icon: Layers, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER'] },
      { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
    ]
  },
  {
    title: 'SALES & ORDERS',
    links: [
      { path: '/pos', label: 'POS Checkout', icon: CreditCard, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
      { path: '/sales', label: 'Sales Ledger', icon: FileText, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
      { path: '/purchases', label: 'Purchases', icon: ShoppingCart, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { path: '/returns', label: 'Returns Slip', icon: RotateCcw, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    ]
  },
  {
    title: 'PATIENT CARE',
    links: [
      { path: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
      { path: '/prescriptions', label: 'Prescriptions', icon: FileText, roles: ['ADMIN', 'PHARMACIST', 'CASHIER'] },
    ]
  },
  {
    title: 'FINANCES & LOGS',
    links: [
      { path: '/reports', label: 'Reports', icon: BarChart2, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { path: '/expenses', label: 'Expenses', icon: DollarSign, roles: ['ADMIN', 'INVENTORY_MANAGER'] },
      { path: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['ADMIN'] },
    ]
  },
  {
    title: 'SYSTEM & SETTINGS',
    links: [
      { path: '/users', label: 'Staff Users', icon: Users, roles: ['ADMIN'] },
      { path: '/settings', label: 'Settings', icon: SlidersHorizontal, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'CASHIER'] },
      { path: '/profile', label: 'My Profile', icon: User, roles: ['ADMIN', 'PHARMACIST', 'INVENTORY_MANAGER', 'CASHIER'] },
    ]
  }
];

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user, logout } = useAuth();

  // Close sidebar on Escape key for mobile accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, toggleSidebar]);

  const linkClass = ({ isActive }) => {
    const baseClass = "flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150";
    return isActive 
      ? `${baseClass} bg-primary-600 text-white shadow-sm shadow-primary-600/20` 
      : `${baseClass} text-slate-600 hover:text-slate-900 hover:bg-slate-100/90`;
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          onClick={toggleSidebar}
          aria-label="Close sidebar backdrop"
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Deck */}
      <aside 
        role="navigation"
        aria-label="Main Navigation"
        className={`fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200/80 w-64 p-4 flex flex-col justify-between z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        
        {/* Top Header & Navigation Links */}
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 px-2">
            <div className="flex items-center space-x-2.5">
              <div className="bg-primary-600 text-white p-2 rounded-xl shadow-sm">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-slate-800 tracking-tight leading-none text-base">PharmaCare</h1>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enterprise ERP</span>
              </div>
            </div>
            {/* Mobile close button */}
            <button 
              onClick={toggleSidebar}
              aria-label="Close navigation sidebar"
              className="lg:hidden p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links Scrollable List */}
          <div className="flex-1 overflow-y-auto pt-3 pb-2 space-y-5 pr-1">
            {navigationGroups.map((group) => {
              const visibleGroupLinks = group.links.filter(
                (link) => user?.role && link.roles.includes(user.role)
              );

              if (visibleGroupLinks.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 tracking-wider px-3 uppercase">
                    {group.title}
                  </span>
                  <div className="space-y-0.5 pt-1">
                    {visibleGroupLinks.map((link) => {
                      const IconComponent = link.icon;
                      return (
                        <NavLink 
                          key={link.path} 
                          to={link.path}
                          onClick={() => {
                            if (window.innerWidth < 1024) toggleSidebar();
                          }}
                          className={linkClass}
                        >
                          <IconComponent className="h-4 w-4 shrink-0" />
                          <span className="truncate">{link.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer controls */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            {user && (
              <div className="px-3 py-2 bg-slate-50/80 rounded-xl flex items-center space-x-2.5 border border-slate-100">
                <div className="bg-primary-100 text-primary-700 h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate flex-1">
                  <p className="text-xs font-bold text-slate-700 truncate">{user.name}</p>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    {user.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
            <button 
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl font-bold text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50/60 transition duration-150 focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </aside>
    </>
  );
};

export default Sidebar;
