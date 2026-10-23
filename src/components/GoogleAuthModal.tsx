import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  Cloud,
  CheckCircle2,
  RefreshCw,
  LogOut,
  AlertCircle,
  Database,
  Smartphone,
  ShieldCheck,
  HardDrive,
  Lock,
} from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({ isOpen, onClose }) => {
  const {
    user,
    signInWithGoogle,
    signOutUser,
    syncNow,
    syncStatus,
    products,
    businesses,
    sales,
    customers,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setSyncSuccessMsg('Signed in! Your shop data is now syncing to Google Cloud.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setErrorMsg('The sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in was cancelled before completion.');
      } else {
        setErrorMsg(err?.message || 'Google Sign-in encountered an issue. Please verify your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm('Sign out of your Google account? Your local shop data will remain safely stored on this device.')) {
      setLoading(true);
      try {
        await signOutUser();
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to sign out.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncSuccessMsg(null);
    setErrorMsg(null);
    try {
      await syncNow();
      setSyncSuccessMsg('All catalog products, sales, and settings successfully synchronized with Cloud Firestore!');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('Sync could not complete. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e121a] border border-white/10 rounded-3xl shadow-2xl p-5 max-h-[92vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#222b3d] text-[#e6c673] border border-[#d4af37]/30 flex items-center justify-center">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-heading tracking-tight">
                Google Cloud Backup & Sync
              </h3>
              <p className="text-xs text-slate-400">
                Offline-First Persistence • Firebase Cloud Firestore
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-800/50 flex items-start gap-2.5 text-xs text-rose-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Sign-in Notice</p>
              <p className="text-[11px] opacity-90 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Success Notification */}
        {syncSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Cloud Sync Success</p>
              <p className="text-[11px] opacity-90 mt-0.5">{syncSuccessMsg}</p>
            </div>
          </div>
        )}

        {/* User State */}
        {user ? (
          /* Signed In State */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141924] border border-[#d4af37]/20 flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Google Account'}
                  className="w-12 h-12 rounded-full border border-[#d4af37]/40 object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#d4af37] text-black font-black flex items-center justify-center text-lg shrink-0">
                  {user.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-mono font-bold">
                    CONNECTED
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white truncate mt-1">
                  {user.displayName || 'Ranks Shop Owner'}
                </h4>
                <p className="text-xs text-slate-400 font-mono truncate">{user.email}</p>
              </div>
            </div>

            {/* Cloud Sync Status Card */}
            <div className="p-4 rounded-2xl bg-[#141924] border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Database Engine:</span>
                <span className="font-mono text-[#e6c673] font-bold">
                  Cloud Firestore + IndexedDB Local Cache
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Network State:</span>
                <span className="flex items-center gap-1 font-mono text-xs">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      navigator.onLine ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {navigator.onLine ? 'Online (Real-time sync)' : 'Offline (Local cache)'}
                </span>
              </div>

              {/* Counts in Database */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10 text-center">
                <div className="p-2 rounded-xl bg-[#090c12]">
                  <p className="text-[10px] text-slate-400">Products</p>
                  <p className="text-sm font-bold text-white font-mono">{products.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-[#090c12]">
                  <p className="text-[10px] text-slate-400">Businesses</p>
                  <p className="text-sm font-bold text-white font-mono">{businesses.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-[#090c12]">
                  <p className="text-[10px] text-slate-400">Sales</p>
                  <p className="text-sm font-bold text-white font-mono">{sales.length}</p>
                </div>
                <div className="p-2 rounded-xl bg-[#090c12]">
                  <p className="text-[10px] text-slate-400">Customers</p>
                  <p className="text-sm font-bold text-white font-mono">{customers.length}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleManualSync}
                disabled={syncing || !navigator.onLine}
                className="w-full py-3 px-4 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                <span>{syncing ? 'Synchronizing with Firestore...' : 'Sync All Data to Cloud Now'}</span>
              </button>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#1a202c] hover:bg-[#252e3f] text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                <span>Sign Out of Google</span>
              </button>
            </div>
          </div>
        ) : (
          /* Not Signed In State */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#141924] border border-white/10 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Signing in with your Google account connects your shop to <strong>Cloud Firestore</strong> so your phones, accessories, popcorn machine stock, and sales tickets are always backed up and synchronized across all your devices.
              </p>

              <div className="space-y-2 text-xs text-slate-400 pt-1 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Works fully offline — automatically syncs when internet returns</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Access Ranks Shop on your Nokia G22, tablet, or PC</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#d4af37] shrink-0" />
                  <span>Local IndexedDB keeps working even if Google is offline</span>
                </div>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{loading ? 'Opening Google Sign-In...' : 'Sign in with Google Account'}</span>
            </button>

            <p className="text-[10px] text-center text-slate-500">
              Secured with Firebase Authentication • Free Spark Tier
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
