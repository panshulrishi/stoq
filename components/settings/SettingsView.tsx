'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import Image from 'next/image';
import { Settings, Save, CheckCircle2, User, Moon } from 'lucide-react';

export function SettingsView() {
  const { companySettings, updateCompanySettings, userProfile, updateUserProfile } = useInventory();

  const [formData, setFormData] = useState({ ...companySettings });
  const [profileData, setProfileData] = useState({ ...userProfile });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);

  const AVATAR_PRESETS = [
    { id: 'founder', name: 'Panshul (Modern Founder)', url: '/avatars/panshul.svg' },
    { id: 'tech', name: 'Panshul (Tech Audio)', url: '/avatars/panshul-tech.svg' },
    { id: 'bot', name: 'Cyber Bot (Matrix AI)', url: '/avatars/panshul-bot.svg' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(profileData);
    setProfileSavedSuccess(true);
    setTimeout(() => setProfileSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl font-sans text-[#141414] dark:text-[#f4f4f5] transition-colors duration-200">
      {/* Top Header Card */}
      <div className="bg-[#f3f3f3] dark:bg-[#141417] p-6 sm:p-8 rounded-[24px] border border-transparent dark:border-[#1f1f23] flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414] dark:text-white flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#141414] dark:text-white" />
            <span>Owner Profile &amp; Preferences.</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#707070] dark:text-[#a1a1aa] font-light mt-1.5">
            Configure owner identity, illustrated digital avatar, business parameters, and display themes.
          </p>
        </div>
      </div>

      {/* Owner Profile & Avatar Card */}
      {profileSavedSuccess && (
        <div className="p-4 bg-[#f3f3f3] dark:bg-[#141417] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#27272a] rounded-full text-xs font-semibold flex items-center gap-2.5 px-6">
          <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
          <span>Owner profile and avatar updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleProfileSubmit} className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-6 transition-colors">
        <div className="flex items-center justify-between border-b border-[#f0f0f0] dark:border-[#1f1f23] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[30%] bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#141414] dark:text-white">Owner &amp; User Identity.</h3>
              <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa]">Personalize owner credentials and digital character avatar.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 bg-[#f3f3f3] dark:bg-[#18181b] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#27272a] rounded-full">
            {profileData.role}
          </span>
        </div>

        {/* Avatar Selection Section */}
        <div>
          <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-3">
            Illustrated Avatar Selection (Non-Real Person)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {AVATAR_PRESETS.map(preset => {
              const isSelected = profileData.avatarUrl === preset.url;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => setProfileData({ ...profileData, avatarUrl: preset.url })}
                  className={`flex items-center gap-3 p-3 rounded-[20px] border transition-all text-left ${
                    isSelected
                      ? 'border-[#141414] dark:border-white bg-[#f8f8f8] dark:bg-[#18181b] ring-2 ring-[#141414]/10 dark:ring-white/20'
                      : 'border-[#e0e0e0] dark:border-[#27272a] hover:border-[#141414] dark:hover:border-white bg-white dark:bg-[#111113]'
                  }`}
                >
                  <div className="relative w-12 h-12 rounded-[30%] overflow-hidden bg-[#141414] dark:bg-white shrink-0 border border-[#e0e0e0] dark:border-[#27272a]">
                    <Image
                      src={preset.url}
                      alt={preset.name}
                      width={48}
                      height={48}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="pr-2">
                    <p className="text-xs font-semibold text-[#141414] dark:text-white leading-snug">{preset.name}</p>
                    <span className="text-[10px] font-medium text-[#707070] dark:text-[#a1a1aa]">
                      {isSelected ? '✓ Selected' : 'Click to select'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input fields for Name and Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Owner Name</label>
            <input
              type="text"
              required
              value={profileData.name}
              onChange={e => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Owner Email</label>
            <input
              type="email"
              required
              value={profileData.email}
              onChange={e => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Role Title</label>
            <select
              value={profileData.role}
              onChange={e => setProfileData({ ...profileData, role: e.target.value as 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF' })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            >
              <option value="OWNER">OWNER</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MANAGER">MANAGER</option>
              <option value="STAFF">STAFF</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Avatar Image URL (or SVG path)</label>
            <input
              type="text"
              value={profileData.avatarUrl}
              onChange={e => setProfileData({ ...profileData, avatarUrl: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#f0f0f0] dark:border-[#1f1f23]">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#141414] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#e4e4e7] text-white dark:text-[#141414] text-xs font-semibold rounded-full transition flex items-center gap-2 active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Update Owner Profile</span>
          </button>
        </div>
      </form>

      {/* Theme Appearance Card (Dark Mode Exclusive) */}
      <div className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-4 transition-colors">
        <div className="border-b border-[#f0f0f0] dark:border-[#1f1f23] pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#141414] dark:text-white">Display Appearance &amp; Aesthetics.</h3>
            <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa]">System-wide display mode configured exclusively for high-contrast telemetry.</p>
          </div>
          <span className="text-[10px] font-semibold px-2.5 py-1 bg-[#18181b] text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Dark Mode Exclusive
          </span>
        </div>

        <div className="p-4 rounded-[20px] border border-white/20 bg-[#141417] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-[30%] bg-[#18181b] text-amber-400 flex items-center justify-center shrink-0 border border-[#27272a]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Dark Mode (Noir Edition)</p>
              <p className="text-[11px] text-[#a1a1aa]">Deep blacks, low eye strain, optical matrix scanner optimization, and inverted white action pills.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-3 py-1 bg-white text-[#141414] rounded-full">
            Active System
          </span>
        </div>
      </div>

      {/* Company Profile Card */}
      {savedSuccess && (
        <div className="p-4 bg-[#f3f3f3] dark:bg-[#141417] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#27272a] rounded-full text-xs font-semibold flex items-center gap-2.5 px-6">
          <CheckCircle2 className="w-4 h-4 text-[#0066ff]" />
          <span>Company preferences and fiscal settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] space-y-6 transition-colors">
        <div className="border-b border-[#f0f0f0] dark:border-[#1f1f23] pb-3">
          <h3 className="text-sm font-bold text-[#141414] dark:text-white">Business Configuration &amp; Fiscal Policy.</h3>
          <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa]">Enterprise legal registration, default currencies, and notification routing.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Company Name</label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={e => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Tax ID / VAT Registration</label>
            <input
              type="text"
              value={formData.taxNumber}
              onChange={e => setFormData({ ...formData, taxNumber: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Currency Symbol</label>
            <select
              value={formData.currencySymbol}
              onChange={e => setFormData({ ...formData, currencySymbol: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            >
              <option value="$">USD ($)</option>
              <option value="€">EUR (€)</option>
              <option value="£">GBP (£)</option>
              <option value="¥">JPY (¥)</option>
              <option value="₹">INR (₹)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Default Sales Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={formData.defaultTaxRate}
              onChange={e => setFormData({ ...formData, defaultTaxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Notification / Reorder Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">Business Phone</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#141414] dark:text-white mb-1.5">HQ Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={e => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-[16px] text-xs text-[#141414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-[#f0f0f0] dark:border-[#1f1f23]">
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#141414] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#e4e4e7] text-white dark:text-[#141414] text-xs font-semibold rounded-full transition flex items-center gap-2 active:scale-98"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
