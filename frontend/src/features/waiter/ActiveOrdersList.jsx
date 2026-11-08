import React, { useState } from 'react';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Modal from '../../components/Modal';
import Input from '../../components/Input';
import PaymentModal from './PaymentModal';
import apiClient from '../../api/client';
import { formatRupiah, formatDateTime, timeAgo } from '../../utils/format';
import {
  Utensils,
  Plus,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';

export function ActiveOrdersList({
  orders = [],
  onRefresh,
  products = [],
  onOpenPayment,
}) {
  const [filterType, setFilterType] = useState('all'); // all, dine_in, takeaway, scheduled
  const [filterPayment, setFilterPayment] = useState('all'); // all, unpaid, partially_paid, paid
  const [search, setSearch] = useState('');

  // Payment modal state
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  // Add items modal state
  const [addingOrder, setAddingOrder] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addQty, setAddQty] = useState(1);
  const [addNotes, setAddNotes] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Cancel Order Modal
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Cancel Item Modal
  const [cancellingItem, setCancellingItem] = useState(null); // { order, item }
  const [cancelItemReason, setCancelItemReason] = useState('');
  const [isSubmittingCancelItem, setIsSubmittingCancelItem] = useState(false);

  // Filter logic
  const filteredOrders = orders.filter((order) => {
    if (filterType === 'dine_in' && order.order_type !== 'dine_in') return false;
    if (filterType === 'takeaway' && order.order_type !== 'takeaway') return false;
    if (filterType === 'scheduled' && order.status !== 'scheduled') return false;

    if (filterPayment !== 'all' && order.payment_status !== filterPayment) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNum = order.order_number?.toLowerCase().includes(q);
      const matchCust = order.customer_name?.toLowerCase().includes(q);
      const matchTable = order.dining_table?.number?.toLowerCase().includes(q);
      if (!matchNum && !matchCust && !matchTable) return false;
    }

    return true;
  });

  // Handle Add Item to Order
  const handleAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProductId || addQty <= 0) return;

    setIsSubmittingAdd(true);
    try {
      await apiClient.post(`/orders/${addingOrder.id}/items`, {
        items: [
          {
            product_id: parseInt(selectedProductId),
            quantity: parseInt(addQty),
            special_instructions: addNotes || null,
          },
        ],
      });
      setAddingOrder(null);
      setSelectedProductId('');
      setAddQty(1);
      setAddNotes('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menambahkan menu.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Cancel Entire Order
  const handleCancelOrderSubmit = async (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) return;

    setIsSubmittingCancel(true);
    try {
      await apiClient.post(`/orders/${cancellingOrder.id}/cancel`, {
        reason: cancelReason,
      });
      setCancellingOrder(null);
      setCancelReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan pesanan.');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  // Handle Cancel Single Item
  const handleCancelItemSubmit = async (e) => {
    e.preventDefault();
    if (!cancelItemReason.trim() || !cancellingItem) return;

    setIsSubmittingCancelItem(true);
    try {
      await apiClient.post(
        `/orders/${cancellingItem.order.id}/items/${cancellingItem.item.id}/cancel`,
        { reason: cancelItemReason }
      );
      setCancellingItem(null);
      setCancelItemReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal membatalkan item.');
    } finally {
      setIsSubmittingCancelItem(false);
    }
  };

  // Mark all items as Served (for Dine-in)
  const handleMarkServed = async (order) => {
    if (!window.confirm(`Tandai pesanan #${order.order_number} sebagai sudah disajikan seluruhnya?`)) {
      return;
    }

    try {
      // Find all ready items in this order and mark them served
      const readyItems = (order.items || []).filter((i) => i.status === 'ready');
      for (const item of readyItems) {
        await apiClient.patch(`/kitchen/items/${item.id}/status`, {
          status: 'served',
        });
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memperbarui status sajian.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-brand-200 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-brand-400" />
          <input
            type="text"
            placeholder="Cari nomor pesanan, meja, pelanggan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-brand-200 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-brand-50/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Order Type Filter */}
          <div className="flex bg-brand-100/70 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-brand-700 hover:text-brand-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterType('dine_in')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'dine_in'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-brand-700 hover:text-brand-900'
              }`}
            >
              Dine-In
            </button>
            <button
              onClick={() => setFilterType('takeaway')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'takeaway'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-brand-700 hover:text-brand-900'
              }`}
            >
              Takeaway
            </button>
            <button
              onClick={() => setFilterType('scheduled')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'scheduled'
                  ? 'bg-white text-brand-900 shadow-xs'
                  : 'text-brand-700 hover:text-brand-900'
              }`}
            >
              Pre-Order
            </button>
          </div>

          {/* Payment Status Filter */}
          <select
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-brand-200 bg-white text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <option value="all">Semua Status Bayar</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="partially_paid">DP Dibayar</option>
            <option value="paid">Lunas</option>
          </select>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            icon={RefreshCw}
            title="Muat Ulang Pesanan"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-brand-200">
          <Utensils className="w-12 h-12 text-brand-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-brand-900">Tidak Ada Pesanan</h3>
          <p className="text-xs text-brand-500 mt-1">
            Belum ada pesanan aktif yang cocok dengan kriteria filter saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isDineIn = order.order_type === 'dine_in';
            const isCancelled = order.status === 'cancelled';
            const isServed = order.status === 'served';
            const isReady = order.status === 'ready';
            const isPaid = order.payment_status === 'paid';
            const isTakeawayReadyAndPaid = !isDineIn && isReady && isPaid;

            const canAddItems = !isCancelled && !isServed;
            const canCancel = !isCancelled && !isServed;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                  isCancelled
                    ? 'border-stone-200 bg-stone-50/50 opacity-70'
                    : isTakeawayReadyAndPaid
                    ? 'border-emerald-300 bg-emerald-50/20 ring-2 ring-emerald-500/20'
                    : isReady
                    ? 'border-emerald-200 ring-1 ring-emerald-400/30'
                    : 'border-brand-200'
                }`}
              >
                {/* Header Card */}
                <div className="p-4 border-b border-brand-100 bg-brand-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-brand-900 tracking-tight font-display">
                          #{order.order_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            isDineIn
                              ? 'bg-brand-200 text-brand-900'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {order.order_type_label}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-brand-800 mt-1">
                        {isDineIn
                          ? `Meja ${order.dining_table?.number || '-'}`
                          : `Pemesan: ${order.customer_name || 'Pelanggan'}`}
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-brand-500 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{timeAgo(order.created_at)}</span>
                        <span>•</span>
                        <span>{formatDateTime(order.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <StatusBadge status={order.status} label={order.status_label} />
                      <StatusBadge status={order.payment_status} label={order.payment_status_label} />
                    </div>
                  </div>

                  {/* Pre-Order Scheduled Banner */}
                  {order.scheduled_order && (
                    <div className="mt-2.5 p-2 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        Disajikan Pukul: {formatDateTime(order.scheduled_order.scheduled_for)}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                        Reminder H-10 Mnt
                      </span>
                    </div>
                  )}

                  {/* Notes */}
                  {order.notes && (
                    <div className="mt-2 text-xs italic text-brand-600 bg-white/80 p-2 rounded-xl border border-brand-100">
                      "{order.notes}"
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="p-4 flex-1 divide-y divide-brand-100">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-950">
                            {item.quantity}x {item.product_name}
                          </span>
                          <span className="text-[10px] text-brand-400 font-mono">
                            (Batch #{item.batch_no})
                          </span>
                        </div>

                        {item.special_instructions && (
                          <p className="text-[11px] text-amber-800 italic mt-0.5">
                            * {item.special_instructions}
                          </p>
                        )}

                        <div className="text-[11px] text-brand-500 mt-0.5">
                          {formatRupiah(item.unit_price)} × {item.quantity} = {formatRupiah(item.subtotal)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge size="sm" status={item.status} label={item.status_label} />

                        {canAddItems && item.status !== 'served' && item.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => setCancellingItem({ order, item })}
                            className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Batalkan item menu ini"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Summary & Action Bar */}
                <div className="p-4 bg-brand-50/50 border-t border-brand-100">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-xs text-brand-600 font-medium">Total Tagihan</span>
                      <div className="text-lg font-black text-brand-950 font-display">
                        {formatRupiah(order.total_amount)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-brand-600 font-medium">Sisa Bayar</span>
                      <div
                        className={`text-base font-extrabold ${
                          order.remaining_amount > 0 ? 'text-amber-800' : 'text-emerald-700'
                        }`}
                      >
                        {formatRupiah(order.remaining_amount)}
                      </div>
                    </div>
                  </div>

                  {/* Operational Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-brand-200/60">
                    {/* Add Items button */}
                    {canAddItems && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Plus}
                        onClick={() => setAddingOrder(order)}
                      >
                        Tambah Menu
                      </Button>
                    )}

                    {/* Pay / Settle button */}
                    {!isPaid && !isCancelled && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={DollarSign}
                        onClick={() => setSelectedOrderForPayment(order)}
                        className="bg-brand-700 hover:bg-brand-800"
                      >
                        {order.paid_amount > 0 ? 'Pelunasan Kasir' : 'Bayar Kasir'}
                      </Button>
                    )}

                    {/* Mark Served for Dine-in */}
                    {isDineIn && isReady && !isServed && (
                      <Button
                        variant="success"
                        size="sm"
                        icon={CheckCircle}
                        onClick={() => handleMarkServed(order)}
                      >
                        Sajikan ke Meja
                      </Button>
                    )}

                    {/* Takeaway Ready Indicator */}
                    {isTakeawayReadyAndPaid && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 font-bold text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        Siap Diambil Pelanggan
                      </span>
                    )}

                    {/* Cancel Order */}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancellingOrder(order)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition-colors ml-auto"
                      >
                        Batalkan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Bayar / Pelunasan */}
      {selectedOrderForPayment && (
        <PaymentModal
          isOpen={true}
          order={selectedOrderForPayment}
          onClose={() => setSelectedOrderForPayment(null)}
          onSuccess={() => {
            setSelectedOrderForPayment(null);
            if (onRefresh) onRefresh();
          }}
        />
      )}

      {/* Modal: Tambah Menu Susulan (Batch Baru) */}
      {addingOrder && (
        <Modal
          isOpen={true}
          onClose={() => setAddingOrder(null)}
          title={`Tambah Menu — Pesanan #${addingOrder.order_number}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleAddItemSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
                Pilih Menu Tambahan
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 bg-white text-sm text-brand-950 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Pilih Produk Makanan / Minuman --</option>
                {products
                  .filter((p) => p.is_available)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.category?.name}] {p.name} — {formatRupiah(p.price)}{' '}
                      {p.track_stock ? `(Sisa: ${p.stock_quantity})` : ''}
                    </option>
                  ))}
              </select>
            </div>

            <Input
              label="Jumlah Kuantitas"
              type="number"
              min="1"
              max="50"
              value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              required
            />

            <Input
              label="Catatan Khusus (Opsional)"
              placeholder="Contoh: Pisah sambal, kuah hangat"
              value={addNotes}
              onChange={(e) => setAddNotes(e.target.value)}
            />

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setAddingOrder(null)}
              >
                Batal
              </Button>

              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                isLoading={isSubmittingAdd}
              >
                Kirim ke Dapur
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Batalkan Seluruh Pesanan */}
      {cancellingOrder && (
        <Modal
          isOpen={true}
          onClose={() => setCancellingOrder(null)}
          title={`Batalkan Pesanan #${cancellingOrder.order_number}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCancelOrderSubmit} className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
              Perhatian: Membatalkan pesanan akan mengembalikan kuota porsi stok menu secara otomatis dan mengubah status tiket dapur menjadi Batal.
            </div>

            <Input
              label="Alasan Pembatalan"
              placeholder="Misal: Pelanggan buru-buru, salah input meja"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
              autoFocus
            />

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCancellingOrder(null)}
              >
                Kembali
              </Button>

              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                isLoading={isSubmittingCancel}
              >
                Ya, Batalkan Pesanan
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Batalkan 1 Item Tertentu */}
      {cancellingItem && (
        <Modal
          isOpen={true}
          onClose={() => setCancellingItem(null)}
          title={`Batalkan Item Menu — ${cancellingItem.item.product_name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCancelItemSubmit} className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
              Stok porsi untuk menu {cancellingItem.item.product_name} ({cancellingItem.item.quantity} porsi) akan otomatis dikembalikan ke etalase.
            </div>

            <Input
              label="Alasan Pembatalan Item"
              placeholder="Misal: Menu salah pilih oleh tamu"
              value={cancelItemReason}
              onChange={(e) => setCancelItemReason(e.target.value)}
              required
              autoFocus
            />

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setCancellingItem(null)}
              >
                Kembali
              </Button>

              <Button
                type="submit"
                variant="danger"
                className="flex-1"
                isLoading={isSubmittingCancelItem}
              >
                Batalkan Item Ini
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default ActiveOrdersList;

