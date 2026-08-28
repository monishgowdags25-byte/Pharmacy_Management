import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const toastStyles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
  },
  error: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    icon: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    text: 'text-blue-800',
    icon: <Info className="h-5 w-5 text-blue-500 shrink-0" />,
  },
};

const Toast = ({ toast, onClose }) => {
  const { message, type, duration } = toast;
  const style = toastStyles[type] || toastStyles.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl border shadow-lg animate-in slide-in-from-bottom-4 duration-300 ${style.bg}`}>
      <div className="flex items-center space-x-3">
        {style.icon}
        <span className={`text-sm font-semibold ${style.text}`}>{message}</span>
      </div>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 focus:outline-none ml-4 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default Toast;
