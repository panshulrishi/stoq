'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { useInventory } from '@/lib/inventory-context';
import { StatusBadge } from '@/components/ui/Badge';
import { Search, Package, ShoppingCart, Truck, Tag, ArrowRight } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const { products, sales, suppliers, companySettings, setCurrentView } = useInventory();
  const [query, setQuery] = useState('');

  const trimmed = query.trim().toLowerCase();

  const matchingProducts = trimmed
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(trimmed) ||
          p.sku.toLowerCase().includes(trimmed) ||
          p.barcode.toLowerCase().includes(trimmed) ||
          p.category.toLowerCase().includes(trimmed)
      )
    : [];

  const matchingSales = trimmed
    ? sales.filter(
        s =>
          s.invoiceNumber.toLowerCase().includes(trimmed) ||
          s.customerName.toLowerCase().includes(trimmed)
      )
    : [];

  const matchingSuppliers = trimmed
    ? suppliers.filter(
        sup =>
          sup.name.toLowerCase().includes(trimmed) ||
          sup.contactPerson.toLowerCase().includes(trimmed)
      )
    : [];

  const handleSelectProduct = () => {
    setCurrentView('inventory');
    onClose();
  };

  const handleSelectSale = () => {
    setCurrentView('sales');
    onClose();
  };

  const handleSelectSupplier = () => {
    setCurrentView('suppliers');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Global Inventory Search" maxWidth="2xl">
      <div className="space-y-4">
        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by product name, SKU, barcode, invoice #, supplier..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* Results */}
        {!trimmed ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <p>Start typing to search products, sales invoices, or suppliers.</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs">
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                Try: Keyboard
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                Try: Coffee
              </span>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300">
                Try: INV-2026
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
            {/* Products */}
            {matchingProducts.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <Package className="w-3.5 h-3.5" />
                  <span>Products ({matchingProducts.length})</span>
                </div>
                <div className="space-y-2">
                  {matchingProducts.map(p => (
                    <div
                      key={p.id}
                      onClick={handleSelectProduct}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{p.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>SKU: {p.sku}</span>
                            <span>•</span>
                            <span>Bar: {p.barcode}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {companySettings.currencySymbol}
                          {p.sellingPrice.toFixed(2)}
                        </span>
                        <StatusBadge status={p.stockStatus} />
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sales */}
            {matchingSales.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Sales Invoices ({matchingSales.length})</span>
                </div>
                <div className="space-y-2">
                  {matchingSales.map(s => (
                    <div
                      key={s.id}
                      onClick={handleSelectSale}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.invoiceNumber}</p>
                        <p className="text-xs text-slate-500">{s.customerName} • {s.saleDate}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {companySettings.currencySymbol}
                          {s.totalAmount.toFixed(2)}
                        </span>
                        <StatusBadge status={s.paymentStatus} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suppliers */}
            {matchingSuppliers.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  <Truck className="w-3.5 h-3.5" />
                  <span>Suppliers ({matchingSuppliers.length})</span>
                </div>
                <div className="space-y-2">
                  {matchingSuppliers.map(sup => (
                    <div
                      key={sup.id}
                      onClick={handleSelectSupplier}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700 cursor-pointer transition"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{sup.name}</p>
                        <p className="text-xs text-slate-500">{sup.contactPerson} • {sup.email}</p>
                      </div>
                      <div className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full">
                        ★ {sup.reliabilityRating}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {matchingProducts.length === 0 && matchingSales.length === 0 && matchingSuppliers.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-sm">
                No matching inventory items found for &quot;{query}&quot;.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
