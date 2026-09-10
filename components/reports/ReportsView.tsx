'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { exportToCSV } from '@/lib/barcode-utils';
import { BarChart3, Download, Printer, ShieldCheck, FileText, Filter } from 'lucide-react';

export function ReportsView() {
  const { products, sales, auditLogs, companySettings } = useInventory();
  const [activeTab, setActiveTab] = useState<'audit' | 'valuation' | 'lowstock'>('audit');

  const lowStockProducts = products.filter(p => p.stockStatus === 'LOW_STOCK' || p.stockStatus === 'OUT_OF_STOCK');

  const handleExportAuditCSV = () => {
    exportToCSV('Stoq_Audit_Log.csv', auditLogs);
  };

  const handleExportValuationCSV = () => {
    const data = products.map(p => ({
      Name: p.name,
      SKU: p.sku,
      Quantity: p.quantity,
      PurchasePrice: p.purchasePrice,
      SellingPrice: p.sellingPrice,
      TotalCostValuation: p.purchasePrice * p.quantity,
      TotalRetailValuation: p.sellingPrice * p.quantity,
    }));
    exportToCSV('Stoq_Valuation_Report.csv', data);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <BarChart3 className="w-3.5 h-3.5 text-white" />
              <span>Audit Logging</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Compliance & Stock Movement Telemetry
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Cryptographically-stamped ledger of SKU movements, asset valuations, and compliance exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Stadium Segmented Tabs */}
      <div className="flex flex-wrap gap-1.5 bg-[#0e0e11] p-1.5 rounded-full border border-[#1f1f23] w-fit">
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
            activeTab === 'audit' ? 'bg-white text-[#141414] shadow-xs' : 'text-[#71717a] hover:text-white'
          }`}
        >
          Audit Ledger ({auditLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
            activeTab === 'valuation' ? 'bg-white text-[#141414] shadow-xs' : 'text-[#71717a] hover:text-white'
          }`}
        >
          Asset Valuation
        </button>
        <button
          onClick={() => setActiveTab('lowstock')}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition ${
            activeTab === 'lowstock' ? 'bg-white text-[#141414] shadow-xs' : 'text-[#71717a] hover:text-white'
          }`}
        >
          Low Stock Exceptions ({lowStockProducts.length})
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'audit' && (
        <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Immutable Inventory Audit Trail</span>
            </h3>
            <button
              onClick={handleExportAuditCSV}
              className="px-3.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#d4d4d8] border border-[#27272a] text-xs font-medium rounded-full transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0e0e11] text-[10px] uppercase font-semibold text-[#71717a] border-b border-[#1f1f23]">
                  <th className="p-3 font-medium">Timestamp</th>
                  <th className="p-3 font-medium">Product SKU</th>
                  <th className="p-3 font-medium">Action</th>
                  <th className="p-3 font-medium">Delta</th>
                  <th className="p-3 font-medium">Balance Shift</th>
                  <th className="p-3 font-medium">Context</th>
                  <th className="p-3 font-medium">Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#18181b]/50 transition">
                    <td className="p-3 font-mono text-[#71717a] text-[11px]">{log.timestamp}</td>
                    <td className="p-3 font-medium text-white">{log.productName}</td>
                    <td className="p-3 font-mono text-[11px] text-[#0066ff] font-medium">{log.type}</td>
                    <td className="p-3 font-mono font-medium">
                      <span className={log.quantityChange > 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[#a1a1aa]">{log.previousQuantity} → {log.newQuantity}</td>
                    <td className="p-3 text-[#71717a]">{log.reason}</td>
                    <td className="p-3 font-mono text-[#d4d4d8]">
                      {log.performedBy && !log.performedBy.toLowerCase().includes('pavan') && !log.performedBy.toLowerCase().includes('alex')
                        ? log.performedBy
                        : 'Panshul'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'valuation' && (
        <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-white">Full Cost &amp; Retail Asset Valuation</h3>
            <button
              onClick={handleExportValuationCSV}
              className="px-3.5 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#d4d4d8] border border-[#27272a] text-xs font-medium rounded-full transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0e0e11] text-[10px] uppercase font-semibold text-[#71717a] border-b border-[#1f1f23]">
                  <th className="p-3 font-medium">Product Name</th>
                  <th className="p-3 font-medium">SKU</th>
                  <th className="p-3 font-medium">On-Hand Qty</th>
                  <th className="p-3 font-medium">Unit Cost</th>
                  <th className="p-3 font-medium">Cost Valuation</th>
                  <th className="p-3 font-medium">Retail Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f23]">
                {products.map(prod => (
                  <tr key={prod.id} className="hover:bg-[#18181b]/50 transition">
                    <td className="p-3 font-medium text-white">{prod.name}</td>
                    <td className="p-3 font-mono text-[#71717a]">{prod.sku}</td>
                    <td className="p-3 font-mono font-medium text-[#d4d4d8]">{prod.quantity}</td>
                    <td className="p-3 font-mono text-[#a1a1aa]">{companySettings.currencySymbol}{prod.purchasePrice.toFixed(2)}</td>
                    <td className="p-3 font-mono font-semibold text-white">
                      {companySettings.currencySymbol}{(prod.purchasePrice * prod.quantity).toFixed(2)}
                    </td>
                    <td className="p-3 font-mono font-medium text-emerald-400">
                      {companySettings.currencySymbol}{(prod.sellingPrice * prod.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'lowstock' && (
        <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Low Stock &amp; Depletion Exceptions</h3>
            <span className="text-xs font-mono text-amber-400">{lowStockProducts.length} items flagged</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="p-4 bg-[#0e0e11] border border-[#27272a] rounded-2xl flex justify-between items-center text-xs">
                <div>
                  <p className="font-medium text-white">{p.name}</p>
                  <p className="text-[11px] font-mono text-[#71717a] mt-0.5">{p.sku} · Supplier: {p.supplierName}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-semibold text-rose-400">{p.quantity} {p.unit}</p>
                  <p className="text-[10px] font-mono text-[#71717a]">Reorder threshold: {p.minReorderLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
