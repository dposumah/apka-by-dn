import React from 'react';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center space-x-2 h-full w-full p-8 min-h-[200px]">
      <div className="w-3 h-3 bg-emerald-600 rounded-full animate-bounce-wave animation-delay-0 shadow-md"></div>
      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce-wave animation-delay-150 shadow-md"></div>
      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-bounce-wave animation-delay-300 shadow-md"></div>
    </div>
  );
}

export function FullPageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] h-full w-full bg-slate-50/50">
      <div className="flex items-center justify-center space-x-2.5">
        <div className="w-3.5 h-3.5 bg-blue-600 rounded-full animate-bounce-wave animation-delay-0 shadow-sm"></div>
        <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-bounce-wave animation-delay-150 shadow-sm"></div>
        <div className="w-3.5 h-3.5 bg-amber-500 rounded-full animate-bounce-wave animation-delay-300 shadow-sm"></div>
      </div>
      <p className="mt-4 text-sm font-medium text-slate-500 tracking-wider">MEMUAT...</p>
    </div>
  );
}
