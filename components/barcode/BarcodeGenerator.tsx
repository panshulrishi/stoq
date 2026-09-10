'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { BarcodeFormat, Product } from '@/lib/types';
import { renderSVGBarcode, generateRandomBarcode } from '@/lib/barcode-utils';
import {
  QrCode,
  Printer,
  Download,
  Copy,
  Check,
  Package,
  Layers,
  Sparkles,
  Grid,
} from 'lucide-react';

export function BarcodeGenerator() {
  const { products, companySettings } = useInventory();

  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>('EAN13');
  const [customCode, setCustomCode] = useState<string>(products[0]?.barcode || generateRandomBarcode('EAN13'));
  const [showPrice, setShowPrice] = useState(true);
  const [showName, setShowName] = useState(true);
  const [labelTemplate, setLabelTemplate] = useState<'thermal_2x1' | 'sheet_3x8' | 'price_tag'>('thermal_2x1');
  const [copied, setCopied] = useState(false);

  // Get active product details if matched
  const activeProduct = products.find(p => p.id === selectedProductId);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const prod = products.find(p => p.id === id);
    if (prod) {
      setCustomCode(prod.barcode);
      setBarcodeFormat(prod.barcodeFormat || 'EAN13');
    }
  };

  const handleGenerateRandom = () => {
    setCustomCode(generateRandomBarcode(barcodeFormat));
  };

  const svgContent = renderSVGBarcode(
    customCode,
    barcodeFormat,
    showName ? (activeProduct?.name || 'Custom Product Label') : undefined,
    showPrice ? (activeProduct?.sellingPrice || 29.99) : undefined
  );

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Barcode_${customCode}_${barcodeFormat}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopySVG = () => {
    navigator.clipboard.writeText(svgContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabels = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header */}
      <div className="bg-[#141417] p-6 rounded-3xl border border-[#1f1f23] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              <QrCode className="w-3.5 h-3.5 text-white" />
              <span>Label Studio</span>
            </span>
          </div>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Barcode & QR Label Generator
          </h2>
          <p className="text-xs text-[#71717a] mt-0.5">
            Generate EAN-13, UPC, Code128, and QR labels calibrated for thermal roll printers or multi-label sheets
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadSVG}
            className="px-4 py-2 bg-[#18181b] hover:bg-[#27272a] text-[#d4d4d8] text-xs font-medium rounded-full border border-[#27272a] transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SVG</span>
          </button>
          <button
            onClick={handlePrintLabels}
            className="px-4 py-2 bg-white hover:bg-[#e4e4e7] text-[#141414] text-xs font-medium rounded-full shadow-sm transition flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="p-6 bg-[#141417] rounded-3xl border border-[#1f1f23] space-y-4">
          <h3 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider border-b border-[#1f1f23] pb-3">
            Label Configuration
          </h3>

          {/* Select Product */}
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">
              Select Product from Inventory
            </label>
            <select
              value={selectedProductId}
              onChange={e => handleSelectProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            >
              <option value="">-- Custom Manual Input --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Barcode Standard */}
          <div>
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">
              Symbology Standard
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['EAN13', 'UPC', 'CODE128', 'QR'] as BarcodeFormat[]).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setBarcodeFormat(fmt);
                    setCustomCode(generateRandomBarcode(fmt));
                  }}
                  className={`py-2 px-3 text-xs font-medium rounded-xl border transition ${
                    barcodeFormat === fmt
                      ? 'bg-white text-[#141414] border-white font-semibold'
                      : 'bg-[#0e0e11] text-[#a1a1aa] border-[#27272a] hover:text-white hover:border-[#3f3f46]'
                  }`}
                >
                  {fmt === 'EAN13' ? 'EAN-13' : fmt === 'UPC' ? 'UPC-A' : fmt === 'CODE128' ? 'Code 128' : 'QR Code'}
                </button>
              ))}
            </div>
          </div>

          {/* Barcode Number Field */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-medium text-[#d4d4d8]">Barcode Value</label>
              <button
                type="button"
                onClick={handleGenerateRandom}
                className="text-[11px] text-[#0066ff] hover:text-[#3385ff] font-medium transition"
              >
                Auto Generate
              </button>
            </div>
            <input
              type="text"
              value={customCode}
              onChange={e => setCustomCode(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl font-mono outline-none focus:border-[#3f3f46] transition"
            />
          </div>

          {/* Toggle Display Customizations */}
          <div className="space-y-2.5 pt-3 border-t border-[#1f1f23]">
            <label className="flex items-center gap-2.5 text-xs text-[#a1a1aa] hover:text-white cursor-pointer transition">
              <input
                type="checkbox"
                checked={showName}
                onChange={e => setShowName(e.target.checked)}
                className="rounded bg-[#0e0e11] border-[#27272a] text-white focus:ring-0"
              />
              <span>Include Product Name</span>
            </label>
            <label className="flex items-center gap-2.5 text-xs text-[#a1a1aa] hover:text-white cursor-pointer transition">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={e => setShowPrice(e.target.checked)}
                className="rounded bg-[#0e0e11] border-[#27272a] text-white focus:ring-0"
              />
              <span>Include Retail Price Tag ({companySettings.currencySymbol})</span>
            </label>
          </div>

          {/* Label Sheet Layout Template */}
          <div className="pt-3 border-t border-[#1f1f23]">
            <label className="block text-xs font-medium text-[#d4d4d8] mb-1.5">
              Sheet Layout Preset
            </label>
            <select
              value={labelTemplate}
              onChange={e => setLabelTemplate(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-[#0e0e11] border border-[#27272a] text-xs text-white rounded-xl outline-none focus:border-[#3f3f46] transition"
            >
              <option value="thermal_2x1">Thermal Sticker Roll (2&quot; x 1&quot;)</option>
              <option value="sheet_3x8">Standard Sheet (24 Labels per A4)</option>
              <option value="price_tag">Retail Shelf Edge / Hangtag</option>
            </select>
          </div>
        </div>

        {/* Live Preview Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-[#141417] rounded-3xl border border-[#1f1f23] flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-between w-full border-b border-[#1f1f23] pb-3">
              <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Preview</span>
              <button
                onClick={handleCopySVG}
                className="text-xs text-[#a1a1aa] hover:text-white flex items-center gap-1.5 font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy SVG'}</span>
              </button>
            </div>

            {/* Rendered SVG Display on light pill card for real-life barcode optics */}
            <div className="w-full max-w-sm p-6 bg-white rounded-2xl border border-white/10 shadow-lg flex items-center justify-center">
              <div
                dangerouslySetInnerHTML={{ __html: svgContent }}
                className="w-full max-w-xs"
              />
            </div>
          </div>

          {/* Printable Layout Preview */}
          <div id="printable-area" className="p-6 bg-[#141417] rounded-3xl border border-[#1f1f23]">
            <h4 className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-4 no-print">
              Grid Layout Preview ({labelTemplate === 'sheet_3x8' ? '3x8 Grid' : 'Thermal Roll'})
            </h4>

            <div className={`grid gap-4 ${labelTemplate === 'sheet_3x8' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
              {Array.from({ length: labelTemplate === 'sheet_3x8' ? 6 : 2 }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-4 border border-zinc-200 rounded-2xl bg-white text-zinc-900 flex flex-col items-center justify-center text-center shadow-xs"
                >
                  <div dangerouslySetInnerHTML={{ __html: svgContent }} className="w-full max-w-[180px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
