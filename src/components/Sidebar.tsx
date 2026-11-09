'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Radio, 
  Settings, 
  QrCode, 
  ExternalLink 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Kiosks & Licenses', href: '/kiosks', icon: Users },
    { label: 'Remote Broadcast', href: '/broadcast', icon: Radio },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex-1 py-6 px-4 space-y-1">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Management
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

        <div className="pt-6 px-3 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Distributor Info
        </div>

        <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-xs text-slate-700 space-y-2">
          <div className="flex items-center gap-2 font-bold text-teal-900">
            <QrCode className="h-4 w-4 text-teal-600" />
            <span>Billing UPI ID</span>
          </div>
          <div className="font-mono bg-white rounded p-1.5 border border-teal-200 text-teal-950 select-all font-semibold">
            9212716009@yescred
          </div>
          <p className="text-[11px] text-slate-500">
            Clients pay here to renew their subscription.
          </p>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
        KioskPro Cloud v2.5.0
      </div>
    </aside>
  );
}
