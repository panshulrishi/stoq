'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useInventory } from '@/lib/inventory-context';
import { StatusBadge } from '@/components/ui/Badge';
import {
  Scan,
  Camera,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  Volume2,
  VolumeX,
  History,
  QrCode,
} from 'lucide-react';

export function BarcodeScannerView() {
  const { products, scanHistory, recordScan, stockMovement, companySettings, setCurrentView } = useInventory();

  const [inputCode, setInputCode] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState<any>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS' | 'NOT_FOUND'>('IDLE');
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [scanMode, setScanMode] = useState<'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT'>('LOOKUP');
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Play audio beep/chime when scan succeeds or fails
  const triggerBeep = (type: 'SUCCESS' | 'ERROR' = 'SUCCESS') => {
    if (!audioFeedback) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      if (type === 'SUCCESS') {
        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1318.51, now);
        
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1760.00, now + 0.07);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.07);
        osc2.start(now + 0.07);
        osc2.stop(now + 0.25);
      } else {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(220, now + 0.1);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch (e) {
      // Audio Context fallback
    }
  };

  const handleExecuteScan = (codeToScan: string, overrideAction?: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT') => {
    const action = overrideAction || scanMode;
    if (!codeToScan.trim()) return;
    setScanningStatus('SCANNING');

    setTimeout(() => {
      const scanItem = recordScan(codeToScan.trim(), action);
      const matched = products.find(p => p.barcode === codeToScan.trim() || p.sku === codeToScan.trim());

      if (matched) {
        setScanningStatus('SUCCESS');
        triggerBeep('SUCCESS');
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 500);

        if (action === 'STOCK_IN') {
          stockMovement(matched.id, 'STOCK_IN', 1, 'Laser Scanned Stock In');
        } else if (action === 'STOCK_OUT') {
          stockMovement(matched.id, 'STOCK_OUT', -1, 'Laser Scanned Stock Out');
        }

        setLastScannedResult({
          product: matched,
          scanItem,
          action,
        });
      } else {
        setScanningStatus('NOT_FOUND');
        triggerBeep('ERROR');
        setLastScannedResult({
          barcode: codeToScan.trim(),
          scanItem,
          action,
        });
      }
    }, 300);
  };

  const startCameraScan = () => {
    setIsCameraActive(true);
    setScanningStatus('SCANNING');

    setTimeout(() => {
      const sampleProd = products[Math.floor(Math.random() * products.length)];
      if (sampleProd) {
        handleExecuteScan(sampleProd.barcode);
      }
      setIsCameraActive(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-white">
      {/* Header Banner */}
      <div className="bg-[#141417] p-6 sm:p-8 rounded-[24px] border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] text-[#f4f4f5] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0066ff]"></span>
            <span>Optical Acquisition Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Laser Matrix Scanner.
          </h2>
          <p className="text-xs sm:text-sm text-[#a1a1aa] font-light leading-relaxed">
            High-precision optical barcode acquisition with automated SKU lookup and inventory ledger movement.
          </p>
        </div>

        {/* Scan Mode Stadium Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="p-1 bg-[#18181b] rounded-full border border-[#27272a] flex items-center gap-1">
            <button
              onClick={() => setScanMode('LOOKUP')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                scanMode === 'LOOKUP'
                  ? 'bg-white text-[#141414]'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              Lookup
            </button>
            <button
              onClick={() => setScanMode('STOCK_IN')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                scanMode === 'STOCK_IN'
                  ? 'bg-white text-[#141414]'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              Stock In (+1)
            </button>
            <button
              onClick={() => setScanMode('STOCK_OUT')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                scanMode === 'STOCK_OUT'
                  ? 'bg-white text-[#141414]'
                  : 'text-[#a1a1aa] hover:text-white'
              }`}
            >
              Stock Out (-1)
            </button>
          </div>

          <button
            onClick={() => setAudioFeedback(!audioFeedback)}
            className={`p-2.5 rounded-full border border-[#27272a] transition flex items-center justify-center ${
              audioFeedback
                ? 'bg-[#18181b] text-white hover:bg-[#222225]'
                : 'bg-[#18181b] text-[#71717a] hover:text-white'
            }`}
            title={audioFeedback ? 'Audio Chime Enabled' : 'Audio Muted'}
          >
            {audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Viewfinder & Input Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Camera Viewfinder Card */}
          <div className="relative overflow-hidden bg-[#111113] rounded-[24px] border border-[#1f1f23] p-8 sm:p-10 flex flex-col items-center justify-center min-h-[340px] text-center">
            {/* Success flash overlay */}
            {showSuccessOverlay && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs border-2 border-emerald-500 rounded-[24px] flex items-center justify-center z-30 animate-in fade-in duration-150">
                <div className="px-5 py-2.5 rounded-full bg-[#111113] border border-emerald-500/40 text-emerald-400 font-semibold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Barcode Verified</span>
                </div>
              </div>
            )}

            {/* Viewfinder Target Aperture */}
            <div className="relative w-80 h-44 border border-[#27272a] rounded-[20px] bg-[#18181b]/50 flex flex-col items-center justify-center p-6 overflow-hidden">
              {/* Scan Sweep Line Animation */}
              {(isCameraActive || scanningStatus === 'SCANNING') && (
                <div className="absolute left-0 right-0 h-[2px] bg-[#0066ff] shadow-[0_0_10px_#0066ff] animate-scan z-20" />
              )}

              <Camera className="w-8 h-8 text-[#71717a] mb-3" />
              <p className="text-xs font-semibold text-white tracking-tight">
                {isCameraActive ? 'Active Scan Aperture' : 'Align Barcode in Viewfinder'}
              </p>
              <p className="text-[11px] text-[#71717a] mt-1 font-mono">
                {isCameraActive ? 'Position label within guides' : 'Supports EAN-13, UPC-A, Code 128'}
              </p>
            </div>

            {/* Action Trigger */}
            <div className="mt-6 z-10">
              <button
                onClick={startCameraScan}
                disabled={isCameraActive}
                className="px-6 py-2.5 bg-white hover:bg-[#e4e4e7] disabled:opacity-50 text-[#141414] font-semibold text-xs rounded-full transition active:scale-98 flex items-center gap-2"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isCameraActive ? 'Acquiring Optical Matrix...' : 'Activate Camera Scanner'}</span>
              </button>
            </div>
          </div>

          {/* Manual Input / Hardware Scanner Box */}
          <div className="p-6 bg-[#111113] rounded-[24px] border border-[#1f1f23] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <QrCode className="w-3.5 h-3.5 text-[#0066ff]" />
                <span>Hardware Laser Scanner & Manual Input</span>
              </h3>
              <span className="text-[11px] text-[#71717a]">USB & Bluetooth HID Compatible</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={e => setInputCode(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleExecuteScan(inputCode);
                }}
                placeholder="Scan or enter barcode / SKU..."
                className="flex-1 px-4 py-2.5 bg-[#18181b] border border-[#27272a] rounded-full text-xs font-mono text-white placeholder:text-[#71717a] outline-none focus:ring-2 focus:ring-white transition"
              />
              <button
                onClick={() => handleExecuteScan(inputCode)}
                className="px-5 py-2.5 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-semibold rounded-full transition active:scale-98"
              >
                Execute Scan
              </button>
            </div>

            {/* Quick Test Barcode Chips */}
            <div className="pt-2">
              <span className="text-[11px] font-medium text-[#71717a] block mb-2">Preset Verification Barcodes:</span>
              <div className="flex flex-wrap gap-2">
                {products.slice(0, 5).map(prod => (
                  <button
                    key={prod.id}
                    onClick={() => {
                      setInputCode(prod.barcode);
                      handleExecuteScan(prod.barcode);
                    }}
                    className="px-3 py-1 bg-[#18181b] hover:bg-[#222225] text-[#f4f4f5] text-[11px] font-mono rounded-full border border-[#27272a] transition flex items-center gap-1.5"
                  >
                    <span>{prod.barcode}</span>
                    <span className="text-[10px] text-[#71717a] font-sans">({prod.name.split(' ')[0]})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Last Scan Result Card */}
          {lastScannedResult && (
            <div className="p-6 bg-[#141417] rounded-[24px] border border-[#1f1f23] space-y-4">
              <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
                <div className="flex items-center gap-2.5">
                  {lastScannedResult.product ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      {lastScannedResult.product ? 'Barcode Match Verified' : 'Unregistered Barcode'}
                    </h3>
                    <p className="text-[11px] text-[#a1a1aa]">
                      Mode: <span className="font-semibold text-white">{lastScannedResult.action || 'LOOKUP'}</span>
                    </p>
                  </div>
                </div>
                {lastScannedResult.product && <StatusBadge status={lastScannedResult.product.stockStatus} />}
              </div>

              {lastScannedResult.product ? (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-[20px] bg-[#18181b] border border-[#27272a]">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-12 h-12 rounded-[30%] overflow-hidden border border-[#27272a] bg-[#111113] shrink-0">
                      <Image
                        src={lastScannedResult.product.imageUrl}
                        alt={lastScannedResult.product.name}
                        fill
                        sizes="48px"
                        referrerPolicy="no-referrer"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {lastScannedResult.product.name}
                      </h4>
                      <p className="text-[11px] text-[#a1a1aa]">
                        SKU: <span className="font-mono text-white">{lastScannedResult.product.sku}</span> • {lastScannedResult.product.location}
                      </p>
                      <p className="text-xs font-medium text-white mt-0.5">
                        {companySettings.currencySymbol}{lastScannedResult.product.sellingPrice.toFixed(2)} • Qty: {lastScannedResult.product.quantity} {lastScannedResult.product.unit}
                      </p>
                    </div>
                  </div>

                  {/* Immediate Adjustment Controls */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        stockMovement(lastScannedResult.product.id, 'STOCK_OUT', -1, 'Scanned Stock Out');
                        setLastScannedResult({
                          ...lastScannedResult,
                          product: { ...lastScannedResult.product, quantity: Math.max(0, lastScannedResult.product.quantity - 1) },
                        });
                        triggerBeep();
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-[#141417] hover:bg-[#222225] text-[#f4f4f5] text-xs font-semibold rounded-full border border-[#27272a] transition flex items-center justify-center gap-1.5"
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>Stock Out (-1)</span>
                    </button>
                    <button
                      onClick={() => {
                        stockMovement(lastScannedResult.product.id, 'STOCK_IN', 1, 'Scanned Stock In');
                        setLastScannedResult({
                          ...lastScannedResult,
                          product: { ...lastScannedResult.product, quantity: lastScannedResult.product.quantity + 1 },
                        });
                        triggerBeep();
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-1.5 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Stock In (+1)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-[20px] text-xs text-rose-300">
                  Barcode <span className="font-mono font-bold text-white">{lastScannedResult.barcode}</span> is not registered in the active catalog.
                  <button
                    onClick={() => setCurrentView('inventory')}
                    className="block font-semibold text-white hover:underline mt-2"
                  >
                    + Register product in SKU Matrix →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-Time Scan History Feed Column */}
        <div className="p-6 bg-[#111113] rounded-[24px] border border-[#1f1f23] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-[#0066ff]" />
              <span>Audit Scan Telemetry</span>
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#18181b] text-[#f4f4f5] border border-[#27272a] rounded-full">
              {scanHistory.length} Scans
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto divide-y divide-[#1f1f23] pr-1">
            {scanHistory.length === 0 ? (
              <div className="py-12 text-center text-[#71717a] space-y-2">
                <Scan className="w-6 h-6 mx-auto text-[#3f3f46]" />
                <p className="text-xs">No scans recorded in current session.</p>
              </div>
            ) : (
              scanHistory.map(item => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white truncate max-w-[140px]">
                      {item.productName || item.barcode}
                    </p>
                    <p className="text-[10px] text-[#71717a] font-mono mt-0.5">{item.barcode} • {item.timestamp}</p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      item.status === 'SUCCESS'
                        ? 'bg-emerald-950/30 text-emerald-400 border-emerald-800/40'
                        : 'bg-rose-950/30 text-rose-400 border-rose-800/40'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
