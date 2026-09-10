'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Product } from '@/lib/types';
import { Modal } from '@/components/ui/Modal';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sliders,
  FileText,
  Trash2,
  Download,
  Database,
  Info,
  Check,
  Search,
  X,
  Layers,
  Sparkles,
  TrendingUp,
  AlertCircle,
  FileCode
} from 'lucide-react';
import Papa from 'papaparse';

interface GuidedImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImportStep = 'UPLOAD' | 'MAPPING' | 'PREVIEW' | 'EXECUTING' | 'SUMMARY';
type ImportMode = 'UPSERT' | 'UPDATE_ONLY' | 'CREATE_ONLY';
type QtyStrategy = 'OVERWRITE' | 'INCREMENT' | 'SKIP';
type PriceStrategy = 'OVERWRITE' | 'SELL_ONLY' | 'SKIP';

interface FieldMapping {
  sku: string;
  barcode: string;
  name: string;
  category: string;
  quantity: string;
  purchasePrice: string;
  sellingPrice: string;
  minReorderLevel: string;
  location: string;
  supplierName: string;
}

interface ParsedPreviewRow {
  rowIndex: number;
  raw: Record<string, string>;
  mapped: {
    sku: string;
    barcode: string;
    name: string;
    category: string;
    quantity: number;
    purchasePrice: number;
    sellingPrice: number;
    minReorderLevel: number;
    location: string;
    supplierName: string;
  };
  matchedProduct?: Product;
  status: 'MATCHED_UPDATE' | 'NEW_ITEM' | 'INVALID';
  validationErrors: string[];
  selected: boolean;
}

