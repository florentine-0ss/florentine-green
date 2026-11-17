import React from 'react';
import { Store, Search, Globe, ShoppingCart, MessageSquare } from 'lucide-react';

interface MobileBottomNavProps {
  cartCount: number;
  onScrollToShop: () => void;
  onFocusSearch: () => void;
  onOpenAccessHub: () => void;
  onOpenCart: () => void;
  onOpenSupport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  onScrollToShop,
  onFocusSearch,
  onOpenAccessHub,
  onOpenCart,
  onOpenSupport,
}) => {
  return (
    <nav
      aria-label="Mobile quick access navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 grid grid-cols-5 items-center shadow-lg"
    >
      <button
        type="button"
        onClick={onScrollToShop}
        className="min-h-[44px] flex flex-col items-center justify-center text-stone-700 hover:text-emerald-800 cursor-pointer transition-colors"
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5 leading-none whitespace-nowrap">Shop</span>
      </button>

      <button
        type="button"
        onClick={onFocusSearch}
        className="min-h-[44px] flex flex-col items-center justify-center text-stone-700 hover:text-emerald-800 cursor-pointer transition-colors"
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5 leading-none whitespace-nowrap">Search</span>
      </button>

      <button
        type="button"
        onClick={onOpenAccessHub}
        className="min-h-[44px] flex flex-col items-center justify-center text-emerald-800 font-bold cursor-pointer transition-colors"
      >
        <Globe className="w-5 h-5" />
        <span className="text-[10px] font-bold mt-0.5 leading-none whitespace-nowrap">Anywhere</span>
      </button>

      <button
        type="button"
        onClick={onOpenCart}
        className="relative min-h-[44px] flex flex-col items-center justify-center text-stone-700 hover:text-emerald-800 cursor-pointer transition-colors"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute top-1 right-3 bg-emerald-800 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center tabular-nums">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] font-semibold mt-0.5 leading-none whitespace-nowrap">Basket</span>
      </button>

      <button
        type="button"
        onClick={onOpenSupport}
        className="min-h-[44px] flex flex-col items-center justify-center text-stone-700 hover:text-emerald-800 cursor-pointer transition-colors"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] font-semibold mt-0.5 leading-none whitespace-nowrap">Support</span>
      </button>
    </nav>
  );
};
