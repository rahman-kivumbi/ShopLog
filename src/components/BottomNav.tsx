import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users2,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  cartCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ cartCount = 0 }) => {
  const { activeTab, setActiveTab, filteredProducts } = useApp();

  // Count low stock items for badge
  const lowStockCount = filteredProducts.filter(
    (p) => p.currentStock <= p.lowStockThreshold
  ).length;

  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'sell', label: 'Sell', icon: ShoppingCart, badge: cartCount > 0 ? cartCount : null },
    { id: 'stock', label: 'Stock', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : null, badgeColor: 'bg-amber-500' },
    { id: 'people', label: 'People', icon: Users2 },
    { id: 'more', label: 'More', icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#090c12]/95 backdrop-blur-xl border-t border-white/[0.08] pb-safe">
      <div className="max-w-md mx-auto grid grid-cols-5 px-2 py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-[#e6c673] font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-[#e6c673]' : ''
                  }`}
                />
                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-bold flex items-center justify-center rounded-full text-black shadow-md animate-in zoom-in ${
                      tab.badgeColor || 'bg-[#e6c673]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 font-heading tracking-tight leading-none">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-4 h-0.5 bg-[#e6c673] rounded-full mt-1 shadow-sm" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
