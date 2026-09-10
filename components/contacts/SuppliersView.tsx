'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Supplier } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import { Truck, Plus, Mail, Phone, MapPin, Star, Clock, Package } from 'lucide-react';

export function SuppliersView() {
  const { suppliers, addSupplier } = useInventory();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    categories: 'Electronics',
    reliabilityRating: 4.8,
    leadTimeDays: 3,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier({
      name: formData.name,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      categories: formData.categories.split(',').map(c => c.trim()),
      reliabilityRating: formData.reliabilityRating,
      leadTimeDays: formData.leadTimeDays,
    });
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <Truck className="w-3.5 h-3.5 text-white" />
              <span>Vendors</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Supplier Network
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Manage wholesale distributors, procurement lead times, reliability scores, and catalog lines
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-xs transition flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map(sup => (
          <div
            key={sup.id}
            className="p-6 bg-[#141417] rounded-3xl border border-[#1f1f23] space-y-4 hover:border-[#27272a] transition"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-white">{sup.name}</h3>
                <p className="text-xs text-[#71717a] mt-0.5">{sup.contactPerson}</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#18181b] border border-[#27272a] text-amber-400 rounded-full text-xs font-mono font-medium">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{sup.reliabilityRating}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-[#a1a1aa]">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                <span className="truncate">{sup.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                <span className="font-mono text-[#d4d4d8]">{sup.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#71717a] shrink-0" />
                <span className="truncate">{sup.address}</span>
              </div>
            </div>

            {/* Categories */}
            {sup.categories && sup.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {sup.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-[#0e0e11] border border-[#27272a] text-[#a1a1aa] rounded-full text-[10px] font-medium"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#1f1f23] flex justify-between items-center text-xs text-[#71717a]">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#71717a]" />
                <span>Lead: <strong className="font-mono text-[#d4d4d8] font-medium">{sup.leadTimeDays}d</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#71717a]" />
                <span><strong className="font-mono text-white font-medium">{sup.totalOrders}</strong> POs</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register Supplier Account"
        subtitle="Add a new verified wholesale supplier to your procurement network"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Company Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Contact Person</label>
            <input
              type="text"
              required
              value={formData.contactPerson}
              onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
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
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">Warehouse Address</label>
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
              Save Supplier
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
