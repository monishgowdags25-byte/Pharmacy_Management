import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const ErrorState = ({ 
  title = 'Something went wrong', 
  message = 'An error occurred while loading this section. Please try again.', 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 bg-rose-50/30 border border-rose-100 rounded-2xl max-w-lg mx-auto text-center">
      <div className="bg-rose-50 text-rose-500 p-4 rounded-full mb-4 border border-rose-100 shadow-inner">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-2 bg-white text-slate-700 hover:text-slate-800 hover:bg-slate-50 border border-slate-200 hover:border-slate-300 font-bold text-sm px-5 py-2.5 rounded-xl shadow-sm transition active:scale-95"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

export default ErrorState;
