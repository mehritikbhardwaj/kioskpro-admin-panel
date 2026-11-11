'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { 
  CreditCard, 
  QrCode, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Upload, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Sparkles,
  Phone,
  User,
  ShieldAlert
} from 'lucide-react';
import { SystemConfig, PlanPricing } from '@/lib/types';

export default function PricingPage() {
  const router = useRouter();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [distributorName, setDistributorName] = useState('');
  const [distributorPhone, setDistributorPhone] = useState('');
  const [distributorUpi, setDistributorUpi] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [plans, setPlans] = useState<PlanPricing[]>([]);
  const [txnPassword, setTxnPassword] = useState('');
  const [showTxnPassword, setShowTxnPassword] = useState(false);

  // QR preview selection
  const [useAutoUpiQr, setUseAutoUpiQr] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await fetch('/api/admin/pricing');
      if (res.status === 401) {
        router.push('/login');
        return;
      }
      const json = await res.json();
      if (json.success && json.config) {
        setConfig(json.config);
        setDistributorName(json.config.distributorName || '');
        setDistributorPhone(json.config.distributorPhone || '');
        setDistributorUpi(json.config.distributorUpi || '');
        setQrCodeUrl(json.config.qrCodeUrl || '/qr_code.jpg');
        setPlans(json.config.plans || []);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load pricing config: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handlePlanPriceChange = (index: number, field: 'price' | 'originalPrice', value: string) => {
    const num = Number(value) || 0;
    setPlans((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: num };
      return copy;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setQrCodeUrl(event.target.result as string);
          setUseAutoUpiQr(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const generatedUpiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    `upi://pay?pa=${distributorUpi}&pn=${encodeURIComponent(distributorName || 'SBI KioskPro')}&cu=INR`
  )}`;

  const activeQrSrc = useAutoUpiQr ? generatedUpiQrUrl : (qrCodeUrl || '/qr_code.jpg');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!txnPassword.trim()) {
      setErrorMsg('Transaction Password zaroori hai! Kripya authorized Transaction Password enter karein.');
      return;
    }

    try {
      setSaving(true);
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          txnPassword: txnPassword.trim(),
          distributorName,
          distributorPhone,
          distributorUpi,
          qrCodeUrl: useAutoUpiQr ? generatedUpiQrUrl : qrCodeUrl,
          plans,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Settings update karne me error aaya');
      } else {
        setSuccessMsg('✅ Pricing, UPI ID aur QR Code safaltapoorvak update ho gaye hain!');
        setTxnPassword('');
        if (json.config) {
          setConfig(json.config);
          setPlans(json.config.plans);
        }
        setTimeout(() => setSuccessMsg(''), 6000);
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchConfig} isLoading={loading} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-5xl mx-auto w-full space-y-5 sm:space-y-6 pb-24 md:pb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Pricing, UPI &amp; Billing QR Settings
                </h1>
                <span className="flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                  <Lock className="h-3 w-3" />
                  Txn PIN Protected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500">
                KioskPro license packages ke prices, distributor UPI ID aur payment QR code yahan se live set karein.
              </p>
            </div>
          </div>

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Authorization Failed</p>
                <p className="font-normal text-rose-700 mt-0.5">{errorMsg}</p>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* Top Grid: UPI & QR Code Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left Column: Distributor & UPI Details */}
              <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <User className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Authorised Distributor &amp; UPI Details</h2>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Distributor Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. KioskPro Support"
                      value={distributorName}
                      onChange={(e) => setDistributorName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      WhatsApp / Calling Mobile Number
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9212716009"
                      value={distributorPhone}
                      onChange={(e) => setDistributorPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Billing UPI ID (VPA) *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="e.g. 9212716009@yescred"
                        value={distributorUpi}
                        onChange={(e) => setDistributorUpi(e.target.value)}
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-teal-500 focus:outline-none font-mono text-teal-900 font-bold bg-teal-50/30"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Kiosks par renewal ke waqt yahi UPI ID customer ko display hoga.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: QR Code & Live Preview */}
              <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <QrCode className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Billing QR Code</h2>
                </div>

                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center overflow-hidden">
                    <img
                      src={activeQrSrc}
                      alt="Payment QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 mt-2">
                    {distributorUpi || 'No UPI ID set'}
                  </span>
                  <span className="text-[10px] text-slate-400">Scan to Pay via Any UPI App</span>
                </div>

                {/* QR Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">QR Generation Mode:</span>
                    <button
                      type="button"
                      onClick={() => setUseAutoUpiQr(!useAutoUpiQr)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        useAutoUpiQr
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {useAutoUpiQr ? 'Auto UPI QR Active' : 'Switch to Auto UPI QR'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                      <Upload className="h-3.5 w-3.5 text-teal-600" />
                      <span>Upload Custom QR</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setQrCodeUrl('/qr_code.jpg');
                        setUseAutoUpiQr(false);
                      }}
                      className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                      title="Reset to default QR"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section: Plans & Pricing */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-teal-600" />
                  <h2 className="text-sm font-bold text-slate-900">Subscription Packages &amp; Official Rates</h2>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Client software &amp; renewal popup par yahi rates dikhenge
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plans.map((plan, idx) => {
                  const isTrial = plan.planId === '1_DAY_TRIAL';
                  return (
                    <div
                      key={plan.planId}
                      className={`p-4 rounded-xl border transition ${
                        isTrial
                          ? 'border-purple-200 bg-purple-50/40'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{plan.name}</span>
                          {plan.badge && (
                            <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[9px] font-bold text-teal-800">
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {isTrial ? '1 Day Validity' : `${plan.durationMonths} Month(s)`}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 mb-3">{plan.description}</p>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-0.5">
                            Offer Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            disabled={isTrial}
                            value={plan.price}
                            onChange={(e) => handlePlanPriceChange(idx, 'price', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm font-bold text-slate-900 focus:border-teal-500 focus:outline-none bg-white disabled:bg-slate-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                            Strikethrough Price (₹)
                          </label>
                          <input
                            type="number"
                            min="0"
                            disabled={isTrial}
                            value={plan.originalPrice}
                            onChange={(e) => handlePlanPriceChange(idx, 'originalPrice', e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm text-slate-500 focus:border-teal-500 focus:outline-none bg-white disabled:bg-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Authorization & Save Footer */}
            <div className="rounded-2xl border-2 border-teal-600 bg-white p-5 sm:p-6 shadow-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900">
                    Master Security Authorization Required
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Prices, UPI ID aur QR code view sabhi kar sakte hain, lekin update ya save karne ke liye authorised <strong>Master Transaction Password</strong> enter karna anivarya hai.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center pt-2">
                <div className="sm:col-span-8 relative">
                  <input
                    type={showTxnPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter Master Transaction Password"
                    value={txnPassword}
                    onChange={(e) => setTxnPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 py-3 pl-4 pr-11 text-sm font-semibold tracking-wider text-slate-900 focus:border-teal-600 focus:outline-none bg-slate-50/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTxnPassword(!showTxnPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showTxnPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="sm:col-span-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 px-5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.99] transition disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Authorize &amp; Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
