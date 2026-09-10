'use client';

import React from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Activity, ArrowUpRight } from 'lucide-react';

export function MobbinFooter() {
  const { companySettings, setCurrentView } = useInventory();

  return (
    <footer className="mt-16 w-full bg-[#141414] dark:bg-[#0c0c0e] text-white rounded-t-[24px] px-6 sm:px-12 py-12 lg:py-16 font-sans border-t border-transparent dark:border-[#1f1f23] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-[#262626] dark:border-[#1f1f23] pb-12">
        <div className="space-y-3 max-w-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[30%] bg-white text-[#141414] flex items-center justify-center font-bold text-sm">
              <Activity className="w-4 h-4 text-[#141414]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Stoq.</span>
          </div>
          <p className="text-sm font-light text-[#adadad] leading-relaxed">
            Autonomous inventory intelligence, optical matrix scanning, and real-time demand telemetry built for modern enterprises.
          </p>
        </div>

        {/* Quick Navigation Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
          <div>
            <p className="font-semibold text-white uppercase tracking-wider mb-3 text-[11px]">Platform</p>
            <ul className="space-y-2 text-[#adadad]">
              <li>
                <button onClick={() => setCurrentView('dashboard')} className="hover:text-white transition">
                  Command Center
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('inventory')} className="hover:text-white transition">
                  SKU Catalog
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('barcode-scanner')} className="hover:text-white transition">
                  Laser Scanner
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white uppercase tracking-wider mb-3 text-[11px]">Operations</p>
            <ul className="space-y-2 text-[#adadad]">
              <li>
                <button onClick={() => setCurrentView('orders')} className="hover:text-white transition">
                  Purchase Orders
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('sales')} className="hover:text-white transition">
                  Sales & Invoices
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('suppliers')} className="hover:text-white transition">
                  Supplier Matrix
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentView('analytics')} className="hover:text-white transition">
                  Demand Velocity
                </button>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-white uppercase tracking-wider mb-3 text-[11px]">Organization</p>
            <ul className="space-y-2 text-[#adadad]">
              <li className="text-white font-medium">{companySettings.companyName}</li>
              <li>{companySettings.currencyCode} Matrix</li>
              <li>Tax ID: {companySettings.taxNumber}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#707070]">
        <p>© 2026 {companySettings.companyName}. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#262626] text-[#adadad] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Telemetry 99.9% Active
          </span>
          <span className="font-mono text-[11px] text-[#adadad]">Mobbin Minimalist Edition</span>
        </div>
      </div>
    </footer>
  );
}
