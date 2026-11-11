'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  IndianRupee, 
  Plus, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Radio, 
  Calendar,
  Phone,
  MapPin,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { KioskLicense } from '@/lib/types';
import ConfirmModal from '@/components/ConfirmModal';

export default function DashboardPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState<KioskLicense[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0,
    expiringSoon: 0,
    totalRevenue: 0,
  });
  const [broadcast, setBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form states for new license
  const [formCsp, setFormCsp] = useState('');
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formPlan, setFormPlan] = useState('12_MONTHS');
  const [formDuration, setFormDuration] = useState('12');
  const [formAmount, setFormAmount] = useState('1799');
  const [formSubmitting, setFormSubmitting] = useState(false);
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
      title: isBlocking ? 'Confirm Block License' : 'Confirm Unblock License',
      message: isBlocking
        ? `Are you sure you want to BLOCK CSP ${kiosk.cspCode} (${kiosk.operatorName})? The agent software will be immediately blocked from logging in or performing any kiosk services.`
        : `Are you sure you want to UNBLOCK CSP ${kiosk.cspCode} (${kiosk.operatorName})? The agent will immediately regain full access to KioskPro.`,
      confirmText: isBlocking ? 'Yes, Block License' : 'Yes, Unblock License',
      variant: isBlocking ? 'danger' : 'success',
      iconType: isBlocking ? 'block' : 'check',
      action: () => handleToggleStatus(kiosk.id, newStatus),
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
        setStats(json.stats);
      }

      const bRes = await fetch('/api/admin/broadcast');
      const bJson = await bRes.json();
      if (bJson.success) {
        setBroadcast(bJson.data);
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
    // Optimistic UI update immediately
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

  const handleCreateKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCsp.trim() || !formName.trim()) {
      alert('CSP Code and Operator Name are required');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cspCode: formCsp,
          operatorName: formName,
          mobileNumber: formPhone,
          location: formLocation,
          plan: formPlan,
          durationMonths: formDuration,
          amount: formAmount,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to create license');
      } else {
        setIsAddModalOpen(false);
        setFormCsp('');
        setFormName('');
        setFormPhone('');
        setFormLocation('');
        await fetchData();
      }
    } catch (err: any) {
      alert('Error creating license: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredKiosks = kiosks.filter((k) => {
    const q = searchTerm.toLowerCase();
    return (
      k.cspCode.toLowerCase().includes(q) ||
      k.operatorName.toLowerCase().includes(q) ||
      (k.mobileNumber && k.mobileNumber.toLowerCase().includes(q)) ||
      (k.location && k.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchData} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-24 md:pb-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                License &amp; Device Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Monitor and issue real-time licenses for SBI KioskPro terminals.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Issue New License</span>
            </button>
          </div>

          {/* Broadcast Banner */}
          {broadcast && broadcast.enabled && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/80 p-3.5 sm:p-4 shadow-sm">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-teal-600 text-white shrink-0 mt-0.5 sm:mt-0">
                  <Radio className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-teal-800">
                      Active Remote Broadcast
                    </span>
                    <span className="rounded bg-teal-200/80 px-1.5 py-0.2 text-[9px] sm:text-[10px] font-bold text-teal-900">
                      LIVE ON TERMINALS
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-teal-950 font-medium">{broadcast.message}</p>
                </div>
              </div>
              <a
                href="/broadcast"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 shrink-0 self-end sm:self-auto"
              >
                Change Message
              </a>
            </div>
          )}

          {/* KPI Stat Cards (2x2 on Mobile, 4x1 on Desktop) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {/* Card 1: Active Kiosks */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Kiosks
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">{stats.active}</span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">/ {stats.total}</span>
              </div>
            </div>

            {/* Card 2: Expiring in 7 Days */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expiring Soon
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-amber-600">{stats.expiringSoon}</span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">in 7 days</span>
              </div>
            </div>

            {/* Card 3: Expired / Suspended */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Blocked / Expired
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-rose-600">
                  {stats.expired + stats.suspended}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">locked</span>
              </div>
            </div>

            {/* Card 4: Subscription Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Revenue
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Kiosk Management Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Registered CSP Kiosks</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Instant remote management and renewal controls</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search CSP code, name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-xs focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            {/* DESKTOP TABLE VIEW (hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">CSP Code</th>
                    <th className="px-5 py-3.5">Operator</th>
                    <th className="px-5 py-3.5">Plan</th>
                    <th className="px-5 py-3.5">Expires On</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">License Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        Loading license database...
                      </td>
                    </tr>
                  ) : filteredKiosks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        No kiosks matching criteria found.
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
                            <div className="text-[11px] text-slate-400">{kiosk.location}</div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900">{kiosk.operatorName}</div>
                            <div className="text-[11px] text-slate-500">{kiosk.mobileNumber || 'No phone'}</div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-block rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700">
                              {kiosk.planName}
                            </span>
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

                          <td className="px-5 py-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Quick +30 Days */}
                              <button
                                onClick={() => promptRenew(kiosk, 30)}
                                title="Renew for 30 Days"
                                className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition"
                              >
                                +30d
                              </button>

                              {/* Quick +365 Days */}
                              <button
                                onClick={() => promptRenew(kiosk, 365)}
                                title="Renew for 1 Year"
                                className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                              >
                                +1 Year
                              </button>

                              {/* Suspend / Reactivate */}
                              {kiosk.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => promptToggleStatus(kiosk, 'SUSPENDED')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Suspend License"
                                  className={`rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? 'Blocking...' : 'Block'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => promptToggleStatus(kiosk, 'ACTIVE')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Unblock License"
                                  className={`rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? 'Unblocking...' : 'Unblock'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (visible only on mobile) */}
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
                      {/* Top Row: CSP & Status */}
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

                      {/* Middle: Operator & Contact */}
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
                        <span className="font-medium text-slate-700">{kiosk.planName}</span>
                        <span>
                          {isExpired ? (
                            <span className="text-rose-600 font-semibold">Expired</span>
                          ) : (
                            <span>{daysLeft} days left</span>
                          )}
                        </span>
                      </div>

                      {/* Mobile Touch Action Buttons */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <button
                          onClick={() => promptRenew(kiosk, 30)}
                          className="flex items-center justify-center py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold active:bg-teal-100 transition"
                        >
                          +30 Days
                        </button>

                        <button
                          onClick={() => promptRenew(kiosk, 365)}
                          className="flex items-center justify-center py-1.5 rounded-lg bg-teal-600 text-white text-xs font-bold shadow-sm active:bg-teal-700 transition"
                        >
                          +1 Year
                        </button>

                        {kiosk.status === 'ACTIVE' ? (
                          <button
                            onClick={() => promptToggleStatus(kiosk, 'SUSPENDED')}
                            disabled={actionLoadingId === kiosk.id}
                            className="flex items-center justify-center py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold active:bg-rose-100 transition"
                          >
                            {actionLoadingId === kiosk.id ? '...' : 'Block'}
                          </button>
                        ) : (
                          <button
                            onClick={() => promptToggleStatus(kiosk, 'ACTIVE')}
                            disabled={actionLoadingId === kiosk.id}
                            className="flex items-center justify-center py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold active:bg-emerald-100 transition"
                          >
                            {actionLoadingId === kiosk.id ? '...' : 'Unblock'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add New Kiosk Modal (Full Mobile Responsive) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-600 text-white shrink-0">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Issue New Kiosk License</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">Directly activate a CSP Kiosk terminal</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKiosk} className="mt-4 sm:mt-5 space-y-3.5 sm:space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    CSP Code / Kiosk ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3A450557"
                    value={formCsp}
                    onChange={(e) => setFormCsp(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 font-mono text-sm uppercase focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Operator Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nagmani Bhardwaj"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9212716009"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Branch / Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Patna, Bihar"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Subscription Plan
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => {
                      const p = e.target.value;
                      setFormPlan(p);
                      if (p === '1_MONTH') { setFormDuration('1'); setFormAmount('199'); }
                      else if (p === '3_MONTHS') { setFormDuration('3'); setFormAmount('449'); }
                      else if (p === '6_MONTHS') { setFormDuration('6'); setFormAmount('999'); }
                      else if (p === '12_MONTHS') { setFormDuration('12'); setFormAmount('1799'); }
                      else { setFormDuration('120'); setFormAmount('4999'); }
                    }}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-teal-500 focus:outline-none"
                  >
                    <option value="1_MONTH">1 Month Starter (₹199)</option>
                    <option value="3_MONTHS">3 Months Quarter (₹449)</option>
                    <option value="6_MONTHS">6 Months Half-Year (₹999)</option>
                    <option value="12_MONTHS">12 Months Enterprise (₹1,799)</option>
                    <option value="LIFETIME">Lifetime Enterprise</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Collected Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-sm font-bold text-slate-800 focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3.5 sm:pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/25 hover:bg-teal-700 disabled:opacity-50"
                >
                  {formSubmitting ? 'Issuing...' : 'Activate License'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
