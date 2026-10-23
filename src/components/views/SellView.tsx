import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  QrCode,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  UserPlus,
  CreditCard,
  Banknote,
  ArrowRightLeft,
  Calendar,
  AlertCircle,
  Tag,
  ShieldCheck,
  Percent,
  LayoutGrid,
  List,
  ShoppingCart,
  Boxes,
  ArrowRight,
  ChevronUp,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { Product, SaleItem, PaymentMethod, PaymentStatus, InventoryUnit, Customer, Sale } from '../../types';
import confetti from 'canvas-confetti';
import { formatImei } from '../../lib/luhn';

interface SellViewProps {
  onOpenScanner: () => void;
  onSaleComplete: (sale: Sale) => void;
  initialScannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const SellView: React.FC<SellViewProps> = ({
  onOpenScanner,
  onSaleComplete,
  initialScannedCode,
  onClearScannedCode,
}) => {
  const {
    filteredProducts,
    filteredUnits,
    customers,
    activeBusiness,
    activeBusinessId,
    currency,
    recordSale,
    addCustomer,
    activeRole,
    sales,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialScannedCode || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [cartItems, setCartItems] = useState<SaleItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [isMobileCartExpanded, setIsMobileCartExpanded] = useState(false);

  // Cart & Customer details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<string>('0');
  const [notes, setNotes] = useState<string>('');

  // Unit selector state when adding a serialized product (phones)
  const [selectingUnitsForProduct, setSelectingUnitsForProduct] = useState<Product | null>(null);

  // New customer quick modal
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // Categories list with item counts
  const categoriesWithCounts = useMemo(() => {
    const counts: Record<string, number> = { All: filteredProducts.length };
    filteredProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const categoryList = ['All', ...Object.keys(counts).filter((c) => c !== 'All').sort()];
    return categoryList.map((cat) => ({
      name: cat,
      count: counts[cat] || 0,
    }));
  }, [filteredProducts]);

  // Filtered product catalog
  const catalog = useMemo(() => {
    return filteredProducts.filter((p) => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;

      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchModel = p.model.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);

      // Check if any unit's IMEI matches query
      const matchUnit = filteredUnits.some(
        (u) =>
          u.productId === p.id &&
          u.status === 'in_stock' &&
          (u.imei.toLowerCase().includes(q) || u.imei2?.toLowerCase().includes(q))
      );

      return matchCat && (matchName || matchBrand || matchModel || matchBarcode || matchUnit);
    });
  }, [filteredProducts, filteredUnits, selectedCategory, searchQuery]);

  // Handle adding product to cart
  const handleAddToCart = (product: Product) => {
    if (product.currentStock <= 0) {
      alert(`Cannot add: "${product.name}" is currently out of stock!`);
      return;
    }

    if (product.isSerialized) {
      // Find in-stock units for this product
      const availableUnits = filteredUnits.filter(
        (u) => u.productId === product.id && u.status === 'in_stock'
      );
      // Filter out units already in cart
      const unpickedUnits = availableUnits.filter(
        (u) => !cartItems.some((ci) => ci.unitId === u.id)
      );

      if (unpickedUnits.length === 0) {
        alert('All in-stock IMEI units for this phone are already in the cart!');
        return;
      }

      setSelectingUnitsForProduct(product);
    } else {
      // Non-serialized item
      setCartItems((prev) => {
        const existingIdx = prev.findIndex((i) => i.productId === product.id);
        if (existingIdx >= 0) {
          const item = prev[existingIdx];
          const nextQty = item.quantity + 1;
          const nextTotal = nextQty * item.unitPrice - item.discount;
          const updated = [...prev];
          updated[existingIdx] = { ...item, quantity: nextQty, total: nextTotal };
          return updated;
        } else {
          const newItem: SaleItem = {
            productId: product.id,
            productName: product.name,
            unitCost: product.purchasePrice,
            unitPrice: product.sellingPrice,
            quantity: 1,
            discount: 0,
            total: product.sellingPrice,
            isSerialized: false,
            warrantyMonths: product.warrantyMonths,
          };
          return [...prev, newItem];
        }
      });
    }
  };

  // Add specific serialized unit to cart
  const handleSelectUnit = (unit: InventoryUnit, product: Product) => {
    const newItem: SaleItem = {
      productId: product.id,
      productName: `${product.name} (${product.sizeOrStorage || product.color || ''})`,
      unitCost: unit.purchasePrice,
      unitPrice: unit.sellingPrice,
      quantity: 1,
      discount: 0,
      total: unit.sellingPrice,
      isSerialized: true,
      unitId: unit.id,
      imei: unit.imei,
      warrantyMonths: product.warrantyMonths,
    };

    setCartItems((prev) => [...prev, newItem]);
    setSelectingUnitsForProduct(null);
  };

