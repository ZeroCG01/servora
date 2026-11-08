import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';
import { useEcho } from '../../context/EchoContext';
import { useSound } from '../../context/SoundContext';
import { formatRupiah } from '../../utils/format';
import Button from '../../components/Button';
import Input from '../../components/Input';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import ActiveOrdersList from './ActiveOrdersList';
import PaymentModal from './PaymentModal';
import {
  Utensils,
  ShoppingBag,
  Clock,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Receipt,
  RotateCcw,
  Coffee,
  Sparkles,
} from 'lucide-react';

export default function WaiterPOS() {
  const { echo } = useEcho();
  const { playNewOrderSound, playPreOrderAlarmSound } = useSound();

  // Screen Tabs: 'pos' (new order) or 'orders' (active/history)
  const [activeScreenTab, setActiveScreenTab] = useState('pos');

  // Master Data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // POS State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orderType, setOrderType] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [selectedTableId, setSelectedTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Pre-Order State
  const [isPreOrder, setIsPreOrder] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [downPaymentAmount, setDownPaymentAmount] = useState('');

  // Cart State: Array of { product, quantity, special_instructions }
  const [cart, setCart] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Payment Modal State
  const [paymentModalOrder, setPaymentModalOrder] = useState(null);

  // Generate unique client_request_id for idempotency
  const [clientRequestId, setClientRequestId] = useState(() =>
    'req_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36)
  );

  // Load Initial Data
  const fetchInitialData = async () => {
    try {
      setIsLoading(true);
      const [catRes, prodRes, tabRes, ordRes] = await Promise.all([
        apiClient.get('/categories'),
        apiClient.get('/products'),
        apiClient.get('/tables'),
        apiClient.get('/orders'),
      ]);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setTables(tabRes.data.data || []);
      setOrders(ordRes.data.data || []);
    } catch (err) {
      console.error('Error fetching POS data:', err);
      showNotification('error', 'Gagal memuat data master restoran.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrders = async () => {
    try {
      const [ordRes, tabRes, prodRes] = await Promise.all([
        apiClient.get('/orders'),
        apiClient.get('/tables'),
        apiClient.get('/products'),
      ]);
      setOrders(ordRes.data.data || []);
      setTables(tabRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (err) {
      console.error('Error refreshing orders:', err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Listen to Reverb Events for real-time updates
  useEffect(() => {
    if (!echo) return;

    const channel = echo.private('waiter.orders');

    channel
      .listen('.order.created', () => {
        refreshOrders();
      })
      .listen('.order.items_added', () => {
        refreshOrders();
      })
      .listen('.order_item.status_updated', () => {
        refreshOrders();
      })
      .listen('.order.status_updated', () => {
        refreshOrders();
      })
      .listen('.product.availability_updated', () => {
        refreshOrders();
      });

    return () => {
      echo.leave('waiter.orders');
    };
  }, [echo]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'all' && p.category_id !== parseInt(selectedCategory)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  }, [cart]);

  // Set default down payment when pre-order toggled or subtotal changed
  useEffect(() => {
    if (isPreOrder) {
      const defaultDp = Math.ceil(cartSubtotal * 0.5);
      setDownPaymentAmount(defaultDp > 0 ? String(defaultDp) : '');
    } else {
      setDownPaymentAmount('');
    }
  }, [isPreOrder, cartSubtotal]);

  // Add Product to Cart
  const handleAddToCart = (product) => {
    if (!product.is_available || (product.track_stock && product.stock_quantity <= 0)) {
      showNotification('error', `Menu ${product.name} sedang habis / sold out.`);
      return;
    }

    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        // Check stock limitation
        if (product.track_stock && currentQty + 1 > product.stock_quantity) {
          showNotification('error', `Sisa stok porsi ${product.name} hanya ${product.stock_quantity}.`);
          return prev;
        }
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: currentQty + 1,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            special_instructions: '',
          },
        ];
      }
    });
  };

  // Modify Quantity
  const handleUpdateQty = (index, delta) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      if (item.product.track_stock && newQty > item.product.stock_quantity) {
        showNotification('error', `Maksimum stok ${item.product.name} adalah ${item.product.stock_quantity}.`);
        return prev;
      }
      const updated = [...prev];
      updated[index] = { ...item, quantity: newQty };
      return updated;
    });
  };

  // Update Item Special Instructions
  const handleUpdateInstructions = (index, notes) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], special_instructions: notes };
      return updated;
    });
  };

  // Remove from Cart
  const handleRemoveFromCart = (index) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear Entire Cart
  const handleClearCart = () => {
    setCart([]);
    setSelectedTableId('');
    setCustomerName('');
    setOrderNotes('');
    setIsPreOrder(false);
    setScheduledFor('');
    setDownPaymentAmount('');
    setClientRequestId('req_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36));
  };

  // Submit Order
  const handleSubmitOrder = async (openPaymentImmediately = false) => {
    if (cart.length === 0) {
      showNotification('error', 'Silakan pilih menu terlebih dahulu.');
      return;
    }

    if (orderType === 'dine_in' && !selectedTableId) {
      showNotification('error', 'Pilih nomor meja untuk pesanan Dine-in.');
      return;
    }

    if (isPreOrder) {
      if (!scheduledFor) {
        showNotification('error', 'Waktu penyajian Pre-Order wajib diisi.');
        return;
      }
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate <= new Date()) {
        showNotification('error', 'Waktu penyajian Pre-Order harus di masa mendatang.');
        return;
      }
      const dp = parseFloat(downPaymentAmount) || 0;
      if (dp <= 0) {
        showNotification('error', 'Pre-Order wajib menyertakan Down Payment (DP).');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        client_request_id: clientRequestId,
        order_type: orderType,
        customer_name: customerName.trim() || null,
        notes: orderNotes.trim() || null,
        items: cart.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          special_instructions: i.special_instructions.trim() || null,
        })),
      };

      if (orderType === 'dine_in') {
        payload.dining_table_id = parseInt(selectedTableId);
      }

      if (isPreOrder) {
        payload.scheduled_for = scheduledFor;
        // Include DP payment if submitted together
        payload.payment = {
          payment_type: 'down_payment',
          payment_method: 'cash',
          amount: parseFloat(downPaymentAmount),
          notes: 'Down Payment (DP) Pre-Order Kasir',
        };
      }

      const res = await apiClient.post('/orders', payload);
      const createdOrder = res.data.data;

      showNotification('success', `Pesanan #${createdOrder.order_number} berhasil dibuat!`);
      handleClearCart();
      await refreshOrders();

      if (openPaymentImmediately) {
        setPaymentModalOrder(createdOrder);
      }
    } catch (err) {
      console.error('Error creating order:', err);
      showNotification('error', err.response?.data?.message || 'Gagal membuat pesanan. Periksa input Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat menu & meja POS Servora..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Screen Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-brand-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveScreenTab('pos')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
              activeScreenTab === 'pos'
                ? 'bg-brand-800 text-white shadow-md'
                : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'
            }`}
          >
            <Utensils className="w-4 h-4" />
            Kasir / Buat Pesanan Baru
          </button>

          <button
            onClick={() => setActiveScreenTab('orders')}
            className={`px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 relative ${
              activeScreenTab === 'orders'
                ? 'bg-brand-800 text-white shadow-md'
                : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'
            }`}
          >
            <Receipt className="w-4 h-4" />
            Pesanan Aktif & Riwayat
            {orders.filter((o) => ['pending', 'in_progress', 'ready'].includes(o.status)).length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-500 text-white font-black animate-pulse">
                {orders.filter((o) => ['pending', 'in_progress', 'ready'].includes(o.status)).length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={refreshOrders}
          className="p-2.5 rounded-xl border border-brand-200 bg-white text-brand-700 hover:bg-brand-50 transition-colors"
          title="Segarkan Data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Render Active Orders List if tab selected */}
      {activeScreenTab === 'orders' ? (
        <ActiveOrdersList
          orders={orders}
          onRefresh={refreshOrders}
          products={products}
          onOpenPayment={(ord) => setPaymentModalOrder(ord)}
        />
      ) : (
        /* Render POS Screen */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Catalog (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search & Category Filter */}
            <div className="bg-white p-4 rounded-3xl border border-brand-200 shadow-xs space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-400" />
                <input
                  type="text"
                  placeholder="Cari menu makanan atau minuman..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-brand-200 bg-brand-50/50 text-brand-950 placeholder-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-700 font-medium text-sm"
                />
              </div>

              {/* Station/Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-brand-700 text-white shadow-xs'
                      : 'bg-brand-100/70 text-brand-800 hover:bg-brand-200/80'
                  }`}
                >
                  Semua ({products.length})
                </button>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category_id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(String(cat.id))}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === String(cat.id)
                          ? 'bg-brand-700 text-white shadow-xs'
                          : 'bg-brand-100/70 text-brand-800 hover:bg-brand-200/80'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-brand-200 p-8">
                <EmptyState
                  title="Menu tidak ditemukan"
                  description="Coba ubah kata kunci pencarian atau kategori filter."
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {filteredProducts.map((product) => {
                  const isSoldOut = !product.is_available || (product.track_stock && product.stock_quantity <= 0);
                  const inCartQty = cart.find((i) => i.product.id === product.id)?.quantity || 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isSoldOut && handleAddToCart(product)}
                      className={`group relative rounded-2xl border p-3.5 flex flex-col justify-between transition-all select-none cursor-pointer ${
                        isSoldOut
                          ? 'bg-brand-50/50 border-brand-200 opacity-60 cursor-not-allowed'
                          : 'bg-white border-brand-200 hover:border-brand-600 hover:shadow-md active:scale-[0.98]'
                      }`}
                    >
                      {/* In Cart Badge */}
                      {inCartQty > 0 && (
                        <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-brand-800 text-white text-xs font-black flex items-center justify-center shadow-xs">
                          {inCartQty}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-brand-600 bg-brand-100/70 px-2 py-0.5 rounded-md">
                            {product.category?.name || 'Menu'}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-brand-950 text-sm leading-snug line-clamp-2">
                          {product.name}
                        </h3>

                        {product.description && (
                          <p className="text-xs text-brand-500 line-clamp-1">{product.description}</p>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-brand-100 flex items-center justify-between">
                        <span className="font-black text-brand-900 text-sm font-mono">
                          {formatRupiah(product.price)}
                        </span>

                        {isSoldOut ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-rose-100 text-rose-800">
                            Habis
                          </span>
                        ) : product.track_stock ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              product.stock_quantity <= 5
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-brand-100 text-brand-700'
                            }`}
                          >
                            Sisa {product.stock_quantity}
                          </span>
                        ) : (
                          <span className="w-6 h-6 rounded-lg bg-brand-50 group-hover:bg-brand-800 group-hover:text-white flex items-center justify-center text-brand-700 transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Cart & Checkout Panel (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-brand-200 p-5 shadow-xs space-y-5">
              {/* Order Settings (Type, Table, Customer) */}
              <div className="space-y-3 pb-4 border-b border-brand-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-brand-950 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-brand-700" />
                    Pesanan Baru
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={handleClearCart}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Dine-In vs Takeaway Selector */}
                <div className="grid grid-cols-2 gap-2 bg-brand-100/60 p-1 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('dine_in');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      orderType === 'dine_in'
                        ? 'bg-white text-brand-900 shadow-xs'
                        : 'text-brand-600 hover:text-brand-900'
                    }`}
                  >
                    <Utensils className="w-3.5 h-3.5" />
                    Dine-in (Makan Sini)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('takeaway');
                      setSelectedTableId('');
                    }}
                    className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      orderType === 'takeaway'
                        ? 'bg-white text-brand-900 shadow-xs'
                        : 'text-brand-600 hover:text-brand-900'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Takeaway (Bungkus)
                  </button>
                </div>

                {/* Table Picker if Dine-in */}
                {orderType === 'dine_in' && (
                  <div>
                    <label className="block text-xs font-bold text-brand-800 mb-1">
                      Pilih Meja Tamu <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedTableId}
                      onChange={(e) => setSelectedTableId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                    >
                      <option value="">-- Pilih Nomor Meja --</option>
                      {tables.map((t) => (
                        <option key={t.id} value={t.id}>
                          Meja {t.table_number} ({t.capacity} kursi) -{' '}
                          {t.status === 'occupied' ? 'Terisi' : 'Kosong'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Name */}
                <div>
                  <label className="block text-xs font-bold text-brand-800 mb-1">
                    Nama Pemesan / Tamu {orderType === 'takeaway' && <span className="text-rose-600">*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Bambang"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 placeholder-brand-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>

                {/* Pre-Order Toggle */}
                <div className="pt-2">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-50 border border-brand-200">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-700" />
                      <div>
                        <div className="text-xs font-black text-brand-900">Jadwalkan Pre-Order</div>
                        <div className="text-[11px] text-brand-600">Pesanan disiapkan pada waktu khusus</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPreOrder}
                        onChange={(e) => setIsPreOrder(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-brand-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-800"></div>
                    </label>
                  </div>

                  {/* Pre-Order Details */}
                  {isPreOrder && (
                    <div className="mt-2.5 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Waktu Penyajian (Scheduled) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={scheduledFor}
                          onChange={(e) => setScheduledFor(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-brand-950 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <p className="text-[11px] text-amber-800 mt-1 flex items-center gap-1 font-medium">
                          🔔 Alarm otomatis berbunyi di dapur H-10 menit.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1">
                          Nominal Down Payment (DP) <span className="text-rose-600">*</span>
                        </label>
                        <input
                          type="number"
                          placeholder="Nominal DP"
                          value={downPaymentAmount}
                          onChange={(e) => setDownPaymentAmount(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                        />
                        <div className="flex items-center gap-1.5 mt-2">
                          <button
                            type="button"
                            onClick={() => setDownPaymentAmount(String(Math.ceil(cartSubtotal * 0.25)))}
                            className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-300"
                          >
                            DP 25%
                          </button>
                          <button
                            type="button"
                            onClick={() => setDownPaymentAmount(String(Math.ceil(cartSubtotal * 0.5)))}
                            className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-300"
                          >
                            DP 50%
                          </button>
                          <button
                            type="button"
                            onClick={() => setDownPaymentAmount(String(cartSubtotal))}
                            className="px-2.5 py-1 rounded-lg bg-amber-200/80 text-amber-900 text-xs font-bold hover:bg-amber-300"
                          >
                            Lunas (100%)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Cart Items List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-brand-600 tracking-wider">
                    Menu Dipilih ({cart.reduce((s, i) => s + i.quantity, 0)})
                  </span>
                  <span className="text-xs font-bold text-brand-700">Harga Nett (Termasuk PB1)</span>
                </div>

                {cart.length === 0 ? (
                  <div className="py-8 text-center text-brand-400">
                    <Utensils className="w-8 h-8 mx-auto opacity-30 mb-2" />
                    <p className="text-xs font-medium">Keranjang masih kosong.</p>
                    <p className="text-[11px] opacity-75">Klik menu di sebelah kiri untuk menambah.</p>
                  </div>
                ) : (
                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {cart.map((item, idx) => (
                      <div
                        key={item.product.id}
                        className="p-3 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-extrabold text-brand-950 text-xs">{item.product.name}</div>
                            <div className="text-[11px] font-mono text-brand-600">
                              {formatRupiah(item.product.price)} x {item.quantity} ={' '}
                              <span className="font-bold text-brand-900">
                                {formatRupiah(item.product.price * item.quantity)}
                              </span>
                            </div>
                          </div>

                          {/* Stepper Quantity */}
                          <div className="flex items-center gap-1.5 bg-white border border-brand-200 rounded-xl p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, -1)}
                              className="p-1 hover:bg-brand-100 rounded-lg text-brand-800 transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-black text-brand-950 font-mono">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(idx, 1)}
                              className="p-1 hover:bg-brand-100 rounded-lg text-brand-800 transition-colors"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Special Instructions Note */}
                        <input
                          type="text"
                          placeholder="Catatan menu (mis: jangan pedas, es dipisah)..."
                          value={item.special_instructions}
                          onChange={(e) => handleUpdateInstructions(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl border border-brand-200 bg-white text-[11px] text-brand-900 placeholder-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-700"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Catatan umum pesanan (opsional)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 placeholder-brand-400 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
                />
              </div>

              {/* Summary & Checkout Actions */}
              <div className="pt-3 border-t border-brand-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-600">Total Pembayaran (Nett)</span>
                  <span className="text-lg font-black text-brand-950 font-mono">
                    {formatRupiah(cartSubtotal)}
                  </span>
                </div>

                {isPreOrder && (
                  <div className="flex items-center justify-between text-xs text-amber-900 bg-amber-100/70 p-2.5 rounded-xl">
                    <span className="font-bold">Wajib Bayar DP Sekarang:</span>
                    <span className="font-black font-mono">
                      {formatRupiah(parseFloat(downPaymentAmount) || 0)}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={cart.length === 0 || isSubmitting}
                    onClick={() => handleSubmitOrder(false)}
                    className="w-full text-xs py-2.5"
                  >
                    Simpan Pesanan
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    disabled={cart.length === 0 || isSubmitting}
                    isLoading={isSubmitting}
                    onClick={() => handleSubmitOrder(true)}
                    className="w-full text-xs py-2.5 shadow-md"
                  >
                    {isPreOrder ? 'Simpan & Bayar DP' : 'Simpan & Bayar Kasir'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {paymentModalOrder && (
        <PaymentModal
          isOpen={!!paymentModalOrder}
          onClose={() => setPaymentModalOrder(null)}
          order={paymentModalOrder}
          onSuccess={() => {
            showNotification('success', 'Pembayaran kasir berhasil dicatat!');
            refreshOrders();
          }}
        />
      )}
    </div>
  );
}

