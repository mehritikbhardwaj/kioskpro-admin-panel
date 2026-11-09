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

export default function KiosksPage() {
  const router = useRouter();
  const [kiosks, setKiosks] = useState<KioskLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
    if (!confirm(`Are you sure you want to delete kiosk license for ${name}?`)) return;
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
      k.mobileNumber.toLowerCase().includes(q) ||
      k.location.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'ALL' && k.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchData} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                All Kiosks &amp; Subscriptions
              </h1>
              <p className="text-sm text-slate-500">
                Detailed record of all SBI KioskPro installations and cloud licenses.
              </p>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
              {(['ALL', 'ACTIVE', 'EXPIRED', 'SUSPENDED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    statusFilter === st
                      ? 'bg-teal-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Kiosks Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
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
                                onClick={() => handleRenew(kiosk.id, 30)}
                                title="Renew for 30 Days"
                                className="rounded-lg bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-700 hover:bg-teal-100 transition"
                              >
                                +30d
                              </button>

                              {/* Quick +365 Days */}
                              <button
                                onClick={() => handleRenew(kiosk.id, 365)}
                                title="Renew for 1 Year"
                                className="rounded-lg bg-teal-600 px-2 py-1 text-xs font-semibold text-white hover:bg-teal-700 transition"
                              >
                                +1y
                              </button>

                              {/* Suspend / Reactivate */}
                              {kiosk.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => handleToggleStatus(kiosk.id, 'SUSPENDED')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Suspend License"
                                  className={`rounded-lg bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? 'Blocking...' : 'Block'}
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleStatus(kiosk.id, 'ACTIVE')}
                                  disabled={actionLoadingId === kiosk.id}
                                  title="Reactivate License"
                                  className={`rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition ${
                                    actionLoadingId === kiosk.id ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                >
                                  {actionLoadingId === kiosk.id ? 'Activating...' : 'Activate'}
                                </button>
                              )}

                              {/* View JSON verify link */}
                              <a
                                href={`/api/license/verify?csp_code=${kiosk.cspCode}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Inspect Live API JSON"
                                className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(kiosk.id, kiosk.operatorName)}
                                title="Delete Kiosk"
                                className="rounded-lg p-1 text-slate-300 hover:text-rose-600 transition"
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
          </div>
        </main>
      </div>
    </div>
  );
}
