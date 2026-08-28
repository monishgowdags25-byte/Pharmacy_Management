import React, { useState } from 'react';
import demoService from '../services/demoService';
import { useToast } from '../context/ToastContext';
import { Sparkles, Loader2 } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

const DemoDataButton = ({
  type = 'all',
  buttonText = 'Dump Dummy Data',
  onSuccess,
  className = '',
  variant = 'outline'
}) => {
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const getServiceCall = () => {
    switch (type) {
      case 'categories': return demoService.seedCategories;
      case 'medicines': return demoService.seedMedicines;
      case 'inventory': return demoService.seedInventory;
      case 'suppliers': return demoService.seedSuppliers;
      case 'purchases': return demoService.seedPurchases;
      case 'sales': return demoService.seedSales;
      case 'customers': return demoService.seedCustomers;
      case 'prescriptions': return demoService.seedPrescriptions;
      case 'returns': return demoService.seedReturns;
      case 'expenses': return demoService.seedExpenses;
      case 'notifications': return demoService.seedNotifications;
      case 'audit-logs': return demoService.seedAuditLogs;
      case 'users': return demoService.seedUsers;
      case 'reports':
      case 'all':
      default: return demoService.seedAll;
    }
  };

  const handleGenerate = async () => {
    setConfirmOpen(false);
    setLoading(true);

    try {
      const serviceFn = getServiceCall();
      const res = await serviceFn();

      if (res?.success) {
        showToast(res.message || 'Demo data generated successfully into MongoDB!', 'success');
        if (typeof onSuccess === 'function') {
          onSuccess(res.data);
        }
      } else {
        showToast(res?.message || 'Failed to generate demo data', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Demo data generation failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Styling based on variant
  const baseClasses = 'inline-flex items-center gap-2 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-sm focus:ring-emerald-500'
    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 dark:hover:bg-emerald-900/60 focus:ring-emerald-500';

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        className={`${baseClasses} ${variantClasses} ${className}`}
        title="Populate authentic demo records for demonstration"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            <span>Generating Demo Data...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      <ConfirmationDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleGenerate}
        title="Generate Demo Data?"
        message="This will add authentic pharmacy records directly into your MongoDB database for demonstration. Existing data will not be deleted."
        confirmText="Generate Data"
        cancelText="Cancel"
        type="info"
        loading={loading}
      />
    </>
  );
};

export default DemoDataButton;
