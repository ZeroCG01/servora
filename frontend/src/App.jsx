import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EchoProvider, useEcho } from './context/EchoContext';
import { SoundProvider, useSound } from './context/SoundContext';
import Navbar from './components/Navbar';
import LoginPage from './features/auth/LoginPage';
import LoadingSpinner from './components/LoadingSpinner';
import PreOrderAlarmBanner from './components/PreOrderAlarmBanner';
import WaiterPOS from './features/waiter/WaiterPOS';
import KitchenDisplay from './features/kitchen/KitchenDisplay';
import AdminDashboard from './features/admin/AdminDashboard';
import { Utensils, ChefHat, BarChart3, Shield, Monitor } from 'lucide-react';

function MainAppShell() {
  const { user, role, isLoading, logout, isAdmin, isWaiter, isKitchen } = useAuth();
  const { echo } = useEcho();
  const { playNewOrderSound, playPreOrderAlarmSound } = useSound();
  const [alarms, setAlarms] = useState([]);

  // For Admin role switching: 'admin_dashboard' | 'pos' | 'kitchen'
  const [adminView, setAdminView] = useState('admin_dashboard');

  // Real-Time Reverb Listener for Pre-Order Alarms and New Orders
  useEffect(() => {
    if (!echo || !user) return;

    // 1. Waiter Channel
    if (isAdmin || isWaiter) {
      echo.private('waiter.orders')
        .listen('.order.created', (data) => {
          console.log('[Echo] Order created:', data);
          playNewOrderSound();
        })
        .listen('.preorder.alarm', (data) => {
          console.log('[Echo] Pre-order alarm for waiter:', data);
          playPreOrderAlarmSound();
          setAlarms((prev) => {
            if (prev.some((a) => a.order_id === data.order_id)) return prev;
            return [...prev, data];
          });
        });
    }

    // 2. Kitchen Channel
    if (isKitchen && user.assigned_stations) {
      user.assigned_stations.forEach((station) => {
        echo.private(`kitchen.category.${station.id}`)
          .listen('.order.created', (data) => {
            console.log(`[Echo] New ticket for station ${station.name}:`, data);
            playNewOrderSound();
          })
          .listen('.preorder.alarm', (data) => {
            console.log(`[Echo] Alarm for station ${station.name}:`, data);
            playPreOrderAlarmSound();
            setAlarms((prev) => {
              if (prev.some((a) => a.order_id === data.order_id)) return prev;
              return [...prev, data];
            });
          });
      });
    }

    return () => {
      if (isAdmin || isWaiter) {
        echo.leave('waiter.orders');
      }
      if (isKitchen && user.assigned_stations) {
        user.assigned_stations.forEach((station) => {
          echo.leave(`kitchen.category.${station.id}`);
        });
      }
    };
  }, [echo, user, isAdmin, isWaiter, isKitchen, playNewOrderSound, playPreOrderAlarmSound]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <LoadingSpinner size="lg" text="Menyiapkan sesi Servora..." />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleDismissAlarm = (orderId) => {
    setAlarms((prev) => prev.filter((a) => a.order_id !== orderId));
  };

  return (
    <div className="min-h-screen bg-brand-50 flex flex-col font-sans">
      {/* Navbar with brand, status, and logout */}
      <Navbar />

      {/* Floating Audio/Visual Alarm Banner for Pre-Orders */}
      <PreOrderAlarmBanner alarms={alarms} onDismiss={handleDismissAlarm} />

      {/* Admin View Switcher Bar (Only visible if user has role: admin) */}
      {isAdmin && (
        <div className="bg-brand-900 border-b border-brand-800 text-white px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-brand-300">
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Mode Tampilan Admin:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-brand-950 p-1 rounded-xl border border-brand-800">
              <button
                onClick={() => setAdminView('admin_dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminView === 'admin_dashboard'
                    ? 'bg-amber-500 text-brand-950 shadow-xs'
                    : 'text-brand-300 hover:text-white hover:bg-brand-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard Admin
              </button>

              <button
                onClick={() => setAdminView('pos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminView === 'pos'
                    ? 'bg-amber-500 text-brand-950 shadow-xs'
                    : 'text-brand-300 hover:text-white hover:bg-brand-900'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                POS Kasir
              </button>

              <button
                onClick={() => setAdminView('kitchen')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  adminView === 'kitchen'
                    ? 'bg-amber-500 text-brand-950 shadow-xs'
                    : 'text-brand-300 hover:text-white hover:bg-brand-900'
                }`}
              >
                <ChefHat className="w-3.5 h-3.5" />
                Layar Dapur (KDS)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* If user is Waiter, render POS */}
        {isWaiter && <WaiterPOS />}

        {/* If user is Kitchen cook, render KitchenDisplay */}
        {isKitchen && <KitchenDisplay />}

        {/* If user is Admin, render according to adminView */}
        {isAdmin && (
          <>
            {adminView === 'admin_dashboard' && <AdminDashboard />}
            {adminView === 'pos' && <WaiterPOS />}
            {adminView === 'kitchen' && <KitchenDisplay />}
          </>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <EchoProvider>
        <SoundProvider>
          <MainAppShell />
        </SoundProvider>
      </EchoProvider>
    </AuthProvider>
  );
}
