import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  DollarSign,
  Plus,
  Repeat,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieIcon,
  Tag,
  AlertCircle,
  X,
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types';

export const ExpensesView: React.FC = () => {
  const {
    filteredExpenses,
    businesses,
    activeBusiness,
    activeBusinessId,
    currency,
    addExpense,
    deleteExpense,
    activeRole,
  } = useApp();

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Rent');
  const [description, setDescription] = useState('');
  const [expenseBusinessId, setExpenseBusinessId] = useState(
    activeBusinessId !== 'all' ? activeBusinessId : 'biz-shop'
  );
  const [isShared, setIsShared] = useState(false);
  const [isPersonal, setIsPersonal] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');

  const categories: ExpenseCategory[] = [
    'Rent',
    'Salaries',
    'Utilities',
    'Transport',
    'Lunch and food',
    'Marketing',
    'Maintenance',
    'Supplies',
    'Other',
  ];

  // Calculations
  const businessExpensesOnly = filteredExpenses.filter((e) => !e.isPersonal);
  const totalBusinessExpenses = businessExpensesOnly.reduce((acc, e) => acc + e.amount, 0);
  const totalPersonalDrawings = filteredExpenses
    .filter((e) => e.isPersonal)
    .reduce((acc, e) => acc + e.amount, 0);

  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || !description.trim()) return;

    addExpense({
      businessId: isShared ? 'shared' : expenseBusinessId,
      isShared,
      category,
      amount: parsedAmount,
      description: description.trim(),
      isPersonal,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      date: new Date().toISOString().split('T')[0],
    });

    setIsAddExpenseOpen(false);
    setAmount('');
    setDescription('');
    setIsShared(false);
    setIsPersonal(false);
    setIsRecurring(false);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            Expenses & Overheads
          </h1>
          <p className="text-xs text-slate-400">
            Rent, utilities, staff & shared multi-business overheads ({currency})
          </p>
        </div>
        <button
          onClick={() => setIsAddExpenseOpen(true)}
          className="px-3.5 py-2 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-3xl bg-[#111622] border border-white/10">
          <p className="text-[11px] font-semibold text-slate-400">Total Business Expenses</p>
          <p className="text-xl font-black text-white font-mono-numbers mt-1">
            <span className="text-xs text-[#e6c673] mr-1">{currency}</span>
            {totalBusinessExpenses.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Deducted from net profit</p>
        </div>

        <div className="p-4 rounded-3xl bg-[#111622] border border-white/10">
          <p className="text-[11px] font-semibold text-slate-400">Personal Drawings</p>
          <p className="text-xl font-bold text-slate-300 font-mono-numbers mt-1">
            <span className="text-xs text-slate-500 mr-1">{currency}</span>
            {totalPersonalDrawings.toLocaleString()}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Excluded from shop P&L</p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="p-8 text-center bg-[#111622] rounded-3xl border border-white/10 text-xs text-slate-400">
            No expenses recorded for this business view yet.
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const biz = businesses.find((b) => b.id === exp.businessId);

            return (
              <div
                key={exp.id}
                className="p-4 rounded-3xl bg-[#111622] border border-white/[0.08] hover:border-white/15 transition-all flex items-start justify-between gap-3 text-xs shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#181f2e] text-[#e6c673] border border-white/5 font-semibold">
                      {exp.category}
                    </span>
                    {exp.isShared && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-800/30 font-semibold flex items-center gap-1">
                        <Layers className="w-3 h-3" /> Shared Split
                      </span>
                    )}
                    {exp.isRecurring && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-950/40 text-emerald-300 font-mono flex items-center gap-1">
                        <Repeat className="w-3 h-3" /> {exp.recurringFrequency}
                      </span>
                    )}
                    {exp.isPersonal && (
                      <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                        Personal
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white truncate text-sm">{exp.description}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {exp.date} • {exp.isShared ? 'Split across businesses' : biz?.name || 'Shop'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-sm font-black text-white font-mono-numbers block">
                    {currency} {exp.amount.toLocaleString()}
                  </span>
                  <button
                    onClick={() => deleteExpense(exp.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors mt-1"
                    title="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-bold text-white font-heading">
                Record New Expense
              </h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Amount ({currency}) *
                </label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 1500000"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
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
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Description / Note *
                </label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Monthly shop rent (Kampala Road)"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                />
              </div>

              {/* Business Assignment / Shared */}
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Assigned Business
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#141924] border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isShared}
                      onChange={(e) => setIsShared(e.target.checked)}
                      className="w-4 h-4 rounded text-[#e6c673]"
                    />
                    <span className="text-white font-semibold">
                      Shared Overhead (Split across all ventures)
                    </span>
                  </label>

                  {!isShared && (
                    <select
                      value={expenseBusinessId}
                      onChange={(e) => setExpenseBusinessId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white"
                    >
                      {businesses.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.type})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Toggles: Recurring & Personal */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-[#e6c673]"
                  />
                  <span className="text-slate-300">
                    Recurring Expense (e.g. Monthly Shop Rent)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => setIsPersonal(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500"
                  />
                  <span className="text-slate-300">
                    Personal Expense / Drawing (Does not distort shop P&L)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
