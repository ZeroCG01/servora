import React, { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import Input from '../../components/Input';
import apiClient from '../../api/client';
import { formatRupiah } from '../../utils/format';
import { CreditCard, QrCode, Banknote, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export function PaymentModal({
  isOpen,
  onClose,
  order,
  onSuccess,
  defaultType = 'full',
}) {
  const [paymentType, setPaymentType] = useState(defaultType);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const remaining = order ? Number(order.remaining_amount || 0) : 0;
  const total = order ? Number(order.total_amount || 0) : 0;
  const isPreOrder = order?.status === 'scheduled';
  const isPartiallyPaid = order?.payment_status === 'partially_paid';

  useEffect(() => {
    if (order) {
      if (isPartiallyPaid) {
        setPaymentType('settlement');
        setAmount(String(remaining));
      } else if (isPreOrder) {
        setPaymentType('down_payment');
        // Default DP 50%
        setAmount(String(Math.ceil(total * 0.5)));
      } else {
        setPaymentType('full');
        setAmount(String(remaining));
      }
      setPaymentMethod('cash');
      setNotes('');
      setErrorMessage('');
    }
  }, [order, isOpen]);

  if (!order) return null;

  const numAmount = parseFloat(amount) || 0;
  const changeAmount = paymentMethod === 'cash' && numAmount > remaining ? numAmount - remaining : 0;

  const handleQuickAmount = (val) => {
    setAmount(String(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      setErrorMessage('Nominal pembayaran harus lebih besar dari 0.');
      return;
    }

    if (paymentType === 'settlement' && numAmount < remaining && paymentMethod !== 'cash') {
      setErrorMessage('Pelunasan non-tunai harus sesuai dengan sisa tagihan.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await apiClient.post(`/orders/${order.id}/payments`, {
        payment_type: paymentType,
        payment_method: paymentMethod,
        amount: numAmount,
        notes: notes || null,
      });

      if (res.data?.success) {
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Gagal memproses pembayaran.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kasir & Pembayaran — #${order.order_number}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Bill Summary Card */}
        <div className="p-4 bg-brand-50/70 border border-brand-200 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs text-brand-600">
            <span>Tujuan / Meja:</span>
            <span className="font-bold text-brand-900">
              {order.dining_table ? `Meja ${order.dining_table.number}` : `Takeaway (${order.customer_name || 'Pelanggan'})`}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-brand-600">
            <span>Total Tagihan:</span>
            <span className="font-bold text-brand-900">{formatRupiah(total)}</span>
          </div>

          {order.paid_amount > 0 && (
            <div className="flex justify-between items-center text-xs text-emerald-700 font-medium">
              <span>Sudah Dibayar (DP):</span>
              <span>- {formatRupiah(order.paid_amount)}</span>
            </div>
          )}

          <div className="pt-2 border-t border-brand-200 flex justify-between items-center">
            <span className="text-sm font-bold text-brand-900">Sisa Pembayaran:</span>
            <span className="text-lg font-black text-brand-900 font-display">
              {formatRupiah(remaining)}
            </span>
          </div>
        </div>

        {/* Payment Type Selection */}
        <div>
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
            Jenis Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              disabled={isPartiallyPaid}
              onClick={() => {
                setPaymentType('full');
                setAmount(String(remaining));
              }}
              className={`p-2.5 rounded-xl font-bold border transition-all ${
                paymentType === 'full'
                  ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                  : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Bayar Lunas
            </button>

            <button
              type="button"
              disabled={isPartiallyPaid}
              onClick={() => {
                setPaymentType('down_payment');
                setAmount(String(Math.ceil(total * 0.5)));
              }}
              className={`p-2.5 rounded-xl font-bold border transition-all ${
                paymentType === 'down_payment'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              Uang Muka (DP)
            </button>

            <button
              type="button"
              onClick={() => {
                setPaymentType('settlement');
                setAmount(String(remaining));
              }}
              className={`p-2.5 rounded-xl font-bold border transition-all ${
                paymentType === 'settlement'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-brand-800 border-brand-200 hover:bg-brand-50'
              }`}
            >
              Pelunasan
            </button>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <label className="block text-xs font-bold text-brand-800 uppercase tracking-wider mb-1.5">
            Metode Pembayaran
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'cash'
                  ? 'bg-brand-100 border-brand-500 text-brand-900 font-bold shadow-xs'
                  : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <Banknote className="w-5 h-5 text-brand-600" />
              <span className="text-xs">Tunai (Cash)</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('qris')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'qris'
                  ? 'bg-brand-100 border-brand-500 text-brand-900 font-bold shadow-xs'
                  : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <QrCode className="w-5 h-5 text-brand-600" />
              <span className="text-xs">QRIS</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('debit_card')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                paymentMethod === 'debit_card'
                  ? 'bg-brand-100 border-brand-500 text-brand-900 font-bold shadow-xs'
                  : 'bg-white border-brand-200 text-brand-700 hover:bg-brand-50'
              }`}
            >
              <CreditCard className="w-5 h-5 text-brand-600" />
              <span className="text-xs">Kartu Debit</span>
            </button>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <Input
            label="Nominal Yang Diterima (Rp)"
            type="number"
            min="0"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />

          {/* Quick Cash Buttons */}
          {paymentMethod === 'cash' && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              <button
                type="button"
                onClick={() => handleQuickAmount(remaining)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-brand-100 hover:bg-brand-200 text-brand-900 border border-brand-300"
              >
                Uang Pas ({formatRupiah(remaining)})
              </button>

              <button
                type="button"
                onClick={() => handleQuickAmount(50000)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-brand-50 text-brand-800 border border-brand-200"
              >
                50.000
              </button>

              <button
                type="button"
                onClick={() => handleQuickAmount(100000)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-brand-50 text-brand-800 border border-brand-200"
              >
                100.000
              </button>

              <button
                type="button"
                onClick={() => handleQuickAmount(200000)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white hover:bg-brand-50 text-brand-800 border border-brand-200"
              >
                200.000
              </button>
            </div>
          )}
        </div>

        {/* Change Display */}
        {paymentMethod === 'cash' && numAmount >= remaining && remaining > 0 && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Uang Kembalian:</span>
            <span className="text-lg font-black text-emerald-700 font-display">
              {formatRupiah(changeAmount)}
            </span>
          </div>
        )}

        {/* Notes */}
        <Input
          label="Catatan Pembayaran (Opsional)"
          placeholder="Misal: Nomor ref transfer atau kartu"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="pt-2 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Batal
          </Button>

          <Button
            type="submit"
            variant="primary"
            className="flex-1 shadow-md shadow-brand-600/30"
            isLoading={isLoading}
            icon={CheckCircle2}
          >
            Simpan Pembayaran
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default PaymentModal;

