import React from 'react';
import Modal from './Modal';
import { AlertCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  type = 'warning', // 'warning', 'danger', 'info'
  loading = false
}) => {
  const iconMap = {
    danger: <AlertCircle className="h-9 w-9 text-rose-500" />,
    warning: <AlertTriangle className="h-9 w-9 text-amber-500" />,
    info: <HelpCircle className="h-9 w-9 text-blue-500" />,
  };

  const buttonMap = {
    danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20',
    info: 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="flex flex-col items-center text-center p-2 space-y-4">
        {/* Icon Badge */}
        <div className={`p-4 rounded-2xl ${
          type === 'danger' ? 'bg-rose-50 text-rose-600' : type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
        }`}>
          {iconMap[type] || iconMap.info}
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-600 max-w-xs leading-relaxed font-medium">
          {message}
        </p>

        {/* Actions Buttons */}
        <div className="flex items-center space-x-3 w-full pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shadow-sm disabled:opacity-50 ${
              buttonMap[type] || buttonMap.info
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
