'use client';

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from '@/lib/inventory-context';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { TopNav } from '@/components/layout/TopNav';
import { GlobalSearchModal } from '@/components/layout/GlobalSearchModal';
import { AuthModal } from '@/components/auth/AuthModal';
import { ToastContainer } from '@/components/ui/ToastContainer';

import { DashboardOverview } from '@/components/dashboard/DashboardOverview';
import { InventoryView } from '@/components/inventory/InventoryView';
import { BarcodeGenerator } from '@/components/barcode/BarcodeGenerator';
import { BarcodeScannerView } from '@/components/barcode/BarcodeScannerView';
import { PurchaseOrdersView } from '@/components/orders/PurchaseOrdersView';
import { SalesView } from '@/components/sales/SalesView';
import { SuppliersView } from '@/components/contacts/SuppliersView';
import { CustomersView } from '@/components/contacts/CustomersView';
import { ReportsView } from '@/components/reports/ReportsView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { AIAssistantView } from '@/components/ai/AIAssistantView';

function AppContent() {
  const { currentView } = useInventory();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex font-sans antialiased selection:bg-white selection:text-[#141414]">
      {/* Sidebar Navigation */}
      <AppSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#09090b]">
        {/* Top Header Navigation (Floating Stadium Pill) */}
        <TopNav
          onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Dynamic View Router */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && <DashboardOverview />}
          {currentView === 'inventory' && <InventoryView />}
          {currentView === 'barcode-generator' && <BarcodeGenerator />}
          {currentView === 'barcode-scanner' && <BarcodeScannerView />}
          {currentView === 'orders' && <PurchaseOrdersView />}
          {currentView === 'sales' && <SalesView />}
          {currentView === 'suppliers' && <SuppliersView />}
          {currentView === 'customers' && <CustomersView />}
          {currentView === 'reports' && <ReportsView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'ai-assistant' && <AIAssistantView />}
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ToastContainer />
    </div>
  );
}

export default function Home() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
