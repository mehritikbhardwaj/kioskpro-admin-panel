'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogOut, ExternalLink, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Navbar({ onRefresh, isLoading }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-6 backdrop-blur transition-all">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-teal-800 text-white shadow-md shadow-teal-500/20">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-slate-900 text-base">KIOSKPRO</span>
            <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-800">
              Admin Cloud
            </span>
          </div>
          <p className="text-xs text-slate-500">Distributor: Hritik Bhardwaj (9212716009)</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh</span>
          </button>
        )}

        <a
          href="/api/license/verify?csp_code=3A450557"
          target="_blank"
          rel="noreferrer"
          className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          <span>Test API</span>
        </a>

        <div className="h-4 w-px bg-slate-200" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
