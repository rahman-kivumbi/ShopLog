import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Store,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Lock,
  User,
  ShieldAlert,
  LogIn,
  LogOut,
  Building2,
  Sparkles,
  Layers,
} from 'lucide-react';
import { loginWithGoogle, logOut } from '../lib/firebase';

interface HeaderProps {
  onOpenBusinessModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenBusinessModal,
  onOpenSettingsModal,
  onOpenAuthModal,
}) => {
  const {
    activeBusinessId,
    setActiveBusinessId,
    activeBusiness,
    businesses,
    syncStatus,
    user,
    activeRole,
    setActiveRole,
    lockApp,
    settings,
  } = useApp();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#090c12]/95 backdrop-blur-md border-b border-white/[0.08] px-3.5 py-2.5 transition-all">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
        {/* Business Selector / Switcher */}
        <div className="relative flex-1 min-w-0 max-w-xs">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141924] border border-white/[0.08] hover:border-[#d4af37]/40 text-left transition-all active:scale-[0.99] shadow-sm"
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-black font-bold shrink-0 shadow-sm"
              style={{
                backgroundColor: activeBusiness?.color || '#d4af37',
              }}
            >
              {activeBusinessId === 'all' ? (
                <Layers className="w-3.5 h-3.5" />
              ) : activeBusiness?.type === 'machine' ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Store className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-mono">
                  {activeBusinessId === 'all' ? 'Consolidated' : activeBusiness?.type || 'Shop'}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#1e2535] text-[#e6c673] font-mono font-bold">
                  {activeBusiness?.currency || 'UGX'}
                </span>
              </div>
              <h2 className="text-xs font-bold text-white truncate font-heading tracking-tight leading-tight">
                {activeBusinessId === 'all' ? 'All Businesses' : activeBusiness?.name}
              </h2>
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180 text-[#d4af37]' : ''
              }`}
            />
          </button>

          {/* Business Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#131824] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Business View
                </div>

                {/* Combined Option */}
                <button
                  onClick={() => {
                    setActiveBusinessId('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors mb-1 ${
                    activeBusinessId === 'all'
                      ? 'bg-[#1e2536] text-[#e6c673] border border-[#d4af37]/30 font-semibold'
                      : 'text-slate-200 hover:bg-[#181f2e]'
                  }`}
                >
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#d4af37] to-[#b89324] flex items-center justify-center text-black font-bold text-xs shrink-0">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">All Businesses (Combined)</p>
                    <p className="text-[10px] text-slate-400">Total profits & consolidated inventory</p>
                  </div>
                </button>

                <div className="h-px bg-white/5 my-1" />

                {/* List of individual businesses */}
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {businesses.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setActiveBusinessId(b.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${
                        activeBusinessId === b.id
                          ? 'bg-[#1e2536] text-[#e6c673] border border-[#d4af37]/30 font-semibold'
                          : 'text-slate-200 hover:bg-[#181f2e]'
                      }`}
                    >
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-black font-bold text-xs shrink-0"
                        style={{ backgroundColor: b.color }}
                      >
                        {b.type === 'machine' ? (
                          <Sparkles className="w-3.5 h-3.5" />
                        ) : (
                          <Store className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{b.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {b.type} • {b.currency}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-white/5 my-1.5" />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenBusinessModal();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#1b2230] hover:bg-[#232c3f] text-[#e6c673] text-xs font-semibold border border-[#d4af37]/20 transition-all"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  + Add / Manage Businesses
                </button>
              </div>
            </>
          )}
        </div>

        {/* Right Action Icons: Sync Status, Role Toggle, PIN Lock, Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync Status Badge */}
          <button
            onClick={onOpenAuthModal}
            title={
              syncStatus === 'synced'
                ? 'Synced to Cloud Firestore & Local Cache. Tap for details.'
                : syncStatus === 'syncing'
                ? 'Syncing offline changes...'
                : 'Offline Mode: saving to local storage. Tap to connect.'
            }
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium border transition-colors ${
              syncStatus === 'synced'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/30'
                : syncStatus === 'syncing'
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/30 animate-pulse'
                : 'bg-slate-800/60 text-slate-300 border-slate-700/40'
            }`}
          >
            {syncStatus === 'synced' ? (
              <Wifi className="w-3 h-3 text-emerald-400" />
            ) : syncStatus === 'syncing' ? (
              <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
            ) : (
              <WifiOff className="w-3 h-3 text-slate-400" />
            )}
            <span className="hidden sm:inline capitalize">{syncStatus}</span>
          </button>

          {/* Role Indicator / Switcher (Owner vs Cashier) */}
          <button
            onClick={() => setActiveRole(activeRole === 'owner' ? 'cashier' : 'owner')}
            title={`Active role: ${activeRole}. Tap to switch.`}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold tracking-wider uppercase border transition-all ${
              activeRole === 'owner'
                ? 'bg-[#1e2536] text-[#e6c673] border-[#d4af37]/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            {activeRole}
          </button>

          {/* Quick Lock Button */}
          {settings.pinEnabled && (
            <button
              onClick={lockApp}
              title="Lock Screen"
              className="p-2 rounded-xl bg-[#141924] hover:bg-[#1c2230] border border-white/10 text-slate-300 hover:text-[#e6c673] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Google Auth Avatar / Button */}
          {user ? (
            <button
              onClick={onOpenAuthModal}
              title={`Signed in as ${user.displayName || user.email}. Tap for Cloud Sync details.`}
              className="flex items-center gap-1.5 p-1 pr-2.5 rounded-full bg-[#161c2a] border border-[#d4af37]/40 hover:border-[#d4af37] transition-all"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Owner'}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#d4af37] text-black font-black flex items-center justify-center text-xs shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <span className="text-[11px] font-mono text-emerald-400 font-semibold hidden md:inline">
                Synced
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs transition-colors shadow-sm active:scale-95"
              title="Sign in with your Google account"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Google Sync</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