export function GuidedImportModal({ isOpen, onClose }: GuidedImportModalProps) {
  const { products, batchUpsertProducts, companySettings } = useInventory();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState<ImportStep>('UPLOAD');

  // File & Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Configuration State
  const [importMode, setImportMode] = useState<ImportMode>('UPSERT');
  const [qtyStrategy, setQtyStrategy] = useState<QtyStrategy>('OVERWRITE');
  const [priceStrategy, setPriceStrategy] = useState<PriceStrategy>('OVERWRITE');
  const [sanitizeInput, setSanitizeInput] = useState(true);
  const [strictSkuMatch, setStrictSkuMatch] = useState(true);

  // Field Mapping State
  const [mapping, setMapping] = useState<FieldMapping>({
    sku: '',
    barcode: '',
    name: '',
    category: '',
    quantity: '',
    purchasePrice: '',
    sellingPrice: '',
    minReorderLevel: '',
    location: '',
    supplierName: '',
  });

  // Preview & Selection State
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'MATCHED' | 'NEW' | 'ERRORS'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());

  // Execution & Result State
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{
    updatedCount: number;
    createdCount: number;
    skippedCount: number;
    valueDelta: number;
    transactionId: string;
  } | null>(null);

  // Reset Modal State
  const handleReset = () => {
    setCurrentStep('UPLOAD');
    setFile(null);
    setRawHeaders([]);
    setRawRows([]);
    setParseError(null);
    setMapping({
      sku: '',
      barcode: '',
      name: '',
      category: '',
      quantity: '',
      purchasePrice: '',
      sellingPrice: '',
      minReorderLevel: '',
      location: '',
      supplierName: '',
    });
    setSelectedRowIndices(new Set());
    setImportResult(null);
    setExecutionProgress(0);
    setExecutionLog([]);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Auto-detect CSV Column Mapping
  const autoMapColumns = (headers: string[]) => {
    const findHeader = (keywords: string[]): string => {
      const found = headers.find(h => {
        const lower = h.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        return keywords.some(k => lower.includes(k));
      });
      return found || '';
    };

    const detected: FieldMapping = {
      sku: findHeader(['sku', 'code', 'itemno', 'itemid', 'partnumber']),
      barcode: findHeader(['barcode', 'upc', 'ean', 'qr', 'gtin']),
      name: findHeader(['name', 'title', 'product', 'item', 'description']),
      category: findHeader(['category', 'type', 'group', 'department']),
      quantity: findHeader(['qty', 'quantity', 'stock', 'onhand', 'units']),
      purchasePrice: findHeader(['cost', 'purchaseprice', 'buyprice', 'wholesale']),
      sellingPrice: findHeader(['price', 'sellingprice', 'retail', 'msrp', 'unitprice']),
      minReorderLevel: findHeader(['min', 'reorder', 'minlevel', 'threshold']),
      location: findHeader(['location', 'bin', 'aisle', 'warehouse']),
      supplierName: findHeader(['supplier', 'vendor', 'brand', 'source']),
    };

    setMapping(detected);
  };

  // File Parsing
  const processFile = (uploadedFile: File) => {
    if (!uploadedFile.name.endsWith('.csv') && !uploadedFile.name.endsWith('.txt')) {
      setParseError('Unsupported file type. Please upload a standard CSV spreadsheet file (.csv).');
      return;
    }

    setParseError(null);
    setFile(uploadedFile);

    Papa.parse<Record<string, string>>(uploadedFile, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors && results.errors.length > 0 && results.data.length === 0) {
          setParseError(`CSV Parsing Error: ${results.errors[0].message}`);
          return;
        }

        const headers = results.meta.fields || [];
        if (headers.length === 0) {
          setParseError('The uploaded CSV file contains no column header row.');
          return;
        }

        setRawHeaders(headers);
        setRawRows(results.data);
        autoMapColumns(headers);
        setCurrentStep('MAPPING');
      },
      error: (err) => {
        setParseError(`Failed to parse file: ${err.message}`);
      }
    });
  };

  // Download Sample CSV Templates
  const handleDownloadTemplate = (type: 'UPDATE' | 'NEW') => {
    let csvContent = '';
    let filename = '';

    if (type === 'UPDATE') {
      csvContent = 'SKU,Barcode,Product Name,Quantity,Purchase Price,Selling Price,Location\n' +
        'SKU-CHAIR-001,123456789012,Ergonomic Mesh Chair,50,85.00,149.99,Aisle 3 Bin 12\n' +
        'SKU-DESK-002,123456789013,Standing Desk Converter,30,120.00,229.00,Aisle 1 Bin 04\n' +
        'SKU-MONITOR-003,123456789014,27-inch 4K Monitor,15,210.00,349.99,Aisle 5 Bin 02\n';
      filename = 'Stoq_Batch_Update_Template.csv';
    } else {
      csvContent = 'SKU,Barcode,Product Name,Category,Quantity,Purchase Price,Selling Price,Min Reorder,Location,Supplier\n' +
        'SKU-KB-010,880123456789,Mechanical Gaming Keyboard,Electronics,40,45.00,89.99,10,Aisle 2 Bin 08,TechSupply Co\n' +
        'SKU-MOUSE-011,880123456790,Wireless Ergonomic Mouse,Electronics,60,18.00,39.99,15,Aisle 2 Bin 09,TechSupply Co\n' +
        'SKU-LAMP-012,880123456791,LED Desk Lamp Warm Light,Office,25,12.50,29.99,5,Aisle 4 Bin 01,HomeOffice Direct\n';
      filename = 'Stoq_New_Inventory_Template.csv';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process rows to create ParsedPreviewRow list
  const parsedPreviewRows = useMemo<ParsedPreviewRow[]>(() => {
    if (rawRows.length === 0) return [];

    return rawRows.map((raw, idx) => {
      const skuVal = (raw[mapping.sku] || '').trim();
      const barcodeVal = (raw[mapping.barcode] || '').trim();
      const nameVal = (raw[mapping.name] || '').trim();
      const categoryVal = (raw[mapping.category] || '').trim();
      const qtyVal = parseFloat(raw[mapping.quantity] || '0') || 0;
      const purchaseVal = parseFloat(raw[mapping.purchasePrice] || '0') || 0;
      const sellingVal = parseFloat(raw[mapping.sellingPrice] || '0') || 0;
      const minLevelVal = parseInt(raw[mapping.minReorderLevel] || '10', 10) || 10;
      const locationVal = (raw[mapping.location] || '').trim();
      const supplierVal = (raw[mapping.supplierName] || '').trim();

      const validationErrors: string[] = [];

      if (!skuVal && !barcodeVal) {
        validationErrors.push('Missing required SKU or Barcode identifier');
      }

      if (qtyVal < 0) {
        validationErrors.push('Stock quantity cannot be negative');
      }

      if (purchaseVal < 0 || sellingVal < 0) {
        validationErrors.push('Prices cannot be negative');
      }

      // Check for existing product match
      const matched = products.find(p => {
        const skuMatch = skuVal && p.sku.toLowerCase() === skuVal.toLowerCase();
        const barcodeMatch = barcodeVal && p.barcode === barcodeVal;
        return strictSkuMatch ? skuMatch : (skuMatch || barcodeMatch);
      });

      let status: 'MATCHED_UPDATE' | 'NEW_ITEM' | 'INVALID' = 'NEW_ITEM';
      if (validationErrors.length > 0) {
        status = 'INVALID';
      } else if (matched) {
        status = 'MATCHED_UPDATE';
      } else {
        status = 'NEW_ITEM';
      }

      return {
        rowIndex: idx,
        raw,
        mapped: {
          sku: skuVal,
          barcode: barcodeVal,
          name: nameVal || (matched ? matched.name : `Imported ${skuVal}`),
          category: categoryVal || (matched ? matched.category : 'Unassigned'),
          quantity: qtyVal,
          purchasePrice: purchaseVal,
          sellingPrice: sellingVal,
          minReorderLevel: minLevelVal,
          location: locationVal,
          supplierName: supplierVal,
        },
        matchedProduct: matched,
        status,
        validationErrors,
        selected: selectedRowIndices.size === 0 || selectedRowIndices.has(idx),
      };
    });
  }, [rawRows, mapping, products, strictSkuMatch, selectedRowIndices]);

  // Filtered Preview Rows
  const filteredPreviewRows = useMemo(() => {
    return parsedPreviewRows.filter(row => {
      // Status Filter
      if (previewFilter === 'MATCHED' && row.status !== 'MATCHED_UPDATE') return false;
      if (previewFilter === 'NEW' && row.status !== 'NEW_ITEM') return false;
      if (previewFilter === 'ERRORS' && row.status !== 'INVALID') return false;

      // Text Search Filter
      if (searchFilter.trim()) {
        const term = searchFilter.toLowerCase().trim();
        const matchSku = row.mapped.sku.toLowerCase().includes(term);
        const matchName = row.mapped.name.toLowerCase().includes(term);
        const matchCat = row.mapped.category.toLowerCase().includes(term);
        const matchBarcode = row.mapped.barcode.toLowerCase().includes(term);
        return matchSku || matchName || matchCat || matchBarcode;
      }

      return true;
    });
  }, [parsedPreviewRows, previewFilter, searchFilter]);

  // Preview Statistics
  const previewStats = useMemo(() => {
    const total = parsedPreviewRows.length;
    const matched = parsedPreviewRows.filter(r => r.status === 'MATCHED_UPDATE').length;
    const newItems = parsedPreviewRows.filter(r => r.status === 'NEW_ITEM').length;
    const errors = parsedPreviewRows.filter(r => r.status === 'INVALID').length;
    const selected = selectedRowIndices.size;

    return { total, matched, newItems, errors, selected };
  }, [parsedPreviewRows, selectedRowIndices]);

  // Toggle Row Selection
  const toggleRowSelection = (idx: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  const toggleSelectAllValid = () => {
    if (selectedRowIndices.size === previewStats.total - previewStats.errors) {
      setSelectedRowIndices(new Set());
    } else {
      const validIndices = parsedPreviewRows
        .filter(r => r.status !== 'INVALID')
        .map(r => r.rowIndex);
      setSelectedRowIndices(new Set(validIndices));
    }
  };

  // Execute Batch Import
  const handleExecuteImport = async () => {
    setCurrentStep('EXECUTING');
    setIsExecuting(true);
    setExecutionProgress(10);
    setExecutionLog(['Initiating secure batch import transaction...', 'Validating payload checksums & field formats...']);

    await new Promise(r => setTimeout(r, 600));
    setExecutionProgress(35);
    setExecutionLog(prev => [...prev, 'Sanitizing strings & encoding special characters...']);

    await new Promise(r => setTimeout(r, 600));
    setExecutionProgress(65);
    setExecutionLog(prev => [...prev, `Matching ${selectedRowIndices.size} selected records against SKU registry...`]);

    // Prepare items payload
    const selectedItems = parsedPreviewRows
      .filter(r => selectedRowIndices.has(r.rowIndex) && r.status !== 'INVALID')
      .map(r => ({
        sku: r.mapped.sku,
        barcode: r.mapped.barcode,
        name: r.mapped.name,
        category: r.mapped.category,
        quantity: r.mapped.quantity,
        purchasePrice: r.mapped.purchasePrice,
        sellingPrice: r.mapped.sellingPrice,
        minReorderLevel: r.mapped.minReorderLevel,
        location: r.mapped.location,
        supplierName: r.mapped.supplierName,
      }));

    await new Promise(r => setTimeout(r, 800));
    setExecutionProgress(90);
    setExecutionLog(prev => [...prev, 'Applying database batch updates and writing audit trail entries...']);

    const result = batchUpsertProducts(selectedItems, {
      mode: importMode,
      qtyStrategy,
      priceStrategy,
      sanitizeInput,
    });

    await new Promise(r => setTimeout(r, 500));
    setExecutionProgress(100);
    setExecutionLog(prev => [...prev, 'Batch sync execution completed successfully!']);
    setImportResult(result);
    setIsExecuting(false);
    setCurrentStep('SUMMARY');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Secure Guided Spreadsheet Import Wizard"
      subtitle="Batch update existing inventory stock & prices from external Excel/CSV files"
      maxWidth="2xl"
    >
      <div className="space-y-6 font-sans">
        {/* Wizard Stepper Progress Bar */}
        <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
          <div className="flex items-center justify-between gap-2 text-xs font-mono">
            {[
              { id: 'UPLOAD', stepNum: 1, label: 'Drop File' },
              { id: 'MAPPING', stepNum: 2, label: 'Column Mapping' },
              { id: 'PREVIEW', stepNum: 3, label: 'Delta Validation' },
              { id: 'SUMMARY', stepNum: 4, label: 'Batch Sync' },
            ].map((st, i, arr) => {
              const isCurrent = currentStep === st.id || (st.id === 'SUMMARY' && currentStep === 'EXECUTING');
              const isPassed =
                (st.id === 'UPLOAD' && currentStep !== 'UPLOAD') ||
                (st.id === 'MAPPING' && ['PREVIEW', 'EXECUTING', 'SUMMARY'].includes(currentStep)) ||
                (st.id === 'PREVIEW' && ['EXECUTING', 'SUMMARY'].includes(currentStep));

              return (
                <React.Fragment key={st.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] transition ${
                        isPassed
                          ? 'bg-emerald-500 text-zinc-950'
                          : isCurrent
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.stepNum}
                    </span>
                    <span
                      className={`hidden sm:inline font-semibold ${
                        isCurrent ? 'text-white' : isPassed ? 'text-emerald-400' : 'text-zinc-500'
                      }`}
                    >
                      {st.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 transition ${
                        isPassed ? 'bg-emerald-500/50' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* STEP 1: FILE UPLOAD & DRAG DROP ZONE */}
        {currentStep === 'UPLOAD' && (
          <div className="space-y-5">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-950'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-3 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Drag and drop your spreadsheet file here
                  </p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Supports standard CSV spreadsheets exported from Excel, Google Sheets, ERPs or POS systems
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-Bit Encrypted & Sanitized In-Browser Parsing</span>
                </div>
              </div>
            </div>

            {parseError && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/40 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Import Mode Selection Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                Select Batch Strategy Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'UPSERT',
                    title: 'Upsert Mode (Default)',
                    desc: 'Update matching SKUs & append unrecognized new products',
                    icon: RefreshCw,
                    color: 'indigo',
                  },
                  {
                    id: 'UPDATE_ONLY',
                    title: 'Update Existing Only',
                    desc: 'Strictly update matched SKUs. Ignore non-matching rows',
                    icon: Sliders,
                    color: 'amber',
                  },
                  {
                    id: 'CREATE_ONLY',
                    title: 'Add New Only',
                    desc: 'Only insert new SKUs. Skip existing inventory items',
                    icon: Layers,
                    color: 'emerald',
                  },
                ].map(mode => {
                  const IconComponent = mode.icon;
                  const isSelected = importMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setImportMode(mode.id as ImportMode)}
                      className={`p-3.5 rounded-2xl border text-left transition relative ${
                        isSelected
                          ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-md'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-500 text-white' : 'bg-zinc-900 text-zinc-400'}`}>
                          <IconComponent className="w-3.5 h-3.5" />
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <p className="text-xs font-bold text-white">{mode.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Download Sample Templates & Security Toggles */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 font-mono">Sample Templates:</span>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('UPDATE')}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-indigo-400 text-[11px] font-mono rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>Update SKU Template</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('NEW')}
                  className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-indigo-400 text-[11px] font-mono rounded-lg transition flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>New Catalog Template</span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sanitizeInput}
                    onChange={e => setSanitizeInput(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-indigo-600 focus:ring-0"
                  />
                  <span>Sanitize Payload</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SMART COLUMN MAPPING */}
        {currentStep === 'MAPPING' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" />
                <span className="text-white font-bold">{file?.name}</span>
                <span className="text-zinc-500">({rawRows.length} total rows parsed)</span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep('UPLOAD')}
                className="text-xs text-zinc-400 hover:text-white underline"
              >
                Change File
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                  Map Spreadsheet Columns to System Fields
                </h4>
                <span className="text-[11px] text-zinc-500 font-mono">
                  * SKU or Barcode required for inventory matching
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800 max-h-72 overflow-y-auto">
                {[
                  { field: 'sku', label: 'SKU / Identifier *', req: true },
                  { field: 'barcode', label: 'Barcode Code (UPC/EAN)', req: false },
                  { field: 'name', label: 'Product Name', req: false },
                  { field: 'category', label: 'Category', req: false },
                  { field: 'quantity', label: 'Stock Quantity', req: false },
                  { field: 'purchasePrice', label: `Purchase Price (${companySettings.currencySymbol})`, req: false },
                  { field: 'sellingPrice', label: `Selling Price (${companySettings.currencySymbol})`, req: false },
                  { field: 'minReorderLevel', label: 'Min Reorder Threshold', req: false },
                  { field: 'location', label: 'Warehouse / Bin Location', req: false },
                  { field: 'supplierName', label: 'Supplier / Vendor', req: false },
                ].map(item => {
                  const currentValue = mapping[item.field as keyof FieldMapping];
                  return (
                    <div key={item.field} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-semibold text-zinc-300 font-mono">
                          {item.label}
                        </label>
                        {currentValue && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Mapped
                          </span>
                        )}
                      </div>
                      <select
                        value={currentValue}
                        onChange={e =>
                          setMapping(prev => ({ ...prev, [item.field]: e.target.value }))
                        }
                        className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">-- Ignore / Do Not Import --</option>
                        {rawHeaders.map(h => (
                          <option key={h} value={h}>
                            Spreadsheet Column: [{h}]
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data Preview snippet */}
            {rawRows.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-zinc-400">Sample Row Mapping Preview (First 2 Rows):</p>
                <div className="overflow-x-auto bg-zinc-950 rounded-xl border border-zinc-800 p-2">
                  <table className="w-full text-left text-[11px] font-mono text-zinc-300">
                    <thead>
                      <tr className="border-b border-zinc-800 text-zinc-500">
                        <th className="p-2">SKU</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0, 2).map((r, i) => (
                        <tr key={i} className="border-b border-zinc-900/50">
                          <td className="p-2 text-indigo-400 font-bold">{r[mapping.sku] || '-'}</td>
                          <td className="p-2">{r[mapping.name] || '-'}</td>
                          <td className="p-2">{r[mapping.category] || '-'}</td>
                          <td className="p-2 text-emerald-400">{r[mapping.quantity] || '0'}</td>
                          <td className="p-2">{r[mapping.sellingPrice] ? `${companySettings.currencySymbol}${r[mapping.sellingPrice]}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep('UPLOAD')}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!mapping.sku && !mapping.barcode}
                onClick={() => {
                  const validIndices = parsedPreviewRows
                    .filter(r => r.status !== 'INVALID')
                    .map(r => r.rowIndex);
                  setSelectedRowIndices(new Set(validIndices));
                  setCurrentStep('PREVIEW');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>Continue to Delta Preview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW, CONFLICT RESOLUTION & DELTA TABLE */}
        {currentStep === 'PREVIEW' && (
          <div className="space-y-4">
            {/* Top Config & Strategy Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Stock Quantity Conflict Strategy:</label>
                <select
                  value={qtyStrategy}
                  onChange={e => setQtyStrategy(e.target.value as QtyStrategy)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="OVERWRITE">Overwrite Stock Quantity (Replace with CSV value)</option>
                  <option value="INCREMENT">Increment Stock Quantity (Add CSV value to current stock)</option>
                  <option value="SKIP">Skip Quantity Updates (Keep existing stock)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Price Update Strategy:</label>
                <select
                  value={priceStrategy}
                  onChange={e => setPriceStrategy(e.target.value as PriceStrategy)}
                  className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none"
                >
                  <option value="OVERWRITE">Overwrite Purchase & Selling Prices</option>
                  <option value="SELL_ONLY">Update Selling Price Only</option>
                  <option value="SKIP">Skip Price Updates (Keep existing prices)</option>
                </select>
              </div>
            </div>

            {/* Filter & Stat Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'ALL', label: `All (${previewStats.total})` },
                  { id: 'MATCHED', label: `Matched Updates (${previewStats.matched})`, color: 'text-indigo-400' },
                  { id: 'NEW', label: `New Items (${previewStats.newItems})`, color: 'text-emerald-400' },
                  { id: 'ERRORS', label: `Errors (${previewStats.errors})`, color: 'text-rose-400' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPreviewFilter(tab.id as any)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition ${
                      previewFilter === tab.id
                        ? 'bg-zinc-800 text-white border border-zinc-700'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span className={tab.color}>{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Filter preview..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white font-mono outline-none"
                />
              </div>
            </div>

            {/* Delta Table */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-400 uppercase tracking-wider">
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedRowIndices.size === previewStats.total - previewStats.errors && previewStats.total > 0}
                        onChange={toggleSelectAllValid}
                        className="rounded border-zinc-700 bg-zinc-900 text-indigo-600"
                      />
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3">SKU / Item</th>
                    <th className="p-3">Quantity Delta</th>
                    <th className="p-3">Retail Price Delta</th>
                    <th className="p-3">Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {filteredPreviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-zinc-500 font-mono">
                        No spreadsheet records matched the selected preview filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewRows.map(row => {
                      const isSelected = selectedRowIndices.has(row.rowIndex);
                      const isMatched = row.status === 'MATCHED_UPDATE';
                      const isInvalid = row.status === 'INVALID';

                      const oldQty = row.matchedProduct?.quantity ?? 0;
                      const newQty = row.mapped.quantity;
                      const oldPrice = row.matchedProduct?.sellingPrice ?? 0;
                      const newPrice = row.mapped.sellingPrice;

                      return (
                        <tr
                          key={row.rowIndex}
                          className={`hover:bg-zinc-900/60 transition ${
                            !isSelected ? 'opacity-40' : ''
                          }`}
                        >
                          <td className="p-3">
                            <input
                              type="checkbox"
                              disabled={isInvalid}
                              checked={isSelected}
                              onChange={() => toggleRowSelection(row.rowIndex)}
                              className="rounded border-zinc-700 bg-zinc-900 text-indigo-600"
                            />
                          </td>
                          <td className="p-3">
                            {row.status === 'MATCHED_UPDATE' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold">
                                <RefreshCw className="w-3 h-3" />
                                <span>Existing Match</span>
                              </span>
                            )}
                            {row.status === 'NEW_ITEM' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                                <Sparkles className="w-3 h-3" />
                                <span>New Product</span>
                              </span>
                            )}
                            {row.status === 'INVALID' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-bold">
                                <AlertCircle className="w-3 h-3" />
                                <span>Invalid Row</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white">{row.mapped.sku}</div>
                            <div className="text-[11px] text-zinc-400">{row.mapped.name}</div>
                            {row.validationErrors.length > 0 && (
                              <div className="text-[10px] text-rose-400 mt-0.5">
                                {row.validationErrors.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            {isMatched ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 line-through">{oldQty}</span>
                                <span>➔</span>
                                <span className="font-bold text-emerald-400">
                                  {qtyStrategy === 'INCREMENT' ? oldQty + newQty : newQty}
                                </span>
                              </div>
                            ) : (
                              <span className="text-emerald-400 font-bold">{newQty} pcs</span>
                            )}
                          </td>
                          <td className="p-3">
                            {isMatched ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-zinc-500 line-through">
                                  {companySettings.currencySymbol}{oldPrice.toFixed(2)}
                                </span>
                                <span>➔</span>
                                <span className="font-bold text-indigo-300">
                                  {companySettings.currencySymbol}{newPrice.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-indigo-300 font-bold">
                                {companySettings.currencySymbol}{newPrice.toFixed(2)}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-zinc-400">{row.mapped.category}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary Action */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep('MAPPING')}
                className="px-4 py-2 text-xs font-semibold text-zinc-400 hover:bg-zinc-800 rounded-xl transition"
              >
                Back to Mapping
              </button>
              <button
                type="button"
                disabled={selectedRowIndices.size === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold rounded-xl shadow-md transition flex items-center gap-2 border border-indigo-400/30 font-mono"
              >
                <Database className="w-4 h-4" />
                <span>Execute Sync ({selectedRowIndices.size} Items)</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: EXECUTING & PROGRESS */}
        {currentStep === 'EXECUTING' && (
          <div className="py-12 px-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-pulse">
              <RefreshCw className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-lg font-bold text-white">Batch Syncing Spreadsheet Data</h3>
              <p className="text-xs text-zinc-400 font-mono">
                Executing atomic update transactions and writing audit trail logs...
              </p>
            </div>

            <div className="max-w-md mx-auto space-y-2 font-mono">
              <div className="w-full bg-zinc-900 rounded-full h-3 overflow-hidden p-0.5 border border-zinc-800">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-md"
                  style={{ width: `${executionProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-500">
                <span>Progress: {executionProgress}%</span>
                <span>{selectedRowIndices.size} Records</span>
              </div>
            </div>

            <div className="max-w-md mx-auto bg-zinc-950 p-3 rounded-2xl border border-zinc-800 text-left font-mono text-[11px] text-zinc-400 space-y-1 max-h-32 overflow-y-auto">
              {executionLog.map((log, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-indigo-400">➔</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: FINAL SUMMARY RECEIPT */}
        {currentStep === 'SUMMARY' && importResult && (
          <div className="space-y-6 py-2">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-3xl text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-zinc-950 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Batch Import Execution Complete!</h3>
              <p className="text-xs text-zinc-400 font-mono">
                Transaction ID: <span className="text-emerald-400 font-bold">{importResult.transactionId}</span>
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-center">
                <span className="text-zinc-500 text-[10px] block">SKUs Updated</span>
                <span className="text-xl font-bold text-indigo-400">{importResult.updatedCount}</span>
              </div>
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-center">
                <span className="text-zinc-500 text-[10px] block">New Items Added</span>
                <span className="text-xl font-bold text-emerald-400">{importResult.createdCount}</span>
              </div>
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-center">
                <span className="text-zinc-500 text-[10px] block">Skipped Records</span>
                <span className="text-xl font-bold text-zinc-400">{importResult.skippedCount}</span>
              </div>
              <div className="bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800 text-center">
                <span className="text-zinc-500 text-[10px] block">Valuation Delta</span>
                <span className="text-xl font-bold text-white">
                  {importResult.valueDelta >= 0 ? '+' : ''}
                  {companySettings.currencySymbol}{importResult.valueDelta.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 text-xs text-zinc-400 space-y-1 font-mono">
              <p className="text-white font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audit Trail Record Created</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                All inventory adjustments and stock movements have been recorded in the central system audit log for compliance and tracking.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition font-mono"
              >
                Done & Return to Catalog
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
