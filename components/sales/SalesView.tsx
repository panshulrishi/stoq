'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Sale } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ShoppingCart, Plus, DollarSign, TrendingUp, User, CreditCard } from 'lucide-react';

export function SalesView() {
  const { sales, customers, products, companySettings, recordSale } = useInventory();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'CASH' | 'BANK_TRANSFER' | 'STRIPE'>('STRIPE');

  const [saleItems, setSaleItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id || '', quantity: 2 },
  ]);

  const addSaleLine = () => {
    setSaleItems(prev => [...prev, { productId: products[0]?.id || '', quantity: 1 }]);
  };

  const removeSaleLine = (index: number) => {
    setSaleItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateSaleLine = (index: number, field: string, value: any) => {
    setSaleItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c.id === selectedCustomerId);
    if (!cust) return;

    const formattedItems = saleItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Product',
        sku: prod ? prod.sku : 'SKU',
        quantity: item.quantity,
        unitPrice: prod ? prod.sellingPrice : 20,
        totalPrice: (prod ? prod.sellingPrice : 20) * item.quantity,
      };
    });

    recordSale({
      customerId: cust.id,
      customerName: cust.name,
      items: formattedItems,
      paymentStatus: 'PAID',
      paymentMethod,
    });

    setIsRecordModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <ShoppingCart className="w-3.5 h-3.5 text-white" />
              <span>Revenue Stream</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Sales & Invoices
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Log point-of-sale transactions, issue invoices, and track realized gross profit margins
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Record Sale</span>
        </button>
      </div>

      {/* Sales Table */}
      <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e0e11] border-b border-[#1f1f23] text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
                <th className="p-4 font-medium">Invoice #</th>
                <th className="p-4 font-medium">Customer</th>
                <th className="p-4 font-medium">Items Fulfilled</th>
                <th className="p-4 font-medium">Payment Method</th>
                <th className="p-4 font-medium">Total Amount</th>
                <th className="p-4 font-medium">Net Profit</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-xs">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-[#18181b]/50 transition">
                  <td className="p-4 font-mono font-medium text-white">{sale.invoiceNumber}</td>
                  <td className="p-4 font-medium text-[#d4d4d8]">{sale.customerName}</td>
                  <td className="p-4 text-[#71717a]">
                    {sale.items.map(i => `${i.productName} (${i.quantity})`).join(', ')}
                  </td>
                  <td className="p-4 font-mono text-[#a1a1aa] text-[11px]">{sale.paymentMethod}</td>
                  <td className="p-4 font-mono font-semibold text-white">
                    {companySettings.currencySymbol}{sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="p-4 font-mono font-medium text-emerald-400">
                    +{companySettings.currencySymbol}{sale.profit.toFixed(2)}
                  </td>
                  <td className="p-4">
                    <StatusBadge status={sale.paymentStatus} />
                  </td>
                  <td className="p-4 font-mono text-[#71717a]">{sale.saleDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Sale Modal */}
      <Modal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        title="Record Sale Transaction"
        subtitle="Automatically updates inventory stock levels and issues receipt"
        maxWidth="2xl"
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={e => setSelectedCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.companyName || 'Individual'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              >
                <option value="STRIPE">Stripe Digital Payment</option>
                <option value="CREDIT_CARD">Credit / Debit Terminal</option>
                <option value="CASH">Cash POS</option>
                <option value="BANK_TRANSFER">Bank Wire Transfer</option>
              </select>
            </div>
          </div>

          {/* Sale Line items */}
          <div className="space-y-3 pt-3 border-t border-[#1f1f23]">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-white">Purchased Items</label>
              <button
                type="button"
                onClick={addSaleLine}
                className="text-xs text-[#0066ff] hover:text-[#3385ff] font-medium transition"
              >
                + Add Item
              </button>
            </div>

            {saleItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-center bg-[#0e0e11] p-3 rounded-2xl border border-[#27272a]">
                <select
                  value={item.productId}
                  onChange={e => updateSaleLine(idx, 'productId', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-white outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({companySettings.currencySymbol}{p.sellingPrice.toFixed(2)}) - Stock: {p.quantity}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateSaleLine(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                  className="w-20 px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-white font-mono outline-none"
                />

                <button
                  type="button"
                  onClick={() => removeSaleLine(idx)}
                  className="text-[#71717a] hover:text-rose-400 font-medium px-2 text-xs transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1f1f23] gap-2">
            <button
              type="button"
              onClick={() => setIsRecordModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition"
            >
              Complete Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
