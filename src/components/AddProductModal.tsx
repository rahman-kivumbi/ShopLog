import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Camera,
  QrCode,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Boxes,
  Info,
  Plus,
  Trash2,
  Sparkles,
  Barcode,
  Layers,
} from 'lucide-react';
import { ProductCondition, ProductCategory } from '../types';
import { isValidLuhn, formatImei, generateValidDemoImei } from '../lib/luhn';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScannerForBarcode: (onScanned: (code: string) => void) => void;
}

export type AddProductTab = 'basic' | 'pricing' | 'inventory';

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onOpenScannerForBarcode,
}) => {
  const {
    filteredProducts,
    filteredUnits,
    suppliers,
    activeBusinessId,
    currency,
    addProduct,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AddProductTab>('basic');

  // Tab 1: Basic Info
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState<ProductCategory | string>('Phones');
  const [condition, setCondition] = useState<ProductCondition>('New');
  const [sizeOrStorage, setSizeOrStorage] = useState('256GB');
  const [color, setColor] = useState('');
  const [variant, setVariant] = useState('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');

  // Tab 2: Pricing & Supplier
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [supplierId, setSupplierId] = useState<string>('');
  const [warrantyMonths, setWarrantyMonths] = useState<string>('12');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('2');

  // Tab 3: Inventory / Serialization
  const [isSerialized, setIsSerialized] = useState<boolean>(true);
  const [initialQuantity, setInitialQuantity] = useState<string>('1');
  const [serializedUnits, setSerializedUnits] = useState<
    { imei: string; imei2: string; serial: string }[]
  >([{ imei: '', imei2: '', serial: '' }]);

  // Default supplier on open
  useEffect(() => {
    if (suppliers.length > 0 && !supplierId) {
      setSupplierId(suppliers[0].id);
    }
  }, [suppliers, supplierId]);

  if (!isOpen) return null;

  // Real-time Financial Calculations (UGX)
  const costNum = parseFloat(purchasePrice) || 0;
  const priceNum = parseFloat(sellingPrice) || 0;
  const grossProfit = priceNum - costNum;
  const marginPercent = priceNum > 0 ? ((grossProfit / priceNum) * 100).toFixed(1) : '0';
  const markupPercent = costNum > 0 ? ((grossProfit / costNum) * 100).toFixed(1) : '0';

  // Trigger camera scanner for the SKU / Barcode input
  const handleScanSkuCamera = () => {
    onOpenScannerForBarcode((scannedText) => {
      setBarcode(scannedText);
    });
  };

  // Trigger camera scanner for an individual IMEI in the units list
  const handleScanImeiCamera = (index: number) => {
    onOpenScannerForBarcode((scannedText) => {
      const cleanDigits = scannedText.replace(/\D/g, '');
      const updated = [...serializedUnits];
      updated[index].imei = cleanDigits || scannedText;
      setSerializedUnits(updated);
    });
  };

  // Add unit row
  const handleAddUnitRow = () => {
    setSerializedUnits((prev) => [...prev, { imei: '', imei2: '', serial: '' }]);
  };

  // Remove unit row
  const handleRemoveUnitRow = (index: number) => {
    if (serializedUnits.length <= 1) return;
    setSerializedUnits((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setActiveTab('basic');
      alert('Please provide a product name.');
      return;
    }

    if (!purchasePrice || !sellingPrice) {
      setActiveTab('pricing');
      alert('Please specify both purchase cost and selling price.');
      return;
    }

    // Process serialized units if serialized
    const validUnits: { imei: string; imei2?: string; serial?: string }[] = [];
    if (isSerialized) {
      for (const u of serializedUnits) {
        if (u.imei.trim()) {
          // Check duplicate in current database
          const duplicate = filteredUnits.some(
            (existing) =>
              existing.imei === u.imei.trim() ||
              (existing.imei2 && existing.imei2 === u.imei.trim())
          );
          if (duplicate) {
            setActiveTab('inventory');
            alert(`IMEI ${u.imei} is already registered in inventory! Please verify.`);
            return;
          }

          validUnits.push({
            imei: u.imei.trim(),
            imei2: u.imei2.trim() || undefined,
            serial: u.serial.trim() || undefined,
          });
        }
      }

      if (validUnits.length === 0) {
        setActiveTab('inventory');
        alert('Please enter at least one valid 15-digit IMEI for serialized phone inventory.');
        return;
      }
    }

    const targetBusinessId =
      activeBusinessId !== 'all' ? activeBusinessId : 'biz-shop';

    addProduct(
      {
        businessId: targetBusinessId,
        name: name.trim(),
        brand: brand.trim() || 'Generic',
        model: model.trim() || 'Standard',
        category,
        sizeOrStorage: sizeOrStorage.trim() || undefined,
        color: color.trim() || undefined,
        variant: variant.trim() || undefined,
        condition,
        barcode: barcode.trim() || undefined,
        purchasePrice: costNum,
        sellingPrice: priceNum,
        supplierId: supplierId || undefined,
        lowStockThreshold: parseInt(lowStockThreshold) || 2,
        warrantyMonths: parseInt(warrantyMonths) || 0,
        isSerialized,
        notes: notes.trim() || undefined,
      },
      isSerialized ? validUnits : undefined
    );

    // Reset and close
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setBrand('');
    setModel('');
    setCategory('Phones');
    setCondition('New');
    setSizeOrStorage('256GB');
    setColor('');
    setVariant('');
    setBarcode('');
    setNotes('');
    setPurchasePrice('');
    setSellingPrice('');
    setWarrantyMonths('12');
    setLowStockThreshold('2');
    setIsSerialized(true);
    setSerializedUnits([{ imei: '', imei2: '', serial: '' }]);
    setActiveTab('basic');
  };

  const categories = [
    'Phones',
    'Accessories',
    'Chargers',
    'Audio',
    'Computers',
    'Repairs & Parts',
    'Snacks & Drinks',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e121a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#131822]">
          <div>
            <h3 className="text-base font-bold text-white font-heading tracking-tight">
              Add New Product
            </h3>
            <p className="text-xs text-slate-400">
              Multi-step catalog entry • {currency} Currency
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Step Tabs Navigation */}
        <div className="grid grid-cols-3 p-1.5 bg-[#090c12] border-b border-white/10 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`py-2 px-1 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'basic'
                ? 'bg-[#1b2230] text-[#e6c673] font-bold border border-[#e6c673]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span className="truncate">Basic Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-2 px-1 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'pricing'
                ? 'bg-[#1b2230] text-[#e6c673] font-bold border border-[#e6c673]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span className="truncate">Pricing & Supplier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inventory')}
            className={`py-2 px-1 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-[#1b2230] text-[#e6c673] font-bold border border-[#e6c673]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span className="truncate">Inventory/Serialisation</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* ======================================================== */}
          {/* TAB 1: BASIC INFO                                       */}
          {/* ======================================================== */}
          {activeTab === 'basic' && (
            <div className="space-y-3.5 animate-in fade-in duration-150 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Product / Phone Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apple iPhone 15 Pro Max"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#141924] border border-white/10 text-white focus:border-[#e6c673] focus:outline-none text-sm font-medium"
                />
              </div>

              {/* SKU / Barcode Input with Integrated Camera Scanner */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  SKU / Barcode (Scan or Type)
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="e.g. 195949038221 or scan with camera"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-xs focus:border-[#e6c673] focus:outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleScanSkuCamera}
                    className="px-3 py-2.5 rounded-xl bg-[#222b3d] hover:bg-[#2c364d] text-[#e6c673] border border-[#e6c673]/30 flex items-center gap-1.5 font-semibold text-xs active:scale-95 transition-all shrink-0"
                    title="Open Camera Barcode Scanner"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Scan SKU</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Point your Nokia G22 or phone camera at the box barcode to auto-populate.
                </p>
              </div>

              {/* Brand and Model */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Apple, Samsung, Nokia..."
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Model Number
                  </label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="e.g. A3102, SM-S928B"
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              {/* Category & Condition */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ProductCondition)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  >
                    <option value="New">Brand New (Factory Sealed)</option>
                    <option value="Used">Used / Pre-Owned</option>
                    <option value="Refurbished">Refurbished (A-Grade)</option>
                  </select>
                </div>
              </div>

              {/* Storage, Color & Variant */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Storage / Spec
                  </label>
                  <input
                    type="text"
                    value={sizeOrStorage}
                    onChange={(e) => setSizeOrStorage(e.target.value)}
                    placeholder="128GB, 256GB..."
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Titanium, Black..."
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Variant
                  </label>
                  <input
                    type="text"
                    value={variant}
                    onChange={(e) => setVariant(e.target.value)}
                    placeholder="Dual SIM..."
                    className="w-full px-2.5 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. TRA / EA spec, includes charger in box..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs"
                />
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PRICING & SUPPLIER                               */}
          {/* ======================================================== */}
          {activeTab === 'pricing' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              {/* Cost & Selling Price Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Purchase Cost ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="e.g. 3800000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-sm focus:border-[#e6c673] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Wholesale cost</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Selling Price ({currency}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="e.g. 4250000"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#141924] border border-white/10 text-[#e6c673] font-mono font-bold text-sm focus:border-[#e6c673] focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Counter retail price</span>
                </div>
              </div>

              {/* Automatic Live Financial Calculation Panel */}
              <div className="p-4 rounded-2xl bg-[#141924] border border-[#e6c673]/20 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-heading">
                    Live Profit & Margin Breakdown
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Auto-calculated
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-[#1c2230]">
                    <span className="text-[10px] text-slate-400 block">Unit Profit</span>
                    <span
                      className={`font-mono font-black text-xs ${
                        grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {currency} {grossProfit.toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#1c2230]">
                    <span className="text-[10px] text-slate-400 block">Profit Margin</span>
                    <span className="font-mono font-black text-xs text-[#e6c673]">
                      {marginPercent}%
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#1c2230]">
                    <span className="text-[10px] text-slate-400 block">Markup</span>
                    <span className="font-mono font-black text-xs text-slate-200">
                      {markupPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Supplier Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Primary Supplier
                </label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#141924] border border-white/10 text-white"
                >
                  <option value="">No supplier linked</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.contactPerson || s.phone || 'Uganda'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Warranty & Low Stock Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Warranty (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(e.target.value)}
                    placeholder="12"
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Appears on retail receipt
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Low Stock Alert
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Triggers reorder badge
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: INVENTORY & SERIALIZATION                         */}
          {/* ======================================================== */}
          {activeTab === 'inventory' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              {/* Serialization Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSerialized}
                    onChange={(e) => setIsSerialized(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e6c673] focus:ring-0"
                  />
                  <div>
                    <span className="font-bold text-white block">
                      Serialized Inventory Tracking (Phone IMEI / Device Serial)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Enable for smartphones and electronics where each physical unit has a unique 15-digit IMEI.
                    </span>
                  </div>
                </label>
              </div>

              {/* SERIALIZED SECTION */}
              {isSerialized ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-xs font-heading">
                        Initial Batch IMEIs ({serializedUnits.filter((u) => u.imei).length} units)
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Camera scan or type 15-digit IMEI with Luhn validation.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddUnitRow}
                      className="px-2.5 py-1 rounded-xl bg-[#222b3d] hover:bg-[#2c364d] text-[#e6c673] font-bold text-[11px] flex items-center gap-1 border border-[#e6c673]/30"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Unit
                    </button>
                  </div>

                  {/* Units List */}
                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {serializedUnits.map((unit, idx) => {
                      const digits = unit.imei.replace(/\D/g, '');
                      const isValid = digits.length === 15 ? isValidLuhn(digits) : null;

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-[#141924] border border-white/10 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                              Unit #{idx + 1}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {/* Quick demo generate button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const gen = generateValidDemoImei('35981204');
                                  const updated = [...serializedUnits];
                                  updated[idx].imei = gen;
                                  setSerializedUnits(updated);
                                }}
                                className="text-[10px] text-slate-400 hover:text-[#e6c673] font-mono px-1.5 py-0.5 rounded bg-slate-800"
                              >
                                Test IMEI
                              </button>

                              {serializedUnits.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveUnitRow(idx)}
                                  className="text-slate-500 hover:text-rose-400 p-0.5"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* IMEI 1 with camera button */}
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              maxLength={15}
                              value={unit.imei}
                              onChange={(e) => {
                                const updated = [...serializedUnits];
                                updated[idx].imei = e.target.value.replace(/\D/g, '');
                                setSerializedUnits(updated);
                              }}
                              placeholder="15-digit IMEI 1"
                              className="flex-1 px-3 py-1.5 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-xs focus:border-[#e6c673] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleScanImeiCamera(idx)}
                              className="p-2 rounded-xl bg-[#222b3d] hover:bg-[#2c364d] text-[#e6c673] border border-[#e6c673]/30"
                              title="Scan IMEI from box sticker"
                            >
                              <Camera className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* IMEI 2 (Dual SIM) & Serial */}
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              maxLength={15}
                              value={unit.imei2}
                              onChange={(e) => {
                                const updated = [...serializedUnits];
                                updated[idx].imei2 = e.target.value.replace(/\D/g, '');
                                setSerializedUnits(updated);
                              }}
                              placeholder="IMEI 2 (Dual-SIM)"
                              className="px-2.5 py-1.5 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-[11px]"
                            />
                            <input
                              type="text"
                              value={unit.serial}
                              onChange={(e) => {
                                const updated = [...serializedUnits];
                                updated[idx].serial = e.target.value;
                                setSerializedUnits(updated);
                              }}
                              placeholder="Serial Number"
                              className="px-2.5 py-1.5 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-[11px]"
                            />
                          </div>

                          {/* Live Luhn Feedback */}
                          {unit.imei && (
                            <div className="text-[10px] font-mono flex items-center gap-1.5 pt-0.5">
                              {isValid === true ? (
                                <span className="text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Valid Luhn Checksum ({formatImei(unit.imei)})
                                </span>
                              ) : digits.length === 15 ? (
                                <span className="text-rose-400 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> Invalid Luhn Checksum! Check digits.
                                </span>
                              ) : (
                                <span className="text-slate-400">
                                  {digits.length}/15 digits entered
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* NON-SERIALIZED SECTION */
                <div className="p-4 rounded-2xl bg-[#141924] border border-white/10 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Initial Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={initialQuantity}
                      onChange={(e) => setInitialQuantity(e.target.value)}
                      placeholder="e.g. 25"
                      className="w-full px-3 py-2 rounded-xl bg-[#0e121a] border border-white/10 text-white font-mono text-sm"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Accessories, chargers, cases, and popcorn are tracked by simple count.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
            {activeTab !== 'basic' ? (
              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'inventory' ? 'pricing' : 'basic')
                }
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold"
              >
                Cancel
              </button>
            )}

            {activeTab !== 'inventory' ? (
              <button
                type="button"
                onClick={() =>
                  setActiveTab(activeTab === 'basic' ? 'pricing' : 'inventory')
                }
                className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1 shadow-md transition-all active:scale-95"
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#e6c673] hover:from-[#c5a059] hover:to-[#d4af37] text-black font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Product & Inventory
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
