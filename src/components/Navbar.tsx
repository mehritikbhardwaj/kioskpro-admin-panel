'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  LogOut, 
  ExternalLink, 
  RefreshCw, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Radio, 
  QrCode,
  CreditCard,
  Receipt,
  Phone
} from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';

interface NavbarProps {
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function Navbar({ onRefresh, isLoading }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleConfirmLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/admin/logout', { method: 'POST' });
      setShowLogoutConfirm(false);
      router.push('/login');
      router.refresh();
    } catch {
      setShowLogoutConfirm(false);
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Kiosks & Licenses', href: '/kiosks', icon: Users },
    { label: 'Billing & Ledger', href: '/transactions', icon: Receipt },
    { label: 'Remote Broadcast', href: '/broadcast', icon: Radio },
    { label: 'Pricing & UPI QR', href: '/pricing', icon: CreditCard },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-3 sm:px-6 backdrop-blur transition-all">
        {/* Left: Brand & Mobile Menu Trigger */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
            aria-label="Open mobile menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-600 to-teal-800 text-white shadow-md shadow-teal-500/20 shrink-0">
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold tracking-tight text-slate-900 text-sm sm:text-base">
                  KIOSKPRO
                </span>
                <span className="rounded-full bg-teal-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-teal-800">
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none">
                Distributor Portal (9212716009)
              </p>
            </div>
          </Link>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-teal-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            onClick={() => setQrModalOpen(true)}
            className="md:hidden flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition"
            title="Billing QR"
          >
            <QrCode className="h-3.5 w-3.5 text-teal-600" />
            <span className="hidden xs:inline">QR</span>
          </button>

          <a
            href="/software-download"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition shadow-sm"
            title="Download Latest KioskPro.exe"
          >
            <span>📥 Download App</span>
          </a>

          <a
            href="/api/license/verify?csp_code=3A450557"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Test API</span>
          </a>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 sm:px-3 text-xs font-medium text-rose-700 hover:bg-rose-100 transition"
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer (Slide over from left) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-white h-full shadow-2xl z-10 p-5 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 text-sm">KIOSKPRO</div>
                  <div className="text-[11px] text-teal-700 font-semibold">Admin Cloud</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation links */}
            <div className="py-4 space-y-1">
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Menu
              </div>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-teal-50 text-teal-700 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Distributor Info & UPI QR */}
            <div className="my-auto pt-2">
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-bold text-teal-900">
                  <QrCode className="h-4 w-4 text-teal-600" />
                  <span>Billing UPI QR</span>
                </div>
                <div className="flex justify-center p-2 bg-white rounded-lg border border-teal-200 shadow-sm">
                  <img src="/qr_code.jpg" alt="UPI QR Code" className="w-28 h-28 object-contain rounded" />
                </div>
                <div className="font-mono bg-white rounded p-1.5 border border-teal-200 text-teal-950 text-center select-all font-semibold text-[11px]">
                  9212716009@yescred
                </div>
                <a
                  href="tel:9212716009"
                  className="flex items-center justify-center gap-1 text-[11px] text-teal-700 font-semibold bg-white p-1 rounded border border-teal-200 hover:bg-teal-50"
                >
                  <Phone className="h-3 w-3" />
                  <span>Call Support (9212716009)</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-100 mt-auto space-y-2">
              <a
                href="/software-download"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-teal-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-700 transition"
              >
                <span>📥 Download KioskPro.exe</span>
              </a>

              <a
                href="/api/license/verify?csp_code=3A450557"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-semibold text-slate-600"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Test Verify API</span>
              </a>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
                className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-rose-50 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Confirm Logout"
        message="Are you sure you want to sign out from the KioskPro Admin Panel?"
        confirmText="Yes, Log Out"
        cancelText="Cancel"
        variant="danger"
        iconType="logout"
        isLoading={loggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />

      {/* Quick QR Modal on Mobile */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl border border-slate-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <QrCode className="h-4 w-4 text-teal-600" />
                <span>UPI Payment QR</span>
              </div>
              <button
                onClick={() => setQrModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-center mb-3">
              <img src="/qr_code.jpg" alt="UPI QR Code" className="w-44 h-44 object-contain rounded-lg shadow-sm" />
            </div>

            <div className="font-mono bg-teal-50 rounded p-2 border border-teal-200 text-teal-950 font-bold text-xs select-all mb-2">
              9212716009@yescred
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              Scan via GooglePay, PhonePe, or Paytm for instant CSP license renewal.
            </p>

            <div className="flex gap-2">
              <Link
                href="/pricing"
                onClick={() => setQrModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-teal-600 py-2 text-xs font-bold text-white hover:bg-teal-700"
              >
                ⚙️ Set Rates &amp; UPI
              </Link>
              <button
                onClick={() => setQrModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 border-t border-slate-200 backdrop-blur-md px-1 py-1 flex items-center justify-around shadow-lg">
        <Link
          href="/"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
            pathname === '/' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="h-4 w-4 mb-0.5" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/kiosks"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
            pathname === '/kiosks' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="h-4 w-4 mb-0.5" />
          <span>Kiosks</span>
        </Link>

        <Link
          href="/broadcast"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
            pathname === '/broadcast' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="h-4 w-4 mb-0.5" />
          <span>Broadcast</span>
        </Link>

        <Link
          href="/pricing"
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold transition ${
            pathname === '/pricing' ? 'text-teal-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="h-4 w-4 mb-0.5" />
          <span>Pricing</span>
        </Link>

        <button
          onClick={() => setQrModalOpen(true)}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-[10px] font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <QrCode className="h-4 w-4 mb-0.5 text-teal-600" />
          <span>Billing QR</span>
        </button>
      </nav>
    </>
  );
}
