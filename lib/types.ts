export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRED' | 'OVERSTOCKED';

export type BarcodeFormat = 'CODE128' | 'EAN13' | 'UPC' | 'QR';

export interface Product {
  id: string;
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
  stockStatus: StockStatus;
  expiryDate?: string;
  imageUrl: string;
  location?: string;
  unit: string; // pcs, kg, box, pack, set
  createdAt: string;
  updatedAt: string;
  description?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  categories: string[];
  reliabilityRating: number; // 1-5
  leadTimeDays: number;
  totalOrders: number;
}

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  email: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export type POStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'PARTIAL' | 'CANCELLED';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: POStatus;
  issueDate: string;
  expectedDeliveryDate: string;
  receivedDate?: string;
  notes?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  totalAmount: number;
  profit: number;
  paymentStatus: PaymentStatus;
  paymentMethod: 'CREDIT_CARD' | 'CASH' | 'BANK_TRANSFER' | 'STRIPE';
  saleDate: string;
}

export type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'MANUAL_ADJUSTMENT' | 'DAMAGE' | 'RETURN';

export interface AuditLog {
  id: string;
  timestamp: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantityChange: number;
  previousQuantity: number;
  newQuantity: number;
  performedBy: string;
  reason: string;
  referenceId?: string; // PO or Sale ID
}

export interface ScanHistoryItem {
  id: string;
  timestamp: string;
  barcode: string;
  productName?: string;
  productId?: string;
  actionTaken: 'LOOKUP' | 'STOCK_IN' | 'STOCK_OUT' | 'NEW_PRODUCT';
  status: 'SUCCESS' | 'NOT_FOUND';
}

export interface UserRolePermission {
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  canAddProduct: boolean;
  canEditProduct: boolean;
  canDeleteProduct: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canCreatePO: boolean;
  canRecordSales: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'STAFF';
  companyName: string;
  avatarUrl: string;
}

export interface CompanySettings {
  companyName: string;
  logoUrl: string;
  taxNumber: string;
  defaultTaxRate: number; // percentage e.g. 8.5
  currencySymbol: string; // $, €, £, ₹
  currencyCode: string; // USD, EUR, GBP, INR
  address: string;
  phone: string;
  email: string;
  lowStockEmailAlerts: boolean;
  autoReorderSuggestions: boolean;
  themeMode: 'light' | 'dark' | 'system';
}

export interface AIInsight {
  id: string;
  type: 'WARNING' | 'OPPORTUNITY' | 'FORECAST' | 'RECOMMENDATION';
  title: string;
  description: string;
  impactScore: 'HIGH' | 'MEDIUM' | 'LOW';
  relatedProductId?: string;
  suggestedAction?: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING' | 'NEW_ORDER' | 'SYSTEM';
  read: boolean;
}

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: ToastType;
  timestamp: string;
  duration?: number;
  details?: string;
}

export interface AppErrorLog {
  id: string;
  timestamp: string;
  message: string;
  source?: string;
  severity: 'ERROR' | 'WARNING' | 'CRITICAL';
  stack?: string;
}
