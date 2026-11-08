import React from 'react';

export function LoadingSpinner({ size = 'md', text = 'Memuat data...' }) {
  const sizeMap = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div
        className={`${sizeMap[size]} rounded-full border-brand-200 border-t-brand-600 animate-spin`}
      />
      {text && <p className="text-xs font-semibold text-brand-600 animate-pulse">{text}</p>}
    </div>
  );
}

export default LoadingSpinner;

