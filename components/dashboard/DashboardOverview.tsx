'use client';

import React from 'react';
import Image from 'next/image';
import { useInventory } from '@/lib/inventory-context';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Boxes,
  ArrowUpRight,
  QrCode,
  Scan,
  Sparkles,
  RefreshCw,
  Activity,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function DashboardOverview() {
  const {
    products,
    sales,
    auditLogs,
    companySettings,
    setCurrentView,
    resetToDefaults,
  } = useInventory();

  // Metrics Calculations
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, p) => sum + p.purchasePrice * p.quantity, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + p.sellingPrice * p.quantity, 0);
  const lowStockProducts = products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK');

  // Today's sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.saleDate === todayStr);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);

  // Monthly revenue
  const monthlyRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalProductsSold = sales.reduce((sum, s) => sum + s.items.reduce((iSum, item) => iSum + item.quantity, 0), 0);

  // Chart Data: Stock distribution by category
  const categoryCounts: Record<string, number> = {};
  products.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + p.quantity;
  });
  const pieData = Object.keys(categoryCounts).map(cat => ({
    name: cat,
    value: categoryCounts[cat],
  }));

  // Mobbin Monochrome + Electric Blue Accent Palette for charts
  const CHART_COLORS = ['#141414', '#0066ff', '#525252', '#858585', '#b3b3b3', '#d9d9d9'];

  // Revenue Trend Data
  const revenueTrendData = [
    { day: 'Mon', revenue: 1200, profit: 540 },
    { day: 'Tue', revenue: 1850, profit: 820 },
    { day: 'Wed', revenue: 1400, profit: 610 },
    { day: 'Thu', revenue: 2200, profit: 980 },
    { day: 'Fri', revenue: 2900, profit: 1350 },
    { day: 'Sat', revenue: 3400, profit: 1600 },
    { day: 'Sun', revenue: todayRevenue + 2100, profit: (todayRevenue + 2100) * 0.45 },
  ];

  return (
    <div className="space-y-8 pb-12 font-sans text-[#141414] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Mobbin Featured Header Card (Canvas-Soft Fill, No Shadow, Rounded 24px) */}
      <div className="relative overflow-hidden rounded-[24px] bg-[#f3f3f3] dark:bg-[#141417] p-6 sm:p-10 border border-transparent dark:border-[#1f1f23] transition-colors">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#18181b] border border-[#e0e0e0] dark:border-[#27272a] text-[#141414] dark:text-white text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff] animate-pulse"></span>
              <span>Autonomous Supply Control Engine.</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#141414] dark:text-white leading-tight">
              Stoq. Command Center &amp; SKU Matrix.
            </h2>
            <p className="text-[#707070] dark:text-[#a1a1aa] text-sm sm:text-base font-light leading-relaxed">
              Monitoring <span className="text-[#141414] dark:text-white font-medium">{companySettings.companyName}</span> telemetry. {lowStockProducts.length > 0 ? (
                <span><strong className="text-[#141414] dark:text-white font-semibold">{lowStockProducts.length} items</strong> trigger the automated reorder threshold.</span>
              ) : (
                <span>All warehouse SKU levels are currently optimal.</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentView('barcode-scanner')}
              className="px-4 py-2 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] text-[#141414] dark:text-white font-semibold text-xs rounded-full border border-[#e0e0e0] dark:border-[#27272a] transition flex items-center gap-2"
            >
              <Scan className="w-3.5 h-3.5 text-[#707070] dark:text-[#a1a1aa]" />
              <span>Laser Scanner</span>
            </button>
            <button
              onClick={() => setCurrentView('barcode-generator')}
              className="px-5 py-2 bg-[#141414] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#e4e4e7] text-white dark:text-[#141414] font-semibold text-xs rounded-full transition flex items-center gap-2 active:scale-98"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Barcode Studio</span>
            </button>
            <button
              onClick={resetToDefaults}
              title="Reset Demo Data"
              className="p-2 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white rounded-full transition border border-[#e0e0e0] dark:border-[#27272a]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid (Mobbin Canvas White Cards, 1px Hairlines, 30% Squircles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Products SKU count */}
        <div className="p-6 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] transition hover:border-[#e0e0e0] dark:hover:border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[#adadad] dark:text-[#71717a] uppercase tracking-wider">
              SKU Matrix
            </span>
            <div className="w-8 h-8 rounded-[30%] bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white flex items-center justify-center">
              <Package className="w-4 h-4 text-[#141414] dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">
              {totalProducts}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-[#141414] dark:text-white bg-[#f3f3f3] dark:bg-[#18181b] border border-[#e0e0e0] dark:border-[#27272a] px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5 text-[#0066ff]" /> +12.4%
            </span>
          </div>
          <p className="text-xs text-[#707070] dark:text-[#a1a1aa] mt-3">
            Retail: <span className="font-medium text-[#141414] dark:text-white">{companySettings.currencySymbol}{totalRetailValue.toLocaleString()}</span>
          </p>
        </div>

        {/* Capital Valuation */}
        <div className="p-6 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] transition hover:border-[#e0e0e0] dark:hover:border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[#adadad] dark:text-[#71717a] uppercase tracking-wider">
              Asset Valuation
            </span>
            <div className="w-8 h-8 rounded-[30%] bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-[#141414] dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">
              {companySettings.currencySymbol}
              {totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-[#141414] dark:text-white bg-[#f3f3f3] dark:bg-[#18181b] border border-[#e0e0e0] dark:border-[#27272a] px-2.5 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3 mr-0.5 text-[#0066ff]" /> +8.4%
            </span>
          </div>
          <p className="text-xs text-[#707070] dark:text-[#a1a1aa] mt-3">
            Yield: <span className="font-medium text-[#141414] dark:text-white">+{((totalRetailValue - totalInventoryValue) / (totalInventoryValue || 1) * 100).toFixed(1)}%</span>
          </p>
        </div>

        {/* Low Stock Reorder Alerts */}
        <div className="p-6 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] transition hover:border-[#e0e0e0] dark:hover:border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[#adadad] dark:text-[#71717a] uppercase tracking-wider">
              Reorder Queue
            </span>
            <div className="w-8 h-8 rounded-[30%] bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">
              {lowStockProducts.length}
            </span>
            <button
              onClick={() => setCurrentView('orders')}
              className="text-xs font-semibold text-[#0066ff] hover:underline"
            >
              Generate PO →
            </button>
          </div>
          <p className="text-xs text-[#707070] dark:text-[#a1a1aa] mt-3">
            {lowStockProducts.length === 0 ? 'Stock optimal.' : 'Purchase orders needed.'}
          </p>
        </div>

        {/* Revenue Velocity */}
        <div className="p-6 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] transition hover:border-[#e0e0e0] dark:hover:border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] font-semibold text-[#adadad] dark:text-[#71717a] uppercase tracking-wider">
              Monthly Revenue
            </span>
            <div className="w-8 h-8 rounded-[30%] bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#141414] dark:text-white" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-[#141414] dark:text-white">
              {companySettings.currencySymbol}
              {monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
            <span className="inline-flex items-center text-[11px] font-semibold text-white bg-[#0066ff] px-2.5 py-0.5 rounded-full">
              +18%
            </span>
          </div>
          <p className="text-xs text-[#707070] dark:text-[#a1a1aa] mt-3">
            {totalProductsSold} fulfilled items
          </p>
        </div>
      </div>

      {/* Analytics Visualizers (Mobbin Canvas White Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trajectory Chart */}
        <div className="lg:col-span-2 p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-6 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#141414] dark:text-white tracking-tight">Revenue &amp; Gross Margin Flow.</h3>
              <p className="text-xs text-[#707070] dark:text-[#a1a1aa] font-light">Weekly sales volume and projected profit curves.</p>
            </div>
            <button
              onClick={() => setCurrentView('analytics')}
              className="text-xs font-semibold text-[#141414] dark:text-white hover:text-[#0066ff] dark:hover:text-[#0066ff] transition flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRevMobbin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={companySettings.themeMode === 'dark' ? '#ffffff' : '#141414'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={companySettings.themeMode === 'dark' ? '#ffffff' : '#141414'} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfMobbin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0066ff" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0066ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke={companySettings.themeMode === 'dark' ? '#71717a' : '#adadad'} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={companySettings.themeMode === 'dark' ? '#71717a' : '#adadad'} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: companySettings.themeMode === 'dark' ? '#18181b' : '#141414',
                    borderColor: companySettings.themeMode === 'dark' ? '#27272a' : '#141414',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke={companySettings.themeMode === 'dark' ? '#ffffff' : '#141414'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevMobbin)" name="Revenue ($)" />
                <Area type="monotone" dataKey="profit" stroke="#0066ff" strokeWidth={2} fillOpacity={1} fill="url(#colorProfMobbin)" name="Net Profit ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Mobbin Pie Chart) */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-6 transition-colors">
          <div>
            <h3 className="text-sm font-bold text-[#141414] dark:text-white tracking-tight">Stock Density Matrix.</h3>
            <p className="text-xs text-[#707070] dark:text-[#a1a1aa] font-light">Category distribution breakdown.</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: companySettings.themeMode === 'dark' ? '#18181b' : '#141414',
                    borderColor: companySettings.themeMode === 'dark' ? '#27272a' : '#141414',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                    padding: '8px 12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-1 text-xs">
            {pieData.map((e, idx) => (
              <div key={e.name} className="flex items-center gap-1.5 text-[11px] bg-[#f3f3f3] dark:bg-[#18181b] px-2.5 py-1 rounded-full border border-transparent dark:border-[#27272a]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                <span className="text-[#141414] dark:text-[#f4f4f5] font-medium">{e.name} ({e.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical Reorder Queue & Movement Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reorder Queue */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#141414] dark:text-white tracking-tight">Critical Reorder Queue.</h3>
            </div>
            <button
              onClick={() => setCurrentView('orders')}
              className="text-xs font-semibold text-[#141414] dark:text-white hover:text-[#0066ff] dark:hover:text-[#0066ff] transition"
            >
              Issue Purchase Order →
            </button>
          </div>

          <div className="space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-[#adadad] dark:text-[#71717a] py-8 text-center">All inventory levels are optimal.</p>
            ) : (
              lowStockProducts.map(prod => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3.5 rounded-[20px] bg-[#f8f8f8] dark:bg-[#18181b] border border-[#f0f0f0] dark:border-[#27272a]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 rounded-[30%] overflow-hidden shrink-0 border border-[#e0e0e0] dark:border-[#27272a] bg-white dark:bg-[#111113]">
                      <Image
                        src={prod.imageUrl}
                        alt={prod.name}
                        fill
                        sizes="44px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#141414] dark:text-white truncate">{prod.name}</p>
                      <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa]">
                        Qty: <strong className="text-[#141414] dark:text-white">{prod.quantity} {prod.unit}</strong> (Min: {prod.minReorderLevel})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={prod.stockStatus} />
                    <button
                      onClick={() => setCurrentView('orders')}
                      className="px-3 py-1 bg-[#141414] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#e4e4e7] text-white dark:text-[#141414] text-[11px] font-semibold rounded-full transition"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Audit Movement Stream */}
        <div className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#141414] dark:text-white tracking-tight">Audit Telemetry Stream.</h3>
            </div>
            <button
              onClick={() => setCurrentView('reports')}
              className="text-xs font-semibold text-[#141414] dark:text-white hover:text-[#0066ff] dark:hover:text-[#0066ff] transition"
            >
              Full Log →
            </button>
          </div>

          <div className="space-y-3.5 divide-y divide-[#f0f0f0] dark:divide-[#1f1f23]">
            {auditLogs.slice(0, 4).map(log => (
              <div key={log.id} className="pt-3.5 first:pt-0 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#141414] dark:text-white">{log.productName}</p>
                  <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa] mt-0.5">{log.reason} • {log.timestamp}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`font-semibold text-xs ${
                      log.quantityChange > 0 ? 'text-[#141414] dark:text-white' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                  </span>
                  <span className="text-[10.5px] text-[#adadad] dark:text-[#71717a] block">
                    {log.performedBy && !log.performedBy.toLowerCase().includes('pavan') && !log.performedBy.toLowerCase().includes('alex')
                      ? log.performedBy
                      : 'Panshul'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
