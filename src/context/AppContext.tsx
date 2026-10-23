import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  SyncStatusType,
  UserRole,
} from '../types';
import {
  auth,
  db,
  onAuthStateChanged,
  User,
  testConnection,
  handleFirestoreError,
  OperationType,
  loginWithGoogle,
  logOut,
} from '../lib/firebase';
import {
  loadLocalData,
  saveLocalData,
  getFreshInitialData,
  exportBackupJson,
  parseBackupJson,
  AppData,
} from '../lib/storage';
import { isValidLuhn } from '../lib/luhn';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
} from 'firebase/firestore';

interface AppContextType {
  user: User | null;
  isAuthReady: boolean;
  syncStatus: SyncStatusType;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  syncNow: () => Promise<void>;
  activeBusinessId: string;
  setActiveBusinessId: (id: string) => void;
  activeBusiness: Business | null;
  currency: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Role & Lock
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  isLocked: boolean;
  lockApp: () => void;
  unlockApp: (pin: string) => boolean;
  setAppPin: (pin: string | null) => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;

  // Data Collections
  businesses: Business[];
  products: Product[];
  inventoryUnits: InventoryUnit[];
  stockMovements: StockMovement[];
  sales: Sale[];
  customers: Customer[];
  suppliers: Supplier[];
  expenses: Expense[];
  purchaseOrders: PurchaseOrder[];

  // Filtered by active business
  filteredProducts: Product[];
  filteredUnits: InventoryUnit[];
  filteredSales: Sale[];
  filteredExpenses: Expense[];
  filteredMovements: StockMovement[];
  filteredOrders: PurchaseOrder[];

  // Action methods
  addBusiness: (business: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>) => string;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;

  addProduct: (
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'currentStock'>,
    initialUnits?: { imei: string; imei2?: string; serial?: string }[]
  ) => string;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addStockMovement: (
    movement: Omit<StockMovement, 'id' | 'createdAt' | 'ownerId'>
  ) => void;

  recordSale: (
    saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'ownerId'>
  ) => Sale;
  refundSale: (saleId: string, reason?: string) => void;

  addCustomer: (
    customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'totalSpent' | 'outstandingBalance'>
  ) => string;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  recordCustomerPayment: (customerId: string, amount: number, notes?: string) => void;

  addSupplier: (
    supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'totalPurchased' | 'balanceOwed'>
  ) => string;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  recordSupplierPayment: (supplierId: string, amount: number, notes?: string) => void;

