import React from 'react';

export function StatusBadge({ status, label, size = 'md' }) {
  const normalized = (status || '').toLowerCase();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const statusStyles = {
    // Order / Item Status
    scheduled: 'bg-amber-100 text-amber-900 border border-amber-300',
    pending: 'bg-blue-100 text-blue-900 border border-blue-300',
    in_progress: 'bg-orange-100 text-orange-900 border border-orange-300 animate-pulse',
    on_progress: 'bg-orange-100 text-orange-900 border border-orange-300 animate-pulse',
    ready: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
    served: 'bg-stone-200 text-stone-700 border border-stone-300',
    cancelled: 'bg-rose-100 text-rose-800 border border-rose-300',

    // Payment Status
    paid: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
    partially_paid: 'bg-amber-100 text-amber-900 border border-amber-300',
    unpaid: 'bg-rose-100 text-rose-800 border border-rose-300',
  };

  const defaultStyle = 'bg-stone-100 text-stone-800 border border-stone-300';
  const appliedStyle = statusStyles[normalized] || defaultStyle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full uppercase tracking-wider ${sizeClasses[size]} ${appliedStyle}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75"></span>
      {label || status}
    </span>
  );
}

export default StatusBadge;

