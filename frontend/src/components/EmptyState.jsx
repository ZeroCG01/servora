import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'Belum Ada Data',
  description = 'Tidak ada item yang ditemukan saat ini.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50">
      <div className="p-3 bg-brand-100 text-brand-600 rounded-2xl mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-brand-900 mb-1">{title}</h3>
      <p className="text-xs text-brand-600 max-w-sm mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

export default EmptyState;