  addPurchaseOrder: (
    order: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'ownerId'>
  ) => string;
  receivePurchaseOrder: (
    orderId: string,
    receivedImeis?: Record<string, string[]>
  ) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'ownerId'>) => string;
  deleteExpense: (id: string) => void;

  // Backup & Reset
  exportBackup: () => string;
  importBackup: (jsonContent: string) => boolean;
  resetDemoData: () => void;

  // Search by IMEI
  findUnitByImei: (imei: string) => { unit?: InventoryUnit; product?: Product; sale?: Sale } | null;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(loadLocalData);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>(
    navigator.onLine ? 'synced' : 'offline'
  );
  const [activeBusinessId, setActiveBusinessId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isLocked, setIsLocked] = useState<boolean>(false);

  // Online / offline event listeners
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('syncing');
      testConnection().then(() => setSyncStatus('synced'));
    };
    const handleOffline = () => setSyncStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial test
    testConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to local storage whenever data changes
  useEffect(() => {
    saveLocalData(data);
  }, [data]);

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      if (currentUser) {
        // If logged in, sync with user subcollections
        syncUserWithFirestore(currentUser);
      }
    });
    return () => unsubscribe();
  }, []);

  // Check PIN lock on boot
  useEffect(() => {
    if (data.settings.pinEnabled && data.settings.pinHash) {
      setIsLocked(true);
    }
  }, [data.settings.pinEnabled, data.settings.pinHash]);

  // Helper to upload all local collections to Firestore for user backup
  const uploadAllLocalDataToFirestore = useCallback(async (uid: string, localData: AppData) => {
    try {
      // 1. User root document
      await setDoc(doc(db, 'users', uid), {
        email: user?.email || '',
        displayName: user?.displayName || 'Ranks Owner',
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });

      // 2. Businesses
      for (const b of localData.businesses) {
        await setDoc(doc(db, `users/${uid}/businesses`, b.id), b, { merge: true });
      }
      // 3. Products
      for (const p of localData.products) {
        await setDoc(doc(db, `users/${uid}/products`, p.id), p, { merge: true });
      }
      // 4. Inventory Units (IMEIs)
      for (const u of localData.inventoryUnits) {
        await setDoc(doc(db, `users/${uid}/inventoryUnits`, u.id), u, { merge: true });
      }
      // 5. Stock Movements
      for (const m of localData.stockMovements) {
        await setDoc(doc(db, `users/${uid}/stockMovements`, m.id), m, { merge: true });
      }
      // 6. Sales
      for (const s of localData.sales) {
        await setDoc(doc(db, `users/${uid}/sales`, s.id), s, { merge: true });
      }
      // 7. Customers
      for (const c of localData.customers) {
        await setDoc(doc(db, `users/${uid}/customers`, c.id), c, { merge: true });
      }
      // 8. Suppliers
      for (const s of localData.suppliers) {
        await setDoc(doc(db, `users/${uid}/suppliers`, s.id), s, { merge: true });
      }
      // 9. Expenses
      for (const e of localData.expenses) {
        await setDoc(doc(db, `users/${uid}/expenses`, e.id), e, { merge: true });
      }
      // 10. Purchase Orders
      for (const po of localData.purchaseOrders) {
        await setDoc(doc(db, `users/${uid}/purchaseOrders`, po.id), po, { merge: true });
      }
      // 11. Settings
      await setDoc(doc(db, `users/${uid}/settings`, 'config'), localData.settings, { merge: true });
    } catch (err) {
      console.error('Failed to upload data to Firestore:', err);
      throw err;
    }
  }, [user]);

  // Sync with Firestore for authenticated users
  const syncUserWithFirestore = useCallback(async (firebaseUser: User) => {
    if (!navigator.onLine) {
      setSyncStatus('offline');
      return;
    }
    setSyncStatus('syncing');

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await setDoc(userRef, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || 'Ranks Owner',
        lastLogin: new Date().toISOString(),
      }, { merge: true });

      // Check if user already has cloud products
      const productsSnap = await getDocs(collection(db, `users/${firebaseUser.uid}/products`));

      if (productsSnap.empty) {
        // First-time sync: Upload current local database to Firestore immediately
        await uploadAllLocalDataToFirestore(firebaseUser.uid, data);
      } else {
        // User already has cloud data: load everything
        const [
          bizSnap,
          unitsSnap,
          movSnap,
          salesSnap,
          custSnap,
          supSnap,
          expSnap,
          poSnap,
          setSnap,
        ] = await Promise.all([
          getDocs(collection(db, `users/${firebaseUser.uid}/businesses`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/inventoryUnits`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/stockMovements`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/sales`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/customers`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/suppliers`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/expenses`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/purchaseOrders`)),
          getDocs(collection(db, `users/${firebaseUser.uid}/settings`)),
        ]);

        const loadedBiz: Business[] = [];
        bizSnap.forEach((d) => loadedBiz.push(d.data() as Business));

        const loadedProds: Product[] = [];
        productsSnap.forEach((d) => loadedProds.push(d.data() as Product));

        const loadedUnits: InventoryUnit[] = [];
        unitsSnap.forEach((d) => loadedUnits.push(d.data() as InventoryUnit));

        const loadedMovs: StockMovement[] = [];
        movSnap.forEach((d) => loadedMovs.push(d.data() as StockMovement));

        const loadedSales: Sale[] = [];
        salesSnap.forEach((d) => loadedSales.push(d.data() as Sale));

        const loadedCusts: Customer[] = [];
        custSnap.forEach((d) => loadedCusts.push(d.data() as Customer));

        const loadedSups: Supplier[] = [];
        supSnap.forEach((d) => loadedSups.push(d.data() as Supplier));

        const loadedExps: Expense[] = [];
        expSnap.forEach((d) => loadedExps.push(d.data() as Expense));

        const loadedPOs: PurchaseOrder[] = [];
        poSnap.forEach((d) => loadedPOs.push(d.data() as PurchaseOrder));

        let loadedSettings = data.settings;
        if (!setSnap.empty) {
          loadedSettings = { ...loadedSettings, ...(setSnap.docs[0].data() as AppSettings) };
        }

        setData((prev) => ({
          businesses: loadedBiz.length > 0 ? loadedBiz : prev.businesses,
          products: loadedProds.length > 0 ? loadedProds : prev.products,
          inventoryUnits: loadedUnits.length > 0 ? loadedUnits : prev.inventoryUnits,
          stockMovements: loadedMovs.length > 0 ? loadedMovs : prev.stockMovements,
          sales: loadedSales.length > 0 ? loadedSales : prev.sales,
          customers: loadedCusts.length > 0 ? loadedCusts : prev.customers,
          suppliers: loadedSups.length > 0 ? loadedSups : prev.suppliers,
          expenses: loadedExps.length > 0 ? loadedExps : prev.expenses,
          purchaseOrders: loadedPOs.length > 0 ? loadedPOs : prev.purchaseOrders,
          settings: loadedSettings,
        }));
      }

      setSyncStatus('synced');
    } catch (e) {
      console.warn('Firestore sync note:', e);
      setSyncStatus('offline');
    }
  }, [data, uploadAllLocalDataToFirestore]);

  // Manual explicit Sync Now
  const syncNow = useCallback(async () => {
    if (!user) {
      throw new Error('Please sign in with a Google account first.');
    }
    setSyncStatus('syncing');
    try {
      await uploadAllLocalDataToFirestore(user.uid, data);
      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('offline');
      throw err;
    }
  }, [user, data, uploadAllLocalDataToFirestore]);

  // Google Sign-In & Sign-Out methods
  const signInWithGoogle = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        setUser(loggedInUser);
        await syncUserWithFirestore(loggedInUser);
      }
    } catch (err) {
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      throw err;
    }
  }, [syncUserWithFirestore]);

  const signOutUser = useCallback(async () => {
    await logOut();
    setUser(null);
    setSyncStatus('offline');
  }, []);

  // Helper to sync doc write to Firestore if authenticated
  const firestoreWrite = useCallback(async (subpath: string, docId: string, docData: unknown) => {
    if (!user || !navigator.onLine) return;
    try {
      const docPath = `users/${user.uid}/${subpath}/${docId}`;
      const docRef = doc(db, `users/${user.uid}/${subpath}`, docId);
      await setDoc(docRef, docData as any, { merge: true });
    } catch (err) {
      console.error('Failed to sync write to Firestore:', err);
    }
  }, [user]);

  const firestoreDelete = useCallback(async (subpath: string, docId: string) => {
    if (!user || !navigator.onLine) return;
    try {
      const docRef = doc(db, `users/${user.uid}/${subpath}`, docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('Failed to sync delete to Firestore:', err);
    }
  }, [user]);

  // Active business resolution
  const activeBusiness = useMemo(() => {
    if (activeBusinessId === 'all') return null;
    return data.businesses.find((b) => b.id === activeBusinessId) || null;
  }, [data.businesses, activeBusinessId]);

  const currency = useMemo(() => {
    if (activeBusiness) return activeBusiness.currency;
    return 'UGX';
  }, [activeBusiness]);

  // Filtered collections based on activeBusinessId
  const filteredProducts = useMemo(() => {
    if (activeBusinessId === 'all') return data.products;
    return data.products.filter((p) => p.businessId === activeBusinessId);
  }, [data.products, activeBusinessId]);

  const filteredUnits = useMemo(() => {
    if (activeBusinessId === 'all') return data.inventoryUnits;
    return data.inventoryUnits.filter((u) => u.businessId === activeBusinessId);
  }, [data.inventoryUnits, activeBusinessId]);

  const filteredSales = useMemo(() => {
    if (activeBusinessId === 'all') return data.sales;
    return data.sales.filter((s) => s.businessId === activeBusinessId);
  }, [data.sales, activeBusinessId]);

  const filteredExpenses = useMemo(() => {
    if (activeBusinessId === 'all') return data.expenses;
    return data.expenses.filter((e) => e.isShared || e.businessId === activeBusinessId);
  }, [data.expenses, activeBusinessId]);

  const filteredMovements = useMemo(() => {
    if (activeBusinessId === 'all') return data.stockMovements;
    return data.stockMovements.filter((m) => m.businessId === activeBusinessId);
  }, [data.stockMovements, activeBusinessId]);

  const filteredOrders = useMemo(() => {
    if (activeBusinessId === 'all') return data.purchaseOrders;
    return data.purchaseOrders.filter((o) => o.businessId === activeBusinessId);
  }, [data.purchaseOrders, activeBusinessId]);

  // PIN Lock & Role
  const lockApp = useCallback(() => {
    setIsLocked(true);
  }, []);

  const unlockApp = useCallback((pin: string): boolean => {
    if (!data.settings.pinEnabled || !data.settings.pinHash) {
      setIsLocked(false);
      return true;
    }
    // Simple fast hash check
    if (data.settings.pinHash === pin) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [data.settings.pinEnabled, data.settings.pinHash]);

  const setAppPin = useCallback((pin: string | null) => {
    setData((prev) => {
      const nextSettings: AppSettings = {
        ...prev.settings,
        pinEnabled: !!pin,
        pinHash: pin || undefined,
      };
      return { ...prev, settings: nextSettings };
    });
  }, []);

  const setActiveRole = useCallback((role: UserRole) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, activeRole: role },
    }));
  }, []);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...updates },
    }));
  }, []);

  // Business CRUD
  const addBusiness = useCallback((bus: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): string => {
    const id = `biz-${Date.now()}`;
    const newBiz: Business = {
      ...bus,
      id,
      ownerId: user?.uid || 'default',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, businesses: [...prev.businesses, newBiz] }));
    firestoreWrite('businesses', id, newBiz);
    return id;
  }, [user, firestoreWrite]);

  const updateBusiness = useCallback((id: string, updates: Partial<Business>) => {
    setData((prev) => {
      const businesses = prev.businesses.map((b) =>
        b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b
      );
      const updated = businesses.find((b) => b.id === id);
      if (updated) firestoreWrite('businesses', id, updated);
      return { ...prev, businesses };
    });
  }, [firestoreWrite]);

  const deleteBusiness = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      businesses: prev.businesses.filter((b) => b.id !== id),
    }));
    firestoreDelete('businesses', id);
    if (activeBusinessId === id) {
      setActiveBusinessId('all');
    }
  }, [activeBusinessId, firestoreDelete]);

  // Product CRUD
  const addProduct = useCallback((
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'currentStock'>,
    initialUnitsList?: { imei: string; imei2?: string; serial?: string }[]
  ): string => {
    const id = `prod-${Date.now()}`;
    const initialQty = initialUnitsList?.length || 0;
    const newProduct: Product = {
      ...productData,
      id,
      ownerId: user?.uid || 'default',
      currentStock: initialQty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newUnits: InventoryUnit[] = [];
    const newMovements: StockMovement[] = [];

    if (productData.isSerialized && initialUnitsList && initialUnitsList.length > 0) {
      initialUnitsList.forEach((u, idx) => {
        const unitId = `unit-${Date.now()}-${idx}`;
        const unit: InventoryUnit = {
          id: unitId,
          businessId: productData.businessId,
          productId: id,
          ownerId: user?.uid || 'default',
          imei: u.imei,
          imei2: u.imei2,
          serialNumber: u.serial,
          status: 'in_stock',
          purchasePrice: productData.purchasePrice,
          sellingPrice: productData.sellingPrice,
          supplierId: productData.supplierId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newUnits.push(unit);
        firestoreWrite('inventoryUnits', unitId, unit);
      });

      // Opening stock movement
      const movId = `mov-${Date.now()}`;
      const mov: StockMovement = {
        id: movId,
        businessId: productData.businessId,
        productId: id,
        ownerId: user?.uid || 'default',
        type: 'in',
        reason: 'opening_stock',
        quantity: initialQty,
        costPerUnit: productData.purchasePrice,
        notes: `Opening stock: ${initialQty} units added`,
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };
      newMovements.push(mov);
      firestoreWrite('stockMovements', movId, mov);
    }

    setData((prev) => ({
      ...prev,
      products: [newProduct, ...prev.products],
      inventoryUnits: [...newUnits, ...prev.inventoryUnits],
      stockMovements: [...newMovements, ...prev.stockMovements],
    }));

    firestoreWrite('products', id, newProduct);
    return id;
  }, [user, firestoreWrite]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>) => {
    setData((prev) => {
      const products = prev.products.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      const updated = products.find((p) => p.id === id);
      if (updated) firestoreWrite('products', id, updated);
      return { ...prev, products };
    });
  }, [firestoreWrite]);

  const deleteProduct = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
      inventoryUnits: prev.inventoryUnits.filter((u) => u.productId !== id),
    }));
    firestoreDelete('products', id);
  }, [firestoreDelete]);

  // Stock Movement & Logging
  const addStockMovement = useCallback((
    movementData: Omit<StockMovement, 'id' | 'createdAt' | 'ownerId'>
  ) => {
    const id = `mov-${Date.now()}`;
    const newMovement: StockMovement = {
      ...movementData,
      id,
      ownerId: user?.uid || 'default',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => {
      // Calculate quantity change
      let delta = 0;
      if (movementData.type === 'in') delta = movementData.quantity;
      else if (movementData.type === 'out') delta = -movementData.quantity;
      else if (movementData.type === 'adjustment') {
        // Absolute adjustment
        const prod = prev.products.find((p) => p.id === movementData.productId);
        if (prod) delta = movementData.quantity - prod.currentStock;
      }

      const products = prev.products.map((p) => {
        if (p.id === movementData.productId) {
          const nextStock = Math.max(0, p.currentStock + delta);
          const updated = { ...p, currentStock: nextStock, updatedAt: new Date().toISOString() };
          firestoreWrite('products', p.id, updated);
          return updated;
        }
        return p;
      });

      return {
        ...prev,
        stockMovements: [newMovement, ...prev.stockMovements],
        products,
      };
    });

    firestoreWrite('stockMovements', id, newMovement);
  }, [user, firestoreWrite]);

  // Record Sale / POS checkout
  const recordSale = useCallback((
    saleData: Omit<Sale, 'id' | 'invoiceNumber' | 'createdAt' | 'ownerId'>
  ): Sale => {
    const timestamp = Date.now();
    const id = `sale-${timestamp}`;
    const invoiceNumber = `INV-${timestamp.toString().slice(-6)}`;

    const newSale: Sale = {
      ...saleData,
      id,
      invoiceNumber,
      ownerId: user?.uid || 'default',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => {
      // 1. Update Products stock & log StockMovements
      const updatedProducts = [...prev.products];
      const newMovements: StockMovement[] = [];
      const updatedUnits = [...prev.inventoryUnits];

      saleData.items.forEach((item) => {
        const prodIdx = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIdx >= 0) {
          const prod = updatedProducts[prodIdx];
          const newStock = Math.max(0, prod.currentStock - item.quantity);
          updatedProducts[prodIdx] = {
            ...prod,
            currentStock: newStock,
            updatedAt: new Date().toISOString(),
          };
          firestoreWrite('products', prod.id, updatedProducts[prodIdx]);
        }

        // Serialized unit update
        if (item.isSerialized && item.unitId) {
          const unitIdx = updatedUnits.findIndex((u) => u.id === item.unitId);
          if (unitIdx >= 0) {
            updatedUnits[unitIdx] = {
              ...updatedUnits[unitIdx],
              status: 'sold',
              saleId: id,
              soldAt: new Date().toISOString(),
              warrantyEndDate: saleData.warrantyEndDate,
              updatedAt: new Date().toISOString(),
            };
            firestoreWrite('inventoryUnits', item.unitId, updatedUnits[unitIdx]);
          }
        }

        // Movement log
        const movId = `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const mov: StockMovement = {
          id: movId,
          businessId: saleData.businessId,
          productId: item.productId,
          ownerId: user?.uid || 'default',
          type: 'out',
          reason: 'sale',
          quantity: item.quantity,
          costPerUnit: item.unitCost,
          referenceId: invoiceNumber,
          imei: item.imei,
          notes: `Sold in ${invoiceNumber} to ${saleData.customerName || 'Walk-in'}`,
          date: saleData.date,
          createdAt: new Date().toISOString(),
        };
        newMovements.push(mov);
        firestoreWrite('stockMovements', movId, mov);
      });

      // 2. Customer updates (credit balance / total spent)
      let updatedCustomers = [...prev.customers];
      if (saleData.customerId) {
        const remainingDebt = Math.max(0, saleData.total - saleData.amountPaid);
        updatedCustomers = updatedCustomers.map((c) => {
          if (c.id === saleData.customerId) {
            const nextCust = {
              ...c,
              totalSpent: c.totalSpent + saleData.total,
              outstandingBalance: c.outstandingBalance + remainingDebt,
              updatedAt: new Date().toISOString(),
            };
            firestoreWrite('customers', c.id, nextCust);
            return nextCust;
          }
          return c;
        });
      }

      return {
        ...prev,
        sales: [newSale, ...prev.sales],
        products: updatedProducts,
        inventoryUnits: updatedUnits,
        stockMovements: [...newMovements, ...prev.stockMovements],
        customers: updatedCustomers,
      };
    });

    firestoreWrite('sales', id, newSale);
    return newSale;
  }, [user, firestoreWrite]);

  // Refund / Return Sale
  const refundSale = useCallback((saleId: string, reason = 'Customer return') => {
    setData((prev) => {
      const sale = prev.sales.find((s) => s.id === saleId);
      if (!sale) return prev;

      const updatedProducts = [...prev.products];
      const newMovements: StockMovement[] = [];
      const updatedUnits = [...prev.inventoryUnits];

      // Restore items back to inventory
      sale.items.forEach((item) => {
        const prodIdx = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIdx >= 0) {
          const prod = updatedProducts[prodIdx];
          updatedProducts[prodIdx] = {
            ...prod,
            currentStock: prod.currentStock + item.quantity,
            updatedAt: new Date().toISOString(),
          };
          firestoreWrite('products', prod.id, updatedProducts[prodIdx]);
        }

        if (item.isSerialized && item.unitId) {
          const uIdx = updatedUnits.findIndex((u) => u.id === item.unitId);
          if (uIdx >= 0) {
            updatedUnits[uIdx] = {
              ...updatedUnits[uIdx],
              status: 'in_stock',
              saleId: undefined,
              soldAt: undefined,
              updatedAt: new Date().toISOString(),
            };
            firestoreWrite('inventoryUnits', item.unitId, updatedUnits[uIdx]);
          }
        }

        const movId = `mov-refund-${Date.now()}`;
        const mov: StockMovement = {
          id: movId,
          businessId: sale.businessId,
          productId: item.productId,
          ownerId: user?.uid || 'default',
          type: 'in',
          reason: 'customer_return',
          quantity: item.quantity,
          costPerUnit: item.unitCost,
          referenceId: sale.invoiceNumber,
          notes: `Refund for ${sale.invoiceNumber}: ${reason}`,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };
        newMovements.push(mov);
        firestoreWrite('stockMovements', movId, mov);
      });

      // Reverse customer debt if applicable
      let updatedCustomers = [...prev.customers];
      if (sale.customerId) {
        const remainingDebt = Math.max(0, sale.total - sale.amountPaid);
        updatedCustomers = updatedCustomers.map((c) => {
          if (c.id === sale.customerId) {
            return {
              ...c,
              totalSpent: Math.max(0, c.totalSpent - sale.total),
              outstandingBalance: Math.max(0, c.outstandingBalance - remainingDebt),
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
      }

      // Remove sale or mark refunded
      const remainingSales = prev.sales.filter((s) => s.id !== saleId);
      firestoreDelete('sales', saleId);

      return {
        ...prev,
        sales: remainingSales,
        products: updatedProducts,
        inventoryUnits: updatedUnits,
        stockMovements: [...newMovements, ...prev.stockMovements],
        customers: updatedCustomers,
      };
    });
  }, [user, firestoreWrite, firestoreDelete]);

  // Customer Management
  const addCustomer = useCallback((
    cust: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'totalSpent' | 'outstandingBalance'>
  ): string => {
    const id = `cust-${Date.now()}`;
    const newCust: Customer = {
      ...cust,
      id,
      ownerId: user?.uid || 'default',
      totalSpent: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, customers: [newCust, ...prev.customers] }));
    firestoreWrite('customers', id, newCust);
    return id;
  }, [user, firestoreWrite]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
    setData((prev) => {
      const customers = prev.customers.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      const updated = customers.find((c) => c.id === id);
      if (updated) firestoreWrite('customers', id, updated);
      return { ...prev, customers };
    });
  }, [firestoreWrite]);

  const recordCustomerPayment = useCallback((customerId: string, amount: number) => {
    setData((prev) => {
      const customers = prev.customers.map((c) => {
        if (c.id === customerId) {
          const nextBal = Math.max(0, c.outstandingBalance - amount);
          const updated = { ...c, outstandingBalance: nextBal, updatedAt: new Date().toISOString() };
          firestoreWrite('customers', c.id, updated);
          return updated;
        }
        return c;
      });
      return { ...prev, customers };
    });
  }, [firestoreWrite]);

  // Supplier Management
  const addSupplier = useCallback((
    sup: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'ownerId' | 'totalPurchased' | 'balanceOwed'>
  ): string => {
    const id = `sup-${Date.now()}`;
    const newSup: Supplier = {
      ...sup,
      id,
      ownerId: user?.uid || 'default',
      totalPurchased: 0,
      balanceOwed: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, suppliers: [newSup, ...prev.suppliers] }));
    firestoreWrite('suppliers', id, newSup);
    return id;
  }, [user, firestoreWrite]);

  const updateSupplier = useCallback((id: string, updates: Partial<Supplier>) => {
    setData((prev) => {
      const suppliers = prev.suppliers.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      );
      const updated = suppliers.find((s) => s.id === id);
      if (updated) firestoreWrite('suppliers', id, updated);
      return { ...prev, suppliers };
    });
  }, [firestoreWrite]);

  const recordSupplierPayment = useCallback((supplierId: string, amount: number) => {
    setData((prev) => {
      const suppliers = prev.suppliers.map((s) => {
        if (s.id === supplierId) {
          const nextBal = Math.max(0, s.balanceOwed - amount);
          const updated = { ...s, balanceOwed: nextBal, updatedAt: new Date().toISOString() };
          firestoreWrite('suppliers', s.id, updated);
          return updated;
        }
        return s;
      });
      return { ...prev, suppliers };
    });
  }, [firestoreWrite]);

  // Purchase Orders
  const addPurchaseOrder = useCallback((
    orderData: Omit<PurchaseOrder, 'id' | 'orderNumber' | 'createdAt' | 'ownerId'>
  ): string => {
    const timestamp = Date.now();
    const id = `po-${timestamp}`;
    const orderNumber = `PO-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`;

    const newOrder: PurchaseOrder = {
      ...orderData,
      id,
      orderNumber,
      ownerId: user?.uid || 'default',
      createdAt: new Date().toISOString(),
    };

    setData((prev) => ({ ...prev, purchaseOrders: [newOrder, ...prev.purchaseOrders] }));
    firestoreWrite('purchaseOrders', id, newOrder);
    return id;
  }, [user, firestoreWrite]);

  const receivePurchaseOrder = useCallback((
    orderId: string,
    receivedImeis?: Record<string, string[]>
  ) => {
    setData((prev) => {
      const order = prev.purchaseOrders.find((o) => o.id === orderId);
      if (!order || order.status === 'received') return prev;

      const updatedProducts = [...prev.products];
      const newUnits: InventoryUnit[] = [];
      const newMovements: StockMovement[] = [];

      order.items.forEach((item) => {
        const prodIdx = updatedProducts.findIndex((p) => p.id === item.productId);
        if (prodIdx >= 0) {
          const prod = updatedProducts[prodIdx];
          updatedProducts[prodIdx] = {
            ...prod,
            currentStock: prod.currentStock + item.quantity,
            purchasePrice: item.unitCost, // Update last cost
            updatedAt: new Date().toISOString(),
          };
          firestoreWrite('products', prod.id, updatedProducts[prodIdx]);
        }

        // If serialized and IMEIs were supplied
        const imeisForItem = receivedImeis?.[item.productId] || [];
        imeisForItem.forEach((imeiStr, uIdx) => {
          const unitId = `unit-${Date.now()}-${uIdx}`;
          const unit: InventoryUnit = {
            id: unitId,
            businessId: order.businessId,
            productId: item.productId,
            ownerId: user?.uid || 'default',
            imei: imeiStr,
            status: 'in_stock',
            purchasePrice: item.unitCost,
            sellingPrice: updatedProducts[prodIdx]?.sellingPrice || item.unitCost * 1.25,
            supplierId: order.supplierId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newUnits.push(unit);
          firestoreWrite('inventoryUnits', unitId, unit);
        });

        // Movement
        const movId = `mov-po-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const mov: StockMovement = {
          id: movId,
          businessId: order.businessId,
          productId: item.productId,
          ownerId: user?.uid || 'default',
          type: 'in',
          reason: 'purchase',
          quantity: item.quantity,
          costPerUnit: item.unitCost,
          supplierId: order.supplierId,
          referenceId: order.orderNumber,
          notes: `Received purchase order ${order.orderNumber} from ${order.supplierName}`,
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
        };
        newMovements.push(mov);
        firestoreWrite('stockMovements', movId, mov);
      });

      // Update supplier purchase total
      const updatedSuppliers = prev.suppliers.map((s) => {
        if (s.id === order.supplierId) {
          const updated = {
            ...s,
            totalPurchased: s.totalPurchased + order.totalAmount,
            updatedAt: new Date().toISOString(),
          };
          firestoreWrite('suppliers', s.id, updated);
          return updated;
        }
        return s;
      });

      const updatedOrders = prev.purchaseOrders.map((o) => {
        if (o.id === orderId) {
          const updated = {
            ...o,
            status: 'received' as const,
            receivedAt: new Date().toISOString(),
          };
          firestoreWrite('purchaseOrders', orderId, updated);
          return updated;
        }
        return o;
      });

      return {
        ...prev,
        purchaseOrders: updatedOrders,
        products: updatedProducts,
        inventoryUnits: [...newUnits, ...prev.inventoryUnits],
        stockMovements: [...newMovements, ...prev.stockMovements],
        suppliers: updatedSuppliers,
      };
    });
  }, [user, firestoreWrite]);

  // Expenses CRUD
  const addExpense = useCallback((
    expenseData: Omit<Expense, 'id' | 'createdAt' | 'ownerId'>
  ): string => {
    const id = `exp-${Date.now()}`;
    const newExp: Expense = {
      ...expenseData,
      id,
      ownerId: user?.uid || 'default',
      createdAt: new Date().toISOString(),
    };
    setData((prev) => ({ ...prev, expenses: [newExp, ...prev.expenses] }));
    firestoreWrite('expenses', id, newExp);
    return id;
  }, [user, firestoreWrite]);

  const deleteExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
    firestoreDelete('expenses', id);
  }, [firestoreDelete]);

  // Search by IMEI / Serial number
  const findUnitByImei = useCallback((imei: string) => {
    const clean = imei.trim().toLowerCase();
    if (!clean) return null;

    const unit = data.inventoryUnits.find(
      (u) =>
        u.imei.toLowerCase() === clean ||
        u.imei2?.toLowerCase() === clean ||
        u.serialNumber?.toLowerCase() === clean
    );

    if (!unit) return null;

    const product = data.products.find((p) => p.id === unit.productId);
    const sale = unit.saleId ? data.sales.find((s) => s.id === unit.saleId) : undefined;

    return { unit, product, sale };
  }, [data.inventoryUnits, data.products, data.sales]);

  // Backup & Import
  const exportBackup = useCallback(() => {
    return exportBackupJson(data);
  }, [data]);

  const importBackup = useCallback((jsonContent: string): boolean => {
    try {
      const parsed = parseBackupJson(jsonContent);
      setData(parsed);
      saveLocalData(parsed);
      return true;
    } catch (e) {
      console.error('Backup import error:', e);
      return false;
    }
  }, [data]);

  const resetDemoData = useCallback(() => {
    const fresh = getFreshInitialData();
    setData(fresh);
    saveLocalData(fresh);
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        isAuthReady,
        syncStatus,
        signInWithGoogle,
        signOutUser,
        syncNow,
        activeBusinessId,
        setActiveBusinessId,
        activeBusiness,
        currency,
        activeTab,
        setActiveTab,

        activeRole: data.settings.activeRole,
        setActiveRole,
        isLocked,
        lockApp,
        unlockApp,
        setAppPin,
        settings: data.settings,
        updateSettings,

        businesses: data.businesses,
        products: data.products,
        inventoryUnits: data.inventoryUnits,
        stockMovements: data.stockMovements,
        sales: data.sales,
        customers: data.customers,
        suppliers: data.suppliers,
        expenses: data.expenses,
        purchaseOrders: data.purchaseOrders,

        filteredProducts,
        filteredUnits,
        filteredSales,
        filteredExpenses,
        filteredMovements,
        filteredOrders,

        addBusiness,
        updateBusiness,
        deleteBusiness,

        addProduct,
        updateProduct,
        deleteProduct,

        addStockMovement,
        recordSale,
        refundSale,

        addCustomer,
        updateCustomer,
        recordCustomerPayment,

        addSupplier,
        updateSupplier,
        recordSupplierPayment,

        addPurchaseOrder,
        receivePurchaseOrder,

        addExpense,
        deleteExpense,

        exportBackup,
        importBackup,
        resetDemoData,
        findUnitByImei,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
