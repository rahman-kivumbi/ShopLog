import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lock, Delete, ShieldAlert } from 'lucide-react';

export const PinLockModal: React.FC = () => {
  const { isLocked, unlockApp } = useApp();
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  if (!isLocked) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Attempt unlock
        const success = unlockApp(nextPin);
        if (!success) {
          setErrorShake(true);
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => {
            setErrorShake(false);
            setPin('');
          }, 600);
        } else {
          setPin('');
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#090c12] flex flex-col items-center justify-center p-6 animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-xs text-center space-y-6">
        {/* App Branding */}
        <div className="space-y-2">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#141924] border border-[#d4af37]/30 flex items-center justify-center text-[#e6c673] shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white font-heading tracking-tight">
            Ranks Shop Locked
          </h1>
          <p className="text-xs text-slate-400">
            Enter 4-digit PIN to access register & inventory
          </p>
        </div>

        {/* 4-digit PIN circles */}
        <div
          className={`flex justify-center items-center gap-4 py-2 ${
            errorShake ? 'animate-bounce text-rose-500' : ''
          }`}
        >
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-[#d4af37] border-[#e6c673] scale-125 shadow-sm'
                    : 'border-slate-700 bg-[#141924]'
                } ${errorShake ? 'border-rose-500 bg-rose-500' : ''}`}
              />
            );
          })}
        </div>

        {errorShake && (
          <p className="text-xs font-semibold text-rose-400 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Incorrect PIN. Try again.
          </p>
        )}

        {/* Numeric Touch Keypad for Nokia G22 */}
        <div className="grid grid-cols-3 gap-3 pt-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-16 rounded-2xl bg-[#141924] hover:bg-[#1c2333] active:scale-90 border border-white/[0.08] text-xl font-bold text-white transition-all flex items-center justify-center font-mono shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Blank Spacer */}
          <div />

          {/* Zero */}
          <button
            onClick={() => handleDigit('0')}
            className="h-16 rounded-2xl bg-[#141924] hover:bg-[#1c2333] active:scale-90 border border-white/[0.08] text-xl font-bold text-white transition-all flex items-center justify-center font-mono shadow-sm"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-[#141924] hover:bg-[#1c2333] active:scale-90 border border-white/[0.08] text-slate-300 hover:text-white transition-all flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
