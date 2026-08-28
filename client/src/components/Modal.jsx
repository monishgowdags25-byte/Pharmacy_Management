import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  // Lock body scroll and handle Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-dialog-title"
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-white rounded-2xl sm:rounded-3xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200/80 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-auto ${sizeClasses[size] || sizeClasses.md}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 shrink-0">
          <h3 id="modal-dialog-title" className="text-base sm:text-lg font-bold text-slate-800 tracking-tight truncate pr-4">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog window"
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body with customized scrolling */}
        <div className="mt-3 sm:mt-4 overflow-y-auto pr-1 flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
