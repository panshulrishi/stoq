'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Supplier,
  Customer,
  PurchaseOrder,
  Sale,
  AuditLog,
  ScanHistoryItem,
  CompanySettings,
  UserProfile,
  SystemNotification,
  MovementType,
  StockStatus,
  POStatus,
  ToastNotification,
  ToastType,
  AppErrorLog,
} from './types';
import {
  INITIAL_COMPANY_SETTINGS,
  INITIAL_USER_PROFILE,
  INITIAL_SUPPLIERS,
  INITIAL_CUSTOMERS,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_SALES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from './mock-data';

interface InventoryContextType {
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  purchaseOrders: PurchaseOrder[];
  sales: Sale[];
  auditLogs: AuditLog[];
  scanHistory: ScanHistoryItem[];
  notifications: SystemNotification[];
  companySettings: CompanySettings;
  userProfile: UserProfile;
  isAuthenticated: boolean;
  currentView: string;
  searchQuery: string;
  selectedCategory: string;

  setCurrentView: (view: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockStatus'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  stockMovement: (productId: string, type: MovementType, quantityChange: number, reason: string, refId?: string) => void;
  recordScan: (barcode: string, actionTaken?: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT' | 'NEW_PRODUCT') => ScanHistoryItem;

  createPurchaseOrder: (po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'issueDate'>) => void;
  updatePOStatus: (id: string, status: POStatus) => void;

  recordSale: (sale: Omit<Sale, 'id' | 'invoiceNumber' | 'saleDate' | 'subtotal' | 'tax' | 'totalAmount' | 'profit'>) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'totalOrders'>) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastOrderDate'>) => void;

  updateCompanySettings: (settings: Partial<CompanySettings>) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;

  loginDemoUser: () => void;
  logout: () => void;

  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  bulkImportProducts: (newProds: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockStatus'>[]) => void;
  batchUpsertProducts: (
    items: Partial<Product>[],
    options: {
      mode: 'UPDATE_ONLY' | 'CREATE_ONLY' | 'UPSERT';
      qtyStrategy: 'OVERWRITE' | 'INCREMENT' | 'SKIP';
      priceStrategy: 'OVERWRITE' | 'SELL_ONLY' | 'SKIP';
      sanitizeInput?: boolean;
    }
  ) => {
    updatedCount: number;
    createdCount: number;
    skippedCount: number;
    valueDelta: number;
    transactionId: string;
  };
  resetToDefaults: () => void;

  toasts: ToastNotification[];
  errorLogs: AppErrorLog[];
  logError: (error: Error | string, source?: string, severity?: 'ERROR' | 'WARNING' | 'CRITICAL') => void;
  addToast: (toast: { title: string; message: string; type?: ToastType; duration?: number; details?: string }) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  clearErrorLogs: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'inventory_ai_app_state_v1';

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(INITIAL_PURCHASE_ORDERS);
  const [sales, setSales] = useState<Sale[]>(INITIAL_SALES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>(INITIAL_NOTIFICATIONS);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(INITIAL_COMPANY_SETTINGS);
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('barcode-scanner');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Runtime Toast & Error Logging State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [errorLogs, setErrorLogs] = useState<AppErrorLog[]>([]);

  // Central Error Logging Utility
  const logError = React.useCallback(
    (error: Error | string, source?: string, severity: 'ERROR' | 'WARNING' | 'CRITICAL' = 'ERROR') => {
      const errorMessage = typeof error === 'string' ? error : error.message || 'An unexpected runtime error occurred';
      const stack = typeof error === 'object' && error.stack ? error.stack : undefined;

      const newErrorLog: AppErrorLog = {
        id: `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toLocaleTimeString(),
        message: errorMessage,
        source: source || 'Application Context',
        severity,
        stack,
      };

      setErrorLogs(prev => [newErrorLog, ...prev.slice(0, 99)]);
      console.error(`[System Error - ${source || 'Global'}]:`, error);

      const toastTitle =
        severity === 'CRITICAL'
          ? 'Critical System Failure'
          : severity === 'WARNING'
          ? 'System Warning'
          : 'System Exception';

      const newToast: ToastNotification = {
        id: `toast_err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: toastTitle,
        message: errorMessage,
        type: severity === 'WARNING' ? 'warning' : 'error',
        timestamp: 'Just now',
        duration: severity === 'CRITICAL' ? 10000 : 6000,
        details: stack || (source ? `Source Component: ${source}` : undefined),
      };

      setToasts(prev => [newToast, ...prev]);

      const newNotif: SystemNotification = {
        id: `notif_err_${Date.now()}`,
        title: `[Runtime Failure] ${source ? `${source}: ` : ''}${errorMessage.slice(0, 40)}`,
        message: errorMessage,
        timestamp: 'Just now',
        type: 'SYSTEM',
        read: false,
      };
      setNotifications(prev => [newNotif, ...prev]);
    },
    []
  );

  const addToast = React.useCallback(
    (toast: { title: string; message: string; type?: ToastType; duration?: number; details?: string }) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastNotification = {
        id,
        title: toast.title,
        message: toast.message,
        type: toast.type || 'info',
        timestamp: 'Just now',
        duration: toast.duration || 4500,
        details: toast.details,
      };
      setToasts(prev => [newToast, ...prev]);
      return id;
    },
    []
  );

  const dismissToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const clearToasts = React.useCallback(() => {
    setToasts([]);
  }, []);

  const clearErrorLogs = React.useCallback(() => {
    setErrorLogs([]);
  }, []);

  // Window error & unhandled promise rejection listeners
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      logError(
        event.error || event.message,
        event.filename ? `${event.filename.split('/').pop()}:${event.lineno}` : 'Uncaught Exception',
        'ERROR'
      );
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      logError(
        reason instanceof Error ? reason : String(reason || 'Unhandled Promise Rejection'),
        'Async Promise Rejection',
        'ERROR'
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [logError]);

  // Load state from localStorage on client mount to prevent SSR hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.products) setProducts(parsed.products);
          if (parsed.suppliers) setSuppliers(parsed.suppliers);
          if (parsed.customers) setCustomers(parsed.customers);
          if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
          if (parsed.sales) setSales(parsed.sales);
          if (parsed.auditLogs) {
            setAuditLogs(
              parsed.auditLogs.map((log: AuditLog) => ({
                ...log,
                performedBy: (!log.performedBy || log.performedBy.toLowerCase().includes('pavan') || log.performedBy.toLowerCase().includes('alex')) ? 'Panshul' : log.performedBy,
              }))
            );
          }
          if (parsed.scanHistory) setScanHistory(parsed.scanHistory);
          if (parsed.notifications) setNotifications(parsed.notifications);
          if (parsed.companySettings) {
            setCompanySettings({
              ...parsed.companySettings,
              companyName: (!parsed.companySettings.companyName || parsed.companySettings.companyName.toLowerCase().includes('stockpulse')) ? 'Stoq.' : parsed.companySettings.companyName,
              themeMode: 'dark',
            });
            if (typeof document !== 'undefined') {
              document.documentElement.classList.add('dark');
            }
          } else {
            if (typeof document !== 'undefined') document.documentElement.classList.add('dark');
          }
          if (parsed.userProfile) {
            const isOldRealPhoto =
              !parsed.userProfile.avatarUrl ||
              parsed.userProfile.avatarUrl.includes('images.unsplash.com') ||
              parsed.userProfile.avatarUrl.includes('picsum.photos');
            setUserProfile({
              ...parsed.userProfile,
              name: 'Panshul',
              companyName: 'Stoq.',
              email: (!parsed.userProfile.email || parsed.userProfile.email.includes('stockpulse') || parsed.userProfile.email.includes('apex')) ? 'panshul@stoq.io' : parsed.userProfile.email,
              avatarUrl: isOldRealPhoto ? '/avatars/panshul.svg' : parsed.userProfile.avatarUrl,
            });
          }
          if (typeof parsed.isAuthenticated === 'boolean') setIsAuthenticated(parsed.isAuthenticated);
        }
      } catch (e) {
        console.error('Failed to load state from localStorage:', e);
      } finally {
        setIsLoaded(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Enforce dark theme class on html root element permanently
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Save to localStorage on state change (only after initial client load)
  useEffect(() => {
    if (!isLoaded) return;
    try {
      const stateToSave = {
        products,
        suppliers,
        customers,
        purchaseOrders,
        sales,
        auditLogs,
        scanHistory,
        notifications,
        companySettings,
        userProfile,
        isAuthenticated,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  }, [
    isLoaded,
    products,
    suppliers,
    customers,
    purchaseOrders,
    sales,
    auditLogs,
    scanHistory,
    notifications,
    companySettings,
    userProfile,
    isAuthenticated,
  ]);

  // Helper to compute stock status based on quantity
  const calculateStockStatus = (qty: number, minLevel: number, maxLevel: number, expDate?: string): StockStatus => {
    if (qty <= 0) return 'OUT_OF_STOCK';
    if (expDate) {
      const exp = new Date(expDate);
      const now = new Date();
      if (exp < now) return 'EXPIRED';
    }
    if (qty <= minLevel) return 'LOW_STOCK';
    if (qty >= maxLevel && maxLevel > 0) return 'OVERSTOCKED';
    return 'IN_STOCK';
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockStatus'>): Product => {
    const id = `prod_${Date.now()}`;
    const now = new Date().toISOString().split('T')[0];
    const stockStatus = calculateStockStatus(productData.quantity, productData.minReorderLevel, productData.maxStockLevel, productData.expiryDate);

    const newProduct: Product = {
      ...productData,
      id,
      stockStatus,
      createdAt: now,
      updatedAt: now,
    };

    setProducts(prev => [newProduct, ...prev]);

    // Add Audit Log
    const log: AuditLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      productId: id,
      productName: newProduct.name,
      type: 'STOCK_IN',
      quantityChange: newProduct.quantity,
      previousQuantity: 0,
      newQuantity: newProduct.quantity,
      performedBy: userProfile.name,
      reason: 'Initial Product Creation',
    };
    setAuditLogs(prev => [log, ...prev]);

    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: new Date().toISOString().split('T')[0] };
        updated.stockStatus = calculateStockStatus(
          updated.quantity,
          updated.minReorderLevel,
          updated.maxStockLevel,
          updated.expiryDate
        );
        return updated;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (prod) {
      const log: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        productId: id,
        productName: prod.name,
        type: 'MANUAL_ADJUSTMENT',
        quantityChange: -prod.quantity,
        previousQuantity: prod.quantity,
        newQuantity: 0,
        performedBy: userProfile.name,
        reason: 'Product deleted from inventory',
      };
      setAuditLogs(prev => [log, ...prev]);
    }
  };

  const stockMovement = (productId: string, type: MovementType, quantityChange: number, reason: string, refId?: string) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id !== productId) return p;
        const previousQuantity = p.quantity;
        const newQuantity = Math.max(0, previousQuantity + quantityChange);
        const updatedStatus = calculateStockStatus(newQuantity, p.minReorderLevel, p.maxStockLevel, p.expiryDate);

        // Record Audit Log
        const log: AuditLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          productId,
          productName: p.name,
          type,
          quantityChange,
          previousQuantity,
          newQuantity,
          performedBy: userProfile.name,
          reason,
          referenceId: refId,
        };
        setAuditLogs(logs => [log, ...logs]);

        // Check for notifications
        if (newQuantity <= p.minReorderLevel && newQuantity > 0) {
          const newNotif: SystemNotification = {
            id: `notif_${Date.now()}`,
            title: 'Low Stock Alert',
            message: `${p.name} reached ${newQuantity} ${p.unit} (Reorder level: ${p.minReorderLevel})`,
            timestamp: 'Just now',
            type: 'LOW_STOCK',
            read: false,
          };
          setNotifications(n => [newNotif, ...n]);
        } else if (newQuantity === 0) {
          const newNotif: SystemNotification = {
            id: `notif_${Date.now()}`,
            title: 'Out of Stock Alert',
            message: `${p.name} is now out of stock!`,
            timestamp: 'Just now',
            type: 'OUT_OF_STOCK',
            read: false,
          };
          setNotifications(n => [newNotif, ...n]);
        }

        return {
          ...p,
          quantity: newQuantity,
          stockStatus: updatedStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        };
      })
    );
  };

  const recordScan = (barcode: string, actionTaken: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT' | 'NEW_PRODUCT' = 'LOOKUP'): ScanHistoryItem => {
    const matched = products.find(p => p.barcode === barcode || p.sku === barcode);
    const item: ScanHistoryItem = {
      id: `scan_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      barcode,
      productName: matched ? matched.name : undefined,
      productId: matched ? matched.id : undefined,
      actionTaken,
      status: matched ? 'SUCCESS' : 'NOT_FOUND',
    };
    setScanHistory(prev => [item, ...prev]);

    if (matched && actionTaken === 'STOCK_IN') {
      stockMovement(matched.id, 'STOCK_IN', 1, 'Scanned Stock-In via Barcode Scanner');
    } else if (matched && actionTaken === 'STOCK_OUT') {
      stockMovement(matched.id, 'STOCK_OUT', -1, 'Scanned Stock-Out via Barcode Scanner');
    }

    return item;
  };

  const createPurchaseOrder = (poData: Omit<PurchaseOrder, 'id' | 'poNumber' | 'issueDate'>) => {
    const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newPO: PurchaseOrder = {
      ...poData,
      id: `po_${Date.now()}`,
      poNumber,
      issueDate: new Date().toISOString().split('T')[0],
    };
    setPurchaseOrders(prev => [newPO, ...prev]);

    // Update supplier total orders
    setSuppliers(prev =>
      prev.map(s => (s.id === poData.supplierId ? { ...s, totalOrders: s.totalOrders + 1 } : s))
    );
  };

  const updatePOStatus = (id: string, status: POStatus) => {
    const po = purchaseOrders.find(p => p.id === id);
    if (!po) return;

    setPurchaseOrders(prev =>
      prev.map(p => (p.id === id ? { ...p, status, receivedDate: status === 'RECEIVED' ? new Date().toISOString().split('T')[0] : p.receivedDate } : p))
    );

    // If marked as RECEIVED, automatically Stock In the items!
    if (status === 'RECEIVED' && po.status !== 'RECEIVED') {
      po.items.forEach(item => {
        stockMovement(item.productId, 'STOCK_IN', item.quantity, `Received PO ${po.poNumber}`, po.id);
      });
    }
  };

  const recordSale = (saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'saleDate' | 'subtotal' | 'tax' | 'totalAmount' | 'profit'>) => {
    const subtotal = saleData.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = (subtotal * companySettings.defaultTaxRate) / 100;
    const totalAmount = subtotal + tax;

    // Calculate profit
    let totalCost = 0;
    saleData.items.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        totalCost += prod.purchasePrice * item.quantity;
      }
    });
    const profit = Math.max(0, subtotal - totalCost);

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newSale: Sale = {
      ...saleData,
      id: `sale_${Date.now()}`,
      invoiceNumber,
      subtotal,
      tax,
      totalAmount,
      profit,
      saleDate: new Date().toISOString().split('T')[0],
    };

    setSales(prev => [newSale, ...prev]);

    // Stock Out items
    saleData.items.forEach(item => {
      stockMovement(item.productId, 'STOCK_OUT', -item.quantity, `Sale Invoice ${invoiceNumber}`, newSale.id);
    });

    // Update customer order totals
    if (saleData.customerId) {
      setCustomers(prev =>
        prev.map(c =>
          c.id === saleData.customerId
            ? {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + totalAmount,
                lastOrderDate: new Date().toISOString().split('T')[0],
              }
            : c
        )
      );
    }
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id' | 'totalOrders'>) => {
    const newSup: Supplier = {
      ...supplierData,
      id: `sup_${Date.now()}`,
      totalOrders: 0,
    };
    setSuppliers(prev => [newSup, ...prev]);
  };

  const addCustomer = (customerData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpent' | 'lastOrderDate'>) => {
    const newCust: Customer = {
      ...customerData,
      id: `cust_${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: 'Never',
    };
    setCustomers(prev => [newCust, ...prev]);
  };

  const updateCompanySettings = (settings: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...settings, themeMode: 'dark' }));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUserProfile(prev => ({ ...prev, ...profile }));
  };

  const loginDemoUser = () => {
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const bulkImportProducts = (newProds: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'stockStatus'>[]) => {
    const formatted: Product[] = newProds.map((item, index) => {
      const id = `prod_imp_${Date.now()}_${index}`;
      const now = new Date().toISOString().split('T')[0];
      const stockStatus = calculateStockStatus(item.quantity, item.minReorderLevel, item.maxStockLevel, item.expiryDate);
      return {
        ...item,
        id,
        stockStatus,
        createdAt: now,
        updatedAt: now,
      };
    });
    setProducts(prev => [...formatted, ...prev]);
  };

  const batchUpsertProducts = (
    items: Partial<Product>[],
    options: {
      mode: 'UPDATE_ONLY' | 'CREATE_ONLY' | 'UPSERT';
      qtyStrategy: 'OVERWRITE' | 'INCREMENT' | 'SKIP';
      priceStrategy: 'OVERWRITE' | 'SELL_ONLY' | 'SKIP';
      sanitizeInput?: boolean;
    }
  ) => {
    let updatedCount = 0;
    let createdCount = 0;
    let skippedCount = 0;
    let valueDelta = 0;
    const now = new Date().toISOString().split('T')[0];
    const txId = `TX_IMP_${Date.now().toString(36).toUpperCase()}`;

    const newLogs: AuditLog[] = [];

    setProducts(prevProducts => {
      const updatedList = [...prevProducts];

      items.forEach((item, index) => {
        const cleanSku = (item.sku || '').trim();
        const cleanBarcode = (item.barcode || '').trim();

        // Match existing product by SKU or Barcode
        const existingIdx = updatedList.findIndex(
          p => (cleanSku && p.sku.toLowerCase() === cleanSku.toLowerCase()) ||
               (cleanBarcode && p.barcode === cleanBarcode)
        );

        if (existingIdx !== -1) {
          // Found existing item!
          if (options.mode === 'CREATE_ONLY') {
            skippedCount++;
            return;
          }

          const existing = updatedList[existingIdx];
          const oldQty = existing.quantity;
          const oldSelling = existing.sellingPrice;

          let newQty = oldQty;
          if (options.qtyStrategy === 'OVERWRITE' && typeof item.quantity === 'number') {
            newQty = Math.max(0, item.quantity);
          } else if (options.qtyStrategy === 'INCREMENT' && typeof item.quantity === 'number') {
            newQty = Math.max(0, oldQty + item.quantity);
          }

          let newPurchase = existing.purchasePrice;
          let newSelling = existing.sellingPrice;
          if (options.priceStrategy === 'OVERWRITE') {
            if (typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice)) newPurchase = item.purchasePrice;
            if (typeof item.sellingPrice === 'number' && !isNaN(item.sellingPrice)) newSelling = item.sellingPrice;
          } else if (options.priceStrategy === 'SELL_ONLY') {
            if (typeof item.sellingPrice === 'number' && !isNaN(item.sellingPrice)) newSelling = item.sellingPrice;
          }

          const qtyChange = newQty - oldQty;
          valueDelta += (newQty * newSelling) - (oldQty * oldSelling);

          const updatedProd: Product = {
            ...existing,
            name: (item.name && item.name.trim()) ? item.name.trim() : existing.name,
            category: (item.category && item.category.trim()) ? item.category.trim() : existing.category,
            quantity: newQty,
            purchasePrice: newPurchase,
            sellingPrice: newSelling,
            minReorderLevel: typeof item.minReorderLevel === 'number' && !isNaN(item.minReorderLevel) ? item.minReorderLevel : existing.minReorderLevel,
            maxStockLevel: typeof item.maxStockLevel === 'number' && !isNaN(item.maxStockLevel) ? item.maxStockLevel : existing.maxStockLevel,
            location: (item.location && item.location.trim()) ? item.location.trim() : existing.location,
            supplierId: item.supplierId || existing.supplierId,
            supplierName: item.supplierName || existing.supplierName,
            updatedAt: now,
            stockStatus: calculateStockStatus(
              newQty,
              typeof item.minReorderLevel === 'number' && !isNaN(item.minReorderLevel) ? item.minReorderLevel : existing.minReorderLevel,
              existing.maxStockLevel,
              existing.expiryDate
            ),
          };

          updatedList[existingIdx] = updatedProd;
          updatedCount++;

          newLogs.push({
            id: `log_imp_${Date.now()}_${index}`,
            timestamp: new Date().toLocaleString(),
            productId: existing.id,
            productName: existing.name,
            type: qtyChange >= 0 ? 'STOCK_IN' : 'STOCK_OUT',
            quantityChange: qtyChange,
            previousQuantity: oldQty,
            newQuantity: newQty,
            performedBy: userProfile.name || 'System Admin',
            reason: `Batch Spreadsheet Import Update [TX: ${txId}]`,
            referenceId: txId,
          });
        } else {
          // No match found
          if (options.mode === 'UPDATE_ONLY') {
            skippedCount++;
            return;
          }

          const newId = `prod_imp_${Date.now()}_${index}`;
          const initialQty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? Math.max(0, item.quantity) : 0;
          const selling = typeof item.sellingPrice === 'number' && !isNaN(item.sellingPrice) ? item.sellingPrice : 0;
          const purchase = typeof item.purchasePrice === 'number' && !isNaN(item.purchasePrice) ? item.purchasePrice : 0;
          const minReorder = typeof item.minReorderLevel === 'number' && !isNaN(item.minReorderLevel) ? item.minReorderLevel : 10;

          const newProd: Product = {
            id: newId,
            name: (item.name && item.name.trim()) ? item.name.trim() : `Imported Item (${cleanSku || 'No SKU'})`,
            sku: cleanSku || `SKU-IMP-${Date.now().toString(36).toUpperCase()}-${index}`,
            barcode: cleanBarcode || `${Math.floor(100000000000 + Math.random() * 900000000000)}`,
            barcodeFormat: 'EAN13',
            category: (item.category && item.category.trim()) ? item.category.trim() : 'General',
            quantity: initialQty,
            purchasePrice: purchase,
            sellingPrice: selling,
            minReorderLevel: minReorder,
            maxStockLevel: 100,
            location: (item.location && item.location.trim()) ? item.location.trim() : 'Warehouse Main',
            supplierId: item.supplierId || 'sup_1',
            supplierName: item.supplierName || 'Global Direct Supply',
            unit: item.unit || 'pcs',
            description: item.description || 'Batch imported inventory item',
            imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80',
            createdAt: now,
            updatedAt: now,
            stockStatus: calculateStockStatus(initialQty, minReorder, 100),
          };

          updatedList.unshift(newProd);
          createdCount++;
          valueDelta += initialQty * selling;

          newLogs.push({
            id: `log_imp_new_${Date.now()}_${index}`,
            timestamp: new Date().toLocaleString(),
            productId: newId,
            productName: newProd.name,
            type: 'STOCK_IN',
            quantityChange: initialQty,
            previousQuantity: 0,
            newQuantity: initialQty,
            performedBy: userProfile.name || 'System Admin',
            reason: `Batch Spreadsheet Import Creation [TX: ${txId}]`,
            referenceId: txId,
          });
        }
      });

      return updatedList;
    });

    if (newLogs.length > 0) {
      setAuditLogs(prev => [...newLogs, ...prev]);
    }

    const batchNotif: SystemNotification = {
      id: `notif_imp_${Date.now()}`,
      title: 'Batch Inventory Sync Complete',
      message: `Spreadsheet sync complete. Updated: ${updatedCount}, Created: ${createdCount}, Skipped: ${skippedCount}.`,
      timestamp: 'Just now',
      type: 'SYSTEM',
      read: false,
    };
    setNotifications(prev => [batchNotif, ...prev]);

    return {
      updatedCount,
      createdCount,
      skippedCount,
      valueDelta,
      transactionId: txId,
    };
  };

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setPurchaseOrders(INITIAL_PURCHASE_ORDERS);
    setSales(INITIAL_SALES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCompanySettings(INITIAL_COMPANY_SETTINGS);
    setUserProfile(INITIAL_USER_PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        suppliers,
        customers,
        purchaseOrders,
        sales,
        auditLogs,
        scanHistory,
        notifications,
        companySettings,
        userProfile,
        isAuthenticated,
        currentView,
        searchQuery,
        selectedCategory,

        setCurrentView,
        setSearchQuery,
        setSelectedCategory,

        addProduct,
        updateProduct,
        deleteProduct,
        stockMovement,
        recordScan,
        createPurchaseOrder,
        updatePOStatus,
        recordSale,
        addSupplier,
        addCustomer,
        updateCompanySettings,
        updateUserProfile,
        loginDemoUser,
        logout,
        markNotificationRead,
        clearAllNotifications,
        bulkImportProducts,
        batchUpsertProducts,
        resetToDefaults,

        toasts,
        errorLogs,
        logError,
        addToast,
        dismissToast,
        clearToasts,
        clearErrorLogs,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
}
