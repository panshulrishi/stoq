'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Modal } from '@/components/ui/Modal';
import { Users, Plus, Mail, Phone, ShoppingCart, DollarSign } from 'lucide-react';

export function CustomersView() {
  const { customers, companySettings, addCustomer } = useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(formData);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Accounts</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Client Accounts
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Track wholesale & retail customer order volume, lifetime revenue spend, and contact records
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      <div className="bg-[#141417] rounded-3xl border border-[#1f1f23] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0e0e11] border-b border-[#1f1f23] text-[10px] font-semibold text-[#71717a] uppercase tracking-wider">
                <th className="p-4 font-medium">Customer Name</th>
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Contact Telemetry</th>
                <th className="p-4 font-medium">Total Orders</th>
                <th className="p-4 font-medium">Lifetime Spend</th>
                <th className="p-4 font-medium">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f23] text-xs">
              {customers.map(cust => (
                <tr key={cust.id} className="hover:bg-[#18181b]/50 transition">
                  <td className="p-4 font-medium text-white">{cust.name}</td>
                  <td className="p-4 text-[#a1a1aa]">{cust.companyName || '—'}</td>
                  <td className="p-4">
                    <div className="text-[#d4d4d8] font-medium">{cust.email}</div>
                    <div className="text-[11px] font-mono text-[#71717a]">{cust.phone}</div>
                  </td>
                  <td className="p-4 font-mono font-medium text-white">{cust.totalOrders} orders</td>
                  <td className="p-4 font-mono font-semibold text-white">
                    {companySettings.currencySymbol}{cust.totalSpent.toFixed(2)}
                  </td>
                  <td className="p-4 font-mono text-[#71717a]">{cust.lastOrderDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Client Account"
        subtitle="Create an enterprise or individual customer profile for invoicing"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Company Name (Optional)</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Phone</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Shipping Destination</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#1f1f23]">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#a1a1aa] hover:text-white rounded-full transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition"
            >
              Save Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
