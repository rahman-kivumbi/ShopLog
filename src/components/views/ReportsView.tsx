import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  ArrowDownToLine,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const ReportsView: React.FC = () => {
  const {
    filteredSales,
    filteredExpenses,
    filteredProducts,
    businesses,
    activeBusiness,
    activeBusinessId,
    currency,
    activeRole,
  } = useApp();

  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('30');

  // Filtered sales & expenses by date range
  const { salesInRange, expensesInRange } = useMemo(() => {
    if (dateRange === 'all') {
      return { salesInRange: filteredSales, expensesInRange: filteredExpenses };
    }

    const cutoffDays = parseInt(dateRange, 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return {
      salesInRange: filteredSales.filter((s) => s.date >= cutoffStr),
      expensesInRange: filteredExpenses.filter((e) => e.date >= cutoffStr),
    };
  }, [filteredSales, filteredExpenses, dateRange]);

  // Profit and Loss calculations
  const totalRevenue = salesInRange.reduce((sum, s) => sum + s.total, 0);
  const totalCogs = salesInRange.reduce((sum, s) => sum + s.costTotal, 0);
  const grossProfit = totalRevenue - totalCogs;
  const totalOverhead = expensesInRange
    .filter((e) => !e.isPersonal)
    .reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOverhead;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Sales by Category Chart Data
  const categoryData = useMemo(() => {
    const map: { [cat: string]: number } = {};
    salesInRange.forEach((sale) => {
      sale.items.forEach((item) => {
        const prod = filteredProducts.find((p) => p.id === item.productId);
        const cat = prod?.category || 'General';
        map[cat] = (map[cat] || 0) + item.total;
      });
    });

    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [salesInRange, filteredProducts]);

  // Fast Movers vs Slow Movers
  const productPerformance = useMemo(() => {
    const map: { [prodId: string]: { name: string; qty: number; revenue: number } } = {};

    filteredProducts.forEach((p) => {
      map[p.id] = { name: p.name, qty: 0, revenue: 0 };
    });

    salesInRange.forEach((sale) => {
      sale.items.forEach((item) => {
        if (!map[item.productId]) {
          map[item.productId] = { name: item.productName, qty: 0, revenue: 0 };
        }
        map[item.productId].qty += item.quantity;
        map[item.productId].revenue += item.total;
      });
    });

    const list = Object.values(map);
    const fastMovers = [...list].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const deadStock = list.filter((p) => p.qty === 0).slice(0, 5);

    return { fastMovers, deadStock };
  }, [filteredProducts, salesInRange]);

  const COLORS = ['#d4af37', '#e6c673', '#10b981', '#3b82f6', '#f59e0b', '#a855f7'];

  // Export CSV Report
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `PROFIT & LOSS REPORT - ${activeBusiness?.name || 'All Businesses'}\n`;
    csvContent += `Date Range: Last ${dateRange} days\n`;
    csvContent += `Exported: ${new Date().toLocaleString()}\n\n`;

    csvContent += `SUMMARY (${currency})\n`;
    csvContent += `Total Revenue,${Math.round(totalRevenue)}\n`;
    csvContent += `Cost of Goods Sold (COGS),${Math.round(totalCogs)}\n`;
    csvContent += `Gross Profit,${Math.round(grossProfit)}\n`;
    csvContent += `Operating Expenses,${Math.round(totalOverhead)}\n`;
    csvContent += `Net Profit,${Math.round(netProfit)}\n`;
    csvContent += `Net Margin %,${profitMargin}%\n\n`;

    csvContent += `SALES LOG\n`;
    csvContent += `Invoice Number,Date,Customer,Items,Total (${currency}),Profit,Payment Method\n`;

    salesInRange.forEach((s) => {
      const itemsList = s.items.map((i) => `${i.productName} (x${i.quantity})`).join('; ');
      csvContent += `"${s.invoiceNumber}","${s.date}","${s.customerName || 'Walk-in'}","${itemsList}",${s.total},${s.profit},"${s.paymentMethod}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ranks_Shop_Report_${dateRange}d_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Title & Range Selector */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            Profit & Loss Reports
          </h1>
          <p className="text-xs text-slate-400">
            {activeBusinessId === 'all'
              ? 'Consolidated multi-business analytics'
              : `${activeBusiness?.name} • Financials`}
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3.5 py-2 rounded-xl bg-[#1a2230] hover:bg-[#222d40] text-[#e6c673] font-bold text-xs flex items-center gap-1.5 border border-[#e6c673]/30 active:scale-95 shadow-sm transition-all"
        >
          <ArrowDownToLine className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Date Range Selector Pills */}
      <div className="grid grid-cols-4 p-1 bg-[#111622] rounded-2xl border border-white/10 gap-1 text-xs font-semibold">
        {(['7', '30', '90', 'all'] as const).map((r) => (
          <button
            key={r}
            onClick={() => setDateRange(r)}
            className={`py-1.5 rounded-xl text-center capitalize transition-all ${
              dateRange === r
                ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {r === 'all' ? 'All Time' : `${r} Days`}
          </button>
        ))}
      </div>

      {/* Financial P&L Statement Card */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <span className="text-xs font-bold text-white uppercase tracking-wider font-heading">
            Statement of Profit & Loss
          </span>
          <span className="text-[10px] text-[#e6c673] font-mono">
            {salesInRange.length} sales analyzed
          </span>
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-300">
            <span>(+) Gross Revenue (Sales):</span>
            <span className="font-bold text-white">{currency} {Math.round(totalRevenue).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-slate-400">
            <span>(-) Cost of Goods Sold (COGS):</span>
            <span>{currency} {Math.round(totalCogs).toLocaleString()}</span>
          </div>

          <div className="flex justify-between font-bold text-[#e6c673] pt-1 border-t border-white/10">
            <span>(=) Gross Profit:</span>
            <span>{currency} {Math.round(grossProfit).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-rose-400">
            <span>(-) Operating Expenses:</span>
            <span>-{currency} {Math.round(totalOverhead).toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-baseline font-bold text-sm pt-2 border-t border-white/10">
            <span className="text-white font-heading">NET PROFIT:</span>
            {activeRole === 'owner' ? (
              <div className="text-right">
                <span
                  className={
                    netProfit >= 0 ? 'text-emerald-400 text-lg font-mono font-bold' : 'text-rose-400 text-lg font-mono font-bold'
                  }
                >
                  {currency} {Math.round(netProfit).toLocaleString()}
                </span>
                <span className="block text-[10px] text-slate-400 font-mono">
                  {profitMargin}% margin
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Owner Confidential</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Breakdown Pie Chart */}
      {categoryData.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#111622] border border-white/10 shadow-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-heading mb-1">
            Revenue by Product Category
          </h3>
          <p className="text-[10px] text-slate-400 mb-3">Sales volume distribution</p>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${currency} ${Number(val).toLocaleString()}`, 'Total']}
                  contentStyle={{
                    backgroundColor: '#0e121a',
                    borderColor: 'rgba(212, 175, 55, 0.4)',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#ffffff',
                  }}
                />
                <Legend
                  formatter={(value) => <span className="text-[11px] text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Fast Movers and Dead Stock Leaderboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Fast Movers */}
        <div className="p-3.5 rounded-2xl bg-[#111622] border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Fast Movers (Top Sold)
            </h4>
          </div>
          <div className="space-y-1.5">
            {productPerformance.fastMovers.slice(0, 4).map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#161c2b] border border-white/5"
              >
                <span className="text-white truncate max-w-[150px]">{item.name}</span>
                <span className="font-mono font-bold text-emerald-400 shrink-0">
                  {item.qty} units
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dead Stock */}
        <div className="p-3.5 rounded-2xl bg-[#111622] border border-white/10 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-heading">
              Dead Stock (0 Sales)
            </h4>
          </div>
          <div className="space-y-1.5">
            {productPerformance.deadStock.length === 0 ? (
              <p className="text-[11px] text-slate-500 p-2">No dead stock in this period!</p>
            ) : (
              productPerformance.deadStock.slice(0, 4).map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#161c2b] border border-white/5"
                >
                  <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                  <span className="font-mono text-amber-400 text-[10px]">Unsold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
