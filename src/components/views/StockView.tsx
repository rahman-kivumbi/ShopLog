import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Boxes,
  Plus,
  Search,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  History,
  TrendingDown,
  ChevronRight,
  Filter,
  DollarSign,
  PackageCheck,
  RotateCcw,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { Product, StockMovement, InventoryUnit, MovementType, MovementReason } from '../../types';
import { isValidLuhn, formatImei } from '../../lib/luhn';

interface StockViewProps {
  onOpenScanner: (imeiMode?: boolean) => void;
  onOpenAddProductModal: () => void;
  scannedCode?: string | null;
  onClearScannedCode?: () => void;
}

export const StockView: React.FC<StockViewProps> = ({
  onOpenScanner,
  onOpenAddProductModal,
  scannedCode,
  onClearScannedCode,
}) => {
  const {
    filteredProducts,
    filteredUnits,
    filteredMovements,
    suppliers,
    activeBusiness,
    activeBusinessId,
    currency,
    deleteProduct,
    addStockMovement,
    activeRole,
    findUnitByImei,
    addPurchaseOrder,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'imei_search' | 'movements' | 'insights'>('catalog');
  const [searchQuery, setSearchQuery] = useState(scannedCode || '');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Stock Adjustment / Movement modal
  const [movementModalProduct, setMovementModalProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [movementReason, setMovementReason] = useState<MovementReason>('purchase');
  const [movementQuantity, setMovementQuantity] = useState<string>('1');
  const [movementCost, setMovementCost] = useState<string>('');
  const [movementNotes, setMovementNotes] = useState<string>('');

  // IMEI Lookup input
  const [imeiLookupInput, setImeiLookupInput] = useState(scannedCode || '');

  // Total valuation
  const totalValuationCost = filteredProducts.reduce(
    (sum, p) => sum + p.currentStock * p.purchasePrice,
    0
  );
  const totalValuationSelling = filteredProducts.reduce(
    (sum, p) => sum + p.currentStock * p.sellingPrice,
    0
  );

  // Filtered Products
  const displayedProducts = useMemo(() => {
    return filteredProducts.filter((p) => {
      if (stockFilter === 'low' && p.currentStock > p.lowStockThreshold) return false;
      if (stockFilter === 'out' && p.currentStock > 0) return false;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.model.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    });
  }, [filteredProducts, stockFilter, searchQuery]);

  // IMEI Lookup result
  const imeiSearchResult = useMemo(() => {
    if (!imeiLookupInput.trim()) return null;
    return findUnitByImei(imeiLookupInput);
  }, [imeiLookupInput, findUnitByImei]);

  // Restock suggestions
  const restockSuggestions = useMemo(() => {
    return filteredProducts.filter((p) => p.currentStock <= p.lowStockThreshold);
  }, [filteredProducts]);

  // Handle Quick PO creation from Restock suggestion
  const handleQuickRestockPO = (product: Product) => {
    const targetSup = suppliers.find((s) => s.id === product.supplierId) || suppliers[0];
    const orderQty = Math.max(5, product.lowStockThreshold * 3);
    const totalCost = orderQty * product.purchasePrice;

    addPurchaseOrder({
      businessId: product.businessId,
      supplierId: targetSup?.id || 'sup-1',
      supplierName: targetSup?.name || 'Kampala Wholesale Hub',
      items: [
        {
          productId: product.id,
          productName: product.name,
          quantity: orderQty,
          unitCost: product.purchasePrice,
          totalCost,
          isSerialized: product.isSerialized,
        },
      ],
      totalAmount: totalCost,
      status: 'ordered',
      date: new Date().toISOString().split('T')[0],
      notes: `Restock suggestion created from low stock alert (Threshold: ${product.lowStockThreshold})`,
    });

    alert(`Purchase Order drafted for ${orderQty} units of ${product.name}! View in People > Suppliers tab.`);
  };

  // Stock Movement Submit
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModalProduct) return;

    const qty = parseInt(movementQuantity) || 1;
    const cost = movementCost ? parseFloat(movementCost) : movementModalProduct.purchasePrice;

    addStockMovement({
      businessId: movementModalProduct.businessId,
      productId: movementModalProduct.id,
      type: movementType,
      reason: movementReason,
      quantity: qty,
      costPerUnit: cost,
      notes: movementNotes.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    });

    setMovementModalProduct(null);
    setMovementNotes('');
    setMovementQuantity('1');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Title & Valuation */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            Inventory & Stock
          </h1>
          <p className="text-xs text-slate-400">
            {activeRole === 'owner' ? (
              <span>
                Valuation: <strong className="text-[#e6c673] font-mono">{currency} {totalValuationCost.toLocaleString()}</strong> cost • <strong className="text-white font-mono">{currency} {totalValuationSelling.toLocaleString()}</strong> retail
              </span>
            ) : (
              <span>{filteredProducts.length} catalog items</span>
            )}
          </p>
        </div>
        <button
          onClick={onOpenAddProductModal}
          className="px-3.5 py-2 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Sub Tabs: Catalog, IMEI Search, Movements, Insights */}
      <div className="grid grid-cols-4 p-1 bg-[#111622] rounded-2xl border border-white/10 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeSubTab === 'catalog'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Catalog
        </button>
        <button
          onClick={() => setActiveSubTab('imei_search')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeSubTab === 'imei_search'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          IMEI Lookup
        </button>
        <button
          onClick={() => setActiveSubTab('movements')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeSubTab === 'movements'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Audit Log
        </button>
        <button
          onClick={() => setActiveSubTab('insights')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeSubTab === 'insights'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Restock
        </button>
      </div>

      {/* CATALOG SUB-TAB */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-3">
          {/* Search & Stock Filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by model, brand, barcode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#111622] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-[#e6c673] focus:outline-none"
              />
            </div>
            <button
              onClick={() => onOpenScanner(false)}
              className="p-2.5 rounded-2xl bg-[#1c2333] hover:bg-[#252f44] text-[#e6c673] border border-white/10 shrink-0"
              title="Scan Barcode"
            >
              <QrCode className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'all'
                  ? 'bg-[#1e2536] text-[#e6c673] border border-[#d4af37]/40'
                  : 'bg-[#111622] text-slate-400 border border-white/5'
              }`}
            >
              All ({filteredProducts.length})
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'low'
                  ? 'bg-amber-950/40 text-amber-300 border border-amber-500/40'
                  : 'bg-[#111622] text-slate-400 border border-white/5'
              }`}
            >
              Low Stock ({filteredProducts.filter((p) => p.currentStock <= p.lowStockThreshold && p.currentStock > 0).length})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                stockFilter === 'out'
                  ? 'bg-rose-950/40 text-rose-300 border border-rose-500/40'
                  : 'bg-[#111622] text-slate-400 border border-white/5'
              }`}
            >
              Out of Stock ({filteredProducts.filter((p) => p.currentStock === 0).length})
            </button>
          </div>

          {/* Product Items List */}
          <div className="space-y-2.5">
            {displayedProducts.map((product) => {
              const profit = product.sellingPrice - product.purchasePrice;
              const margin = product.sellingPrice > 0 ? ((profit / product.sellingPrice) * 100).toFixed(0) : '0';

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] hover:border-white/15 transition-all space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                          {product.brand}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-[10px] text-slate-400">{product.category}</span>
                        {product.condition !== 'New' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-[#e6c673] border border-amber-800/40">
                            {product.condition}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {product.model} {product.sizeOrStorage ? `• ${product.sizeOrStorage}` : ''}{' '}
                        {product.color ? `• ${product.color}` : ''}
                      </p>
                    </div>

                    {/* Stock Count Pill */}
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
                          product.currentStock <= 0
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                            : product.currentStock <= product.lowStockThreshold
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                            : 'bg-[#181f2e] text-slate-200 border-white/10'
                        }`}
                      >
                        {product.currentStock} in stock
                      </span>
                      {product.isSerialized && (
                        <p className="text-[10px] text-[#e6c673] font-mono font-medium mt-0.5">
                          Tracked by IMEI
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Financials & Stock Controls */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs">
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono font-black text-white text-sm">
                        {currency} {product.sellingPrice.toLocaleString()}
                      </span>
                      {activeRole === 'owner' && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Cost: {currency} {product.purchasePrice.toLocaleString()} ({margin}% margin)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setMovementModalProduct(product);
                          setMovementType('in');
                          setMovementReason('purchase');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#1c2333] hover:bg-[#252f44] text-[#e6c673] text-xs font-semibold border border-white/10"
                        title="Stock In / Add Stock"
                      >
                        + Stock In
                      </button>
                      <button
                        onClick={() => {
                          setMovementModalProduct(product);
                          setMovementType('adjustment');
                          setMovementReason('correction');
                        }}
                        className="p-1.5 rounded-xl bg-[#1c2333] hover:bg-[#252f44] text-slate-400 hover:text-white"
                        title="Adjust Stock Count"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-1.5 rounded-xl bg-[#1c2333] hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* IMEI SEARCH SUB-TAB */}
      {activeSubTab === 'imei_search' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-[#111622] border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Phone IMEI Instant Lookup
            </h3>
            <p className="text-xs text-slate-400">
              Scan or enter 15-digit IMEI to verify authenticity, check supplier, sale date, and warranty.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={imeiLookupInput}
                onChange={(e) => setImeiLookupInput(e.target.value)}
                placeholder="Enter 15-digit IMEI number..."
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#0e121a] border border-white/10 text-white font-mono text-xs focus:border-[#e6c673] focus:outline-none"
              />
              <button
                onClick={() => onOpenScanner(true)}
                className="p-2.5 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold shrink-0"
                title="Scan IMEI with Camera"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {imeiLookupInput.length === 15 && (
              <div
                className={`p-2 rounded-xl text-xs flex items-center gap-2 ${
                  isValidLuhn(imeiLookupInput)
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-800/30'
                }`}
              >
                {isValidLuhn(imeiLookupInput) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Luhn check passed: Valid GSM phone IMEI</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    <span>Invalid Luhn Checksum! Digits do not match IMEI standard.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {imeiSearchResult ? (
            <div className="p-4 rounded-3xl bg-[#111622] border border-emerald-500/30 space-y-3 shadow-lg">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white font-heading">Unit Match Found</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase font-mono ${
                    imeiSearchResult.unit?.status === 'in_stock'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {imeiSearchResult.unit?.status === 'in_stock' ? 'In Stock' : 'Sold'}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                <p className="text-sm font-bold text-white">
                  {imeiSearchResult.product?.name}
                </p>
                <p className="text-slate-400 font-mono text-[11px]">
                  IMEI 1: {formatImei(imeiSearchResult.unit?.imei || '')}
                </p>
                {imeiSearchResult.unit?.imei2 && (
                  <p className="text-slate-400 font-mono text-[11px]">
                    IMEI 2: {formatImei(imeiSearchResult.unit.imei2)}
                  </p>
                )}
                <p className="text-slate-400">
                  Storage/Spec: {imeiSearchResult.product?.sizeOrStorage} • {imeiSearchResult.product?.color}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Selling Price</span>
                  <span className="font-bold text-white font-mono">
                    {currency} {imeiSearchResult.unit?.sellingPrice.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Warranty Period</span>
                  <span className="font-bold text-[#e6c673] font-mono">
                    {imeiSearchResult.product?.warrantyMonths} Months
                  </span>
                </div>

                {imeiSearchResult.sale && (
                  <div className="col-span-2 p-3 rounded-2xl bg-[#0e121a] border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Sold Transaction Record:
                    </span>
                    <p className="text-white font-mono text-xs">
                      Invoice: {imeiSearchResult.sale.invoiceNumber}
                    </p>
                    <p className="text-slate-300">
                      Customer: {imeiSearchResult.sale.customerName} ({imeiSearchResult.sale.customerPhone || 'N/A'})
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Sold on: {imeiSearchResult.sale.date}
                    </p>
                    {imeiSearchResult.sale.warrantyEndDate && (
                      <p className="text-emerald-400 text-[11px] font-bold">
                        Warranty expires: {imeiSearchResult.sale.warrantyEndDate}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : imeiLookupInput ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-[#111622] rounded-3xl border border-white/10">
              No inventory unit found with IMEI "{imeiLookupInput}". Check the number or add it as a new product unit.
            </div>
          ) : null}

          {/* Registered in-stock serialized phone list */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-heading">
              In-Stock Serialized Units ({filteredUnits.filter((u) => u.status === 'in_stock').length})
            </h4>
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {filteredUnits
                .filter((u) => u.status === 'in_stock')
                .map((unit) => {
                  const prod = filteredProducts.find((p) => p.id === unit.productId);
                  return (
                    <div
                      key={unit.id}
                      onClick={() => setImeiLookupInput(unit.imei)}
                      className="p-3 rounded-2xl bg-[#111622] hover:bg-[#181f2e] border border-white/5 cursor-pointer flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <p className="font-bold text-white truncate max-w-[200px]">
                          {prod?.name || 'Device'}
                        </p>
                        <p className="font-mono text-[10px] text-[#e6c673]">
                          {formatImei(unit.imei)}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-200">
                        {currency} {unit.sellingPrice.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* MOVEMENTS AUDIT LOG SUB-TAB */}
      {activeSubTab === 'movements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Stock Movement History
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {filteredMovements.length} total events
            </span>
          </div>

          <div className="space-y-2">
            {filteredMovements.map((mov) => {
              const prod = filteredProducts.find((p) => p.id === mov.productId);

              return (
                <div
                  key={mov.id}
                  className="p-3.5 rounded-3xl bg-[#111622] border border-white/10 flex items-start justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-lg font-mono font-bold uppercase ${
                          mov.type === 'in'
                            ? 'bg-emerald-950/60 text-emerald-300'
                            : mov.type === 'out'
                            ? 'bg-rose-950/60 text-rose-300'
                            : 'bg-amber-950/60 text-amber-300'
                        }`}
                      >
                        {mov.type.toUpperCase()}: {mov.reason.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{mov.date}</span>
                    </div>
                    <p className="font-bold text-white truncate">{prod?.name || 'Product'}</p>
                    {mov.notes && <p className="text-[11px] text-slate-400 mt-0.5">{mov.notes}</p>}
                    {mov.imei && (
                      <p className="text-[10px] text-[#e6c673] font-mono mt-0.5">IMEI: {formatImei(mov.imei)}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-black text-sm ${
                        mov.type === 'in'
                          ? 'text-emerald-400'
                          : mov.type === 'out'
                          ? 'text-rose-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {mov.type === 'in' ? '+' : mov.type === 'out' ? '-' : '±'}
                      {mov.quantity}
                    </span>
                    {activeRole === 'owner' && mov.costPerUnit > 0 && (
                      <p className="text-[10px] text-slate-500 font-mono">
                        @{currency} {mov.costPerUnit.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESTOCK & INSIGHTS SUB-TAB */}
      {activeSubTab === 'insights' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-[#111622] border border-white/10 space-y-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Smart Restock Suggestions
            </h3>
            <p className="text-xs text-slate-400">
              Products at or below their safety threshold. Click to create a purchase order.
            </p>
          </div>

          {restockSuggestions.length === 0 ? (
            <div className="p-8 text-center bg-[#111622] rounded-3xl border border-white/10 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white font-heading">All Stock Levels Healthy!</p>
              <p className="text-xs text-slate-400">
                No items currently below their reorder threshold.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {restockSuggestions.map((prod) => {
                const sup = suppliers.find((s) => s.id === prod.supplierId);

                return (
                  <div
                    key={prod.id}
                    className="p-4 rounded-3xl bg-[#111622] border border-amber-500/20 flex items-center justify-between gap-2 shadow-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-amber-950/60 text-[#e6c673] font-mono font-bold">
                          {prod.currentStock === 0 ? 'Out of Stock' : `Low: ${prod.currentStock} left`}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Threshold: {prod.lowStockThreshold}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                      <p className="text-[11px] text-slate-400">
                        Supplier: {sup?.name || 'Wholesale Supplier'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleQuickRestockPO(prod)}
                      className="px-3 py-2 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs shrink-0 active:scale-95 transition-all shadow-sm flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Create PO
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* STOCK MOVEMENT / ADJUSTMENT MODAL */}
      {movementModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <div className="pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-heading">
                Stock Adjustment: {movementModalProduct.name}
              </h3>
              <p className="text-xs text-slate-400">
                Current stock: {movementModalProduct.currentStock} units
              </p>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Movement Action
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['in', 'out', 'adjustment'] as MovementType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMovementType(t)}
                      className={`py-2 rounded-xl text-center font-bold capitalize transition-all ${
                        movementType === t
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-[#141924] text-slate-400 border border-white/5'
                      }`}
                    >
                      {t === 'in' ? 'Stock In' : t === 'out' ? 'Stock Out' : 'Correct'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-1">
                  Reason / Notes
                </label>
                <input
                  type="text"
                  value={movementNotes}
                  onChange={(e) => setMovementNotes(e.target.value)}
                  placeholder="e.g. Delivery from Kampala hub, display unit..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementModalProduct(null)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold"
                >
                  Apply & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
