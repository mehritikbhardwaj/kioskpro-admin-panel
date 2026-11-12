'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Radio, 
  CreditCard,
  Receipt
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Kiosks & Licenses', href: '/kiosks', icon: Users },
    { label: 'Billing & Ledger', href: '/transactions', icon: Receipt },
    { label: 'Remote Broadcast', href: '/broadcast', icon: Radio },
    { label: 'Pricing & UPI QR', href: '/pricing', icon: CreditCard },
  ];

  return (
    <aside className="hidden md:flex w-60 flex-col border-r border-slate-200 bg-white justify-between">
      <div className="py-6 px-3 space-y-1">
        <div className="px-3 mb-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-teal-50 text-teal-800 font-bold shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
        KioskPro Cloud v2.1.2
      </div>
    </aside>
  );
}
