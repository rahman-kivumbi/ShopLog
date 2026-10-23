import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Store,
  Sparkles,
  Building2,
  Plus,
  Edit2,
  Trash2,
  Check,
  Palette,
} from 'lucide-react';
import { Business, BusinessType } from '../../types';

interface BusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BusinessModal: React.FC<BusinessModalProps> = ({ isOpen, onClose }) => {
  const {
    businesses,
    addBusiness,
    updateBusiness,
    deleteBusiness,
    activeBusinessId,
    setActiveBusinessId,
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [editingBizId, setEditingBizId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<BusinessType>('shop');
  const [currency, setCurrency] = useState('UGX');
  const [color, setColor] = useState('#d4af37');
  const [phone, setPhone] = useState('');
  const [trn, setTrn] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const colorPalette = [
    '#d4af37', // Warm Gold
    '#f59e0b', // Amber / Popcorn
    '#10b981', // Emerald
    '#3b82f6', // Sapphire
    '#8b5cf6', // Violet
    '#ec4899', // Rose
    '#06b6d4', // Cyan
  ];

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingBizId(null);
    setName('');
    setType('shop');
    setCurrency('UGX');
    setColor('#d4af37');
    setPhone('');
    setTrn('');
    setAddress('');
  };

  const handleStartEdit = (b: Business) => {
    setEditingBizId(b.id);
    setIsCreating(false);
    setName(b.name);
    setType(b.type);
    setCurrency(b.currency || 'UGX');
    setColor(b.color);
    setPhone(b.phone || '');
    setTrn(b.trn || '');
    setAddress(b.address || '');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingBizId) {
      updateBusiness(editingBizId, {
        name: name.trim(),
        type,
        currency: currency.trim() || 'UGX',
        color,
        phone: phone.trim() || undefined,
        trn: trn.trim() || undefined,
        address: address.trim() || undefined,
      });
      setEditingBizId(null);
    } else {
      const newId = addBusiness({
        name: name.trim(),
        type,
        currency: currency.trim() || 'UGX',
        color,
        phone: phone.trim() || undefined,
        trn: trn.trim() || undefined,
        address: address.trim() || undefined,
      });
      setActiveBusinessId(newId);
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0e121a] border border-white/10 rounded-3xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#d4af37]" />
            <h3 className="text-sm font-bold text-white font-heading">
              Manage Businesses & Ventures
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Businesses List */}
        {!isCreating && !editingBizId && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">
                Active Ventures ({businesses.length})
              </span>
              <button
                onClick={handleStartCreate}
                className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Business
              </button>
            </div>

            <div className="space-y-2">
              {businesses.map((biz) => (
                <div
                  key={biz.id}
                  className="p-3 rounded-2xl bg-[#141924] border border-white/10 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-black font-black shrink-0"
                      style={{ backgroundColor: biz.color }}
                    >
                      {biz.type === 'machine' ? (
                        <Sparkles className="w-4 h-4 text-black" />
                      ) : (
                        <Store className="w-4 h-4 text-black" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate text-sm">{biz.name}</p>
                      <p className="text-[11px] text-slate-400 capitalize">
                        {biz.type} • Currency: {biz.currency} {biz.phone ? `• ${biz.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleStartEdit(biz)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Edit Business"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {businesses.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${biz.name}"? Products belonging to it will remain in archive.`)) {
                            deleteBusiness(biz.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Business"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create / Edit Form */}
        {(isCreating || editingBizId) && (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <h4 className="text-xs font-bold text-[#e6c673] uppercase tracking-wider font-heading">
              {editingBizId ? 'Edit Business Details' : 'Add New Side Business or Stall'}
            </h4>

            <div>
              <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ranks Popcorn Machine or Kiosk"
                className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-medium focus:border-[#d4af37] focus:outline-none"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Business Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as BusinessType)}
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white focus:border-[#d4af37] focus:outline-none"
                >
                  <option value="shop">Retail Shop</option>
                  <option value="machine">Machine / Vending (e.g. Popcorn)</option>
                  <option value="kiosk">Mall / Street Kiosk</option>
                  <option value="other">Other Venture</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Default Currency
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="UGX"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono uppercase focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            {/* Color Accent Picker */}
            <div>
              <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                Theme Color
              </label>
              <div className="flex items-center gap-2">
                {colorPalette.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-[#d4af37] shadow-md' : 'opacity-80'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-black font-bold" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Contact & TIN */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+256 701 234 567"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                  URA TIN (Tax No)
                </label>
                <input
                  type="text"
                  value={trn}
                  onChange={(e) => setTrn(e.target.value)}
                  placeholder="101XXXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white font-mono text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                Physical Location / Shop Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Shop 4, Kampala Road, Kampala, Uganda"
                className="w-full px-3 py-2 rounded-xl bg-[#141924] border border-white/10 text-white focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingBizId(null);
                }}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e6c673] text-black font-bold shadow-md active:scale-95 transition-all"
              >
                {editingBizId ? 'Update Business' : 'Save Business'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
