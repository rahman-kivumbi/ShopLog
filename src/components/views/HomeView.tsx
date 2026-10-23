import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Boxes,
  Users,
  ShoppingCart,
  QrCode,
  Plus,
  ArrowUpRight,
  ShieldAlert,
  Wallet,
  Clock,
  ChevronRight,
  Calculator,
  X,
  CheckCircle2,
  Receipt,
  Cloud,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface HomeViewProps {
  onOpenScanner: () => void;
  onOpenNewProduct: () => void;
  onOpenAuthModal?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onOpenScanner,
  onOpenNewProduct,
  onOpenAuthModal,
}) => {
  const {
    filteredSales,
    filteredProducts,
    filteredExpenses,
    customers,
    suppliers,
    currency,
    activeRole,
    activeBusiness,
    activeBusinessId,
    setActiveTab,
    user,
  } = useApp();

  const [isCashCountOpen, setIsCashCountOpen] = useState(false);
  // Bank of Uganda Currency Denominations (Notes & Coins)
  const [cashDenominations, setCashDenominations] = useState<{ [denom: number]: number }>({
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's metrics
  const todaySales = filteredSales.filter((s) => s.date === todayStr);
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.profit, 0);
  const todayCashSales = todaySales
    .filter((s) => s.paymentMethod === 'Cash')
    .reduce((acc, s) => acc + s.amountPaid, 0);

  // Month metrics
  const monthPrefix = todayStr.slice(0, 7);
  const monthSales = filteredSales.filter((s) => s.date.startsWith(monthPrefix));
  const monthRevenue = monthSales.reduce((acc, s) => acc + s.total, 0);
  const monthProfit = monthSales.reduce((acc, s) => acc + s.profit, 0);

  // Today Expenses
  const todayExpenses = filteredExpenses
    .filter((e) => e.date === todayStr)
    .reduce((acc, e) => acc + e.amount, 0);

  // Alerts
  const lowStockItems = filteredProducts.filter((p) => p.currentStock <= p.lowStockThreshold);
  const customersWithCredit = customers.filter((c) => c.outstandingBalance > 0);
  const totalCustomerDebt = customersWithCredit.reduce((acc, c) => acc + c.outstandingBalance, 0);

  // Last 7 days chart data
  const last7DaysData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const daySales = filteredSales.filter((s) => s.date === dateStr);
    const dayRev = daySales.reduce((acc, s) => acc + s.total, 0);
    const dayProf = daySales.reduce((acc, s) => acc + s.profit, 0);

    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date: dateStr,
      revenue: dayRev,
      profit: dayProf,
    };
  });

  // Calculate actual cash drawer total from Bank of Uganda denomination counter
  const totalCountedCash = Object.entries(cashDenominations).reduce(
    (sum, [denom, count]) => sum + Number(denom) * (count || 0),
    0
  );

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Welcome & Quick Status Bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            {activeBusinessId === 'all'
              ? 'Multi-Business Consolidated Metrics'
              : `${activeBusiness?.name} • Live Overview`}
          </p>
        </div>
        <button
          onClick={() => setIsCashCountOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141924] hover:bg-[#1e2536] border border-white/10 text-[#e6c673] text-xs font-semibold shadow-sm active:scale-95 transition-all"
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>UGX Cash Drawer</span>
        </button>
      </div>

      {/* Google Cloud Backup & Sync Banner */}
      {!user && onOpenAuthModal && (
        <div
          onClick={onOpenAuthModal}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1c2436] to-[#121722] border border-[#d4af37]/30 flex items-center justify-between cursor-pointer hover:border-[#d4af37]/60 transition-all shadow-md active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37] text-black font-bold flex items-center justify-center shrink-0 shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Save Shop Data to Google Account</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#2b354c] text-[#e6c673] font-mono font-semibold">
                  Offline Sync
                </span>
              </p>
              <p className="text-[11px] text-slate-300">
                Keep products, IMEIs, and sales tickets backed up & synced in real-time
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-black px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] shrink-0 transition-colors shadow-sm">
            Sign In
          </span>
        </div>
      )}

      {/* Critical Alert Banners */}
      {(lowStockItems.length > 0 || customersWithCredit.length > 0) && (
        <div className="space-y-2">
          {lowStockItems.length > 0 && (
            <div
              onClick={() => setActiveTab('stock')}
              className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-950/40 transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-[#e6c673] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#e6c673]">
                    {lowStockItems.length} Product{lowStockItems.length > 1 ? 's' : ''} Low in Stock
                  </p>
                  <p className="text-[11px] text-slate-300 truncate max-w-[220px]">
                    {lowStockItems.map((p) => p.name).slice(0, 2).join(', ')}
                    {lowStockItems.length > 2 ? ` +${lowStockItems.length - 2} more` : ''}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#e6c673] shrink-0" />
            </div>
          )}

          {customersWithCredit.length > 0 && (
            <div
              onClick={() => setActiveTab('people')}
              className="p-3 rounded-2xl bg-[#1e2536] border border-white/10 flex items-center justify-between cursor-pointer hover:bg-[#252f44] transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#d4af37]/15 text-[#e6c673] flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    {currency} {totalCustomerDebt.toLocaleString()} Customer Credit
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Owed by {customersWithCredit.length} customer{customersWithCredit.length > 1 ? 's' : ''} (Pay Later)
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today Sales */}
        <div className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Today's Sales</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1c2333] text-slate-300 font-mono">
              {todaySales.length} txns
            </span>
          </div>
          <p className="text-2xl font-black text-white font-mono-numbers tracking-tight mt-1">
            <span className="text-xs text-[#e6c673] font-normal mr-1">{currency}</span>
            {todayRevenue.toLocaleString()}
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/5 pt-2">
            <span>Cash: {currency} {todayCashSales.toLocaleString()}</span>
            <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
              <ArrowUpRight className="w-3 h-3" /> Live
            </span>
          </div>
        </div>

        {/* Today's Profit (Hidden for Cashier role) */}
        <div className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-semibold">Today's Profit</span>
            {activeRole === 'owner' ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 font-mono">
                {todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(0) : 0}% margin
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                Staff
              </span>
            )}
          </div>

          {activeRole === 'owner' ? (
            <p className="text-2xl font-black text-emerald-400 font-mono-numbers tracking-tight mt-1">
              <span className="text-xs text-emerald-400/80 font-normal mr-1">{currency}</span>
              {todayProfit.toLocaleString()}
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-500 font-mono mt-1">
              ••••••••
            </p>
          )}

          <div className="mt-2.5 text-[11px] text-slate-400 border-t border-white/5 pt-2">
            Overhead: {currency} {todayExpenses.toLocaleString()}
          </div>
        </div>

        {/* Month Revenue */}
        <div className="p-3.5 rounded-2xl bg-[#111622] border border-white/[0.06]">
          <p className="text-xs text-slate-400 font-medium mb-1">This Month Sales</p>
          <p className="text-lg font-bold text-white font-mono-numbers">
            <span className="text-xs text-slate-500 mr-1">{currency}</span>
            {monthRevenue.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">
            {monthSales.length} total orders
          </p>
        </div>

        {/* Month Net Profit */}
        <div className="p-3.5 rounded-2xl bg-[#111622] border border-white/[0.06]">
          <p className="text-xs text-slate-400 font-medium mb-1">Month Net Profit</p>
          {activeRole === 'owner' ? (
            <p className="text-lg font-bold text-[#e6c673] font-mono-numbers">
              <span className="text-xs text-[#e6c673]/80 mr-1">{currency}</span>
              {monthProfit.toLocaleString()}
            </p>
          ) : (
            <p className="text-lg font-bold text-slate-500 font-mono">••••••••</p>
          )}
          <p className="text-[10px] text-slate-400 mt-1">
            Net after wholesale costs
          </p>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-4 gap-2.5 pt-1">
        <button
          onClick={() => setActiveTab('sell')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#222b3d] to-[#161d2a] hover:from-[#2a354c] hover:to-[#1c2434] border border-[#d4af37]/30 text-white transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#d4af37] text-black font-black flex items-center justify-center mb-1.5 shadow-md">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold font-heading">New Sale</span>
        </button>

        <button
          onClick={onOpenScanner}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111622] hover:bg-[#181f2e] border border-white/[0.08] text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1c2333] text-[#e6c673] flex items-center justify-center mb-1.5 border border-white/5">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold font-heading">Scan SKU</span>
        </button>

        <button
          onClick={onOpenNewProduct}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111622] hover:bg-[#181f2e] border border-white/[0.08] text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1c2333] text-emerald-400 flex items-center justify-center mb-1.5 border border-white/5">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold font-heading">Add Item</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111622] hover:bg-[#181f2e] border border-white/[0.08] text-slate-200 transition-all active:scale-95 shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1c2333] text-amber-400 flex items-center justify-center mb-1.5 border border-white/5">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-bold font-heading">Stock</span>
        </button>
      </div>

      {/* 7-Day Sales Trend Mini Chart */}
      <div className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              7-Day Sales Performance
            </h3>
            <p className="text-[10px] text-slate-400">Daily revenue trend in {currency}</p>
          </div>
          <button
            onClick={() => setActiveTab('more')}
            className="text-[11px] font-semibold text-[#e6c673] hover:underline flex items-center gap-0.5"
          >
            Financials <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-40 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7DaysData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradClassy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#d4af37" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0e121a',
                  borderColor: 'rgba(212, 175, 55, 0.3)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: '#fff',
                }}
                formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#d4af37"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#salesGradClassy)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Sales Transactions */}
      <div className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Recent Sales Transactions
          </h3>
          <span className="text-[10px] text-slate-400">Latest 5 sales</span>
        </div>

        {filteredSales.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            No sales recorded yet. Tap "New Sale" to ring up an order.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-2.5 rounded-2xl bg-[#161c2a] hover:bg-[#1c2335] transition-colors border border-white/5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#1f273a] text-[#e6c673] flex items-center justify-center font-bold text-xs shrink-0 border border-white/5">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {sale.items.map((i) => i.productName).join(', ')}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {sale.invoiceNumber} • {sale.customerName || 'Walk-in'} • {sale.paymentMethod}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-white font-mono-numbers">
                    {currency} {sale.total.toLocaleString()}
                  </p>
                  {activeRole === 'owner' && (
                    <p className="text-[10px] text-emerald-400 font-mono-numbers">
                      +{currency} {sale.profit.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ugandan Shilling Cash Drawer Calculator Modal */}
      {isCashCountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#e6c673]" />
                <h3 className="text-sm font-bold text-white font-heading">
                  Bank of Uganda Cash Count
                </h3>
              </div>
              <button
                onClick={() => setIsCashCountOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Count UGX banknotes & coins in your register to reconcile with today's cash sales.
            </p>

            <div className="space-y-2 mb-4">
              {[50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100, 50].map((denom) => (
                <div key={denom} className="flex items-center justify-between gap-2 text-xs">
                  <span className="w-24 font-mono font-bold text-slate-300">
                    {denom >= 1000 ? `${denom.toLocaleString()} UGX note` : `${denom} UGX coin`}:
                  </span>
                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                    <input
                      type="number"
                      min="0"
                      value={cashDenominations[denom] || ''}
                      onChange={(e) =>
                        setCashDenominations((prev) => ({
                          ...prev,
                          [denom]: Math.max(0, parseInt(e.target.value) || 0),
                        }))
                      }
                      placeholder="0"
                      className="w-16 px-2 py-1 bg-[#141924] border border-white/10 rounded-lg text-center font-mono text-white text-xs"
                    />
                    <span className="w-24 text-right font-mono text-slate-400">
                      = {(denom * (cashDenominations[denom] || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Reconciliation Summary */}
            <div className="p-3 rounded-2xl bg-[#141924] border border-white/10 space-y-1.5 mb-4 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Counted Cash:</span>
                <span className="font-bold text-white">{currency} {totalCountedCash.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>System Cash Sales:</span>
                <span className="font-bold text-[#e6c673]">{currency} {todayCashSales.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-white/10">
                <span>Difference / Float:</span>
                <span
                  className={
                    totalCountedCash - todayCashSales >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }
                >
                  {currency} {(totalCountedCash - todayCashSales).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsCashCountOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs"
            >
              Done / Close Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
