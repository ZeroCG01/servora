import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useEcho } from '../context/EchoContext';
import { Utensils, LogOut, Wifi, WifiOff, ChefHat, UserCheck, Shield } from 'lucide-react';

export function Navbar({ onLogout, activeTab, onTabChange }) {
  const { user, role, assignedStations, logout, isAdmin, isWaiter, isKitchen } = useAuth();
  const { isConnected } = useEcho();

  const handleLogout = async () => {
    if (window.confirm('Apakah Anda yakin ingin keluar dari sistem Servora?')) {
      if (onLogout) {
        onLogout();
      } else {
        await logout();
      }
    }
  };

  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-800 text-brand-100 border border-brand-700">
          <Shield className="w-3 h-3 text-brand-300" />
          Admin / Manager
        </span>
      );
    }
    if (isWaiter) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-200 text-brand-900 border border-brand-300">
          <UserCheck className="w-3 h-3 text-brand-700" />
          Waiter & Kasir
        </span>
      );
    }
    if (isKitchen) {
      const stationNames = assignedStations.map((s) => s.name).join(', ') || 'Semua Stasiun';
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
          <ChefHat className="w-3 h-3 text-amber-700" />
          {stationNames}
        </span>
      );
    }
    return null;
  };

  return (
    <header className="bg-white border-b border-brand-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 flex items-center justify-center text-white shadow-md">
              <Utensils className="w-5 h-5 text-brand-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-brand-900 font-display">
                  SERVORA
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-sm bg-brand-100 text-brand-800 border border-brand-300">
                  POS & KDS
                </span>
              </div>
              <p className="text-[11px] text-brand-500 font-medium hidden sm:block">
                Restaurant Order & Kitchen Management System
              </p>
            </div>
          </div>

          {/* Right Section: Connection Status, User Profile, Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Realtime Status Indicator */}
            <div
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-stone-100 text-stone-600 border-stone-200'
              }`}
              title={isConnected ? 'Terhubung ke server Reverb WebSocket' : 'Menghubungkan ke server Reverb...'}
            >
              {isConnected ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  <span>Realtime Aktif</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-stone-400"></span>
                  <WifiOff className="w-3 h-3 text-stone-500" />
                  <span>Menghubungkan...</span>
                </>
              )}
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="text-xs font-bold text-brand-900 leading-tight">
                  {user?.name || user?.username}
                </p>
                <div className="mt-0.5">{getRoleBadge()}</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-brand-500 hover:text-rose-600 hover:bg-rose-50 border border-brand-200 transition-colors ml-1"
              title="Keluar / Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;