  // Cart item modifications
  const updateItemQty = (index: number, delta: number) => {
    setCartItems((prev) => {
      const item = prev[index];
      if (item.isSerialized) return prev; // Cannot change serialized phone quantity from ticket

      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: nextQty,
        total: nextQty * item.unitPrice - item.discount,
      };
      return updated;
    });
  };

  const updateItemPrice = (index: number, newPrice: number) => {
    setCartItems((prev) => {
      const item = prev[index];
      const validPrice = Math.max(0, newPrice);
      const updated = [...prev];
      updated[index] = {
        ...item,
        unitPrice: validPrice,
        total: item.quantity * validPrice - item.discount,
      };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const itemsDiscount = cartItems.reduce((acc, item) => acc + item.discount, 0);
  const overallDiscount = parseFloat(discountAmount) || 0;
  const netTotal = Math.max(0, subtotal - itemsDiscount - overallDiscount);
  const totalCost = cartItems.reduce((acc, item) => acc + item.quantity * item.unitCost, 0);
  const totalProfit = netTotal - totalCost;

  // Actual amount paid defaulting to netTotal unless overridden
  const effectiveAmountPaid =
    amountPaid === '' ? netTotal : Math.max(0, parseFloat(amountPaid) || 0);

  // Submit sale
  const handleCheckout = () => {
    if (cartItems.length === 0) return;

    const targetBusinessId =
      activeBusinessId !== 'all'
        ? activeBusinessId
        : cartItems[0]?.productId
        ? filteredProducts.find((p) => p.id === cartItems[0].productId)?.businessId || 'biz-shop'
        : 'biz-shop';

    const selectedCust = customers.find((c) => c.id === selectedCustomerId);

    const maxWarrantyMonths = Math.max(...cartItems.map((i) => i.warrantyMonths || 0), 0);
    let warrantyEndDate: string | undefined = undefined;
    if (maxWarrantyMonths > 0) {
      const d = new Date();
      d.setMonth(d.getMonth() + maxWarrantyMonths);
      warrantyEndDate = d.toISOString().split('T')[0];
    }

    let pStatus: PaymentStatus = 'paid';
    if (effectiveAmountPaid <= 0) {
      pStatus = 'pending';
    } else if (effectiveAmountPaid < netTotal) {
      pStatus = 'partial';
    }

    const sale = recordSale({
      businessId: targetBusinessId,
      customerId: selectedCust?.id,
      customerName: selectedCust?.name || 'Walk-in Customer',
      customerPhone: selectedCust?.phone,
      items: cartItems,
      subtotal,
      discount: itemsDiscount + overallDiscount,
      total: netTotal,
      costTotal: totalCost,
      profit: totalProfit,
      amountPaid: effectiveAmountPaid,
      paymentMethod,
      paymentStatus: pStatus,
      notes: notes.trim() || undefined,
      warrantyEndDate,
      date: new Date().toISOString().split('T')[0],
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    setCartItems([]);
    setSelectedCustomerId('');
    setAmountPaid('');
    setDiscountAmount('0');
    setNotes('');
    setIsMobileCartExpanded(false);
    setMobileTab('catalog');
    if (onClearScannedCode) onClearScannedCode();

    onSaleComplete(sale);
  };

  // Quick Customer Creation
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    const newId = addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
    });

    setSelectedCustomerId(newId);
    setNewCustName('');
    setNewCustPhone('');
    setIsNewCustomerOpen(false);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in duration-150">
      {/* Top Header: Title, business context, clear cart & view switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white font-heading tracking-tight">
              Quick Sale (POS)
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-[#1b2230] text-[#e6c673] border border-[#d4af37]/30 text-[10px] font-mono font-bold">
              {activeBusinessId === 'all' ? 'All Ventures' : activeBusiness?.name}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Full-catalog register terminal • Prices in <strong className="text-white font-mono">{currency}</strong>
          </p>
        </div>

        {/* View toggles & Cart controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Grid vs List View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#111622] border border-white/10">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Card View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#1e2536] text-[#e6c673] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="Compact List View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#1e2536] text-[#e6c673] shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Tab switcher (when cart has items on small screens) */}
          <div className="flex lg:hidden items-center p-1 rounded-xl bg-[#111622] border border-white/10 text-xs font-semibold">
            <button
              onClick={() => setMobileTab('catalog')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mobileTab === 'catalog'
                  ? 'bg-[#1e2536] text-[#e6c673] shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Catalog ({catalog.length})
            </button>
            <button
              onClick={() => setMobileTab('cart')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all ${
                mobileTab === 'cart'
                  ? 'bg-[#d4af37] text-black shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Cart ({cartItems.length})</span>
            </button>
          </div>

          {cartItems.length > 0 && (
            <button
              onClick={() => setCartItems([])}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/40 transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Cart
            </button>
          )}
        </div>
      </div>

      {/* Main Dual-Column POS Layout (Full page width on desktop/tablet, stacked on mobile) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ======================================================== */}
        {/* LEFT / MAIN COLUMN: PRODUCT CATALOG & DEPARTMENTS        */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-7 xl:col-span-8 space-y-3.5 ${
            mobileTab === 'cart' ? 'hidden lg:block' : 'block'
          }`}
        >
          {/* Search & Barcode Scan Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone model, accessory, barcode or 15-digit IMEI..."
                className="w-full pl-10 pr-16 py-2.5 rounded-2xl bg-[#111622] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-[#e6c673] focus:outline-none transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-[11px]"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={onOpenScanner}
              className="px-3.5 py-2.5 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold transition-all shadow-sm active:scale-95 shrink-0 flex items-center gap-1.5 text-xs"
              title="Scan Barcode or Phone IMEI"
            >
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">Scan SKU/IMEI</span>
            </button>
          </div>

          {/* Department / Category Tabs with Live Product Counts */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
            {categoriesWithCounts.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-[#d4af37] text-black font-bold shadow-md scale-[1.02]'
                    : 'bg-[#111622] hover:bg-[#161c2a] text-slate-300 hover:text-white border border-white/5'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCategory === cat.name
                      ? 'bg-black/20 text-black font-bold'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </div>

          {/* Department Status & Results Banner */}
          <div className="flex items-center justify-between px-1 text-xs text-slate-400">
            <span className="font-medium">
              Showing <strong className="text-white">{catalog.length}</strong> product{catalog.length === 1 ? '' : 's'} in{' '}
              <strong className="text-[#e6c673]">{selectedCategory}</strong>
              {searchQuery ? ` matching "${searchQuery}"` : ''}
            </span>
            <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
              Tap any item to ring up
            </span>
          </div>

          {/* ======================================================== */}
          {/* PRODUCT CATALOG: FULL PAGE (NO max-h-64 RESTRICTION)     */}
          {/* ======================================================== */}
          {catalog.length === 0 ? (
            <div className="p-10 rounded-3xl bg-[#111622] border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#161c2a] text-[#e6c673] flex items-center justify-center mx-auto border border-[#d4af37]/20">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No products found</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No items match the selected department "{selectedCategory}" or search term "{searchQuery}".
              </p>
              {selectedCategory !== 'All' && (
                <button
                  onClick={() => setSelectedCategory('All')}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1e2536] hover:bg-[#283248] text-[#e6c673] font-bold text-xs border border-[#d4af37]/30 transition-colors"
                >
                  View All Departments ({filteredProducts.length})
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            /* Responsive Grid Cards: Fills full width & height */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {catalog.map((product) => {
                const inCartCount = cartItems
                  .filter((i) => i.productId === product.id)
                  .reduce((sum, i) => sum + i.quantity, 0);

                const isOutOfStock = product.currentStock <= 0;

                return (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    disabled={isOutOfStock}
                    className={`p-3.5 rounded-3xl text-left transition-all active:scale-[0.98] border relative flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-[#0e121a] opacity-40 border-white/5 cursor-not-allowed'
                        : inCartCount > 0
                        ? 'bg-[#161c2b] border-[#d4af37]/50 shadow-md ring-1 ring-[#d4af37]/30'
                        : 'bg-[#111622] hover:bg-[#161d2c] border-white/[0.08] hover:border-white/20 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider truncate">
                          {product.brand}
                        </span>
                        {product.isSerialized ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-950/60 text-[#e6c673] border border-[#d4af37]/30 font-mono font-bold">
                            IMEI
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                              product.currentStock <= product.lowStockThreshold
                                ? 'bg-rose-950/70 text-rose-300 border border-rose-800/40'
                                : 'bg-[#1b2230] text-slate-300'
                            }`}
                          >
                            {product.currentStock} left
                          </span>
                        )}
                      </div>

                      {/* Product Name & Specs */}
                      <h4 className="text-xs font-bold text-white group-hover:text-[#e6c673] line-clamp-2 leading-snug transition-colors">
                        {product.name}
                      </h4>
                      {(product.sizeOrStorage || product.color) && (
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {[product.sizeOrStorage, product.color].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>

                    {/* Price and Cart Action */}
                    <div className="mt-3.5 flex items-baseline justify-between pt-2 border-t border-white/5">
                      <span className="text-xs font-black text-[#e6c673] font-mono">
                        {currency} {product.sellingPrice.toLocaleString()}
                      </span>

                      {inCartCount > 0 ? (
                        <span className="w-5 h-5 rounded-full bg-[#d4af37] text-black font-black text-[11px] flex items-center justify-center shadow-sm">
                          {inCartCount}
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#1e2536] text-slate-400 group-hover:text-white flex items-center justify-center text-xs opacity-70 group-hover:opacity-100 transition-opacity">
                          <Plus className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Dense List View: Rapid scanning and adding */
            <div className="space-y-2">
              {catalog.map((product) => {
                const inCartCount = cartItems
                  .filter((i) => i.productId === product.id)
                  .reduce((sum, i) => sum + i.quantity, 0);

                const isOutOfStock = product.currentStock <= 0;

                return (
                  <div
                    key={product.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isOutOfStock
                        ? 'bg-[#0e121a] opacity-40 border-white/5'
                        : inCartCount > 0
                        ? 'bg-[#161c2b] border-[#d4af37]/40 shadow-sm'
                        : 'bg-[#111622] hover:bg-[#141b27] border-white/[0.08]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {product.brand}
                        </span>
                        {product.isSerialized ? (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/60 text-[#e6c673] font-mono font-bold">
                            IMEI
                          </span>
                        ) : (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-[#1b2230] text-slate-300 font-mono">
                            Stock: {product.currentStock}
                          </span>
                        )}
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                          {product.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate mt-0.5">
                        {product.name}{' '}
                        {product.sizeOrStorage ? `(${product.sizeOrStorage})` : ''}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-black text-[#e6c673] font-mono">
                        {currency} {product.sellingPrice.toLocaleString()}
                      </span>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                          inCartCount > 0
                            ? 'bg-[#d4af37] text-black shadow-sm'
                            : 'bg-[#1b2230] hover:bg-[#252f44] text-[#e6c673] border border-[#d4af37]/30'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{inCartCount > 0 ? `In Cart (${inCartCount})` : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: CURRENT CART / REGISTER TICKET             */}
        {/* ======================================================== */}
        <div
          className={`lg:col-span-5 xl:col-span-4 space-y-3.5 lg:sticky lg:top-16 ${
            mobileTab === 'catalog' ? 'hidden lg:block' : 'block'
          }`}
        >
          {cartItems.length > 0 ? (
            <div className="p-4 sm:p-5 rounded-3xl bg-[#111622] border border-white/10 shadow-2xl space-y-3.5 animate-in fade-in">
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#d4af37] text-black font-black flex items-center justify-center text-xs">
                    {cartItems.length}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
                      Sale Register Ticket
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      {cartItems.reduce((sum, i) => sum + i.quantity, 0)} units ringed up
                    </p>
                  </div>
                </div>

                {activeRole === 'owner' && (
                  <span className="text-[11px] text-emerald-400 font-semibold font-mono">
                    Profit: +{currency} {totalProfit.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-[#161c2a] border border-white/5 space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{item.productName}</p>
                        {item.imei && (
                          <p className="text-[10px] text-[#e6c673] font-mono flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3 text-[#e6c673]" />
                            IMEI: {formatImei(item.imei)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-slate-400 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Price:</span>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItemPrice(idx, parseFloat(e.target.value) || 0)}
                          className="w-24 px-2 py-0.5 rounded-lg bg-[#0e121a] border border-white/10 text-[#e6c673] font-mono text-xs text-right focus:border-[#d4af37] focus:outline-none"
                        />
                      </div>

                      {!item.isSerialized ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateItemQty(idx, -1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-white text-xs min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateItemQty(idx, 1)}
                            className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono font-semibold">
                          1 Unit (IMEI)
                        </span>
                      )}

                      <span className="font-mono font-bold text-white text-xs">
                        {currency} {item.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Customer Link & Payment Method */}
              <div className="space-y-2.5 pt-2 border-t border-white/10">
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#0e121a] border border-white/10 text-white text-xs focus:border-[#e6c673] focus:outline-none"
                  >
                    <option value="">Walk-in Customer (No account link)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}){' '}
                        {c.outstandingBalance > 0
                          ? `[Owes UGX ${c.outstandingBalance.toLocaleString()}]`
                          : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerOpen(true)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#e6c673] border border-white/10 shrink-0"
                    title="Add New Customer"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>

                {/* Payment Method Selector */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'Card', 'Transfer', 'Credit/Pay later'] as PaymentMethod[]).map(
                    (method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 rounded-xl text-center text-xs font-semibold transition-all ${
                          paymentMethod === method
                            ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                            : 'bg-[#141924] text-slate-300 hover:bg-slate-800 border border-white/5'
                        }`}
                      >
                        {method === 'Credit/Pay later' ? 'Credit' : method}
                      </button>
                    )
                  )}
                </div>

                {/* Discount & Partial Payment fields */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Sale Discount ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(e.target.value)}
                      placeholder="0"
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-xs focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                      Amount Paid Now ({currency})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      placeholder={netTotal.toString()}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-xs focus:border-[#d4af37] focus:outline-none"
                    />
                  </div>
                </div>

                {effectiveAmountPaid < netTotal && (
                  <div className="p-2.5 rounded-2xl bg-amber-950/40 border border-amber-800/30 text-[11px] text-[#e6c673] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Remaining Due: {currency} {(netTotal - effectiveAmountPaid).toLocaleString()}{' '}
                      recorded on customer credit balance.
                    </span>
                  </div>
                )}
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#e6c673] to-[#d4af37] hover:from-[#c5a059] hover:to-[#d4af37] text-black font-black text-sm transition-all shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm & Print Receipt • {currency} {netTotal.toLocaleString()}</span>
              </button>
            </div>
          ) : (
            /* Empty Cart Placeholder (Desktop side view) */
            <div className="p-6 rounded-3xl bg-[#111622] border border-white/10 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#161c2a] text-[#e6c673] flex items-center justify-center mx-auto border border-[#d4af37]/20">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-heading">Register Ticket Empty</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tap any product from the catalog on the left or scan a barcode/IMEI to start ringing up a sale.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#0e121a] border border-white/5 space-y-1 text-left text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Today's Total Sales:</span>
                  <span className="font-bold text-white font-mono">{sales.length} transactions</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Register Currency:</span>
                  <span className="font-bold text-[#e6c673] font-mono">{currency}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Cart Bar for Mobile Viewers (Sticky above bottom nav) */}
      {cartItems.length > 0 && mobileTab === 'catalog' && (
        <div className="fixed bottom-20 left-3 right-3 z-30 lg:hidden animate-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => setMobileTab('cart')}
            className="w-full py-3 px-4 rounded-2xl bg-[#d4af37] text-black font-bold text-xs flex items-center justify-between shadow-2xl active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-black text-[#e6c673] flex items-center justify-center text-xs font-black">
                {cartItems.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
              <span>View Cart & Checkout</span>
            </div>
            <div className="flex items-center gap-1 font-mono font-black text-sm">
              <span>{currency} {netTotal.toLocaleString()}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        </div>
      )}

      {/* Select IMEI Unit Modal for Serialized Item */}
      {selectingUnitsForProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 max-h-[85vh] flex flex-col">
            <div className="pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-heading">
                Choose IMEI for {selectingUnitsForProduct.name}
              </h3>
              <p className="text-xs text-slate-400">
                Select the physical phone unit being handed to customer
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {filteredUnits
                .filter(
                  (u) =>
                    u.productId === selectingUnitsForProduct.id &&
                    u.status === 'in_stock' &&
                    !cartItems.some((ci) => ci.unitId === u.id)
                )
                .map((unit) => (
                  <button
                    key={unit.id}
                    onClick={() => handleSelectUnit(unit, selectingUnitsForProduct)}
                    className="w-full p-3 rounded-2xl bg-[#141924] hover:bg-[#1e2536] border border-white/5 hover:border-[#d4af37]/40 text-left transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-white">
                        IMEI: {formatImei(unit.imei)}
                      </span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                    {unit.imei2 && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        IMEI 2: {formatImei(unit.imei2)}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Serial: {unit.serialNumber || 'N/A'}</span>
                      <span className="font-bold text-[#e6c673]">
                        {currency} {unit.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                  </button>
                ))}
            </div>

            <button
              onClick={() => setSelectingUnitsForProduct(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Quick Add Customer Modal */}
      {isNewCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xs bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4">
            <h3 className="text-sm font-bold text-white font-heading mb-3">
              Add New Customer
            </h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Brian Ssemwanga"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Phone (for WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+256 772 123 456"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerOpen(false)}
                  className="py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs"
                >
                  Save & Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
