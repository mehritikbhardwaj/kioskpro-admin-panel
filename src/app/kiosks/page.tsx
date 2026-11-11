'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Trash2, 
  ExternalLink,
  Plus,
  RefreshCw,
  Phone,
  MapPin,
  Calendar
} from 'lucide-react';
import { KioskLicense } from '@/lib/types';
import ConfirmModal from '@/components/ConfirmModal';

export default function KiosksPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState<KioskLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: 'danger' | 'warning' | 'primary' | 'success';
    iconType: 'alert' | 'block' | 'clock' | 'logout' | 'check';
    action: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    variant: 'primary',
    iconType: 'alert',
    action: () => {},
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const promptRenew = (kiosk: KioskLicense, days: number) => {
    const isYear = days >= 365;
    setConfirmConfig({
      isOpen: true,
      title: isYear ? 'Confirm 1-Year Extension' : 'Confirm 30-Day Extension',
      message: `Are you sure you want to add ${isYear ? '1 Year (365 days)' : '30 days'} extension to CSP ${kiosk.cspCode} (${kiosk.operatorName})? The expiry date will be updated accordingly.`,
      confirmText: isYear ? 'Yes, Add 1 Year' : 'Yes, Add 30 Days',
      variant: 'primary',
      iconType: 'clock',
      action: () => handleRenew(kiosk.id, days),
    });
  };

  const promptToggleStatus = (kiosk: KioskLicense, newStatus: string) => {
    const isBlocking = newStatus === 'SUSPENDED';
    setConfirmConfig({
      isOpen: true,
      title: isBlocking ? 'Confirm Block License' : 'Confirm Activate License',
      message: isBlocking
        ? `Are you sure you want to BLOCK CSP ${kiosk.cspCode} (${kiosk.operatorName})? The agent software will be immediately blocked from logging in or performing any kiosk services.`
        : `Are you sure you want to UNBLOCK / ACTIVATE CSP ${kiosk.cspCode} (${kiosk.operatorName})? The agent will immediately regain full access.`,
      confirmText: isBlocking ? 'Yes, Block License' : 'Yes, Activate License',
      variant: isBlocking ? 'danger' : 'success',
      iconType: isBlocking ? 'block' : 'check',
      action: () => handleToggleStatus(kiosk.id, newStatus),
    });
  };

  const promptDelete = (kiosk: KioskLicense) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Delete License',
      message: `Are you sure you want to permanently delete the license record for CSP ${kiosk.cspCode} (${kiosk.operatorName})? This action cannot be undone.`,
      confirmText: 'Yes, Delete License',
      variant: 'danger',
      iconType: 'alert',
      action: () => handleDelete(kiosk.id, kiosk.operatorName),
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/kiosks');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setKiosks(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRenew = async (id: string, days: number) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'RENEW', days }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Error renewing kiosk license');
      } else {
        await fetchData();
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    const prevKiosks = [...kiosks];
    // Optimistic UI update
    setKiosks((prev) =>
      prev.map((k) => (k.id === id || k.cspCode === id ? { ...k, status: newStatus as any } : k))
    );
    setActionLoadingId(id);

    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'SET_STATUS', status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setKiosks(prevKiosks);
        alert(json.message || 'Failed to update kiosk status');
      } else {
        await fetchData();
      }
    } catch (err: any) {
      setKiosks(prevKiosks);
      alert('Network error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/kiosks?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to delete kiosk');
      } else {
        await fetchData();
      }
    } catch (err: any) {
      alert('Network error: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredKiosks = kiosks.filter((k) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      k.cspCode.toLowerCase().includes(q) ||
      k.operatorName.toLowerCase().includes(q) ||
      (k.mobileNumber && k.mobileNumber.toLowerCase().includes(q)) ||
      (k.location && k.location.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    if (statusFilter === 'ALL') return true;
    return k.status === statusFilter;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchData} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-24 md:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                All Kiosks &amp; Subscriptions
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Detailed record of all SBI KioskPro installations and cloud licenses.
              </p>
            </div>
          </div>

          {/* Filters & Search (Mobile Scrollable) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by CSP Code, Name, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-xs font-semibold text-slate-400 mr-1 shrink-0">Filter:</span>
              {(['ALL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-semibold shrink-0 transition ${
                    statusFilter === st
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Kiosks Container */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Terminal / CSP</th>
                    <th className="px-5 py-3.5">Operator &amp; Contact</th>
                    <th className="px-5 py-3.5">Subscription Plan</th>
                    <th className="px-5 py-3.5">Expiration</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Last Seen</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        Loading license database...
                      </td>
                    </tr>
                  ) : filteredKiosks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No kiosks found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredKiosks.map((kiosk) => {
                      const exp = new Date(kiosk.expiresAt);
                      const isExpired = exp < new Date();
                      return (
                        <tr key={kiosk.id} className="hover:bg-slate-50/75 transition">
                          <td className="px-5 py-4">
                            <div className="font-mono font-bold text-teal-700 text-sm">
                              {kiosk.cspCode}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>{kiosk.location || 'India'}</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">{kiosk.operatorName}</div>
                            {kiosk.mobileNumber && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                                <Phone className="h-3 w-3 shrink-0" />
                                <span>{kiosk.mobileNumber}</span>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800">{kiosk.planName}</div>
                            <div className="text-[11px] text-teal-600 font-semibold">₹{kiosk.amount}</div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-800">
                              {exp.toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isExpired ? 'Expired' : `${Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days left`}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            {kiosk.status === 'ACTIVE' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 font-bold text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                ACTIVE
                              </span>
                            )}
                            {kiosk.status === 'EXPIRED' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 font-bold text-amber-800">
                                <Clock className="h-3 w-3" />
                                EXPIRED
                              </span>
                            )}
                            {kiosk.status === 'SUSPENDED' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 font-bold text-rose-800">
                                <XCircle className="h-3 w-3" />
                                SUSPENDED
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-[11px] text-slate-400">
                            {kiosk.lastSeenAt ? new Date(kiosk.lastSeenAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Quick +30 Days */}
                              <button
                                onClick={() => promptRenew(kiosk, 30)}
                                title="Renew for 30 Days"
                                className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition"
                              >
                                +30d
                              </button>

                              {/* Quick +365 Days */}
                              <button
                                onClick={() => promptRenew(kiosk, 365)}
                                title="Renew for 1 Year"
                                className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                              >
                                +1y
                              </button>

                              {/* Suspend / Reactivate */}
                              {kiosk.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => promptToggleStatus(kiosk, 'SUSPENDED')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Suspend License"
                                  className={`rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? '...' : 'Block'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => promptToggleStatus(kiosk, 'ACTIVE')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Reactivate License"
                                  className={`rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? '...' : 'Activate'}
                                </button>
                              )}

                              {/* Delete */}
                              <button
                                onClick={() => promptDelete(kiosk)}
                                disabled={actionLoadingId === kiosk.id}
                                title="Delete Kiosk License"
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW */}
            <div className="md:hidden divide-y divide-slate-100">
              {loading ? (
                <div className="text-center py-8 text-xs text-slate-400">Loading licenses...</div>
              ) : filteredKiosks.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">No kiosks found.</div>
              ) : (
                filteredKiosks.map((kiosk) => {
                  const exp = new Date(kiosk.expiresAt);
                  const isExpired = exp < new Date();
                  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={kiosk.id} className="p-4 space-y-2.5 hover:bg-slate-50 transition">
                      {/* Top: CSP + Status */}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-teal-700 text-sm">
                            {kiosk.cspCode}
                          </span>
                          <span className="text-[11px] text-slate-400 ml-1.5">
                            ({kiosk.location || 'India'})
                          </span>
                        </div>

                        <div>
                          {kiosk.status === 'ACTIVE' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                              <CheckCircle2 className="h-3 w-3" />
                              ACTIVE
                            </span>
                          )}
                          {kiosk.status === 'EXPIRED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                              <Clock className="h-3 w-3" />
                              EXPIRED
                            </span>
                          )}
                          {kiosk.status === 'SUSPENDED' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                              <XCircle className="h-3 w-3" />
                              SUSPENDED
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle: Operator & Phone */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="font-semibold text-slate-900">{kiosk.operatorName}</div>
                        {kiosk.mobileNumber && (
                          <a
                            href={`tel:${kiosk.mobileNumber}`}
                            className="flex items-center gap-1 text-[11px] text-teal-600 font-semibold bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-100"
                          >
                            <Phone className="h-3 w-3" />
                            <span>{kiosk.mobileNumber}</span>
                          </a>
                        )}
                      </div>

                      {/* Plan & Expiry */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                        <span className="font-medium text-slate-700">{kiosk.planName} (₹{kiosk.amount})</span>
                        <span>
                          {isExpired ? (
                            <span className="text-rose-600 font-semibold">Expired</span>
                          ) : (
                            <span>{daysLeft} days left</span>
                          )}
                        </span>
                      </div>

                      {/* Last Seen */}
                      <div className="text-[10px] text-slate-400">
                        Last Active:{' '}
                        {kiosk.lastSeenAt
                          ? new Date(kiosk.lastSeenAt).toLocaleString('en-IN', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          : 'Never'}
                      </div>

                      {/* Touch Action Bar */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        <button
                          onClick={() => promptRenew(kiosk, 30)}
                          className="flex items-center justify-center py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold active:bg-teal-100 transition"
                        >
                          +30d
                        </button>

                        <button
                          onClick={() => promptRenew(kiosk, 365)}
                          className="flex items-center justify-center py-1.5 rounded-lg bg-teal-600 text-white text-[11px] font-bold shadow-sm active:bg-teal-700 transition"
                        >
                          +1 Year
                        </button>

                        {kiosk.status === 'ACTIVE' ? (
                          <button
                            onClick={() => promptToggleStatus(kiosk, 'SUSPENDED')}
                            disabled={actionLoadingId === kiosk.id}
                            className="flex items-center justify-center py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold active:bg-rose-100 transition"
                          >
                            {actionLoadingId === kiosk.id ? '...' : 'Block'}
                          </button>
                        ) : (
                          <button
                            onClick={() => promptToggleStatus(kiosk, 'ACTIVE')}
                            disabled={actionLoadingId === kiosk.id}
                            className="flex items-center justify-center py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold active:bg-emerald-100 transition"
                          >
                            {actionLoadingId === kiosk.id ? '...' : 'Activate'}
                          </button>
                        )}

                        <button
                          onClick={() => promptDelete(kiosk)}
                          disabled={actionLoadingId === kiosk.id}
                          className="flex items-center justify-center py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 active:bg-rose-200 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText="Cancel"
        variant={confirmConfig.variant}
        iconType={confirmConfig.iconType}
        isLoading={confirmLoading}
        onConfirm={async () => {
          try {
            setConfirmLoading(true);
            await confirmConfig.action();
          } finally {
            setConfirmLoading(false);
            setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
          }
        }}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
