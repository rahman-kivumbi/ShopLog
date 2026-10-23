export type BusinessType = 'shop' | 'kiosk' | 'machine' | 'other';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  currency: string;
  color: string;
  ownerId: string;
  isDefault?: boolean;
  trn?: string; // Dubai Tax Registration Number (optional)
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductCategory =
  | 'Phones'
  | 'Accessories'
  | 'Chargers'
  | 'Audio'
  | 'Computers'
  | 'Repairs & Parts'
  | 'Snacks & Drinks'
  | 'Other';

export type ProductCondition = 'New' | 'Used' | 'Refurbished';

export interface Product {
  id: string;
  businessId: string;
  ownerId: string;
  name: string;
  brand: string;
  model: string;
  category: ProductCategory | string;
  sizeOrStorage?: string; // e.g. "128GB", "256GB", "6.7 inch"
  color?: string;
  variant?: string;
  condition: ProductCondition;
  barcode?: string;
  purchasePrice: number; // Cost in UGX
  sellingPrice: number;  // Price in UGX
  supplierId?: string;
  lowStockThreshold: number;
  warrantyMonths: number;
  isSerialized: boolean; // Phones & serialized devices
  currentStock: number;
  photoUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type UnitStatus = 'in_stock' | 'sold' | 'returned' | 'damaged' | 'reserved';

export interface InventoryUnit {
  id: string;
  businessId: string;
  productId: string;
  ownerId: string;
  imei: string; // 15 digits Luhn validated
  imei2?: string; // Optional for dual-SIM
  serialNumber?: string;
  status: UnitStatus;
  purchasePrice: number;
  sellingPrice: number;
  supplierId?: string;
  saleId?: string;
  soldAt?: string;
  warrantyEndDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'in' | 'out' | 'adjustment';
export type MovementReason =
  | 'purchase'
  | 'customer_return'
  | 'opening_stock'
  | 'sale'
  | 'damaged'
  | 'lost'
  | 'supplier_return'
  | 'internal_use'
  | 'correction';

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  ownerId: string;
  type: MovementType;
  reason: MovementReason;
  quantity: number;
  costPerUnit: number;
  supplierId?: string;
  referenceId?: string; // saleId, orderId, or note
  imei?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  unitCost: number;
  unitPrice: number;
  quantity: number;
  discount: number;
  total: number;
  isSerialized: boolean;
  unitId?: string;
  imei?: string;
  imei2?: string;
  warrantyMonths?: number;
}

export type PaymentMethod = 'Cash' | 'Card' | 'Transfer' | 'Credit/Pay later' | 'Split';
export type PaymentStatus = 'paid' | 'partial' | 'pending';

export interface Sale {
  id: string;
  businessId: string;
  ownerId: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  costTotal: number;
  profit: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  warrantyEndDate?: string;
  date: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  ownerId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalSpent: number;
  outstandingBalance: number; // For credit/pay later
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  ownerId: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  totalPurchased: number;
  balanceOwed: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  isSerialized?: boolean;
  imeis?: string[]; // Entered when received
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  businessId: string;
  ownerId: string;
  supplierId: string;
  supplierName: string;
  orderNumber: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: PurchaseOrderStatus;
  notes?: string;
  date: string;
  receivedAt?: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Rent'
  | 'Salaries'
  | 'Utilities'
  | 'Transport'
  | 'Lunch and food'
  | 'Marketing'
  | 'Maintenance'
  | 'Supplies'
  | 'Inventory Purchase'
  | 'Other';

export interface Expense {
  id: string;
  businessId: string; // If 'shared', isShared is true
  ownerId: string;
  isShared: boolean;
  category: ExpenseCategory | string;
  amount: number;
  description: string;
  isPersonal: boolean;
  isRecurring: boolean;
  recurringFrequency?: 'monthly' | 'weekly' | 'yearly';
  receiptPhoto?: string;
  date: string;
  createdAt: string;
}

export type UserRole = 'owner' | 'cashier';

export interface AppSettings {
  pinHash?: string;
  pinEnabled: boolean;
  cashierPinHash?: string;
  activeRole: UserRole;
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopTrn: string;
  defaultWarrantyTerms: string;
}

export type SyncStatusType = 'offline' | 'syncing' | 'synced';
