'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { PurchaseOrder, POStatus } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  ShoppingBag,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  FileText,
  Calendar,
  AlertCircle,
  Package,
} from 'lucide-react';

export function PurchaseOrdersView() {
  const { purchaseOrders, suppliers, products, companySettings, createPurchaseOrder, updatePOStatus } = useInventory();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('2026-08-05');
  const [poNotes, setPONotes] = useState('Urgent stock replenishment');

  // Line items for PO
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    {
      productId: products[0]?.id || '',
      quantity: 20,
      unitCost: products[0]?.purchasePrice || 15,
    },
  ]);

  const addLineItem = () => {
    setOrderItems(prev => [
      ...prev,
      { productId: products[0]?.id || '', quantity: 10, unitCost: products[0]?.purchasePrice || 10 },
    ]);
  };

  const removeLineItem = (index: number) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setOrderItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        if (field === 'productId') {
          const prod = products.find(p => p.id === value);
          return { ...item, productId: value, unitCost: prod ? prod.purchasePrice : item.unitCost };
        }
        return { ...item, [field]: value };
      })
    );
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
  };

  const handleCreatePOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup) return;

    const formattedItems = orderItems.map(item => {
      const prod = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        productName: prod ? prod.name : 'Product',
        sku: prod ? prod.sku : 'SKU',
        quantity: item.quantity,
        unitCost: item.unitCost,
        totalCost: item.quantity * item.unitCost,
      };
    });

    const subtotal = calculateSubtotal();
    const tax = (subtotal * companySettings.defaultTaxRate) / 100;
    const total = subtotal + tax;

    createPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      items: formattedItems,
      subtotal,
      tax,
      total,
      status: 'SENT',
      expectedDeliveryDate: expectedDate,
      notes: poNotes,
    });

    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <ShoppingBag className="w-3.5 h-3.5 text-white" />
              <span>Procurement</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Supplier Purchase Orders
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Issue procurement orders, track shipment lead times, and automate stock replenishment
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* PO List Cards */}
      <div className="space-y-4">
        {purchaseOrders.map(po => (
          <div
            key={po.id}
            className="p-6 bg-[#141417] rounded-3xl border border-[#1f1f23] space-y-4 hover:border-[#27272a] transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1f1f23] pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-semibold text-sm text-white">{po.poNumber}</span>
                  <StatusBadge status={po.status} />
                </div>
                <p className="text-xs text-[#71717a] mt-1">
                  Supplier: <span className="font-medium text-[#d4d4d8]">{po.supplierName}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {po.status === 'SENT' && (
                  <button
                    onClick={() => updatePOStatus(po.id, 'RECEIVED')}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium rounded-full transition flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Received (+Stock)</span>
                  </button>
                )}
                {po.status === 'DRAFT' && (
                  <button
                    onClick={() => updatePOStatus(po.id, 'SENT')}
                    className="px-3.5 py-1.5 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full transition"
                  >
                    Dispatch PO
                  </button>
                )}
              </div>
            </div>

            {/* Line items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase font-semibold text-[#71717a] border-b border-[#1f1f23]">
                    <th className="py-2.5 font-medium">Item</th>
                    <th className="py-2.5 font-medium">SKU</th>
                    <th className="py-2.5 font-medium">Quantity</th>
                    <th className="py-2.5 font-medium">Unit Cost</th>
                    <th className="py-2.5 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f23]">
                  {po.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 font-medium text-white">{item.productName}</td>
                      <td className="py-2.5 font-mono text-[#71717a]">{item.sku}</td>
                      <td className="py-2.5 font-mono text-[#d4d4d8]">{item.quantity}</td>
                      <td className="py-2.5 font-mono text-[#a1a1aa]">{companySettings.currencySymbol}{item.unitCost.toFixed(2)}</td>
                      <td className="py-2.5 text-right font-mono font-medium text-white">{companySettings.currencySymbol}{item.totalCost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 text-xs border-t border-[#1f1f23] text-[#71717a]">
              <div>Issued: <span className="font-mono text-[#a1a1aa]">{po.issueDate}</span> · Delivery: <span className="font-mono text-[#d4d4d8]">{po.expectedDeliveryDate}</span></div>
              <div className="font-semibold text-sm text-white mt-1 sm:mt-0">
                Total: <span className="font-mono">{companySettings.currencySymbol}{po.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order"
        subtitle="Order replacement inventory from registered suppliers"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreatePOSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Supplier</label>
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Expected Delivery Date</label>
              <input
                type="date"
                required
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="space-y-3 pt-3 border-t border-[#1f1f23]">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-semibold text-white">Line Items</label>
              <button
                type="button"
                onClick={addLineItem}
                className="text-xs text-[#0066ff] hover:text-[#3385ff] font-medium transition"
              >
                + Add Line
              </button>
            </div>

            {orderItems.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-center bg-[#0e0e11] p-3 rounded-2xl border border-[#27272a]">
                <select
                  value={item.productId}
                  onChange={e => updateLineItem(idx, 'productId', e.target.value)}
                  className="flex-1 w-full px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-white outline-none"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={e => updateLineItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                  placeholder="Qty"
                  className="w-20 px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-white font-mono outline-none"
                />

                <input
                  type="number"
                  step="0.01"
                  value={item.unitCost}
                  onChange={e => updateLineItem(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                  placeholder="Unit Cost"
                  className="w-24 px-3 py-2 bg-[#141417] border border-[#27272a] rounded-xl text-xs text-white font-mono outline-none"
                />

                <button
                  type="button"
                  onClick={() => removeLineItem(idx)}
                  className="text-[#71717a] hover:text-rose-400 text-xs font-medium px-2 transition"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-[#1f1f23] gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
