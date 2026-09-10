'use client';

import React, { useState, useEffect } from 'react';
import { useInventory } from '@/lib/inventory-context';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ChevronDown,
  ChevronUp,
  Bug,
  Trash2,
  Copy,
  Check,
  Terminal,
} from 'lucide-react';
import { ToastNotification, ToastType } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';

function ToastItem({
  toast,
  onDismiss,
  onOpenErrorLogs,
}: {
  toast: ToastNotification;
  onDismiss: (id: string) => void;
  onOpenErrorLogs: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const copyDetails = () => {
    const text = `[${toast.type.toUpperCase()}] ${toast.title}\nMessage: ${toast.message}\nDetails: ${toast.details || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-950/90 dark:bg-red-950/95 border-red-500/30 text-red-100',
          iconBg: 'bg-red-500/20 text-red-400',
          Icon: AlertOctagon,
          accentBorder: 'border-l-4 border-l-red-500',
        };
      case 'warning':
        return {
          bg: 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/30 text-amber-100',
          iconBg: 'bg-amber-500/20 text-amber-400',
          Icon: AlertTriangle,
          accentBorder: 'border-l-4 border-l-amber-500',
        };
      case 'success':
        return {
          bg: 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-emerald-100',
          iconBg: 'bg-emerald-500/20 text-emerald-400',
          Icon: CheckCircle2,
          accentBorder: 'border-l-4 border-l-emerald-500',
        };
      case 'info':
      default:
        return {
          bg: 'bg-slate-900/90 dark:bg-slate-900/95 border-slate-700/50 text-slate-100',
          iconBg: 'bg-blue-500/20 text-blue-400',
          Icon: Info,
          accentBorder: 'border-l-4 border-l-blue-500',
        };
    }
  };

  const style = getStyle(toast.type);
  const IconComponent = style.Icon;

  return (
    <div
      className={`w-full max-w-sm rounded-xl border backdrop-blur-md shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${style.bg} ${style.accentBorder}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${style.iconBg}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold tracking-tight text-white">{toast.title}</h4>
            <span className="text-[10px] opacity-60 shrink-0 font-mono">{toast.timestamp}</span>
          </div>

          <p className="text-xs text-slate-200 mt-1 leading-relaxed break-words">{toast.message}</p>

          {toast.details && (
            <div className="mt-2.5">
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1 text-[11px] font-medium opacity-80 hover:opacity-100 transition text-indigo-300"
              >
                <span>{expanded ? 'Hide stack details' : 'View stack details'}</span>
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {expanded && (
                <div className="mt-2 p-2.5 bg-black/60 rounded-lg text-[10px] font-mono text-slate-300 border border-white/10 max-h-36 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1">
                    <span className="text-slate-400">Exception Trace:</span>
                    <button
                      onClick={copyDetails}
                      className="inline-flex items-center gap-1 text-[10px] text-slate-300 hover:text-white"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap break-all">{toast.details}</pre>
                </div>
              )}
            </div>
          )}

          {toast.type === 'error' && (
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={onOpenErrorLogs}
                className="text-[10px] font-medium text-red-300 hover:text-red-200 underline underline-offset-2 flex items-center gap-1"
              >
                <Bug className="w-3 h-3" />
                <span>Open System Health Console</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onDismiss(toast.id)}
          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast, clearToasts, errorLogs, clearErrorLogs, logError } = useInventory();
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'ERROR' | 'WARNING'>('ALL');

  const filteredLogs = errorLogs.filter(log => {
    if (filterSeverity === 'ALL') return true;
    return log.severity === filterSeverity;
  });

  const triggerTestError = () => {
    try {
      // Simulate a runtime failure
      throw new Error(`Simulated Runtime Error: [Failed to process inventory sync] at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      logError(err as Error, 'TestSimulator', 'ERROR');
    }
  };

  return (
    <>
      {/* Toast Stack Container (Fixed Top Right) */}
      <div className="fixed top-20 right-4 sm:right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map(toast => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
              onOpenErrorLogs={() => setIsLogsModalOpen(true)}
            />
          ))}
        </div>

        {toasts.length > 2 && (
          <div className="pointer-events-auto flex justify-end">
            <button
              onClick={clearToasts}
              className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear all notifications ({toasts.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* System Error Logs & Health Modal */}
      <Modal
        isOpen={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        title="System Exception & Runtime Health Logs"
        subtitle="Real-time captured runtime exceptions, failure events, and stack details"
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Logged Exceptions ({errorLogs.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={triggerTestError}
                className="px-2.5 py-1 bg-red-600/10 text-red-600 dark:text-red-400 hover:bg-red-600/20 border border-red-500/20 text-[11px] font-medium rounded-lg transition flex items-center gap-1"
              >
                <Bug className="w-3 h-3" />
                <span>Simulate Test Exception</span>
              </button>

              {errorLogs.length > 0 && (
                <button
                  onClick={clearErrorLogs}
                  className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 text-[11px] font-medium rounded-lg transition"
                >
                  Clear Logs
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Severity:</span>
            {(['ALL', 'CRITICAL', 'ERROR', 'WARNING'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  filterSeverity === sev
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Error Log Entries */}
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No runtime exceptions recorded</p>
                <p className="text-[11px] mt-0.5">System runtime is operating cleanly without failure events.</p>
              </div>
            ) : (
              filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-xs font-mono space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.severity === 'CRITICAL'
                            ? 'bg-red-500 text-white'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {log.severity}
                      </span>
                      <span className="text-indigo-400 font-semibold">{log.source}</span>
                    </div>
                    <span className="text-slate-400 text-[10px]">{log.timestamp}</span>
                  </div>

                  <p className="text-slate-200 font-sans text-xs">{log.message}</p>

                  {log.stack && (
                    <details className="text-[10px] text-slate-400 bg-black/50 p-2 rounded border border-slate-800">
                      <summary className="cursor-pointer text-indigo-300 font-sans hover:underline">
                        View Stack Trace
                      </summary>
                      <pre className="mt-1.5 whitespace-pre-wrap break-all text-[10px] leading-relaxed">
                        {log.stack}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
