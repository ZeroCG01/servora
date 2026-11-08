import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Utensils, Lock, User, Sparkles } from 'lucide-react';
import Button from '../../components/Button';
import Input from '../../components/Input';

export function LoginPage() {
  const { login } = useAuth();
  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginInput || !password) {
      setErrorMessage('Silakan isi username/email dan password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await login(loginInput, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Username/email atau password salah.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal terhubung ke server backend.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (uname) => {
    setLoginInput(uname);
    setPassword('password');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-100 via-brand-50 to-brand-200 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-brand-400 mx-auto flex items-center justify-center text-white shadow-xl shadow-brand-700/20 mb-4 animate-in zoom-in-75 duration-300">
          <Utensils className="w-8 h-8 text-brand-50" />
        </div>

        <h2 className="text-3xl font-extrabold text-brand-950 font-display tracking-tight">
          SERVORA
        </h2>
        <p className="mt-1 text-sm font-medium text-brand-700">
          Restaurant Order & Kitchen Management System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-brand-100">
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0"></span>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username atau Email"
              type="text"
              placeholder="admin / waiter / koki_indo"
              icon={User}
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 shadow-lg shadow-brand-600/25"
              isLoading={isLoading}
            >
              Masuk ke Sistem
            </Button>
          </form>

          {/* Quick Demo Logins for Fast Local Testing */}
          <div className="mt-6 pt-6 border-t border-brand-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-600 uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>Akses Cepat Pengujian:</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2 rounded-xl border border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-100 text-left transition-colors"
              >
                <div className="font-bold text-brand-900">Admin</div>
                <div className="text-[10px] text-brand-500">Manager Resto</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('waiter')}
                className="p-2 rounded-xl border border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-100 text-left transition-colors"
              >
                <div className="font-bold text-brand-900">Waiter & Kasir</div>
                <div className="text-[10px] text-brand-500">Order & Bayar</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('koki_indo')}
                className="p-2 rounded-xl border border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-100 text-left transition-colors"
              >
                <div className="font-bold text-brand-900">Koki Indo</div>
                <div className="text-[10px] text-brand-500">Stasiun Masakan Indo</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('koki_western')}
                className="p-2 rounded-xl border border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-100 text-left transition-colors"
              >
                <div className="font-bold text-brand-900">Koki Western</div>
                <div className="text-[10px] text-brand-500">Stasiun Masakan Barat</div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('barista')}
              className="mt-2 w-full p-2 rounded-xl border border-brand-200 hover:border-brand-400 bg-brand-50/50 hover:bg-brand-100 text-left transition-colors text-xs"
            >
              <div className="font-bold text-brand-900">Barista</div>
              <div className="text-[10px] text-brand-500">Stasiun Minuman / Beverages</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

