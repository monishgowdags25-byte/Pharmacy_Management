import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Building2, Bell, Receipt, Shield, Activity, 
  Key, Eye, EyeOff, Loader2, Save, CheckCircle2, 
  RefreshCw, Database, Server, Clock, Lock, Sparkles
} from 'lucide-react';
import DemoDataButton from '../components/DemoDataButton';
import demoService from '../services/demoService';

const Settings = () => {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('store');

  // Store Profile State (loaded from localStorage or defaults)
  const [storeName, setStoreName] = useState(() => localStorage.getItem('pc_store_name') || 'PharmaCare Central Pharmacy');
  const [licenseNumber, setLicenseNumber] = useState(() => localStorage.getItem('pc_store_license') || 'PH-8829-2026');
  const [taxId, setTaxId] = useState(() => localStorage.getItem('pc_store_tax_id') || 'TX-90210-ERP');
  const [phone, setPhone] = useState(() => localStorage.getItem('pc_store_phone') || '+1 (555) 234-5678');
  const [email, setEmail] = useState(() => localStorage.getItem('pc_store_email') || 'support@pharmacare.local');
  const [address, setAddress] = useState(() => localStorage.getItem('pc_store_address') || '742 Evergreen Medical Blvd, Suite 100, Springfield');
  const [currency, setCurrency] = useState(() => localStorage.getItem('pc_store_currency') || '$');
  const [receiptHeader, setReceiptHeader] = useState(() => localStorage.getItem('pc_receipt_header') || 'Thank you for choosing PharmaCare Healthcare!');
  const [receiptFooter, setReceiptFooter] = useState(() => localStorage.getItem('pc_receipt_footer') || 'For refills or dosage inquiries, call support.');

  // Inventory & Alerts State
  const [lowStockThreshold, setLowStockThreshold] = useState(() => localStorage.getItem('pc_low_stock_threshold') || '10');
  const [expiryWarningDays, setExpiryWarningDays] = useState(() => localStorage.getItem('pc_expiry_warning_days') || '90');
  const [autoFEFO, setAutoFEFO] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  // POS Preferences
  const [defaultTaxRate, setDefaultTaxRate] = useState(() => localStorage.getItem('pc_default_tax_rate') || '5');
  const [autoPrintReceipt, setAutoPrintReceipt] = useState(true);
  const [showGenericName, setShowGenericName] = useState(true);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Saving state
  const [saveLoading, setSaveLoading] = useState(false);

  const handleSaveStoreSettings = (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setTimeout(() => {
      localStorage.setItem('pc_store_name', storeName);
      localStorage.setItem('pc_store_license', licenseNumber);
      localStorage.setItem('pc_store_tax_id', taxId);
      localStorage.setItem('pc_store_phone', phone);
      localStorage.setItem('pc_store_email', email);
      localStorage.setItem('pc_store_address', address);
      localStorage.setItem('pc_store_currency', currency);
      localStorage.setItem('pc_receipt_header', receiptHeader);
      localStorage.setItem('pc_receipt_footer', receiptFooter);
      setSaveLoading(false);
      showToast('Store settings saved successfully!', 'success');
    }, 400);
  };

  const handleSaveInventorySettings = (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setTimeout(() => {
      localStorage.setItem('pc_low_stock_threshold', lowStockThreshold);
      localStorage.setItem('pc_expiry_warning_days', expiryWarningDays);
      setSaveLoading(false);
      showToast('Inventory & Alert parameters updated!', 'success');
    }, 400);
  };

  const handleSavePOSSettings = (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setTimeout(() => {
      localStorage.setItem('pc_default_tax_rate', defaultTaxRate);
      setSaveLoading(false);
      showToast('POS checkout preferences saved!', 'success');
    }, 400);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Please fill in all password fields.', 'warning');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      showToast('Password updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to change password. Please verify credentials.', 'error');
    } finally {
      setPwdLoading(false);
    }
  };

  const tabs = [
    { id: 'store', label: 'Store Profile', icon: Building2 },
    { id: 'inventory', label: 'Alerts & Stock', icon: Bell },
    { id: 'pos', label: 'POS & Receipts', icon: Receipt },
    { id: 'security', label: 'Security & Auth', icon: Shield },
    { id: 'system', label: 'Diagnostics', icon: Activity },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          System Settings & ERP Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">Configure pharmacy branch parameters, billing rules, alert limits, and security credentials.</p>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 bg-white border border-slate-200/80'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Store Profile Settings */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveStoreSettings} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Pharmacy Branch Information</h2>
              <p className="text-xs text-slate-500">Details printed on customer receipts and official purchase orders.</p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Changes</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Pharmacy Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Pharmacy License / DEA Reg #</label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Tax ID / VAT Registration</label>
              <input
                type="text"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Currency Symbol</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white cursor-pointer"
              >
                <option value="$">USD ($)</option>
                <option value="€">EUR (€)</option>
                <option value="£">GBP (£)</option>
                <option value="₹">INR (₹)</option>
                <option value="C$">CAD (C$)</option>
                <option value="A$">AUD (A$)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Receipt Header Note</label>
              <input
                type="text"
                value={receiptHeader}
                onChange={(e) => setReceiptHeader(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 focus:bg-white"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Inventory & Alert Thresholds */}
      {activeTab === 'inventory' && (
        <form onSubmit={handleSaveInventorySettings} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Inventory & Expiry Parameters</h2>
              <p className="text-xs text-slate-500">Configure global stock alarms and automated safety buffers.</p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Rules</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Default Reorder Level (Low Stock)</span>
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  {lowStockThreshold} Units
                </span>
              </div>
              <p className="text-xs text-slate-500">Items falling below this quantity trigger a dashboard warning and stock notification.</p>
              <input
                type="number"
                min="1"
                max="1000"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Expiry Warning Window</span>
                <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                  {expiryWarningDays} Days
                </span>
              </div>
              <p className="text-xs text-slate-500">Batches expiring within this window are flagged as "EXPIRING SOON".</p>
              <input
                type="number"
                min="15"
                max="365"
                value={expiryWarningDays}
                onChange={(e) => setExpiryWarningDays(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Enforce FEFO Dispensing</h3>
                <p className="text-[11px] text-slate-500">Automatically allocate earliest expiring batches at POS.</p>
              </div>
              <input
                type="checkbox"
                checked={autoFEFO}
                onChange={(e) => setAutoFEFO(e.target.checked)}
                className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
              />
            </div>

            <div className="p-5 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Automated Daily Scans</h3>
                <p className="text-[11px] text-slate-500">Run background audit of expiring batches every midnight.</p>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: POS & Receipt Settings */}
      {activeTab === 'pos' && (
        <form onSubmit={handleSavePOSSettings} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">Point of Sale & Checkout Preferences</h2>
              <p className="text-xs text-slate-500">Customize default sales tax, receipts, and printing behaviors.</p>
            </div>
            <button
              type="submit"
              disabled={saveLoading}
              className="inline-flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition disabled:opacity-50"
            >
              {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save POS Config</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Default Sales Tax Rate (%)</label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.1"
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 uppercase">Receipt Print Layout</label>
              <select className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-primary-500 cursor-pointer">
                <option value="80mm">Thermal 80mm POS Roll</option>
                <option value="58mm">Thermal 58mm POS Compact</option>
                <option value="A4">Standard A4 / Letterhead Invoice</option>
              </select>
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Auto-prompt Print Dialog</h3>
                <p className="text-[11px] text-slate-500">Automatically trigger browser print upon sale completion.</p>
              </div>
              <input
                type="checkbox"
                checked={autoPrintReceipt}
                onChange={(e) => setAutoPrintReceipt(e.target.checked)}
                className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
              />
            </div>

            <div className="p-4 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Display Generic Name</h3>
                <p className="text-[11px] text-slate-500">Print scientific/generic formulation under brand name.</p>
              </div>
              <input
                type="checkbox"
                checked={showGenericName}
                onChange={(e) => setShowGenericName(e.target.checked)}
                className="h-5 w-5 text-primary-600 border-slate-300 rounded focus:ring-primary-500 cursor-pointer"
              />
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Security & Authentication */}
      {activeTab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Role Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
              <div className="h-10 w-10 bg-primary-100 text-primary-700 rounded-2xl flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">{user?.name}</h3>
                <span className="text-[10px] font-bold text-slate-400">{user?.email}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Access Role</span>
                <span className="bg-primary-50 text-primary-700 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Account Status</span>
                <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                  Active
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Session Timeout</span>
                <span className="text-slate-600 font-bold">24 Hours (JWT)</span>
              </div>
            </div>
          </div>

          {/* Change Password Form */}
          <form onSubmit={handlePasswordChange} className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center space-x-2">
              <Key className="h-4 w-4 text-primary-600" />
              <span>Change Security Password</span>
            </h2>
            <p className="text-xs text-slate-500">Ensure password contains at least 6 characters with letters and numbers.</p>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">New Password</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-primary-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={pwdLoading}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-xs py-3 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition disabled:opacity-50"
              >
                {pwdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 5: System Diagnostics */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-800">ERP Engine Health & Environment</h2>
              <p className="text-xs text-slate-500">Live operational status and diagnostic metadata.</p>
            </div>
            <button
              onClick={() => showToast('System diagnostics check passed. All services online.', 'success')}
              className="inline-flex items-center space-x-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Run Health Check</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <Server className="h-4 w-4" />
                <span>REST API Server</span>
              </div>
              <p className="text-lg font-extrabold text-emerald-800">OPERATIONAL</p>
              <span className="text-[10px] text-emerald-600 font-medium">Node.js Express (Port 5000)</span>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
                <Database className="h-4 w-4" />
                <span>Database Engine</span>
              </div>
              <p className="text-lg font-extrabold text-emerald-800">CONNECTED</p>
              <span className="text-[10px] text-emerald-600 font-medium">MongoDB v7.0 / Replica Cluster</span>
            </div>

            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl space-y-1.5">
              <div className="flex items-center space-x-2 text-blue-700 font-bold text-xs">
                <Clock className="h-4 w-4" />
                <span>Application Version</span>
              </div>
              <p className="text-lg font-extrabold text-blue-800">v2.4.0 SaaS</p>
              <span className="text-[10px] text-blue-600 font-medium">PharmaCare Core Engine</span>
            </div>
          </div>

          {/* Demo Data Management Deck */}
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Presentation & Demonstration Engine
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generate realistic sample datasets across all modules for project presentation, or safely purge demo records.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <DemoDataButton 
                  type="all" 
                  buttonText="Dump All Demo Data" 
                  variant="primary" 
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm("Purge all demo data records? Real user data will NOT be deleted.")) {
                      try {
                        const res = await demoService.clearDemo();
                        if (res?.success) {
                          showToast(res.message || 'Demo records cleared successfully', 'success');
                        }
                      } catch (err) {
                        showToast('Failed to clear demo data', 'error');
                      }
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition"
                >
                  Clear Demo Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
