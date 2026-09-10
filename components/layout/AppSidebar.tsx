'use client';

import React from 'react';
import { useInventory } from '@/lib/inventory-context';
import {
  LayoutDashboard,
  Package,
  QrCode,
  Scan,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  isAi?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AppSidebar({ isMobileOpen, onCloseMobile }: SidebarProps) {
  const { currentView, setCurrentView, companySettings, products } = useInventory();

  const lowStockCount = products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK').length;

  const navGroups: NavGroup[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'inventory', label: 'SKU Catalog Matrix', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined },
      ],
    },
    {
      title: 'HARDWARE & OPTICAL',
      items: [
        { id: 'barcode-scanner', label: 'Laser Matrix Scanner', icon: Scan },
        { id: 'barcode-generator', label: 'Barcode Print Engine', icon: QrCode },
      ],
    },
    {
      title: 'SUPPLY CHAIN & REVENUE',
      items: [
        { id: 'orders', label: 'Purchase Orders', icon: ShoppingBag },
        { id: 'sales', label: 'Sales & Invoices', icon: ShoppingCart },
        { id: 'suppliers', label: 'Supplier Network', icon: Truck },
        { id: 'customers', label: 'Client Accounts', icon: Users },
      ],
    },
    {
      title: 'INTELLIGENCE & SYSTEM',
      items: [
        { id: 'analytics', label: 'Demand Velocity', icon: PieChart },
        { id: 'reports', label: 'Audit Telemetry', icon: BarChart3 },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    setCurrentView(id);
    onCloseMobile();
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0c0c0e] text-[#141414] dark:text-[#f4f4f5] w-64 border-r border-[#f0f0f0] dark:border-[#1f1f23] font-sans select-none transition-colors duration-200">
      {/* Brand Header with 30% Squircle Icon */}
      <div className="p-5 border-b border-[#f0f0f0] dark:border-[#1f1f23] flex items-center justify-between bg-white dark:bg-[#0c0c0e]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[30%] bg-[#141414] dark:bg-white text-white dark:text-[#141414] flex items-center justify-center shadow-none transition-colors">
            <Activity className="w-4 h-4 text-white dark:text-[#141414]" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-sm font-bold text-[#141414] dark:text-white tracking-tight">Stoq.</h1>
              <span className="text-[9.5px] font-semibold px-1.5 py-0.2 bg-[#f0f0f0] dark:bg-[#1f1f23] text-[#141414] dark:text-[#f4f4f5] rounded-full">OS</span>
            </div>
            <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa] mt-0.5 truncate max-w-[130px]">
              {companySettings.companyName}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections (Stadium Pills) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <div className="text-[10px] font-semibold text-[#adadad] dark:text-[#71717a] uppercase tracking-wider px-3.5 py-1">
              {group.title}
            </div>
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition ${
                    isActive
                      ? 'bg-[#141414] dark:bg-white text-white dark:text-[#141414] font-semibold shadow-none'
                      : 'text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f3f3f3] dark:hover:bg-[#18181b]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white dark:text-[#141414]' : item.isAi ? 'text-[#0066ff]' : 'text-[#707070] dark:text-[#a1a1aa]'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                      isActive ? 'bg-white dark:bg-[#141414] text-[#141414] dark:text-white' : 'bg-[#f0f0f0] dark:bg-[#27272a] text-[#141414] dark:text-[#f4f4f5]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#f0f0f0] dark:border-[#1f1f23] bg-white dark:bg-[#0c0c0e] text-center">
        <div className="flex items-center justify-between text-[11px] text-[#707070] dark:text-[#a1a1aa]">
          <span className="flex items-center gap-1.5 text-[#141414] dark:text-white font-medium">
            <Radio className="w-3 h-3 text-[#0066ff] animate-pulse" />
            Stoq. v3.2
          </span>
          <span className="text-[#0066ff] font-semibold text-[10.5px]">● 99.9% Telemetry</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block shrink-0 h-screen sticky top-0 z-20">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">{SidebarContent}</div>
        </div>
      )}
    </>
  );
}
