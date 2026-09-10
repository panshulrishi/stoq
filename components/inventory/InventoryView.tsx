'use client';

import React, { useState } from 'react';
import { useInventory } from '@/lib/inventory-context';
import { Product, StockStatus, BarcodeFormat } from '@/lib/types';
import { StatusBadge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { GuidedImportModal } from '@/components/inventory/GuidedImportModal';
import { generateRandomBarcode, exportToCSV } from '@/lib/barcode-utils';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit2,
  Trash2,
  QrCode,
  ArrowUpDown,
  PlusCircle,
  MinusCircle,
  FileSpreadsheet,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import Papa from 'papaparse';

export function InventoryView() {
  const {
    products,
    suppliers,
    companySettings,
    addProduct,
    updateProduct,
    deleteProduct,
    stockMovement,
    bulkImportProducts,
    setCurrentView,
  } = useInventory();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'sellingPrice' | 'stockStatus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

  // Selected product state
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState<{
    name: string;
    sku: string;
    barcode: string;
    barcodeFormat: BarcodeFormat;
    category: string;
    supplierId: string;
    supplierName: string;
    purchasePrice: number;
    sellingPrice: number;
    quantity: number;
    minReorderLevel: number;
    maxStockLevel: number;
    expiryDate: string;
    imageUrl: string;
    location: string;
    unit: string;
    description: string;
  }>({
    name: '',
    sku: '',
    barcode: '',
    barcodeFormat: 'EAN13',
    category: 'Electronics',
    supplierId: suppliers[0]?.id || '',
    supplierName: suppliers[0]?.name || '',
    purchasePrice: 10.0,
    sellingPrice: 19.99,
    quantity: 20,
    minReorderLevel: 5,
    maxStockLevel: 100,
    expiryDate: '',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop&q=80',
    location: 'Aisle 1',
    unit: 'pcs',
    description: '',
  });

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  // Filtering logic
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || p.stockStatus === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting logic
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
    else if (sortBy === 'quantity') comparison = a.quantity - b.quantity;
    else if (sortBy === 'sellingPrice') comparison = a.sellingPrice - b.sellingPrice;
    else if (sortBy === 'stockStatus') comparison = a.stockStatus.localeCompare(b.stockStatus);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const openAddModal = () => {
    const autoBarcode = generateRandomBarcode('EAN13');
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: autoBarcode,
      barcodeFormat: 'EAN13',
      category: 'Electronics',
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      purchasePrice: 15.0,
      sellingPrice: 29.99,
      quantity: 25,
      minReorderLevel: 5,
      maxStockLevel: 100,
      expiryDate: '',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
      location: 'Aisle 1',
      unit: 'pcs',
      description: '',
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setActiveProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      barcode: prod.barcode,
      barcodeFormat: prod.barcodeFormat,
      category: prod.category,
      supplierId: prod.supplierId,
      supplierName: prod.supplierName,
      purchasePrice: prod.purchasePrice,
      sellingPrice: prod.sellingPrice,
      quantity: prod.quantity,
      minReorderLevel: prod.minReorderLevel,
      maxStockLevel: prod.maxStockLevel,
      expiryDate: prod.expiryDate || '',
      imageUrl: prod.imageUrl,
      location: prod.location || '',
      unit: prod.unit,
      description: prod.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === formData.supplierId);
    addProduct({
      ...formData,
      supplierName: sup ? sup.name : formData.supplierName,
    });
    setIsAddModalOpen(false);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    const sup = suppliers.find(s => s.id === formData.supplierId);
    updateProduct(activeProduct.id, {
      ...formData,
      supplierName: sup ? sup.name : formData.supplierName,
    });
    setIsEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (activeProduct) {
      deleteProduct(activeProduct.id);
      setIsDeleteModalOpen(false);
      setActiveProduct(null);
    }
  };

  const handleCSVImportFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row: any) => ({
          name: row.Name || row.name || 'Imported Product',
          sku: row.SKU || row.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: row.Barcode || row.barcode || generateRandomBarcode('EAN13'),
          barcodeFormat: 'EAN13' as BarcodeFormat,
          category: row.Category || row.category || 'General',
          supplierId: suppliers[0]?.id || '',
          supplierName: row.Supplier || row.supplier || suppliers[0]?.name || 'Global Imports',
          purchasePrice: parseFloat(row.PurchasePrice || row.purchasePrice || '10'),
          sellingPrice: parseFloat(row.SellingPrice || row.sellingPrice || '20'),
          quantity: parseInt(row.Quantity || row.quantity || '10', 10),
          minReorderLevel: parseInt(row.MinReorderLevel || row.minReorderLevel || '5', 10),
          maxStockLevel: parseInt(row.MaxStockLevel || row.maxStockLevel || '100', 10),
          expiryDate: row.ExpiryDate || row.expiryDate || '',
          imageUrl: row.Image || row.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
          location: row.Location || row.location || 'Warehouse A',
          unit: row.Unit || row.unit || 'pcs',
          description: row.Description || row.description || '',
        }));

        bulkImportProducts(parsed);
        setIsBulkImportOpen(false);
      },
    });
  };

  const handleExportCSV = () => {
    exportToCSV('Stoq_Product_Catalog.csv', sortedProducts);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls Bar (Mobbin Canvas-Soft Card) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f3f3f3] dark:bg-[#141417] p-6 sm:p-8 rounded-[24px] border border-transparent dark:border-[#1f1f23] transition-colors">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#141414] dark:text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#141414] dark:text-white" />
            <span>Inventory Catalog Matrix.</span>
            <span className="text-xs font-semibold px-3 py-1 bg-white dark:bg-[#18181b] text-[#141414] dark:text-white border border-[#e0e0e0] dark:border-[#27272a] rounded-full">
              {products.length} Products
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-[#707070] dark:text-[#a1a1aa] font-light mt-1.5">
            Real-time optical SKU catalog, unit economics, reorder thresholds, and warehouse allocation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="px-4 py-2 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] text-[#141414] dark:text-white text-xs font-semibold rounded-full border border-[#e0e0e0] dark:border-[#27272a] transition flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-[#707070] dark:text-[#a1a1aa]" />
            <span>Import CSV</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-white dark:bg-[#18181b] hover:bg-[#fafafa] dark:hover:bg-[#222225] text-[#141414] dark:text-white text-xs font-semibold rounded-full border border-[#e0e0e0] dark:border-[#27272a] transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#707070] dark:text-[#a1a1aa]" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="px-5 py-2 bg-[#141414] dark:bg-white hover:bg-[#262626] dark:hover:bg-[#e4e4e7] text-white dark:text-[#141414] text-xs font-semibold rounded-full transition flex items-center gap-1.5 active:scale-98"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[#111113] p-4 rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] transition-colors">
        {/* Search Input (Stadium Pill) */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#707070] dark:text-[#a1a1aa] absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SKU, name, barcode..."
            className="w-full pl-9 pr-4 py-2 bg-[#f0f0f0] dark:bg-[#18181b] border-none rounded-full text-xs text-[#141414] dark:text-white placeholder:text-[#adadad] dark:placeholder:text-[#71717a] focus:outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-[#f0f0f0] dark:bg-[#18181b] border-none text-[#141414] dark:text-white text-xs rounded-full outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="px-3.5 py-2 bg-[#f0f0f0] dark:bg-[#18181b] border-none text-[#141414] dark:text-white text-xs rounded-full outline-none focus:ring-2 focus:ring-[#141414] dark:focus:ring-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
            <option value="OVERSTOCKED">Overstocked</option>
          </select>

          {/* Sort By */}
          <button
            onClick={() => {
              setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
            }}
            className="px-3.5 py-2 bg-[#f0f0f0] dark:bg-[#18181b] text-[#141414] dark:text-white text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-[#e8e8e8] dark:hover:bg-[#27272a] transition"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#707070] dark:text-[#a1a1aa]" />
            <span className="capitalize">{sortBy} ({sortOrder})</span>
          </button>
        </div>
      </div>

      {/* Main Responsive Inventory Table (Mobbin Canvas Card) */}
      <div className="bg-white dark:bg-[#111113] rounded-[24px] border border-[#f0f0f0] dark:border-[#1f1f23] overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans">
            <thead>
              <tr className="bg-[#f3f3f3] dark:bg-[#18181b] border-b border-[#f0f0f0] dark:border-[#27272a] text-[11px] font-semibold text-[#707070] dark:text-[#a1a1aa] uppercase tracking-wider">
                <th className="p-4">Product Details</th>
                <th className="p-4">SKU / Barcode</th>
                <th className="p-4">Category</th>
                <th className="p-4">Cost / Price</th>
                <th className="p-4">Stock Qty</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Quick Stock Adjustment</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] dark:divide-[#1f1f23] text-xs">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#adadad] dark:text-[#71717a]">
                    No products matched your filter query.
                  </td>
                </tr>
              ) : (
                sortedProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-[#fbfbfb] dark:hover:bg-[#18181b]/60 transition">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-11 h-11 rounded-[30%] object-cover border border-[#e0e0e0] dark:border-[#27272a] bg-[#f8f8f8] dark:bg-[#161619] shrink-0"
                        />
                        <div>
                          <p
                            onClick={() => {
                              setActiveProduct(prod);
                              setIsDetailDrawerOpen(true);
                            }}
                            className="font-semibold text-[#141414] dark:text-white hover:text-[#0066ff] dark:hover:text-[#0066ff] cursor-pointer"
                          >
                            {prod.name}
                          </p>
                          <p className="text-[11px] text-[#707070] dark:text-[#a1a1aa]">{prod.location || 'No location set'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono text-slate-800 dark:text-slate-200">{prod.sku}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <QrCode className="w-3 h-3 text-slate-400" />
                        <span>{prod.barcode}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg text-[11px]">
                        {prod.category}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {companySettings.currencySymbol}{prod.sellingPrice.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cost: {companySettings.currencySymbol}{prod.purchasePrice.toFixed(2)}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {prod.quantity} <span className="font-normal text-slate-400 text-[11px]">{prod.unit}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Min: {prod.minReorderLevel}</div>
                    </td>

                    <td className="p-4">
                      <StatusBadge status={prod.stockStatus} />
                    </td>

                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button
                          onClick={() => stockMovement(prod.id, 'STOCK_OUT', -1, 'Manual Quick Stock Out')}
                          disabled={prod.quantity <= 0}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-red-600 disabled:opacity-30 transition"
                          title="Reduce stock by 1"
                        >
                          <MinusCircle className="w-4 h-4" />
                        </button>
                        <span className="font-bold text-xs px-2">{prod.quantity}</span>
                        <button
                          onClick={() => stockMovement(prod.id, 'STOCK_IN', 1, 'Manual Quick Stock In')}
                          className="p-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
                          title="Increase stock by 1"
                        >
                          <PlusCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActiveProduct(prod);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory Item"
        subtitle="Create product entry with automatic barcode assignment"
        maxWidth="2xl"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Ergonomic Office Chair"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Electronics, Apparel, Coffee..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">SKU *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Barcode Code *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.barcode}
                  onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, barcode: generateRandomBarcode(formData.barcodeFormat) })}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-xl"
                >
                  Gen
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Barcode Format</label>
              <select
                value={formData.barcodeFormat}
                onChange={e => setFormData({ ...formData, barcodeFormat: e.target.value as BarcodeFormat })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              >
                <option value="EAN13">EAN-13</option>
                <option value="UPC">UPC-A</option>
                <option value="CODE128">Code 128</option>
                <option value="QR">QR Code</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
              <select
                value={formData.supplierId}
                onChange={e => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              >
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purchase Price ({companySettings.currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.purchasePrice}
                onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selling Price ({companySettings.currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Initial Quantity</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Min Reorder Level</label>
              <input
                type="number"
                required
                value={formData.minReorderLevel}
                onChange={e => setFormData({ ...formData, minReorderLevel: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Warehouse Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
                placeholder="Aisle 2, Bin 4"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Image URL</label>
              <input
                type="text"
                value={formData.imageUrl}
                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md"
            >
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Inventory Item"
        subtitle={`Update settings for ${activeProduct?.name}`}
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Selling Price ({companySettings.currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
              <input
                type="number"
                required
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md"
            >
              Update Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Delete Product"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 rounded-xl text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>
              Are you sure you want to delete <span className="font-bold">{activeProduct?.name}</span>? This action is permanent and recorded in the audit log.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md"
            >
              Delete Item
            </button>
          </div>
        </div>
      </Modal>

      {/* Guided Spreadsheet Batch Import Modal */}
      <GuidedImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />

      {/* Product Detail Drawer Modal */}
      {activeProduct && isDetailDrawerOpen && (
        <Modal
          isOpen={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          title={activeProduct.name}
          subtitle={`SKU: ${activeProduct.sku}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex gap-4">
              <img src={activeProduct.imageUrl} alt={activeProduct.name} className="w-24 h-24 rounded-2xl object-cover border" />
              <div className="space-y-1">
                <StatusBadge status={activeProduct.stockStatus} />
                <p className="text-xs text-slate-500">Category: {activeProduct.category}</p>
                <p className="text-xs text-slate-500">Supplier: {activeProduct.supplierName}</p>
                <p className="text-xs text-slate-500">Location: {activeProduct.location}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block">Retail Price:</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {companySettings.currencySymbol}{activeProduct.sellingPrice.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Purchase Cost:</span>
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  {companySettings.currencySymbol}{activeProduct.purchasePrice.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsDetailDrawerOpen(false);
                setCurrentView('barcode-generator');
              }}
              className="w-full py-2.5 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Generate Barcode Labels</span>
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
