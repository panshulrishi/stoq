'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

export function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'lg' }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto font-sans">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Modal Container (Mobbin 24px Canvas Card) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`relative w-full ${maxWidthClass} bg-white dark:bg-[#111113] rounded-[24px] shadow-2xl border border-[#e0e0e0] dark:border-[#1f1f23] overflow-hidden my-auto z-10 transition-colors`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0] dark:border-[#1f1f23] bg-white dark:bg-[#111113]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#141414] dark:text-white tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-[#707070] dark:text-[#a1a1aa] font-light mt-0.5">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-[#707070] dark:text-[#a1a1aa] hover:text-[#141414] dark:hover:text-white hover:bg-[#f3f3f3] dark:hover:bg-[#18181b] transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto text-[#141414] dark:text-[#f4f4f5]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
