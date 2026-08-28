import React from 'react';
import { Loader2 } from 'lucide-react';

const Loading = ({ fullScreen = false, message = 'Loading PharmaCare...' }) => {
  return (
    <div className={`flex flex-col items-center justify-center ${
      fullScreen ? 'min-h-screen bg-slate-50' : 'py-12 px-6'
    }`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary-600 animate-spin" />
        <div className="absolute h-14 w-14 rounded-full border-2 border-primary-100 animate-ping opacity-70"></div>
      </div>
      <span className="mt-6 text-sm font-semibold text-slate-500 tracking-wide animate-pulse">
        {message}
      </span>
    </div>
  );
};

export default Loading;
