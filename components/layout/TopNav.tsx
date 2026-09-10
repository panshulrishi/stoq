'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useInventory } from '@/lib/inventory-context';
import { GlobalSearchModal } from './GlobalSearchModal';
import {
  Search,
  Bell,
  LogOut,
  Menu,
  X,
  AlertTriangle,
  Package,
  Command,
  ArrowUpRight,
} from 'lucide-react';

interface TopNavProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
  onOpenMobileMenu?: () => void;
  onOpenSearch?: () => void;
  onOpenAuth?: () => void;
}

export function TopNav({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
  onOpenMobileMenu,
  onOpenSearch,
}: TopNavProps) {
  const {
    userProfile,
    companySettings,
    notifications,
    markNotificationRead,
    clearAllNotifications,
    setCurrentView,
    logout,
  } = useInventory();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Mobbin Floating Stadium Nav Pill */}
      <header className="sticky top-3 z-30 px-4 sm:px-8 py-1 max-w-7xl w-full mx-auto font-sans">
        <div className="w-full bg-[#f3f3f3] dark:bg-[#121214] text-[#141414] dark:text-[#f4f4f5] border border-[#e0e0e0] dark:border-[#27272a] rounded-full px-3.5 sm:px-5 py-2 flex items-center justify-between shadow-none transition-all">
          {/* Left Side: Mobile Menu Button & Search Trigger */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenMobileMenu || onToggleMobileSidebar}
              className="lg:hidden p-1.5 rounded-full text-[#141414] dark:text-white hover:bg-[#e8e8e8] dark:hover:bg-[#27272a] transition"
              aria-label="Toggle Navigation"
            >
              {isMobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            {/* Command Palette Trigger (Stadium Pill) */}
            <button
              onClick={() => (onOpenSearch ? onOpenSearch() : setIsSearchOpen(true))}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] border border-[#e0e0e0] dark:border-[#27272a] rounded-full text-xs text-[#707070] dark:text-[#a1a1aa] transition w-44 sm:w-64"
            >
              <Search className="w-3.5 h-3.5 text-[#707070] dark:text-[#a1a1aa] shrink-0" />
              <span className="truncate">Search catalog & telemetry...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 ml-auto text-[10px] bg-[#f0f0f0] dark:bg-[#27272a] text-[#707070] dark:text-[#a1a1aa] px-1.5 py-0.5 rounded-full font-mono">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>
          </div>

          {/* Right Side: Notifications, Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Notifications Dropdown (Stadium Pill) */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-full bg-white dark:bg-[#18181b] border border-[#e0e0e0] dark:border-[#27272a] text-[#141414] dark:text-white hover:bg-[#f8f8f8] dark:hover:bg-[#222225] transition"
                aria-label="Notifications"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#0066ff] rounded-full ring-2 ring-white dark:ring-[#18181b]" />
                )}
              </button>

              {/* Notifications Popover (Mobbin Card) */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#121214] border border-[#e0e0e0] dark:border-[#27272a] rounded-[24px] shadow-xl z-50 overflow-hidden text-xs">
                  <div className="p-4 border-b border-[#f0f0f0] dark:border-[#27272a] flex items-center justify-between bg-[#fbfbfb] dark:bg-[#18181b]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#141414] dark:text-white">System Alerts.</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#0066ff] text-white rounded-full">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[11px] text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white transition font-medium"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-[#f0f0f0] dark:divide-[#27272a]">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#adadad] dark:text-[#71717a]">No active alerts.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3.5 flex gap-3 transition cursor-pointer hover:bg-[#f8f8f8] dark:hover:bg-[#18181b] ${
                            !n.read ? 'bg-[#f3f3f3]/60 dark:bg-[#18181b]/50' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.type === 'LOW_STOCK' || n.type === 'OUT_OF_STOCK' ? (
                              <div className="p-1.5 rounded-full bg-[#f0f0f0] dark:bg-[#27272a] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#3f3f46]">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-full bg-[#f0f0f0] dark:bg-[#27272a] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#3f3f46]">
                                <Package className="w-3.5 h-3.5 text-[#0066ff]" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#141414] dark:text-white truncate">{n.title}</p>
                            <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa] mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[10px] text-[#adadad] dark:text-[#71717a] font-mono mt-1 block">{n.timestamp}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown (Mobbin Stadium Pill) */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] border border-[#e0e0e0] dark:border-[#27272a] rounded-full transition"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#141414] dark:bg-white shrink-0">
                  <Image
                    src={userProfile.avatarUrl}
                    alt={userProfile.name}
                    width={28}
                    height={28}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-xs font-semibold text-[#141414] dark:text-white leading-tight">{userProfile.name}</p>
                </div>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121214] border border-[#e0e0e0] dark:border-[#27272a] rounded-[24px] shadow-xl z-50 py-2 text-xs">
                  <div className="px-4 py-3.5 border-b border-[#f0f0f0] dark:border-[#27272a] flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[30%] overflow-hidden bg-[#141414] shrink-0 border border-[#e0e0e0] dark:border-[#27272a]">
                      <Image
                        src={userProfile.avatarUrl}
                        alt={userProfile.name}
                        width={40}
                        height={40}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#141414] dark:text-white truncate text-sm">{userProfile.name}</p>
                      <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa] truncate">{userProfile.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 bg-[#f0f0f0] dark:bg-[#27272a] text-[#141414] dark:text-white rounded-full">
                        {userProfile.role} • {companySettings.companyName}
                      </span>
                    </div>
                  </div>

                  <div className="border-t border-[#f0f0f0] dark:border-[#27272a] pt-1 px-2">
                    <button
                      onClick={() => {
                        logout();
                        setIsProfileOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-full flex items-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
