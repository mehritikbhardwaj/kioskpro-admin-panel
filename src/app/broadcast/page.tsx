'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { Radio, AlertCircle, CheckCircle2, Send, Save, BellRing } from 'lucide-react';
import { BroadcastAnnouncement } from '@/lib/types';

export default function BroadcastPage() {
  const router = useRouter();
  const [broadcast, setBroadcast] = useState<BroadcastAnnouncement>({
    enabled: true,
    message: '',
    level: 'info',
    updatedAt: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const fetchBroadcast = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/broadcast');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (json.success) {
        setBroadcast(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBroadcast();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(broadcast),
      });
      const json = await res.json();
      if (json.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchBroadcast} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Remote Announcement Broadcast
            </h1>
            <p className="text-sm text-slate-500">
              Broadcast high-priority alerts, maintenance notices, and reminders directly into SBI KioskPro terminals.
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>Broadcast message updated successfully! All kiosks will receive this on their next ping.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            {/* Toggle Enable */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <span className="text-sm font-bold text-slate-900">Enable Broadcast Banner</span>
                <p className="text-xs text-slate-500">
                  When enabled, terminals will show this banner alert upon opening.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcast.enabled}
                  onChange={(e) => setBroadcast({ ...broadcast, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Severity Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Alert Severity Level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'info', label: 'Info (Standard)', color: 'border-teal-500 bg-teal-50 text-teal-800' },
                  { id: 'warning', label: 'Warning (Urgent)', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                  { id: 'critical', label: 'Critical (Maintenance)', color: 'border-rose-500 bg-rose-50 text-rose-800' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setBroadcast({ ...broadcast, level: lvl.id as any })}
                    className={`rounded-xl border-2 p-3 text-xs font-bold text-center transition ${
                      broadcast.level === lvl.id
                        ? lvl.color
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Announcement Message (Hindi or English)
              </label>
              <textarea
                rows={4}
                required
                value={broadcast.message}
                onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
                placeholder="e.g. SBI Server maintenance scheduled from 2:00 PM to 3:30 PM today. Please plan cash transactions accordingly."
                className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <p className="mt-1.5 text-[11px] text-slate-400">
                Supports Unicode (Hindi and regional languages).
              </p>
            </div>

            {/* Live Terminal Preview */}
            <div>
              <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Terminal Live Preview
              </span>
              <div
                className={`rounded-xl border p-4 shadow-sm transition ${
                  broadcast.level === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-950'
                    : broadcast.level === 'critical'
                    ? 'border-rose-200 bg-rose-50 text-rose-950'
                    : 'border-teal-200 bg-teal-50 text-teal-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-white shrink-0 ${
                      broadcast.level === 'warning'
                        ? 'bg-amber-600'
                        : broadcast.level === 'critical'
                        ? 'bg-rose-600'
                        : 'bg-teal-600'
                    }`}
                  >
                    <BellRing className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                      {broadcast.level.toUpperCase()} NOTICE
                    </span>
                    <p className="text-sm font-semibold mt-0.5">
                      {broadcast.message || 'No announcement message entered yet.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-600/25 hover:bg-teal-700 disabled:opacity-50 transition"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Publishing...' : 'Publish Broadcast'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
