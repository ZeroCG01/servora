import React, { useState, useEffect } from 'react';
import Drawer from '../../components/Drawer';
import Button from '../../components/Button';
import Input from '../../components/Input';
import LoadingSpinner from '../../components/LoadingSpinner';
import apiClient from '../../api/client';
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export function KitchenStockDrawer({
  isOpen,
  onClose,
  stationId,
  stationName = 'Stasiun Dapur',
  onStockUpdated,
}) {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'ingredients'
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Ingredient Adjustment State
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [adjustType, setAdjustType] = useState('out'); // 'in' | 'out' | 'adjustment'
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    if (!stationId) return;
    setIsLoading(true);
    try {
      const [prodRes, ingRes] = await Promise.all([
        apiClient.get(`/products?category_id=${stationId}`),
        apiClient.get(`/ingredients?category_id=${stationId}`),
      ]);
      setProducts(prodRes.data.data || []);
      setIngredients(ingRes.data.data || []);
    } catch (err) {
      console.error('Error fetching kitchen stock:', err);
      showNotification('error', 'Gagal memuat data stok stasiun.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && stationId) {
      loadData();
    }
  }, [isOpen, stationId]);

  // Toggle Product Availability
  const handleToggleAvailability = async (product) => {
    setUpdatingId(product.id);
    try {
      const newStatus = !product.is_available;
      await apiClient.patch(`/products/${product.id}/availability`, {
        is_available: newStatus,
      });

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: newStatus } : p))
      );
      showNotification(
        'success',
        `${product.name} sekarang ${newStatus ? 'Tersedia' : 'Habis / Sold Out'}.`
      );
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Gagal mengubah status menu.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Adjust Product Portion Stock
  const handleUpdatePortionStock = async (product, newQty) => {
    if (newQty < 0) return;
    setUpdatingId(product.id);
    try {
      await apiClient.patch(`/products/${product.id}/stock`, {
        stock_quantity: newQty,
        track_stock: true,
      });

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? {
                ...p,
                stock_quantity: newQty,
                is_available: newQty > 0,
              }
            : p
        )
      );
      showNotification('success', `Stok porsi ${product.name} diubah menjadi ${newQty}.`);
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Gagal mengubah stok porsi.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Submit Ingredient Stock Adjustment
  const handleAdjustIngredientSubmit = async (e) => {
    e.preventDefault();
    if (!selectedIngredient || !adjustAmount || parseFloat(adjustAmount) <= 0) return;

    setIsSubmittingAdjust(true);
    try {
      await apiClient.post(`/ingredients/${selectedIngredient.id}/adjust`, {
        change_type: adjustType,
        amount: parseFloat(adjustAmount),
        reason: adjustReason.trim() || null,
      });

      showNotification('success', `Penyesuaian bahan ${selectedIngredient.name} berhasil dicatat.`);
      setSelectedIngredient(null);
      setAdjustAmount('');
      setAdjustReason('');
      await loadData();
      if (onStockUpdated) onStockUpdated();
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Gagal mencatat mutasi bahan.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Kelola Stok: ${stationName}`}
      width="max-w-lg"
    >
      <div className="space-y-4">
        {/* Feedback notification */}
        {notification && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-2 bg-brand-100/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('products')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'products'
                ? 'bg-white text-brand-900 shadow-xs'
                : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            Menu & Porsi ({products.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ingredients')}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ingredients'
                ? 'bg-white text-brand-900 shadow-xs'
                : 'text-brand-600 hover:text-brand-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Bahan Baku ({ingredients.length})
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner size="md" text="Memuat stok stasiun..." />
          </div>
        ) : activeTab === 'products' ? (
          /* Products Tab */
          <div className="space-y-3">
            <div className="text-xs text-brand-500 font-medium">
              Ubah ketersediaan atau sesuaikan porsi menu stasiun Anda secara langsung.
            </div>

            {products.length === 0 ? (
              <div className="p-6 text-center text-brand-400 text-xs">
                Tidak ada menu untuk stasiun ini.
              </div>
            ) : (
              products.map((product) => {
                const isUpdating = updatingId === product.id;
                return (
                  <div
                    key={product.id}
                    className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-brand-950 text-sm">{product.name}</div>
                        <div className="text-xs text-brand-600">
                          {product.track_stock
                            ? `Porsi: ${product.stock_quantity ?? 0} tersisa`
                            : 'Stok tidak dibatasi'}
                        </div>
                      </div>

                      {/* Quick Available/Sold-Out Toggle */}
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleToggleAvailability(product)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                          product.is_available
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {product.is_available ? 'Tersedia' : 'Habis'}
                      </button>
                    </div>

                    {/* Quick Portion Stepper */}
                    {product.track_stock && (
                      <div className="flex items-center justify-between pt-1 border-t border-brand-100">
                        <span className="text-[11px] font-bold text-brand-600">Sesuaikan Porsi:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={isUpdating || product.stock_quantity <= 0}
                            onClick={() => handleUpdatePortionStock(product, product.stock_quantity - 1)}
                            className="p-1 rounded-lg bg-white border border-brand-200 hover:bg-brand-100 text-brand-800 text-xs disabled:opacity-40"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center text-xs font-black font-mono text-brand-950">
                            {product.stock_quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdatePortionStock(product, product.stock_quantity + 1)}
                            className="p-1 rounded-lg bg-white border border-brand-200 hover:bg-brand-100 text-brand-800 text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleUpdatePortionStock(product, product.stock_quantity + 5)}
                            className="px-2 py-1 rounded-lg bg-brand-200 text-brand-900 text-[10px] font-bold hover:bg-brand-300"
                          >
                            +5
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Ingredients Tab */
          <div className="space-y-3">
            <div className="text-xs text-brand-500 font-medium">
              Pantau sisa bahan mentah & lakukan pencatatan keluar/masuk bahan dapur.
            </div>

            {ingredients.length === 0 ? (
              <div className="p-6 text-center text-brand-400 text-xs">
                Belum ada bahan baku terdaftar di stasiun ini.
              </div>
            ) : (
              ingredients.map((ing) => {
                const isLow = Number(ing.current_stock) <= Number(ing.minimum_stock);
                return (
                  <div
                    key={ing.id}
                    className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-brand-950 text-sm flex items-center gap-1.5">
                          {ing.name}
                          {isLow && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Menipis
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-brand-600 mt-0.5">
                          Stok: <span className="font-bold text-brand-900">{ing.current_stock} {ing.unit}</span> (Min: {ing.minimum_stock} {ing.unit})
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedIngredient(ing);
                          setAdjustType('out');
                          setAdjustAmount('');
                          setAdjustReason('');
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-800 text-white hover:bg-brand-900 transition-colors flex items-center gap-1"
                      >
                        <Sliders className="w-3 h-3" />
                        Mutasi
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            {/* Inline Mutation Form if selected */}
            {selectedIngredient && (
              <form
                onSubmit={handleAdjustIngredientSubmit}
                className="mt-4 p-4 rounded-2xl bg-white border border-brand-300 shadow-md space-y-3 animate-in fade-in"
              >
                <div className="flex items-center justify-between pb-2 border-b border-brand-100">
                  <h4 className="text-xs font-black text-brand-950 uppercase tracking-wider">
                    Mutasi Bahan: {selectedIngredient.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedIngredient(null)}
                    className="text-xs text-brand-500 hover:text-brand-800 font-bold"
                  >
                    Batal
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustType('out')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      adjustType === 'out'
                        ? 'bg-rose-600 text-white'
                        : 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                    }`}
                  >
                    - Keluar / Pakai
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('in')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      adjustType === 'in'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                    }`}
                  >
                    + Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment')}
                    className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                      adjustType === 'adjustment'
                        ? 'bg-amber-600 text-white'
                        : 'bg-brand-100 text-brand-800 hover:bg-brand-200'
                    }`}
                  >
                    Koreksi
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-800 mb-1">
                    Jumlah ({selectedIngredient.unit}) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Jumlah dalam ${selectedIngredient.unit}`}
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-800 mb-1">
                    Alasan / Keterangan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pemakaian shift siang, bahan tumpah, dll"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-brand-950 text-xs focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-xs py-2"
                  isLoading={isSubmittingAdjust}
                >
                  Simpan Mutasi Bahan
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}

export default KitchenStockDrawer;

