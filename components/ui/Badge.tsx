import React from 'react';
import { StockStatus, POStatus, PaymentStatus } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, PackageCheck } from 'lucide-react';

interface BadgeProps {
  status: StockStatus | POStatus | PaymentStatus | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: BadgeProps) {
  let dot = 'bg-[#707070]';
  let label = status;

  switch (status) {
    case 'IN_STOCK':
      dot = 'bg-emerald-500';
      label = 'In Stock';
      break;
    case 'LOW_STOCK':
      dot = 'bg-amber-500';
      label = 'Low Stock';
      break;
    case 'OUT_OF_STOCK':
      dot = 'bg-rose-500';
      label = 'Out of Stock';
      break;
    case 'OVERSTOCKED':
      dot = 'bg-[#0066ff]';
      label = 'Overstocked';
      break;
    case 'EXPIRED':
      dot = 'bg-purple-500';
      label = 'Expired';
      break;
    case 'RECEIVED':
    case 'PAID':
      dot = 'bg-emerald-500';
      label = status === 'RECEIVED' ? 'Received' : 'Paid';
      break;
    case 'SENT':
    case 'PENDING':
      dot = 'bg-amber-500';
      label = status === 'SENT' ? 'Sent to Supplier' : 'Pending Payment';
      break;
    case 'DRAFT':
      dot = 'bg-[#adadad]';
      label = 'Draft';
      break;
    case 'CANCELLED':
    case 'REFUNDED':
      dot = 'bg-rose-500';
      label = status;
      break;
    default:
      label = status;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-xs font-medium rounded-full bg-[#f3f3f3] text-[#141414] border border-[#e0e0e0] ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} />
      <span>{label}</span>
    </span>
  );
}

export function PopularBadge({ text = 'Popular', className = '' }: { text?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-[#0066ff] text-white ${className}`}>
      {text}
    </span>
  );
}
