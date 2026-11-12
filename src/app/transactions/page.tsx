'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import {
  Receipt,
  Search,
  Filter,
  IndianRupee,
  Plus,
  Printer,
  Share2,
  Copy,
  Check,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  Download,
  RefreshCw,
  FileText,
  Smartphone,
  X,
  CreditCard,
  Building,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { SubscriptionTransaction, PaymentMethodType, PlanType, KioskLicense } from '@/lib/types';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<SubscriptionTransaction[]>([]);
  const [kiosks, setKiosks] = useState<KioskLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedTxnForReceipt, setSelectedTxnForReceipt] = useState<SubscriptionTransaction | null>(null);

  // Record Form state
  const [formCsp, setFormCsp] = useState('');
  const [formName, setFormName] = useState('');
  const [formMobile, setFormMobile] = useState('');
  const [formPlan, setFormPlan] = useState<PlanType>('12_MONTHS');
  const [formPlanName, setFormPlanName] = useState('12 Months Annual Access');
  const [formAmount, setFormAmount] = useState('1799');
  const [formDays, setFormDays] = useState('365');
  const [formMethod, setFormMethod] = useState<PaymentMethodType>('UPI');
  const [formUtr, setFormUtr] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAutoRenew, setFormAutoRenew] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Toast / Copy feedback
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);
  const [copiedReceiptLink, setCopiedReceiptLink] = useState(false);

  const receiptPrintRef = useRef<HTMLDivElement>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [txnRes, kioskRes] = await Promise.all([
        fetch('/api/admin/transactions'),
        fetch('/api/admin/kiosks'),
      ]);

      if (txnRes.status === 401 || kioskRes.status === 401) {
        router.push('/login');
        return;
      }

      const txnData = await txnRes.json();
      const kioskData = await kioskRes.json();

      if (txnData.success && Array.isArray(txnData.transactions)) {
        setTransactions(txnData.transactions);
      }
      if (kioskData.success && Array.isArray(kioskData.kiosks)) {
        setKiosks(kioskData.kiosks);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Autofill kiosk info when CSP is typed in Record Modal
  const handleCspChange = (cspInput: string) => {
    setFormCsp(cspInput);
    const clean = cspInput.trim().toLowerCase();
    if (clean) {
      const match = kiosks.find((k) => k.cspCode.toLowerCase() === clean);
      if (match) {
        setFormName(match.operatorName || '');
        setFormMobile(match.mobileNumber || '');
      }
    }
  };

  const handlePlanSelect = (plan: PlanType) => {
    setFormPlan(plan);
    switch (plan) {
      case '1_DAY_TRIAL':
        setFormPlanName('1-Day Free Trial (₹0)');
        setFormAmount('0');
        setFormDays('1');
        setFormMethod('FREE_TRIAL');
        break;
      case '1_MONTH':
        setFormPlanName('1 Month Starter License');
        setFormAmount('199');
        setFormDays('30');
        setFormMethod('UPI');
        break;
      case '3_MONTHS':
        setFormPlanName('3 Months Quarterly License');
        setFormAmount('499');
        setFormDays('90');
        setFormMethod('UPI');
        break;
      case '6_MONTHS':
        setFormPlanName('6 Months Half-Yearly License');
        setFormAmount('999');
        setFormDays('180');
        setFormMethod('UPI');
        break;
      case '12_MONTHS':
        setFormPlanName('12 Months Annual Access');
        setFormAmount('1799');
        setFormDays('365');
        setFormMethod('UPI');
        break;
      default:
        break;
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCsp.trim()) {
      alert('Please enter a CSP Code');
      return;
    }

    try {
      setFormSubmitting(true);
      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cspCode: formCsp.trim(),
          operatorName: formName.trim() || 'SBI CSP Operator',
          mobileNumber: formMobile.trim() || undefined,
          plan: formPlan,
          planName: formPlanName,
          amount: Number(formAmount) || 0,
          durationDays: Number(formDays) || 30,
          paymentMethod: formMethod,
          utrNumber: formUtr.trim() || undefined,
          notes: formNotes.trim() || undefined,
          autoRenewKiosk: formAutoRenew,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.message || 'Failed to record transaction');
      } else {
        setIsRecordModalOpen(false);
        // Reset form
        setFormCsp('');
        setFormName('');
        setFormMobile('');
        setFormUtr('');
        setFormNotes('');
        await fetchData();
      }
    } catch (err: any) {
      alert('Error recording transaction: ' + err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Copy CSP or ID to clipboard
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxnId(id);
    setTimeout(() => setCopiedTxnId(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let thisMonthRevenue = 0;
    let paidCount = 0;
    let trialCount = 0;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    transactions.forEach((t) => {
      if (t.status === 'COMPLETED') {
        const amt = Number(t.amount) || 0;
        totalRevenue += amt;

        const date = new Date(t.createdAt);
        if (date.getFullYear() === currentYear && date.getMonth() === currentMonth) {
          thisMonthRevenue += amt;
        }

        if (amt > 0) {
          paidCount += 1;
        } else if (t.paymentMethod === 'FREE_TRIAL') {
          trialCount += 1;
        }
      }
    });

    return {
      totalRevenue,
      thisMonthRevenue,
      paidCount,
      trialCount,
      totalCount: transactions.length,
    };
  }, [transactions]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        t.cspCode.toLowerCase().includes(q) ||
        t.operatorName.toLowerCase().includes(q) ||
        (t.mobileNumber && t.mobileNumber.toLowerCase().includes(q)) ||
        (t.utrNumber && t.utrNumber.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q));

      // Plan filter
      const matchPlan = selectedPlan === 'ALL' || t.plan === selectedPlan;

      // Method filter
      const matchMethod = selectedMethod === 'ALL' || t.paymentMethod === selectedMethod;

      return matchSearch && matchPlan && matchMethod;
    });
  }, [transactions, searchTerm, selectedPlan, selectedMethod]);

  const handlePrintReceipt = () => {
    window.print();
  };

  const handleShareWhatsApp = (txn: SubscriptionTransaction) => {
    const text = `*🧾 KIOSKPRO LICENSE BILLING RECEIPT*\n` +
      `----------------------------------------\n` +
      `*Receipt No:* ${txn.id.toUpperCase()}\n` +
      `*CSP Code:* ${txn.cspCode}\n` +
      `*Operator Name:* ${txn.operatorName}\n` +
      `*Plan:* ${txn.planName} (${txn.durationDays} Days)\n` +
      `*Amount Paid:* ₹${txn.amount.toLocaleString('en-IN')}\n` +
      `*Payment Mode:* ${txn.paymentMethod}${txn.utrNumber ? ` (UTR: ${txn.utrNumber})` : ''}\n` +
      `*Date:* ${new Date(txn.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n` +
      `*Status:* ACTIVE / COMPLETED ✅\n` +
      `----------------------------------------\n` +
      `Distributor Helpline: 9212716009\n` +
      `SBI KioskPro Enterprise Banking Automation`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const copyReceiptSummary = (txn: SubscriptionTransaction) => {
    const text = `🧾 KioskPro Billing Receipt: CSP ${txn.cspCode} | ${txn.planName} | ₹${txn.amount} Paid via ${txn.paymentMethod} (${txn.utrNumber || 'Verified'}) on ${new Date(txn.createdAt).toLocaleDateString('en-IN')}. Status: ACTIVE. Support: 9212716009`;
    navigator.clipboard.writeText(text);
    setCopiedReceiptLink(true);
    setTimeout(() => setCopiedReceiptLink(false), 2000);
  };

  // Helper for plan badge styling
  const getPlanBadge = (plan: PlanType) => {
    switch (plan) {
      case '12_MONTHS':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case '6_MONTHS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case '3_MONTHS':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case '1_MONTH':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case '1_DAY_TRIAL':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getMethodBadge = (method: PaymentMethodType) => {
    switch (method) {
      case 'UPI':
        return 'bg-teal-50 text-teal-800 border-teal-200';
      case 'CASH':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'FREE_TRIAL':
        return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'BANK_TRANSFER':
        return 'bg-sky-50 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar onRefresh={fetchData} isLoading={refreshing} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-24 md:pb-8">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-600/20">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Subscription Billing &amp; Ledger
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Audit log of all KioskPro license renewals, UPI payments, and trial activations.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-teal-600' : 'text-slate-500'}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Record Payment / Renewal</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {/* Card 1: Total Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Collected
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900">
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-emerald-600">Lifetime</span>
              </div>
            </div>

            {/* Card 2: This Month Revenue */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  This Month
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-teal-700">
                  ₹{stats.thisMonthRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Collection</span>
              </div>
            </div>

            {/* Card 3: Paid Subscriptions */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Paid Subscriptions
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900">{stats.paidCount}</span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Transactions</span>
              </div>
            </div>

            {/* Card 4: Free Trials Issued */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Free Trials (24h)
                </span>
                <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <div className="mt-2 sm:mt-3 flex items-baseline gap-1">
                <span className="text-lg sm:text-2xl font-black text-slate-900">{stats.trialCount}</span>
                <span className="text-[10px] sm:text-xs font-medium text-slate-500">Activated</span>
              </div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by CSP Code, Operator Name, Phone, or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {/* Plan Filter */}
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Plans</option>
                <option value="12_MONTHS">12 Months (₹1,799)</option>
                <option value="6_MONTHS">6 Months (₹999)</option>
                <option value="3_MONTHS">3 Months (₹499)</option>
                <option value="1_MONTH">1 Month (₹199)</option>
                <option value="1_DAY_TRIAL">1 Day Free Trial (₹0)</option>
              </select>

              {/* Payment Method Filter */}
              <select
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium text-slate-700 focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">All Payment Modes</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash</option>
                <option value="FREE_TRIAL">Free Trial</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="ADMIN_OVERRIDE">Admin Override</option>
              </select>
            </div>
          </div>

          {/* Transactions Count & Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              {(searchTerm || selectedPlan !== 'ALL' || selectedMethod !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedPlan('ALL');
                    setSelectedMethod('ALL');
                  }}
                  className="text-xs font-bold text-teal-600 hover:text-teal-800"
                >
                  Reset Filters
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading ? (
                <div className="py-20 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Loading Billing Ledger...</p>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mx-auto mb-3">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No Transactions Found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    {searchTerm || selectedPlan !== 'ALL' || selectedMethod !== 'ALL'
                      ? 'No records match your selected filters. Try broadening your search.'
                      : 'No subscription transactions recorded yet. Click "Record Payment" to add the first entry.'}
                  </p>
                  {(searchTerm || selectedPlan !== 'ALL' || selectedMethod !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedPlan('ALL');
                        setSelectedMethod('ALL');
                      }}
                      className="mt-3 text-xs font-bold text-teal-600 hover:underline"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Date &amp; Time</th>
                        <th className="px-4 py-3">CSP Details</th>
                        <th className="px-4 py-3">Plan / Duration</th>
                        <th className="px-4 py-3">Payment Mode &amp; UTR</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-center">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.map((t) => {
                        const dateObj = new Date(t.createdAt);
                        const dateFormatted = dateObj.toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        });
                        const timeFormatted = dateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });

                        return (
                          <tr key={t.id} className="hover:bg-slate-50/80 transition">
                            {/* Date */}
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <div className="font-semibold text-slate-800">{dateFormatted}</div>
                              <div className="text-[11px] text-slate-400">{timeFormatted}</div>
                            </td>

                            {/* CSP Details */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] sm:text-xs">
                                  {t.cspCode}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(t.cspCode, t.id)}
                                  className="text-slate-400 hover:text-slate-600 transition"
                                  title="Copy CSP Code"
                                >
                                  {copiedTxnId === t.id ? (
                                    <Check className="h-3 w-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                              <div className="font-semibold text-slate-700 text-xs mt-0.5">
                                {t.operatorName}
                              </div>
                              {t.mobileNumber && (
                                <div className="text-[11px] text-slate-400">{t.mobileNumber}</div>
                              )}
                            </td>

                            {/* Plan & Duration */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${getPlanBadge(
                                    t.plan
                                  )}`}
                                >
                                  {t.planName}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                                {t.durationDays} Days Access
                              </div>
                            </td>

                            {/* Payment Mode */}
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${getMethodBadge(
                                  t.paymentMethod
                                )}`}
                              >
                                {t.paymentMethod}
                              </span>
                              {t.utrNumber && (
                                <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate max-w-[150px]">
                                  Ref: {t.utrNumber}
                                </div>
                              )}
                              {t.notes && (
                                <div className="text-[10px] text-slate-400 italic truncate max-w-[150px]">
                                  {t.notes}
                                </div>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="font-black text-slate-900 text-sm sm:text-base">
                                {t.amount === 0 ? (
                                  <span className="text-emerald-600 font-bold">FREE (₹0)</span>
                                ) : (
                                  `₹${t.amount.toLocaleString('en-IN')}`
                                )}
                              </div>
                              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                {t.status}
                              </div>
                            </td>

                            {/* Receipt Button */}
                            <td className="px-4 py-3.5 text-center whitespace-nowrap">
                              <button
                                onClick={() => setSelectedTxnForReceipt(t)}
                                className="inline-flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-800 hover:bg-teal-100 transition shadow-sm"
                                title="View Tax Invoice & Receipt"
                              >
                                <Receipt className="h-3.5 w-3.5 text-teal-600" />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL 1: RECORD PAYMENT / MANUAL RENEWAL                     */}
      {/* ============================================================ */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Record Payment &amp; Renewal</h3>
                  <p className="text-xs text-slate-500">Record offline/UPI subscription &amp; auto-extend license</p>
                </div>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* CSP Code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  CSP Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 3A450557 or 1A990022"
                  value={formCsp}
                  onChange={(e) => handleCspChange(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              {/* Operator Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Operator Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formMobile}
                    onChange={(e) => setFormMobile(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Plan Quick Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Select License Plan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePlanSelect('12_MONTHS')}
                    className={`p-2 rounded-xl border text-left transition ${
                      formPlan === '12_MONTHS'
                        ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">12 Months (Yearly)</div>
                    <div className="text-sm font-extrabold text-purple-700">₹1,799</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('6_MONTHS')}
                    className={`p-2 rounded-xl border text-left transition ${
                      formPlan === '6_MONTHS'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">6 Months</div>
                    <div className="text-sm font-extrabold text-blue-700">₹999</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('3_MONTHS')}
                    className={`p-2 rounded-xl border text-left transition ${
                      formPlan === '3_MONTHS'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">3 Months</div>
                    <div className="text-sm font-extrabold text-amber-700">₹499</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('1_MONTH')}
                    className={`p-2 rounded-xl border text-left transition ${
                      formPlan === '1_MONTH'
                        ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">1 Month Starter</div>
                    <div className="text-sm font-extrabold text-teal-700">₹199</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePlanSelect('1_DAY_TRIAL')}
                    className={`p-2 rounded-xl border text-left transition ${
                      formPlan === '1_DAY_TRIAL'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-xs">1-Day Trial (24h)</div>
                    <div className="text-sm font-extrabold text-emerald-700">₹0 (Free)</div>
                  </button>
                </div>
              </div>

              {/* Amount & Duration (Days) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    type="number"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Extension Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={formDays}
                    onChange={(e) => setFormDays(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    required
                  />
                </div>
              </div>

              {/* Payment Mode & UTR */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value as PaymentMethodType)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                    <option value="FREE_TRIAL">Free Trial (₹0)</option>
                    <option value="ADMIN_OVERRIDE">Admin Manual Override</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    UTR / Reference Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 431289128019"
                    value={formUtr}
                    onChange={(e) => setFormUtr(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Notes / Remarks */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received payment via QR code on WhatsApp"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              {/* Auto Renew Toggle */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-teal-200 bg-teal-50/70">
                <input
                  type="checkbox"
                  id="autoRenewCheck"
                  checked={formAutoRenew}
                  onChange={(e) => setFormAutoRenew(e.target.checked)}
                  className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="autoRenewCheck" className="text-xs font-semibold text-teal-950 cursor-pointer">
                  Auto-Extend License: Automatically add {formDays} days to CSP’s current expiry date in Kiosks DB.
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 disabled:opacity-50 transition"
                >
                  {formSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Recording...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save &amp; Record Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: INTERACTIVE RECEIPT / TAX INVOICE                   */}
      {/* ============================================================ */}
      {selectedTxnForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-200 max-h-[92vh] flex flex-col">
            {/* Modal Controls Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-4 w-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Official License Receipt
                </span>
              </div>
              <button
                onClick={() => setSelectedTxnForReceipt(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div
              ref={receiptPrintRef}
              id="printable-receipt"
              className="p-6 sm:p-8 space-y-5 overflow-y-auto bg-white text-slate-900"
            >
              {/* Receipt Header Banner */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white font-black text-sm">
                      KP
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-slate-900 leading-none">
                        KIOSKPRO COMMERCE
                      </h2>
                      <p className="text-[10px] font-semibold text-teal-700 tracking-wide mt-0.5">
                        SBI BANKING AUTOMATION
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-500 space-y-0.5">
                    <p>Authorized Distributor: 9212716009</p>
                    <p>Email: support@kioskpro.in</p>
                    <p>Cloud Server: India Primary Zone</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-2.5 py-1 rounded bg-teal-50 border border-teal-200 text-teal-900 font-extrabold text-xs">
                    TAX INVOICE / RECEIPT
                  </span>
                  <div className="mt-2 text-xs font-mono font-bold text-slate-700">
                    ID: {selectedTxnForReceipt.id.toUpperCase().substring(0, 18)}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Date:{' '}
                    {new Date(selectedTxnForReceipt.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {/* Customer / Terminal Details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Billed To / Licensee
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">SBI CSP Code:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {selectedTxnForReceipt.cspCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Operator Name:</span>
                    <span className="font-bold text-slate-900">{selectedTxnForReceipt.operatorName}</span>
                  </div>
                  {selectedTxnForReceipt.mobileNumber && (
                    <div>
                      <span className="text-slate-500 block">Contact Phone:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedTxnForReceipt.mobileNumber}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block">Payment Method:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedTxnForReceipt.paymentMethod}
                    </span>
                  </div>
                </div>
              </div>

              {/* Service Line Items */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold uppercase tracking-wider text-slate-600 text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Service Description</th>
                      <th className="px-4 py-2.5 text-center">Duration</th>
                      <th className="px-4 py-2.5 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{selectedTxnForReceipt.planName}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          SBI Kiosk Single-Click Automation, Rule Sync v2.1.0, Auto-Updates Included
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-slate-700">
                        {selectedTxnForReceipt.durationDays} Days
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        ₹{selectedTxnForReceipt.amount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="flex justify-between items-start pt-2 border-t border-slate-200">
                <div className="text-xs text-slate-500 space-y-1">
                  {selectedTxnForReceipt.utrNumber && (
                    <p className="font-mono text-[11px]">
                      UTR/Ref: <strong className="text-slate-800">{selectedTxnForReceipt.utrNumber}</strong>
                    </p>
                  )}
                  {selectedTxnForReceipt.notes && (
                    <p className="italic text-[11px]">Note: {selectedTxnForReceipt.notes}</p>
                  )}
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Payment Status: Verified &amp; Paid (Completed)
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500">Net Total (Inclusive of GST):</div>
                  <div className="text-2xl font-black text-slate-900">
                    {selectedTxnForReceipt.amount === 0 ? (
                      <span className="text-emerald-600 font-bold">₹0.00 (FREE)</span>
                    ) : (
                      `₹${selectedTxnForReceipt.amount.toLocaleString('en-IN')}.00`
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Seal / Verification */}
              <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-teal-600" />
                  <span>Authenticated Cryptographic Receipt (KioskPro Cloud)</span>
                </div>
                <span>Helpline: 9212716009</span>
              </div>
            </div>

            {/* Modal Action Buttons Footer */}
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(selectedTxnForReceipt)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
                >
                  <Share2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Send WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyReceiptSummary(selectedTxnForReceipt)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  {copiedReceiptLink ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedReceiptLink ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTxnForReceipt(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS for Print Mode */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible;
          }
          #printable-receipt {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            padding: 24px;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}