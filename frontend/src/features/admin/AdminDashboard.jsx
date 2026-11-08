import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/client';
import { useEcho } from '../../context/EchoContext';
import { formatRupiah, formatDateTime, formatDate, formatTime } from '../../utils/format';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Modal from '../../components/Modal';
import Drawer from '../../components/Drawer';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import PaymentModal from '../waiter/PaymentModal';
import {
  LayoutDashboard,
  Utensils,
  BookOpen,
  Layers,
  Users,
  BarChart3,
  Flame,
  ChefHat,
  Coffee,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Sliders,
  Download,
  Calendar,
  Search,
  RotateCcw,
  Shield,
  FileSpreadsheet,
  Grid,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CHART_COLORS = ['#b45309', '#0284c7', '#059669', '#7c3aed', '#db2777'];

export default function AdminDashboard() {
  const { echo } = useEcho();

  // Active View Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, orders, menu, inventory, tables, users, reports

  // Master Data & States
  const [overview, setOverview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [tables, setTables] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // Modals & Drawers
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    track_stock: true,
    stock_quantity: 50,
    is_available: true,
  });

  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category_id: '',
    current_stock: 10,
    minimum_stock: 5,
    unit: 'kg',
  });

  const [isMutasiModalOpen, setIsMutasiModalOpen] = useState(false);
  const [mutasiIngredient, setMutasiIngredient] = useState(null);
  const [mutasiForm, setMutasiForm] = useState({
    change_type: 'in',
    amount: '',
    reason: '',
  });

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableForm, setTableForm] = useState({
    table_number: '',
    capacity: 4,
    status: 'available',
  });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedStationIds, setSelectedStationIds] = useState([]);

  const [selectedOrderPayment, setSelectedOrderPayment] = useState(null);
  const [orderDetailModal, setOrderDetailModal] = useState(null);

  // Reports State
  const [reportRange, setReportRange] = useState({
    startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [reportSummary, setReportSummary] = useState(null);
  const [reportTopProducts, setReportTopProducts] = useState([]);
  const [reportCategorySales, setReportCategorySales] = useState([]);
  const [isReportLoading, setIsReportLoading] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load Overview & Initial Data
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [ovRes, catRes, prodRes, ingRes, tabRes, usrRes, ordRes] = await Promise.all([
        apiClient.get('/dashboard/overview'),
        apiClient.get('/categories'),
        apiClient.get('/products'),
        apiClient.get('/ingredients'),
        apiClient.get('/tables'),
        apiClient.get('/users'),
        apiClient.get('/orders'),
      ]);

      setOverview(ovRes.data.data);
      setCategories(catRes.data.data || []);
      setProducts(prodRes.data.data || []);
      setIngredients(ingRes.data.data || []);
      setTables(tabRes.data.data || []);
      setUsers(usrRes.data.data || []);
      setOrders(ordRes.data.data || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
      showNotification('error', 'Gagal memuat data dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen to Reverb Events
  useEffect(() => {
    if (!echo) return;
    const channel = echo.private('waiter.orders');
    channel
      .listen('.order.created', () => loadAllData())
      .listen('.order.items_added', () => loadAllData())
      .listen('.order_item.status_updated', () => loadAllData())
      .listen('.order.status_updated', () => loadAllData())
      .listen('.product.availability_updated', () => loadAllData());

    return () => {
      echo.leave('waiter.orders');
    };
  }, [echo]);

  // Load Reports Data
  const loadReports = async () => {
    setIsReportLoading(true);
    try {
      const params = {
        start_date: reportRange.startDate,
        end_date: reportRange.endDate,
      };
      const [sumRes, topRes, catRes] = await Promise.all([
        apiClient.get('/reports/summary', { params }),
        apiClient.get('/reports/top-products', { params }),
        apiClient.get('/reports/category-sales', { params }),
      ]);
      setReportSummary(sumRes.data.data);
      setReportTopProducts(topRes.data.data || []);
      setReportCategorySales(catRes.data.data || []);
    } catch (err) {
      console.error('Error loading reports:', err);
      showNotification('error', 'Gagal memuat laporan penjualan.');
    } finally {
      setIsReportLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reports') {
      loadReports();
    }
  }, [activeTab, reportRange]);

  // Export CSV Handler
  const handleExportCsv = () => {
    const token = localStorage.getItem('servora_token');
    const url = `${apiClient.defaults.baseURL}/reports/export?start_date=${reportRange.startDate}&end_date=${reportRange.endDate}`;
    
    // Create download via fetch with bearer token
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `Laporan_Servora_${reportRange.startDate}_sd_${reportRange.endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showNotification('success', 'Laporan CSV berhasil diunduh.');
      })
      .catch((err) => {
        console.error('CSV export failed:', err);
        showNotification('error', 'Gagal mengunduh file CSV.');
      });
  };

  // -------------------------------------------------------------
  // Product Handlers
  // -------------------------------------------------------------
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, productForm);
        showNotification('success', `Menu ${productForm.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/products', productForm);
        showNotification('success', `Menu ${productForm.name} berhasil ditambahkan.`);
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan menu.');
    }
  };

  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${prod.name}"?`)) return;
    try {
      await apiClient.delete(`/products/${prod.id}`);
      showNotification('success', `Menu "${prod.name}" berhasil dihapus.`);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus menu.');
    }
  };

  // -------------------------------------------------------------
  // Ingredient Handlers
  // -------------------------------------------------------------
  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    try {
      if (editingIngredient) {
        await apiClient.put(`/ingredients/${editingIngredient.id}`, ingredientForm);
        showNotification('success', `Bahan baku ${ingredientForm.name} berhasil diperbarui.`);
      } else {
        await apiClient.post('/ingredients', ingredientForm);
        showNotification('success', `Bahan baku ${ingredientForm.name} berhasil ditambahkan.`);
      }
      setIsIngredientModalOpen(false);
      setEditingIngredient(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan bahan baku.');
    }
  };

  const handleSaveMutasi = async (e) => {
    e.preventDefault();
    if (!mutasiIngredient || !mutasiForm.amount) return;
    try {
      await apiClient.post(`/ingredients/${mutasiIngredient.id}/adjust`, {
        change_type: mutasiForm.change_type,
        amount: parseFloat(mutasiForm.amount),
        reason: mutasiForm.reason.trim() || null,
      });
      showNotification('success', `Mutasi stok ${mutasiIngredient.name} berhasil dicatat.`);
      setIsMutasiModalOpen(false);
      setMutasiIngredient(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mencatat mutasi bahan.');
    }
  };

  // -------------------------------------------------------------
  // Table Handlers
  // -------------------------------------------------------------
  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await apiClient.put(`/tables/${editingTable.id}`, tableForm);
        showNotification('success', `Meja ${tableForm.table_number} berhasil diperbarui.`);
      } else {
        await apiClient.post('/tables', tableForm);
        showNotification('success', `Meja ${tableForm.table_number} berhasil ditambahkan.`);
      }
      setIsTableModalOpen(false);
      setEditingTable(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan meja.');
    }
  };

  // -------------------------------------------------------------
  // User Station Sync Handlers
  // -------------------------------------------------------------
  const handleSaveUserCategories = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await apiClient.put(`/users/${editingUser.id}/categories`, {
        category_ids: selectedStationIds,
      });
      showNotification('success', `Penugasan stasiun untuk ${editingUser.name} berhasil disimpan.`);
      setIsUserModalOpen(false);
      setEditingUser(null);
      loadAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menugaskan stasiun.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Memuat Dashboard Admin Servora..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
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
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          )}
          <span className="font-semibold text-sm">{notification.message}</span>
        </div>
      )}

      {/* Admin Sub-Navbar Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-brand-200 no-scrollbar">
        {[
          { id: 'overview', label: 'Ringkasan & KPI', icon: LayoutDashboard },
          { id: 'orders', label: 'Pantau Pesanan', icon: Utensils },
          { id: 'menu', label: 'Menu & Kategori', icon: BookOpen },
          { id: 'inventory', label: 'Stok Bahan Baku', icon: Layers },
          { id: 'tables', label: 'Meja Restoran', icon: Grid },
          { id: 'users', label: 'Staf & Stasiun', icon: Users },
          { id: 'reports', label: 'Laporan & Omset', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-brand-800 text-white shadow-sm'
                  : 'bg-white text-brand-700 border border-brand-200 hover:bg-brand-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & OPERATIONAL DASHBOARD */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                Omset Hari Ini (Kasir)
              </span>
              <div className="text-2xl font-black text-brand-950 font-mono">
                {formatRupiah(overview.today_revenue || 0)}
              </div>
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {overview.today_paid_orders || 0} transaksi lunas
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                Total Pesanan Hari Ini
              </span>
              <div className="text-2xl font-black text-brand-950 font-mono">
                {overview.today_total_orders || 0}
              </div>
              <p className="text-[11px] text-brand-500 font-medium">Dine-in & Takeaway</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                Pesanan Dapur Aktif
              </span>
              <div className="text-2xl font-black text-amber-600 font-mono">
                {overview.total_active_kitchen_items || 0}
              </div>
              <p className="text-[11px] text-amber-700 font-bold">Sedang / Menunggu masak</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
              <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                Peringatan Bahan Menipis
              </span>
              <div className="text-2xl font-black text-rose-600 font-mono">
                {overview.low_ingredients_count || 0}
              </div>
              <p className="text-[11px] text-rose-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Di bawah batas minimum
              </p>
            </div>
          </div>

          {/* 3 Kitchen Stations Load Meters */}
          <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-brand-950 text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  Beban Kerja 3 Stasiun Dapur
                </h3>
                <p className="text-xs text-brand-600">
                  Antrean menu yang sedang diproses di masing-masing stasiun kerja.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {overview.station_loads?.map((station) => (
                <div
                  key={station.category_id}
                  className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-brand-900 text-sm">{station.name}</span>
                    <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-brand-200 text-brand-900 font-mono">
                      {station.active_items_count} tiket
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-brand-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        station.active_items_count > 10
                          ? 'bg-rose-500'
                          : station.active_items_count > 5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(station.active_items_count * 10, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Ingredients Quick Table */}
          {overview.low_ingredients_list?.length > 0 && (
            <div className="bg-rose-50/60 rounded-3xl border border-rose-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h3 className="font-extrabold text-rose-950 text-base">
                    Bahan Baku Mencapai Batas Minimum ({overview.low_ingredients_list.length})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 underline"
                >
                  Kelola Stok Bahan &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {overview.low_ingredients_list.map((ing) => (
                  <div
                    key={ing.id}
                    className="p-3.5 rounded-2xl bg-white border border-rose-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-rose-950 text-sm">{ing.name}</div>
                      <div className="text-xs text-rose-700">
                        Sisa: <span className="font-black">{ing.current_stock} {ing.unit}</span> (Min: {ing.minimum_stock})
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setMutasiIngredient(ing);
                        setMutasiForm({ change_type: 'in', amount: '', reason: 'Restock bahan menipis' });
                        setIsMutasiModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
                    >
                      + Tambah
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PANTAU PESANAN (ORDERS) */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-brand-950 text-base">Pantau Semua Pesanan</h3>
              <p className="text-xs text-brand-600">
                Daftar pesanan aktif, jadwal Pre-Order, dan riwayat transaksi.
              </p>
            </div>
            <button
              onClick={loadAllData}
              className="p-2 rounded-xl border border-brand-200 hover:bg-brand-50 text-brand-700"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50/75 border-b border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">No. Pesanan</th>
                  <th className="px-4 py-3">Tipe / Meja</th>
                  <th className="px-4 py-3">Pemesan</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Total (Nett)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-mono font-bold text-brand-950">
                      #{ord.order_number}
                    </td>
                    <td className="px-4 py-3">
                      {ord.order_type === 'dine_in' ? (
                        <span className="font-bold text-brand-900">
                          Meja {ord.dining_table?.table_number || ord.dining_table?.number || '-'}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          Takeaway
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-900">
                      {ord.customer_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-600">
                      {formatTime(ord.created_at)}
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-brand-950">
                      {formatRupiah(ord.total_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ord.status} type="order" />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ord.payment_status} type="payment" />
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {ord.payment_status !== 'paid' && ord.status !== 'cancelled' && (
                        <button
                          onClick={() => setSelectedOrderPayment(ord)}
                          className="px-2.5 py-1 rounded-lg bg-brand-800 text-white font-bold text-xs hover:bg-brand-900"
                        >
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MENU & KATEGORI (PRODUCTS) */}
      {activeTab === 'menu' && (
        <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-brand-950 text-base">Kelola Menu & Kategori</h3>
              <p className="text-xs text-brand-600">
                Atur daftar 13 menu makanan dan minuman pada 3 stasiun utama.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  category_id: categories[0]?.id || '',
                  price: '',
                  description: '',
                  track_stock: true,
                  stock_quantity: 50,
                  is_available: true,
                });
                setIsProductModalOpen(true);
              }}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Menu Baru
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50/75 border-b border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Menu</th>
                  <th className="px-4 py-3">Stasiun / Kategori</th>
                  <th className="px-4 py-3">Harga Nett</th>
                  <th className="px-4 py-3">Stok Porsi</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-extrabold text-brand-950">
                      {p.name}
                      {p.description && (
                        <div className="text-xs font-normal text-brand-500 line-clamp-1">
                          {p.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-xl bg-brand-100 text-brand-800 text-xs font-bold">
                        {p.category?.name || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-brand-900">
                      {formatRupiah(p.price)}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">
                      {p.track_stock ? `${p.stock_quantity ?? 0} porsi` : 'Tanpa batas'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          p.is_available
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {p.is_available ? 'Tersedia' : 'Habis'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setProductForm({
                            name: p.name,
                            category_id: p.category_id,
                            price: p.price,
                            description: p.description || '',
                            track_stock: p.track_stock,
                            stock_quantity: p.stock_quantity ?? 0,
                            is_available: p.is_available,
                          });
                          setIsProductModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-100"
                        title="Edit Menu"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        title="Hapus Menu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: STOK BAHAN BAKU (INVENTORY) */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-brand-950 text-base">Stok Bahan Baku & Mutasi</h3>
              <p className="text-xs text-brand-600">
                Pencatatan persediaan bahan mentah dapur per stasiun kerja.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingIngredient(null);
                setIngredientForm({
                  name: '',
                  category_id: categories[0]?.id || '',
                  current_stock: 10,
                  minimum_stock: 5,
                  unit: 'kg',
                });
                setIsIngredientModalOpen(true);
              }}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Bahan Baku
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50/75 border-b border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Bahan</th>
                  <th className="px-4 py-3">Stasiun Dapur</th>
                  <th className="px-4 py-3">Stok Saat Ini</th>
                  <th className="px-4 py-3">Batas Minimum</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {ingredients.map((ing) => {
                  const isLow = Number(ing.current_stock) <= Number(ing.minimum_stock);
                  return (
                    <tr key={ing.id} className="hover:bg-brand-50/50">
                      <td className="px-4 py-3 font-extrabold text-brand-950">{ing.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-xl bg-brand-100 text-brand-800 text-xs font-bold">
                          {ing.category?.name || 'Umum'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-black text-brand-900">
                        {ing.current_stock} {ing.unit}
                      </td>
                      <td className="px-4 py-3 font-mono text-brand-600">
                        {ing.minimum_stock} {ing.unit}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 flex items-center gap-1 w-max">
                            <AlertTriangle className="w-3 h-3" />
                            Menipis
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            Aman
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setMutasiIngredient(ing);
                            setMutasiForm({ change_type: 'in', amount: '', reason: '' });
                            setIsMutasiModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-brand-800 text-white font-bold text-xs hover:bg-brand-900"
                        >
                          Mutasi
                        </button>
                        <button
                          onClick={() => {
                            setEditingIngredient(ing);
                            setIngredientForm({
                              name: ing.name,
                              category_id: ing.category_id || '',
                              current_stock: ing.current_stock,
                              minimum_stock: ing.minimum_stock,
                              unit: ing.unit,
                            });
                            setIsIngredientModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg border border-brand-200 text-brand-700 hover:bg-brand-100"
                          title="Edit Bahan"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MEJA RESTORAN (TABLES) */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-brand-950 text-base">Meja Makan Restoran</h3>
              <p className="text-xs text-brand-600">
                Kelola status ketersediaan 10 meja makan di area restoran.
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingTable(null);
                setTableForm({ table_number: '', capacity: 4, status: 'available' });
                setIsTableModalOpen(true);
              }}
              className="text-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Tambah Meja
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                  t.status === 'occupied'
                    ? 'bg-rose-50/70 border-rose-300'
                    : 'bg-brand-50/70 border-brand-200 hover:border-brand-600'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-brand-500">Meja</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                        t.status === 'occupied'
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {t.status === 'occupied' ? 'Terisi' : 'Kosong'}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-brand-950 font-mono mt-1">
                    {t.table_number}
                  </div>
                  <div className="text-xs text-brand-600 mt-1">{t.capacity} Kursi Tamu</div>
                </div>

                <div className="mt-4 pt-2 border-t border-brand-200/60 flex items-center justify-end gap-1">
                  <button
                    onClick={() => {
                      setEditingTable(t);
                      setTableForm({
                        table_number: t.table_number,
                        capacity: t.capacity,
                        status: t.status,
                      });
                      setIsTableModalOpen(true);
                    }}
                    className="p-1 rounded-md text-brand-600 hover:bg-brand-200/50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: MANAJEMEN STAF (USERS & STATIONS) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-brand-950 text-base">Manajemen Staf & Stasiun Kerja</h3>
              <p className="text-xs text-brand-600">
                Atur akun staf kasir/waiter serta penugasan stasiun koki dapur.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-brand-50/75 border-b border-brand-200 text-brand-700 text-xs font-black uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Nama Staf</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Peran / Role</th>
                  <th className="px-4 py-3">Stasiun Dapur Ditugaskan</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-brand-50/50">
                    <td className="px-4 py-3 font-extrabold text-brand-950">{u.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-600">@{u.username}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-xl bg-brand-100 text-brand-900 font-bold text-xs capitalize">
                        {u.role?.display_name || u.role?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {u.categories?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {u.categories.map((c) => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold"
                            >
                              {c.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-brand-400">
                          {u.role?.name === 'kitchen' ? 'Belum ditugaskan' : 'Akses Penuh / Kasir'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role?.name === 'kitchen' && (
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedStationIds(u.categories?.map((c) => c.id) || []);
                            setIsUserModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-brand-800 text-white font-bold text-xs hover:bg-brand-900"
                        >
                          Tugaskan Stasiun
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: LAPORAN PENJUALAN & EKSPOR CSV */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Filter Bar & Export CSV Button */}
          <div className="bg-white rounded-3xl border border-brand-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-black text-brand-800 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-brand-600" />
                Periode Laporan:
              </span>
              <input
                type="date"
                value={reportRange.startDate}
                onChange={(e) => setReportRange({ ...reportRange, startDate: e.target.value })}
                className="px-3 py-1.5 rounded-xl border border-brand-200 text-xs font-bold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
              <span className="text-xs font-bold text-brand-400">s/d</span>
              <input
                type="date"
                value={reportRange.endDate}
                onChange={(e) => setReportRange({ ...reportRange, endDate: e.target.value })}
                className="px-3 py-1.5 rounded-xl border border-brand-200 text-xs font-bold text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleExportCsv}
              className="text-xs shadow-md"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Export Laporan CSV (Excel)
            </Button>
          </div>

          {isReportLoading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="lg" text="Merekap data laporan..." />
            </div>
          ) : reportSummary ? (
            <div className="space-y-6">
              {/* Summary 4 Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                    Total Omset Periode Ini
                  </span>
                  <div className="text-2xl font-black text-brand-950 font-mono">
                    {formatRupiah(reportSummary.total_revenue || 0)}
                  </div>
                  <p className="text-[11px] text-brand-600">Nett (Pajak PB1 & Service)</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                    Total Transaksi Lunas
                  </span>
                  <div className="text-2xl font-black text-brand-950 font-mono">
                    {reportSummary.paid_orders_count || 0}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold">
                    Dari {reportSummary.total_orders_count || 0} pesanan dibuat
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                    Total Porsi Terjual
                  </span>
                  <div className="text-2xl font-black text-brand-950 font-mono">
                    {reportSummary.total_items_sold || 0}
                  </div>
                  <p className="text-[11px] text-brand-600">Porsi makanan & minuman</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-brand-200 shadow-xs space-y-1">
                  <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                    Metode Pembayaran
                  </span>
                  <div className="space-y-1 mt-1 text-xs font-bold text-brand-800">
                    {reportSummary.payment_methods?.map((pm) => (
                      <div key={pm.method} className="flex justify-between">
                        <span className="capitalize">{pm.method_label}:</span>
                        <span className="font-mono">{formatRupiah(pm.total_amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Sales Distribution */}
                <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-brand-950 text-base">
                    Distribusi Penjualan per Stasiun (3 Kategori)
                  </h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reportCategorySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3ece7" />
                        <XAxis dataKey="category_name" stroke="#8c7a72" fontSize={11} />
                        <YAxis
                          stroke="#8c7a72"
                          fontSize={11}
                          tickFormatter={(val) => `Rp ${(val / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          formatter={(value) => [formatRupiah(value), 'Omset']}
                          labelStyle={{ fontWeight: 'bold', color: '#3d2b24' }}
                        />
                        <Bar dataKey="total_revenue" fill="#8c5838" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top 5 Products */}
                <div className="bg-white rounded-3xl border border-brand-200 p-6 shadow-xs space-y-4">
                  <h4 className="font-extrabold text-brand-950 text-base">
                    Top 5 Menu Paling Laris
                  </h4>
                  <div className="space-y-3">
                    {reportTopProducts.map((p, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-brand-50/70 border border-brand-200/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-brand-800 text-white font-black text-xs flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-extrabold text-brand-950 text-sm">
                              {p.product_name}
                            </div>
                            <div className="text-xs text-brand-500 font-mono">
                              Omset: {formatRupiah(p.total_revenue)}
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-brand-200 text-brand-950 font-black text-xs font-mono">
                          {p.total_sold} Porsi
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT PRODUCT */}
      {/* ------------------------------------------------------------- */}
      {isProductModalOpen && (
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? 'Edit Menu' : 'Tambah Menu Baru'}
        >
          <form onSubmit={handleSaveProduct} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Nama Menu</label>
              <input
                type="text"
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Kategori / Stasiun</label>
              <select
                required
                value={productForm.category_id}
                onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              >
                <option value="">-- Pilih Kategori --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Harga Nett (Rp)</label>
              <input
                type="number"
                required
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Stok Porsi</label>
              <input
                type="number"
                value={productForm.stock_quantity}
                onChange={(e) =>
                  setProductForm({ ...productForm, stock_quantity: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Deskripsi Singkat</label>
              <textarea
                rows={2}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProductModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Menu
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT INGREDIENT */}
      {/* ------------------------------------------------------------- */}
      {isIngredientModalOpen && (
        <Modal
          isOpen={isIngredientModalOpen}
          onClose={() => setIsIngredientModalOpen(false)}
          title={editingIngredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku Baru'}
        >
          <form onSubmit={handleSaveIngredient} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Nama Bahan</label>
              <input
                type="text"
                required
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Stasiun Dapur</label>
              <select
                value={ingredientForm.category_id}
                onChange={(e) => setIngredientForm({ ...ingredientForm, category_id: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              >
                <option value="">-- Umum / Semua Stasiun --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-brand-800 mb-1">Stok Awal</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ingredientForm.current_stock}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, current_stock: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-800 mb-1">Batas Minimum</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={ingredientForm.minimum_stock}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, minimum_stock: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Satuan</label>
              <input
                type="text"
                placeholder="Contoh: kg, liter, butir, pack"
                required
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsIngredientModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Bahan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: MUTASI STOK BAHAN */}
      {/* ------------------------------------------------------------- */}
      {isMutasiModalOpen && mutasiIngredient && (
        <Modal
          isOpen={isMutasiModalOpen}
          onClose={() => setIsMutasiModalOpen(false)}
          title={`Catat Mutasi: ${mutasiIngredient.name}`}
        >
          <form onSubmit={handleSaveMutasi} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMutasiForm({ ...mutasiForm, change_type: 'in' })}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mutasiForm.change_type === 'in'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                + Masuk / Beli
              </button>
              <button
                type="button"
                onClick={() => setMutasiForm({ ...mutasiForm, change_type: 'out' })}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mutasiForm.change_type === 'out'
                    ? 'bg-rose-600 text-white'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                - Keluar / Pakai
              </button>
              <button
                type="button"
                onClick={() => setMutasiForm({ ...mutasiForm, change_type: 'adjustment' })}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  mutasiForm.change_type === 'adjustment'
                    ? 'bg-amber-600 text-white'
                    : 'bg-brand-100 text-brand-800'
                }`}
              >
                Koreksi Stok
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">
                Jumlah ({mutasiIngredient.unit})
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={mutasiForm.amount}
                onChange={(e) => setMutasiForm({ ...mutasiForm, amount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">
                Keterangan / Alasan Mutasi
              </label>
              <input
                type="text"
                placeholder="Contoh: Pembelian supplier, bahan tumpah, dll"
                value={mutasiForm.reason}
                onChange={(e) => setMutasiForm({ ...mutasiForm, reason: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsMutasiModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Mutasi
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT TABLE */}
      {/* ------------------------------------------------------------- */}
      {isTableModalOpen && (
        <Modal
          isOpen={isTableModalOpen}
          onClose={() => setIsTableModalOpen(false)}
          title={editingTable ? 'Edit Meja' : 'Tambah Meja Baru'}
        >
          <form onSubmit={handleSaveTable} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Nomor Meja</label>
              <input
                type="text"
                required
                placeholder="Contoh: 1, 2, atau VIP-1"
                value={tableForm.table_number}
                onChange={(e) => setTableForm({ ...tableForm, table_number: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-800 mb-1">Kapasitas Kursi</label>
              <input
                type="number"
                required
                value={tableForm.capacity}
                onChange={(e) => setTableForm({ ...tableForm, capacity: parseInt(e.target.value) || 2 })}
                className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsTableModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Meja
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ASSIGN USER STATIONS */}
      {/* ------------------------------------------------------------- */}
      {isUserModalOpen && editingUser && (
        <Modal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          title={`Penugasan Stasiun: ${editingUser.name}`}
        >
          <form onSubmit={handleSaveUserCategories} className="space-y-4">
            <p className="text-xs text-brand-600">
              Pilih stasiun dapur yang dapat dilihat dan dikelola oleh koki ini:
            </p>

            <div className="space-y-2">
              {categories.map((c) => {
                const checked = selectedStationIds.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className="flex items-center gap-2.5 p-3 rounded-xl border border-brand-200 bg-brand-50/50 cursor-pointer hover:bg-brand-100/50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStationIds([...selectedStationIds, c.id]);
                        } else {
                          setSelectedStationIds(selectedStationIds.filter((id) => id !== c.id));
                        }
                      }}
                      className="w-4 h-4 rounded text-brand-800 focus:ring-brand-700"
                    />
                    <span className="font-bold text-sm text-brand-950">{c.name}</span>
                  </label>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Penugasan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Payment Modal */}
      {selectedOrderPayment && (
        <PaymentModal
          isOpen={!!selectedOrderPayment}
          onClose={() => setSelectedOrderPayment(null)}
          order={selectedOrderPayment}
          onSuccess={() => {
            showNotification('success', 'Pembayaran kasir berhasil dicatat!');
            loadAllData();
          }}
        />
      )}
    </div>
  );
}

