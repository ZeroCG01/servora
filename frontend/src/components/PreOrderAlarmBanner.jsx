import React from 'react';
import { BellRing, Clock, X, ChefHat } from 'lucide-react';

export function PreOrderAlarmBanner({ alarms = [], onDismiss }) {
  if (!alarms || alarms.length === 0) return null;

  return (
    <div className="fixed top-20 inset-x-4 z-50 max-w-4xl mx-auto flex flex-col gap-2 pointer-events-none">
      {alarms.map((alarm) => (
        <div
          key={alarm.order_id || alarm.order_number}
          className="pointer-events-auto bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white p-4 rounded-2xl shadow-2xl border-2 border-white/50 flex items-center justify-between gap-4 alarm-pulse animate-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-white text-rose-600 rounded-xl shadow-md shrink-0 animate-bounce">
              <BellRing className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-white/20 border border-white/40">
                  Alarm Pre-Order H-10 Menit!
                </span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-100">
                  <Clock className="w-3.5 h-3.5" />
                  Pukul {alarm.scheduled_time || '10:00'} WIB
                </span>
              </div>

              <h4 className="text-base font-extrabold tracking-tight mt-0.5">
                Pesanan #{alarm.order_number} — {alarm.customer_name || 'Pelanggan Pre-Order'}
              </h4>

              <p className="text-xs text-amber-50 mt-0.5 font-medium">
                {alarm.alert_message || 'Pesanan harus segera dimasak sekarang agar tepat waktu!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onDismiss && onDismiss(alarm.order_id)}
              className="px-4 py-2 rounded-xl bg-white text-rose-700 hover:bg-amber-50 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Matikan Alarm
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default PreOrderAlarmBanner;

