import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useEcho } from '../../context/EchoContext';
import { useSound } from '../../context/SoundContext';
import KitchenStockDrawer from './KitchenStockDrawer';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatTime, timeAgo } from '../../utils/format';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Utensils,
  ShoppingBag,
  Bell,
  Sliders,
  RotateCcw,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export default function KitchenDisplay() {
  const { user, isAdmin, isKitchen } = useAuth();
  const { echo } = useEcho();
  const { playNewOrderSound, playPreOrderAlarmSound } = useSound();

  // Selected Station Filter (Category ID)
  const defaultStationId = user?.assigned_stations?.[0]?.id || null;
  const [selectedStationId, setSelectedStationId] = useState(defaultStationId);
  const [categories, setCategories] = useState([]);

  // Kanban Data: { pending: [], on_progress: [], ready: [] }
  const [kanban, setKanban] = useState({ pending: [], on_progress: [], ready: [] });
  const [scheduledOrders, setScheduledOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState({});

  // Drawer & Sound State
  const [isStockDrawerOpen, setIsStockDrawerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Fetch Categories for Admin or Multi-station user
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await apiClient.get('/categories');
        setCategories(res.data.data || []);
        if (!selectedStationId && res.data.data?.length > 0) {
          setSelectedStationId(res.data.data[0].id);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  // Fetch Kanban Tickets
  const fetchTickets = useCallback(async () => {
    try {
      const params = selectedStationId ? { category_id: selectedStationId } : {};
      const [ticketsRes, schedRes] = await Promise.all([
        apiClient.get('/kitchen/orders', { params }),
        apiClient.get('/kitchen/scheduled', { params }),
      ]);
      setKanban(ticketsRes.data.data || { pending: [], on_progress: [], ready: [] });
      setScheduledOrders(schedRes.data.data || []);
    } catch (err) {
      console.error('Error fetching kitchen tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStationId]);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, 15000); // Polling safety net
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!echo) return;

    // Determine stations to listen to
    const targetCategories = isKitchen && user?.assigned_stations?.length
      ? user.assigned_stations
      : categories;

    targetCategories.forEach((cat) => {
      const channel = echo.private(`kitchen.category.${cat.id}`);
      channel
        .listen('.order.created', () => {
          if (soundEnabled) playNewOrderSound();
          fetchTickets();
        })
        .listen('.order.items_added', () => {
          if (soundEnabled) playNewOrderSound();
          fetchTickets();
        })
        .listen('.order_item.status_updated', () => {
          fetchTickets();
        })
        .listen('.preorder.alarm', () => {
          if (soundEnabled) playPreOrderAlarmSound();
          fetchTickets();
        });
    });

    return () => {
      targetCategories.forEach((cat) => {
        echo.leave(`kitchen.category.${cat.id}`);
      });
    };
  }, [echo, categories, user, isKitchen, soundEnabled, fetchTickets, playNewOrderSound, playPreOrderAlarmSound]);

  // Handle Item Status Change
  const handleUpdateStatus = async (itemId, newStatus) => {
    setIsUpdatingStatus((prev) => ({ ...prev, [itemId]: true }));
    try {
      await apiClient.patch(`/kitchen/items/${itemId}/status`, {
        status: newStatus,
      });
      await fetchTickets();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status masakan.');
    } finally {
      setIsUpdatingStatus((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  // Get current station object
  const currentStation = categories.find((c) => c.id === selectedStationId) || {
    id: selectedStationId,
    name: 'Stasiun Dapur',
  };

  // Available station options for user
  const stationOptions = isAdmin
    ? categories
    : user?.assigned_stations?.length
    ? user.assigned_stations
    : categories;

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8 min-h-screen bg-brand-950 text-white flex flex-col font-sans">
      {/* KDS Header Bar */}
      <header className="bg-brand-900 border-b border-brand-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-800 border border-brand-700 flex items-center justify-center text-amber-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display tracking-tight text-white flex items-center gap-2">
              KDS — Layar Antrean Dapur
            </h1>
            <p className="text-xs text-brand-300 font-medium">
              Stasiun Aktif: <span className="text-amber-400 font-bold">{currentStation.name}</span>
            </p>
          </div>
        </div>

        {/* Station Tabs / Filters */}
        <div className="flex items-center gap-1.5 bg-brand-950/80 p-1 rounded-2xl border border-brand-800">
          {stationOptions.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStationId(st.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                selectedStationId === st.id
                  ? 'bg-amber-500 text-brand-950 shadow-md'
                  : 'text-brand-300 hover:text-white hover:bg-brand-900'
              }`}
            >
              {st.name}
            </button>
          ))}
        </div>

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2.5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              if (!soundEnabled) playNewOrderSound();
            }}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold ${
              soundEnabled
                ? 'bg-brand-800 border-brand-700 text-amber-400 hover:bg-brand-700'
                : 'bg-brand-900 border-brand-800 text-brand-400 hover:bg-brand-800'
            }`}
            title={soundEnabled ? 'Suara Aktif' : 'Suara Dimatikan'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Bell On' : 'Bell Off'}</span>
          </button>

          {/* Stock Drawer Button */}
          <button
            type="button"
            onClick={() => setIsStockDrawerOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-800 border border-brand-700 hover:bg-brand-700 text-white text-xs font-black transition-all flex items-center gap-2 shadow-xs"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Kelola Stok & Bahan</span>
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchTickets}
            className="p-2.5 rounded-xl bg-brand-800 border border-brand-700 hover:bg-brand-700 text-brand-300 hover:text-white transition-colors"
            title="Segarkan Tiket"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Scheduled Orders Bar (if any scheduled pre-orders today) */}
      {scheduledOrders.length > 0 && (
        <div className="bg-amber-950/70 border-b border-amber-800/60 px-6 py-2.5 flex items-center gap-3 overflow-x-auto text-xs">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold flex-shrink-0">
            <Clock className="w-4 h-4" />
            <span>Pre-Order Terjadwal Hari Ini ({scheduledOrders.length}):</span>
          </div>
          <div className="flex items-center gap-3">
            {scheduledOrders.map((so) => (
              <div
                key={so.id}
                className="px-3 py-1 rounded-xl bg-amber-900/60 border border-amber-700 text-amber-200 flex items-center gap-2 whitespace-nowrap"
              >
                <span className="font-mono font-bold text-amber-300">
                  {formatTime(so.scheduled_for)}
                </span>
                <span>#{so.order?.order_number}</span>
                <span className="text-amber-400/80">({so.order?.customer_name || 'Tamu'})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main 3-Column Kanban Board */}
      <main className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1: PENDING (Menunggu Masak) */}
        <div className="flex flex-col bg-brand-900/60 rounded-3xl border border-brand-800/80 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-brand-800 bg-amber-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse"></span>
              <h2 className="font-black text-amber-400 text-sm tracking-wide uppercase">
                Menunggu Masak
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {kanban.pending?.length || 0}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" text="Memuat tiket..." />
              </div>
            ) : kanban.pending?.length === 0 ? (
              <div className="py-16 text-center text-brand-500 text-xs">
                Tidak ada pesanan menunggu masak di stasiun ini.
              </div>
            ) : (
              kanban.pending.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-brand-900 border border-brand-700 shadow-md space-y-3 transition-all hover:border-amber-500/60"
                >
                  {/* Card Header: Table & Order Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.order?.order_type === 'dine_in' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-brand-800 border border-brand-700 font-extrabold text-xs text-white flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-amber-400" />
                          Meja {item.order?.dining_table?.table_number || item.order?.dining_table?.number || '-'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 font-extrabold text-xs text-amber-300 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
                          Takeaway
                        </span>
                      )}
                      <span className="text-xs text-brand-400 font-mono font-medium">
                        #{item.order?.order_number}
                      </span>
                    </div>

                    <span className="text-[11px] text-brand-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(item.created_at)}
                    </span>
                  </div>

                  {/* Customer Name */}
                  {item.order?.customer_name && (
                    <div className="text-xs text-brand-300 font-semibold">
                      Tamu: <span className="text-white">{item.order.customer_name}</span>
                    </div>
                  )}

                  {/* Menu Item Name & Big Quantity */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <h3 className="text-lg font-black text-white leading-tight">
                      {item.product_name}
                    </h3>
                    <div className="px-3 py-1.5 rounded-xl bg-amber-500 text-brand-950 font-black text-lg font-mono flex-shrink-0 shadow-xs">
                      x{item.quantity}
                    </div>
                  </div>

                  {/* Special Instructions Alert */}
                  {item.special_instructions && (
                    <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-200 text-xs font-bold flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Catatan: {item.special_instructions}</span>
                    </div>
                  )}

                  {/* Big Action Button: Mulai Masak */}
                  <button
                    type="button"
                    disabled={isUpdatingStatus[item.id]}
                    onClick={() => handleUpdateStatus(item.id, 'on_progress')}
                    className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-brand-950 font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <Flame className="w-4 h-4" />
                    {isUpdatingStatus[item.id] ? 'Memproses...' : 'Mulai Masak'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 2: ON PROGRESS (Sedang Dimasak) */}
        <div className="flex flex-col bg-brand-900/60 rounded-3xl border border-brand-800/80 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-brand-800 bg-sky-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 animate-pulse"></span>
              <h2 className="font-black text-sky-400 text-sm tracking-wide uppercase">
                Sedang Dimasak
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
              {kanban.on_progress?.length || 0}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" text="Memuat tiket..." />
              </div>
            ) : kanban.on_progress?.length === 0 ? (
              <div className="py-16 text-center text-brand-500 text-xs">
                Tidak ada masakan yang sedang diproses saat ini.
              </div>
            ) : (
              kanban.on_progress.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-brand-900 border border-sky-600/40 shadow-md space-y-3 transition-all hover:border-sky-400"
                >
                  {/* Card Header: Table & Order Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.order?.order_type === 'dine_in' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-brand-800 border border-brand-700 font-extrabold text-xs text-white flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-sky-400" />
                          Meja {item.order?.dining_table?.table_number || item.order?.dining_table?.number || '-'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-500/40 font-extrabold text-xs text-sky-300 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                          Takeaway
                        </span>
                      )}
                      <span className="text-xs text-brand-400 font-mono font-medium">
                        #{item.order?.order_number}
                      </span>
                    </div>

                    <span className="text-[11px] text-sky-300 font-medium flex items-center gap-1">
                      <Flame className="w-3 h-3 text-sky-400" />
                      Mulai: {formatTime(item.started_at)}
                    </span>
                  </div>

                  {/* Customer Name */}
                  {item.order?.customer_name && (
                    <div className="text-xs text-brand-300 font-semibold">
                      Tamu: <span className="text-white">{item.order.customer_name}</span>
                    </div>
                  )}

                  {/* Menu Item Name & Big Quantity */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <h3 className="text-lg font-black text-white leading-tight">
                      {item.product_name}
                    </h3>
                    <div className="px-3 py-1.5 rounded-xl bg-sky-500 text-brand-950 font-black text-lg font-mono flex-shrink-0 shadow-xs">
                      x{item.quantity}
                    </div>
                  </div>

                  {/* Special Instructions Alert */}
                  {item.special_instructions && (
                    <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-200 text-xs font-bold flex items-start gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>Catatan: {item.special_instructions}</span>
                    </div>
                  )}

                  {/* Big Action Button: Siap Saji */}
                  <button
                    type="button"
                    disabled={isUpdatingStatus[item.id]}
                    onClick={() => handleUpdateStatus(item.id, 'ready')}
                    className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-brand-950 font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isUpdatingStatus[item.id] ? 'Memproses...' : 'Siap Saji (Ready)'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMN 3: READY (Siap Disajikan / Diambil) */}
        <div className="flex flex-col bg-brand-900/60 rounded-3xl border border-brand-800/80 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-brand-800 bg-emerald-950/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h2 className="font-black text-emerald-400 text-sm tracking-wide uppercase">
                Siap Saji
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {kanban.ready?.length || 0}
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" text="Memuat tiket..." />
              </div>
            ) : kanban.ready?.length === 0 ? (
              <div className="py-16 text-center text-brand-500 text-xs">
                Tidak ada menu siap saji yang menunggu pengantaran.
              </div>
            ) : (
              kanban.ready.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-brand-900 border border-emerald-600/40 shadow-md space-y-3 transition-all hover:border-emerald-400"
                >
                  {/* Card Header: Table & Order Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.order?.order_type === 'dine_in' ? (
                        <span className="px-2.5 py-1 rounded-xl bg-brand-800 border border-brand-700 font-extrabold text-xs text-white flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                          Meja {item.order?.dining_table?.table_number || item.order?.dining_table?.number || '-'}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 font-extrabold text-xs text-emerald-300 flex items-center gap-1">
                          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                          Takeaway
                        </span>
                      )}
                      <span className="text-xs text-brand-400 font-mono font-medium">
                        #{item.order?.order_number}
                      </span>
                    </div>

                    <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Siap: {formatTime(item.ready_at)}
                    </span>
                  </div>

                  {/* Customer Name */}
                  {item.order?.customer_name && (
                    <div className="text-xs text-brand-300 font-semibold">
                      Tamu: <span className="text-white">{item.order.customer_name}</span>
                    </div>
                  )}

                  {/* Menu Item Name & Big Quantity */}
                  <div className="flex items-start justify-between gap-3 pt-1">
                    <h3 className="text-lg font-black text-white leading-tight">
                      {item.product_name}
                    </h3>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500 text-brand-950 font-black text-lg font-mono flex-shrink-0 shadow-xs">
                      x{item.quantity}
                    </div>
                  </div>

                  {/* Big Action Button: Selesai Disajikan */}
                  <button
                    type="button"
                    disabled={isUpdatingStatus[item.id]}
                    onClick={() => handleUpdateStatus(item.id, 'served')}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-brand-950 font-black text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isUpdatingStatus[item.id] ? 'Memproses...' : 'Selesai Disajikan / Diambil'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Kitchen Stock & Raw Material Drawer */}
      <KitchenStockDrawer
        isOpen={isStockDrawerOpen}
        onClose={() => setIsStockDrawerOpen(false)}
        stationId={selectedStationId}
        stationName={currentStation.name}
        onStockUpdated={fetchTickets}
      />
    </div>
  );
}

