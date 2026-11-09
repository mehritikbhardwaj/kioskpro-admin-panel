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
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { KioskLicense } from '@/lib/types';

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
    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'RENEW', days }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/kiosks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'SET_STATUS', status: newStatus }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateKiosk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCsp.trim() || !formName.trim()) {
      alert('CSP Code and Operator Name are required!');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await fetch('/api/admin/kiosks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cspCode: formCsp.trim(),
          operatorName: formName.trim(),
          mobileNumber: formPhone.trim(),
          location: formLocation.trim() || 'India',
          plan: formPlan,
          durationMonths: Number(formDuration),
          amount: Number(formAmount),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setIsAddModalOpen(false);
        setFormCsp('');
        setFormName('');
        setFormPhone('');
        setFormLocation('');
        fetchData();
      } else {
        alert(json.message || 'Error creating license');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredKiosks = kiosks.filter((k) => {
    const q = searchTerm.toLowerCase();
    return (
      k.cspCode.toLowerCase().includes(q) ||
      k.operatorName.toLowerCase().includes(q) ||
      k.mobileNumber.toLowerCase().includes(q) ||
      k.location.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchData} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                License &amp; Device Overview
              </h1>
              <p className="text-sm text-slate-500">
                Monitor and issue real-time licenses for SBI KioskPro terminals.
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Issue New License</span>
            </button>
          </div>

          {/* Broadcast Banner */}
          {broadcast && broadcast.enabled && (
            <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50/80 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600 text-white shrink-0">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                      Active Remote Broadcast
                    </span>
                    <span className="rounded bg-teal-200/80 px-1.5 py-0.2 text-[10px] font-bold text-teal-900">
                      LIVE ON ALL TERMINALS
                    </span>
                  </div>
                  <p className="text-sm text-teal-950 font-medium">{broadcast.message}</p>
                </div>
              </div>
              <a
                href="/broadcast"
                className="text-xs font-semibold text-teal-700 hover:text-teal-900 underline underline-offset-2 ml-4 shrink-0"
              >
                Change Message
              </a>
            </div>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Active Kiosks
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{stats.active}</span>
                <span className="text-xs font-medium text-slate-500">of {stats.total} total</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expiring in 7 Days
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-600">{stats.expiringSoon}</span>
                <span className="text-xs font-medium text-slate-500">require renewal</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Expired / Suspended
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600">{stats.expired + stats.suspended}</span>
                <span className="text-xs font-medium text-slate-500">kiosks locked</span>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Subscription Revenue
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <IndianRupee className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Kiosk Management Table Section */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Registered CSP Kiosks</h2>
                <p className="text-xs text-slate-500">Instant remote management and renewal controls</p>
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

            <div className="overflow-x-auto">
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
                                onClick={() => handleRenew(kiosk.id, 30)}
                                title="Renew for 30 Days"
                                className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition"
                              >
                                +30d
                              </button>

                              {/* Quick +365 Days */}
                              <button
                                onClick={() => handleRenew(kiosk.id, 365)}
                                title="Renew for 1 Year"
                                className="rounded-lg bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                              >
                                +1 Year
                              </button>

                              {/* Suspend / Reactivate */}
                              {kiosk.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleToggleStatus(kiosk.id, 'SUSPENDED')}
                                  title="Suspend License"
                                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                                >
                                  Block
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(kiosk.id, 'ACTIVE')}
                                  title="Reactivate License"
                                  className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                                >
                                  Activate
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
          </div>
        </main>
      </div>

      {/* Add New Kiosk Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Issue New Kiosk License</h3>
                  <p className="text-xs text-slate-500">Directly activate a CSP Kiosk terminal</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKiosk} className="mt-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
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
    </div>
  );
}
