import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  DollarSign,
  Building2,
  Settings as SettingsIcon,
  Lock,
  Download,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Store,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { ExpensesView } from './ExpensesView';
import { ReportsView } from './ReportsView';

interface MoreViewProps {
  onOpenBusinessModal: () => void;
  onOpenSettingsModal: () => void;
}

export const MoreView: React.FC<MoreViewProps> = ({
  onOpenBusinessModal,
  onOpenSettingsModal,
}) => {
  const {
    activeBusiness,
    activeBusinessId,
    activeRole,
    setActiveRole,
    lockApp,
    settings,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'menu' | 'expenses' | 'reports'>('menu');

  if (activeSection === 'expenses') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setActiveSection('menu')}
          className="text-xs font-semibold text-[#e6c673] hover:underline flex items-center gap-1 mb-2"
        >
          ← Back to More Menu
        </button>
        <ExpensesView />
      </div>
    );
  }

  if (activeSection === 'reports') {
    return (
      <div className="space-y-3">
        <button
          onClick={() => setActiveSection('menu')}
          className="text-xs font-semibold text-[#e6c673] hover:underline flex items-center gap-1 mb-2"
        >
          ← Back to More Menu
        </button>
        <ReportsView />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-150">
      <div className="px-1">
        <h1 className="text-xl font-bold text-white font-heading tracking-tight">
          Management & Tools
        </h1>
        <p className="text-xs text-slate-400">
          Financial statements, expenses, multi-business switcher & settings
        </p>
      </div>

      <div className="space-y-2.5">
        {/* Expenses Option */}
        <button
          onClick={() => setActiveSection('expenses')}
          className="w-full p-4 rounded-2xl bg-[#111622] hover:bg-[#161c2b] border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#252014] text-[#e6c673] flex items-center justify-center border border-[#d4af37]/30">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Expenses & Shared Overheads
              </h3>
              <p className="text-xs text-slate-400">
                Rent, utilities, food, and cross-business cost splitting
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

        {/* Profit & Loss Reports Option */}
        <button
          onClick={() => setActiveSection('reports')}
          className="w-full p-4 rounded-2xl bg-[#111622] hover:bg-[#161c2b] border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800/40">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Profit & Loss Reports & CSV
              </h3>
              <p className="text-xs text-slate-400">
                P&L statements, category breakdown, fast/slow movers, CSV export
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

        {/* Business Ventures Option */}
        <button
          onClick={onOpenBusinessModal}
          className="w-full p-4 rounded-2xl bg-[#111622] hover:bg-[#161c2b] border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/60 text-amber-400 flex items-center justify-center border border-amber-800/40">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Manage Businesses & Machines
              </h3>
              <p className="text-xs text-slate-400">
                Add side ventures (popcorn machine, kiosk, repair stall)
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>

        {/* Settings & Backup Option */}
        <button
          onClick={onOpenSettingsModal}
          className="w-full p-4 rounded-2xl bg-[#111622] hover:bg-[#161c2b] border border-white/10 flex items-center justify-between text-left transition-all active:scale-[0.99] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/60 text-purple-400 flex items-center justify-center border border-purple-800/40">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-heading">
                Settings, PIN & Offline Backup
              </h3>
              <p className="text-xs text-slate-400">
                Full JSON backup/restore, URA TIN, and 4-digit counter lock
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Quick Lock Card */}
      {settings.pinEnabled && (
        <div className="p-4 rounded-2xl bg-[#141924] border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-[#d4af37]" />
            <div>
              <p className="text-xs font-bold text-white">Screen PIN Protection</p>
              <p className="text-[11px] text-slate-400">Lock immediately for phone counter handoff</p>
            </div>
          </div>
          <button
            onClick={lockApp}
            className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs shadow-sm active:scale-95 transition-all"
          >
            Lock Now
          </button>
        </div>
      )}

      {/* Kampala Shop Info Card */}
      <div className="p-4 rounded-2xl bg-[#111622] border border-white/10 space-y-1 text-center text-xs text-slate-400">
        <p className="font-bold text-slate-200">Ranks Shop Manager v1.0.0</p>
        <p className="text-[11px]">
          Optimized for Android & Nokia G22 • Kampala, Uganda Retail POS
        </p>
        <p className="text-[10px] text-[#e6c673] font-mono">
          Cloud Firestore Persistent Cache • Spark Free Tier Compliant
        </p>
      </div>
    </div>
  );
};
