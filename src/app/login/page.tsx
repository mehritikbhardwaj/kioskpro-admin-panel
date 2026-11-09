'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the admin password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.message || 'Invalid password. Please check and try again.');
      }
    } catch {
      setError('Connection failed. Please check network and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-teal-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-700 text-white shadow-lg shadow-teal-500/30">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
              KIOSKPRO ADMIN
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              License &amp; Device Cloud Management
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 py-3 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/25 hover:from-teal-500 hover:to-teal-400 disabled:opacity-60 transition"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            <p className="text-[11px] text-slate-500">🔒 Secure Enterprise Portal • Authorized Access Only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
