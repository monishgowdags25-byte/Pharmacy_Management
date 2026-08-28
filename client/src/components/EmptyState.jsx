import React from 'react';
import { PackageOpen, Plus } from 'lucide-react';

const EmptyState = ({ 
  title = 'No records found', 
  message = 'There is currently no data in this directory. Add a new record to get started.', 
  onAction,
  actionText = 'Add Record'
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-slate-50 border border-dashed border-slate-200 rounded-3xl max-w-xl mx-auto text-center">
      <div className="bg-slate-100/80 text-slate-400 p-5 rounded-2xl mb-4 border border-slate-200/50">
        <PackageOpen className="h-10 w-10 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">{message}</p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-primary-600/10 hover:shadow-primary-600/25 transition active:scale-95"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
