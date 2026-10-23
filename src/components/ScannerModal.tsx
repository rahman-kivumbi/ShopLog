import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, Flashlight, CheckCircle2, AlertCircle, Search, Keyboard } from 'lucide-react';
import { isValidLuhn } from '../lib/luhn';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string) => void;
  title?: string;
  isImeiMode?: boolean;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode or IMEI',
  isImeiMode = false,
}) => {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isManualTab, setIsManualTab] = useState(false);
  const [scannedFeedback, setScannedFeedback] = useState<string | null>(null);

  const qrReaderRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'mobile-barcode-reader-div';

  useEffect(() => {
    if (!isOpen || isManualTab) {
      stopScanner();
      return;
    }

    let isSubscribed = true;

    const startScanner = async () => {
      try {
        setCameraError(null);
        if (qrReaderRef.current) {
          try {
            await qrReaderRef.current.stop();
          } catch {
            // ignore
          }
        }

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        qrReaderRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.33,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (!isSubscribed) return;
            if (navigator.vibrate) {
              navigator.vibrate(80);
            }
            setScannedFeedback(decodedText);
            setTimeout(() => {
              onScan(decodedText);
              onClose();
            }, 300);
          },
          () => {
            // scanning loop
          }
        );
      } catch (err: any) {
        console.warn('Camera scanner init note:', err);
        setCameraError(
          err?.message || 'Camera access not allowed or unavailable. Use manual input below.'
        );
        setIsManualTab(true);
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      stopScanner();
    };
  }, [isOpen, isManualTab]);

  const stopScanner = async () => {
    if (qrReaderRef.current) {
      try {
        if (qrReaderRef.current.isScanning) {
          await qrReaderRef.current.stop();
        }
        qrReaderRef.current.clear();
      } catch (e) {
        console.warn('Scanner stop note:', e);
      }
      qrReaderRef.current = null;
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onScan(manualInput.trim());
    onClose();
  };

  if (!isOpen) return null;

  const isLuhnValid = isImeiMode && manualInput.length === 15 ? isValidLuhn(manualInput) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0e121a] border border-white/15 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#131822]">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#e6c673]" />
            <div>
              <h3 className="text-sm font-bold text-white font-heading">{title}</h3>
              <p className="text-[11px] text-slate-400">
                {isImeiMode ? 'Point camera at 15-digit IMEI or type' : 'Align barcode in camera box'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View Mode Toggle: Camera vs Manual */}
        <div className="grid grid-cols-2 p-1.5 bg-[#090c12] border-b border-white/10 gap-1 text-xs font-semibold">
          <button
            onClick={() => setIsManualTab(false)}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              !isManualTab
                ? 'bg-[#1e2536] text-[#e6c673] font-bold border border-[#d4af37]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera Scanner
          </button>
          <button
            onClick={() => {
              setIsManualTab(true);
              stopScanner();
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              isManualTab
                ? 'bg-[#1e2536] text-[#e6c673] font-bold border border-[#d4af37]/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual Typing
          </button>
        </div>

        {/* Camera Scanner View */}
        {!isManualTab && (
          <div className="relative flex-1 bg-black flex flex-col items-center justify-center min-h-[300px] overflow-hidden">
            <div id={scannerContainerId} className="w-full h-full max-w-sm rounded-lg overflow-hidden" />

            {/* Target Reticle Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-dashed border-[#e6c673]/80 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-[#e6c673] -mt-1 -ml-1 rounded-tl" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-[#e6c673] -mt-1 -mr-1 rounded-tr" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-[#e6c673] -mb-1 -ml-1 rounded-bl" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-[#e6c673] -mb-1 -mr-1 rounded-br" />
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[#e6c673]/40 animate-pulse" />
              </div>
            </div>

            {scannedFeedback && (
              <div className="absolute bottom-4 bg-[#141924] border border-emerald-400 text-emerald-300 px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Scanned: {scannedFeedback}
              </div>
            )}

            {cameraError && (
              <div className="p-4 text-center">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-slate-300 mb-3">{cameraError}</p>
                <button
                  onClick={() => setIsManualTab(true)}
                  className="px-4 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl"
                >
                  Switch to Manual Input
                </button>
              </div>
            )}
          </div>
        )}

        {/* Manual Input Form */}
        {isManualTab && (
          <div className="p-5 space-y-4 flex-1">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {isImeiMode ? 'Enter 15-Digit IMEI or Serial' : 'Enter Barcode / SKU'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder={isImeiMode ? 'e.g. 358941092834012' : 'e.g. 195949038221'}
                    className="w-full px-3.5 py-3 rounded-2xl bg-[#141924] border border-white/10 text-white font-mono text-sm focus:border-[#e6c673] focus:outline-none"
                    autoFocus
                  />
                  {manualInput && (
                    <button
                      type="button"
                      onClick={() => setManualInput('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Luhn Algorithm Feedback if IMEI mode */}
              {isImeiMode && manualInput.length > 0 && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    isLuhnValid === true
                      ? 'bg-emerald-950/40 border-emerald-800/30 text-emerald-300'
                      : manualInput.length === 15
                      ? 'bg-rose-950/40 border-rose-800/30 text-rose-300'
                      : 'bg-[#141924] border-white/5 text-slate-400'
                  }`}
                >
                  {isLuhnValid === true ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Valid 15-digit IMEI (Luhn checksum passed)</span>
                    </>
                  ) : manualInput.length === 15 ? (
                    <>
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>Invalid Luhn Checksum! Check digits.</span>
                    </>
                  ) : (
                    <span>
                      {manualInput.length}/15 digits entered ({15 - manualInput.length} left)
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="w-full py-3 rounded-2xl bg-[#d4af37] hover:bg-[#e6c673] disabled:opacity-40 text-black font-bold text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" /> Use this Code
              </button>
            </form>
          </div>
        )}

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-[#090c12] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <span>Camera Barcode & IMEI Scanner</span>
          <button
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="text-[#e6c673] hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
