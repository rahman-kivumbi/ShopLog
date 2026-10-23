import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Users,
  Truck,
  Phone,
  MessageCircle,
  Plus,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  PackageCheck,
  X,
  CreditCard,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Customer, Supplier, PurchaseOrder } from '../../types';

export const PeopleView: React.FC = () => {
  const {
    customers,
    suppliers,
    filteredOrders,
    filteredProducts,
    currency,
    addCustomer,
    updateCustomer,
    recordCustomerPayment,
    addSupplier,
    updateSupplier,
    recordSupplierPayment,
    addPurchaseOrder,
    receivePurchaseOrder,
    activeBusinessId,
    activeRole,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers' | 'orders'>('customers');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment modal state
  const [paymentTargetCustomer, setPaymentTargetCustomer] = useState<Customer | null>(null);
  const [paymentTargetSupplier, setPaymentTargetSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Create Customer / Supplier modal
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [newSupName, setNewSupName] = useState('');
  const [newSupContact, setNewSupContact] = useState('');
  const [newSupPhone, setNewSupPhone] = useState('');
  const [newSupEmail, setNewSupEmail] = useState('');
  const [newSupNotes, setNewSupNotes] = useState('');

  // Create Purchase Order modal
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poProductId, setPoProductId] = useState('');
  const [poQuantity, setPoQuantity] = useState('5');
  const [poUnitCost, setPoUnitCost] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // Filtered lists
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.phone?.includes(q);
  });

  // Open WhatsApp chat
  const handleOpenWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const text = encodeURIComponent(`Hello ${name}, this is Ranks Phones & Electronics Kampala.`);
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  // Customer Payment
  const handleCustomerPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetCustomer) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    recordCustomerPayment(paymentTargetCustomer.id, amt);
    setPaymentTargetCustomer(null);
    setPaymentAmount('');
  };

  // Supplier Payment
  const handleSupplierPaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTargetSupplier) return;
    const amt = parseFloat(paymentAmount) || 0;
    if (amt <= 0) return;

    recordSupplierPayment(paymentTargetSupplier.id, amt);
    setPaymentTargetSupplier(null);
    setPaymentAmount('');
  };

  // Add Customer Submit
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustPhone.trim()) return;

    addCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      email: newCustEmail.trim() || undefined,
      notes: newCustNotes.trim() || undefined,
    });

    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  // Add Supplier Submit
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupName.trim()) return;

    addSupplier({
      name: newSupName.trim(),
      contactPerson: newSupContact.trim() || undefined,
      phone: newSupPhone.trim() || undefined,
      email: newSupEmail.trim() || undefined,
      notes: newSupNotes.trim() || undefined,
    });

    setIsAddSupplierOpen(false);
    setNewSupName('');
    setNewSupPhone('');
    setNewSupContact('');
  };

  // Add Purchase Order Submit
  const handleAddPOSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId) || suppliers[0];
    const prod = filteredProducts.find((p) => p.id === poProductId) || filteredProducts[0];
    if (!sup || !prod) return;

    const qty = parseInt(poQuantity) || 1;
    const cost = poUnitCost ? parseFloat(poUnitCost) : prod.purchasePrice;
    const total = qty * cost;

    const targetBizId = activeBusinessId !== 'all' ? activeBusinessId : prod.businessId;

    addPurchaseOrder({
      businessId: targetBizId,
      supplierId: sup.id,
      supplierName: sup.name,
      items: [
        {
          productId: prod.id,
          productName: prod.name,
          quantity: qty,
          unitCost: cost,
          totalCost: total,
          isSerialized: prod.isSerialized,
        },
      ],
      totalAmount: total,
      status: 'ordered',
      date: new Date().toISOString().split('T')[0],
      notes: poNotes.trim() || undefined,
    });

    setIsAddPOOpen(false);
    setPoQuantity('5');
    setPoUnitCost('');
    setPoNotes('');
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            People & Vendors
          </h1>
          <p className="text-xs text-slate-400">
            Customers, Supplier wholesale accounts & Purchase Orders
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 p-1 bg-[#111622] rounded-2xl border border-white/10 gap-1 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('customers')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeTab === 'customers'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Customers ({customers.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeTab === 'suppliers'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-2 rounded-xl text-center transition-all ${
            activeTab === 'orders'
              ? 'bg-[#1e2536] text-[#e6c673] font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Purchase Orders
        </button>
      </div>

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customers by name or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#111622] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-[#e6c673] focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsAddCustomerOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{customer.name}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{customer.phone}</p>
                    {customer.notes && (
                      <p className="text-[11px] text-slate-400 mt-1">{customer.notes}</p>
                    )}
                  </div>

                  <div className="text-right">
                    {customer.outstandingBalance > 0 ? (
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-950/60 text-[#e6c673] border border-amber-800/40 text-[11px] font-mono font-bold">
                        Owes: {currency} {customer.outstandingBalance.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 text-[10px] font-mono font-bold">
                        No Debt
                      </span>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Spent: {currency} {customer.totalSpent.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${customer.phone}`}
                      className="p-2 rounded-xl bg-[#161c2a] hover:bg-[#1f273a] text-slate-200 border border-white/5 flex items-center gap-1.5 text-[11px]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#e6c673]" /> Call
                    </a>
                    <button
                      onClick={() => handleOpenWhatsApp(customer.phone, customer.name)}
                      className="p-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/30 flex items-center gap-1.5 text-[11px]"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> WhatsApp
                    </button>
                  </div>

                  {customer.outstandingBalance > 0 && (
                    <button
                      onClick={() => {
                        setPaymentTargetCustomer(customer);
                        setPaymentAmount(customer.outstandingBalance.toString());
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-[11px] shadow-sm"
                    >
                      Record Payment
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPPLIERS TAB */}
      {activeTab === 'suppliers' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers by name or phone..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#111622] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:border-[#e6c673] focus:outline-none"
              />
            </div>
            <button
              onClick={() => setIsAddSupplierOpen(true)}
              className="px-3.5 py-2.5 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1 shadow-md active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-white">{supplier.name}</h3>
                    {supplier.contactPerson && (
                      <p className="text-xs text-slate-300 mt-0.5">Contact: {supplier.contactPerson}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{supplier.phone}</p>
                    )}
                    {supplier.notes && (
                      <p className="text-[11px] text-slate-400 mt-1">{supplier.notes}</p>
                    )}
                  </div>

                  <div className="text-right">
                    {supplier.balanceOwed > 0 ? (
                      <span className="inline-block px-2.5 py-1 rounded-xl bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[11px] font-mono font-bold">
                        Owed: {currency} {supplier.balanceOwed.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono font-bold">
                        Paid in Full
                      </span>
                    )}
                    <p className="text-[10px] text-slate-500 font-mono mt-1">
                      Purchased: {currency} {supplier.totalPurchased.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-white/5 text-xs">
                  <div className="flex items-center gap-2">
                    {supplier.phone && (
                      <a
                        href={`tel:${supplier.phone}`}
                        className="p-2 rounded-xl bg-[#161c2a] hover:bg-[#1f273a] text-slate-200 border border-white/5 flex items-center gap-1.5 text-[11px]"
                      >
                        <Phone className="w-3.5 h-3.5 text-[#e6c673]" /> Call
                      </a>
                    )}
                    {supplier.phone && (
                      <button
                        onClick={() => handleOpenWhatsApp(supplier.phone!, supplier.name)}
                        className="p-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/30 flex items-center gap-1.5 text-[11px]"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" /> Order via WA
                      </button>
                    )}
                  </div>

                  {supplier.balanceOwed > 0 && (
                    <button
                      onClick={() => {
                        setPaymentTargetSupplier(supplier);
                        setPaymentAmount(supplier.balanceOwed.toString());
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-[11px]"
                    >
                      Pay Supplier
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Supplier Orders
            </h3>
            <button
              onClick={() => setIsAddPOOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1 shadow-md"
            >
              <Plus className="w-4 h-4" /> New Order
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-[#111622] rounded-3xl border border-white/10 text-xs text-slate-400">
                No purchase orders created yet.
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-white font-mono">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase font-mono ${
                            order.status === 'received'
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/30'
                              : 'bg-amber-950/60 text-amber-300 border border-amber-800/30'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold">{order.supplierName}</p>
                      <p className="text-[11px] text-slate-400">Date: {order.date}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-white font-mono">
                        {currency} {order.totalAmount.toLocaleString()}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {order.items.reduce((s, i) => s + i.quantity, 0)} items
                      </p>
                    </div>
                  </div>

                  {/* Items in order */}
                  <div className="p-3 rounded-2xl bg-[#0e121a] border border-white/5 text-xs space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>
                          {item.productName} x{item.quantity}
                        </span>
                        <span className="font-mono">{currency} {item.totalCost.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {order.status !== 'received' && (
                    <button
                      onClick={() => receivePurchaseOrder(order.id)}
                      className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      <PackageCheck className="w-4 h-4" /> Receive Order & Restock Automatically
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Record Customer Payment Modal */}
      {paymentTargetCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Record Payment: {paymentTargetCustomer.name}
            </h3>
            <p className="text-xs text-slate-400">
              Outstanding Debt: {currency} {paymentTargetCustomer.outstandingBalance.toLocaleString()}
            </p>
            <form onSubmit={handleCustomerPaySubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Amount Received ({currency})
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  min="500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentTargetCustomer(null)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Supplier Payment Modal */}
      {paymentTargetSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Pay Supplier: {paymentTargetSupplier.name}
            </h3>
            <p className="text-xs text-slate-400">
              Balance Owed: {currency} {paymentTargetSupplier.balanceOwed.toLocaleString()}
            </p>
            <form onSubmit={handleSupplierPaySubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Payment Amount ({currency})
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  min="500"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentTargetSupplier(null)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs"
                >
                  Confirm Paid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading">Add New Customer</h3>
            <form onSubmit={handleAddCustomerSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Brian Ssemwanga"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Phone (for WhatsApp receipts) *
                </label>
                <input
                  type="tel"
                  required
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+256 772 123 456"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  placeholder="Regular customer, Kampala Road..."
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xs bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading">Add New Supplier</h3>
            <form onSubmit={handleAddSupplierSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSupName}
                  onChange={(e) => setNewSupName(e.target.value)}
                  placeholder="e.g. Kampala Electronics Hub"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={newSupContact}
                  onChange={(e) => setNewSupContact(e.target.value)}
                  placeholder="e.g. David Mukasa"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={newSupPhone}
                  onChange={(e) => setNewSupPhone(e.target.value)}
                  placeholder="+256 701 982 341"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Order Modal */}
      {isAddPOOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <h3 className="text-sm font-bold text-white font-heading">
              Create Purchase Order
            </h3>
            <form onSubmit={handleAddPOSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Supplier *
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Product to Order *
                </label>
                <select
                  value={poProductId}
                  onChange={(e) => {
                    setPoProductId(e.target.value);
                    const p = filteredProducts.find((item) => item.id === e.target.value);
                    if (p) setPoUnitCost(p.purchasePrice.toString());
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white text-xs"
                >
                  {filteredProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({currency} {p.purchasePrice.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poQuantity}
                    onChange={(e) => setPoQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                    Cost per Unit ({currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={poUnitCost}
                    onChange={(e) => setPoUnitCost(e.target.value)}
                    placeholder="e.g. 3800000"
                    className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddPOOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold"
                >
                  Place Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
