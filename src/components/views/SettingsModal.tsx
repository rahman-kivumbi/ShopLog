import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Settings as SettingsIcon,
  Download,
  Upload,
  Lock,
  ShieldCheck,
  RotateCcw,
  Store,
  CheckCircle2,
  AlertCircle,
  FileJson,
  KeyRound,
  Users,
  Cloud,
  RefreshCw,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    updateSettings,
    setAppPin,
    activeRole,
    setActiveRole,
    exportBackup,
    importBackup,
    resetDemoData,
    syncStatus,
    user,
    signInWithGoogle,
    signOutUser,
    syncNow,
  } = useApp();

  const [pinInput, setPinInput] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  const [shopName, setShopName] = useState(settings.shopName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopTrn, setShopTrn] = useState(settings.shopTrn);
  const [warrantyTerms, setWarrantyTerms] = useState(settings.defaultWarrantyTerms);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Export Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ranks_shop_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handle Import Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importBackup(text);
        if (success) {
          setImportStatus('Backup restored successfully! All data loaded.');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Failed to restore backup: invalid file format.');
        }
      } catch (err) {
        setImportStatus('Error reading backup file.');
      }
    };
    reader.readAsText(file);
  };

  // Handle PIN Save
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length !== 4) {
      setPinMessage('PIN must be exactly 4 digits.');
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinMessage('PIN codes do not match!');
      return;
    }

    setAppPin(pinInput);
    setPinMessage('4-digit PIN lock activated successfully!');
    setPinInput('');
    setPinConfirm('');
    setTimeout(() => setPinMessage(null), 3000);
  };

  const handleDisablePin = () => {
    setAppPin(null);
    setPinMessage('PIN lock disabled.');
    setTimeout(() => setPinMessage(null), 2000);
  };

  const handleSaveShopInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      shopName,
      shopPhone,
      shopAddress,
      shopTrn,
      defaultWarrantyTerms: warrantyTerms,
    });
    alert('Shop details updated!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0e121a] border border-white/10 rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white font-heading">
              Settings & Security
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync & Cloud Status */}
        <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10 space-y-2.5 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Offline-First Sync Status
          </span>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Persistence Engine:</span>
            <span className="font-mono text-[#e6c673] font-bold">
              IndexedDB Local Cache + Cloud Firestore
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-300">Google Account:</span>
            <span className="text-white font-mono truncate max-w-[180px]">
              {user ? user.email : 'Local Guest Mode (Offline)'}
            </span>
          </div>

          <div className="pt-1">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await syncNow();
                      alert('All data synced successfully to Cloud Firestore!');
                    } catch (e: any) {
                      alert('Sync failed: ' + (e?.message || 'Check connection'));
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync to Cloud Now
                </button>
                <button
                  onClick={signOutUser}
                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                  } catch (e: any) {
                    alert('Sign in: ' + (e?.message || 'Could not complete sign in'));
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                <Cloud className="w-4 h-4" /> Sign in with Google Account
              </button>
            )}
          </div>
        </div>

        {/* Staff Role Switcher */}
        <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-white">Staff Access Role</h4>
              <p className="text-[11px] text-slate-400">
                Cashiers can ring up sales but cannot see purchase costs or profit margins.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#252014] text-[#e6c673] font-mono uppercase font-bold text-[10px] border border-[#d4af37]/30">
              {activeRole}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveRole('owner')}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                activeRole === 'owner'
                  ? 'bg-[#d4af37] text-black border-[#e6c673] shadow-sm'
                  : 'bg-[#1b2230] text-slate-400 border-white/5'
              }`}
            >
              Owner (Full Access)
            </button>
            <button
              onClick={() => setActiveRole('cashier')}
              className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                activeRole === 'cashier'
                  ? 'bg-amber-700 text-white border-amber-600 shadow-sm'
                  : 'bg-[#1b2230] text-slate-400 border-white/5'
              }`}
            >
              Cashier (Hide Profits)
            </button>
          </div>
        </div>

        {/* 4-Digit PIN Lock Setup */}
        <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#d4af37]" />
              <h4 className="font-bold text-white">Counter Screen PIN Lock</h4>
            </div>
            {settings.pinEnabled ? (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                Active
              </span>
            ) : (
              <span className="text-[10px] font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                Disabled
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Locks the Nokia G22 screen with a 4-digit code when leaving the counter unattended.
          </p>

          {settings.pinEnabled ? (
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300">PIN Protection is Active</span>
              <button
                onClick={handleDisablePin}
                className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/40 font-semibold transition-colors"
              >
                Disable PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSavePin} className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="4-digit PIN"
                  className="px-3 py-2 rounded-xl bg-[#090c12] border border-white/10 text-white font-mono text-center tracking-widest focus:border-[#d4af37] focus:outline-none"
                />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  placeholder="Confirm PIN"
                  className="px-3 py-2 rounded-xl bg-[#090c12] border border-white/10 text-white font-mono text-center tracking-widest focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              {pinMessage && (
                <p className="text-[11px] text-[#e6c673] font-semibold">{pinMessage}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold shadow-md active:scale-95 transition-all"
              >
                Enable 4-Digit PIN Lock
              </button>
            </form>
          )}
        </div>

        {/* Data Backup & Restore */}
        <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10 space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <FileJson className="w-4 h-4 text-[#d4af37]" />
            <h4 className="font-bold text-white">Data Backup & Restore</h4>
          </div>
          <p className="text-[11px] text-slate-400">
            Export a full JSON backup of all products, IMEIs, sales and customers to keep offline copies.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleDownloadBackup}
              className="py-2.5 px-3 rounded-xl bg-[#1b2230] hover:bg-[#242d40] text-[#e6c673] font-bold flex items-center justify-center gap-1.5 border border-[#e6c673]/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Export JSON
            </button>

            <label className="py-2.5 px-3 rounded-xl bg-[#1b2230] hover:bg-[#242d40] text-slate-200 font-bold flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#e6c673]" /> Import JSON
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <p className="text-[11px] text-emerald-400 font-semibold">{importStatus}</p>
          )}
        </div>

        {/* Shop Profile & URA TIN */}
        <div className="p-3.5 rounded-2xl bg-[#141924] border border-white/10 space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-[#d4af37]" />
            <h4 className="font-bold text-white">Default Shop Profile & Warranty</h4>
          </div>

          <form onSubmit={handleSaveShopInfo} className="space-y-2">
            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Shop Name</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#090c12] border border-white/10 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Shop Phone</label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#090c12] border border-white/10 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">URA TIN</label>
                <input
                  type="text"
                  value={shopTrn}
                  onChange={(e) => setShopTrn(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#090c12] border border-white/10 text-white font-mono focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Shop Address</label>
              <input
                type="text"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#090c12] border border-white/10 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 block mb-0.5">Default Warranty Terms</label>
              <textarea
                rows={2}
                value={warrantyTerms}
                onChange={(e) => setWarrantyTerms(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#090c12] border border-white/10 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold shadow-md active:scale-95 transition-all"
            >
              Save Shop Details
            </button>
          </form>
        </div>

        {/* Reset Demo Data */}
        <div className="pt-2 text-center">
          <button
            onClick={() => {
              if (confirm('Reset application to original Uganda phones & popcorn demo data?')) {
                resetDemoData();
                onClose();
              }
            }}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center justify-center gap-1 mx-auto transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to Initial Demo Data
          </button>
        </div>
      </div>
    </div>
  );
};
