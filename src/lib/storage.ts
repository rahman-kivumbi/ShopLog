import {
  Business,
  Product,
  InventoryUnit,
  StockMovement,
  Sale,
  Customer,
  Supplier,
  Expense,
  PurchaseOrder,
  AppSettings,
} from '../types';
import {
  initialBusinesses,
  initialProducts,
  initialUnits,
  initialMovements,
  initialSales,
  initialCustomers,
  initialSuppliers,
  initialExpenses,
  initialPurchaseOrders,
  defaultSettings,
} from './mockData';

export interface AppData {
  businesses: Business[];
  products: Product[];
  inventoryUnits: InventoryUnit[];
  stockMovements: StockMovement[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];
  settings: AppSettings;
}

const STORAGE_KEY = 'ranks_shop_pos_data_v1';

export function loadLocalData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getFreshInitialData();
    }
    const parsed = JSON.parse(raw);
    // If stored data was previously AED, reset to fresh UGX data for seamless transition
    if (parsed.businesses?.[0]?.currency === 'AED') {
      return getFreshInitialData();
    }
    return {
      businesses: parsed.businesses?.length ? parsed.businesses : initialBusinesses,
      products: parsed.products?.length ? parsed.products : initialProducts,
      inventoryUnits: parsed.inventoryUnits?.length ? parsed.inventoryUnits : initialUnits,
      stockMovements: parsed.stockMovements?.length ? parsed.stockMovements : initialMovements,
      sales: parsed.sales?.length ? parsed.sales : initialSales,
      customers: parsed.customers?.length ? parsed.customers : initialCustomers,
      suppliers: parsed.suppliers?.length ? parsed.suppliers : initialSuppliers,
      expenses: parsed.expenses?.length ? parsed.expenses : initialExpenses,
      purchaseOrders: parsed.purchaseOrders?.length ? parsed.purchaseOrders : initialPurchaseOrders,
      settings: parsed.settings ? { ...defaultSettings, ...parsed.settings } : defaultSettings,
    };
  } catch (e) {
    console.error('Failed to parse local storage, loading defaults:', e);
    return getFreshInitialData();
  }
}

export function saveLocalData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to local storage:', e);
  }
}

export function getFreshInitialData(): AppData {
  return {
    businesses: initialBusinesses,
    products: initialProducts,
    inventoryUnits: initialUnits,
    stockMovements: initialMovements,
    sales: initialSales,
    customers: initialCustomers,
    suppliers: initialSuppliers,
    expenses: initialExpenses,
    purchaseOrders: initialPurchaseOrders,
    settings: defaultSettings,
  };
}

export function exportBackupJson(data: AppData): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      app: 'Ranks Shop Manager',
      version: '1.0.0',
      data,
    },
    null,
    2
  );
}

export function parseBackupJson(jsonString: string): AppData {
  const parsed = JSON.parse(jsonString);
  if (parsed.data && parsed.data.products && parsed.data.businesses) {
    return parsed.data as AppData;
  }
  if (parsed.products && parsed.businesses) {
    return parsed as AppData;
  }
  throw new Error('Invalid backup file format: missing core business data');
}
