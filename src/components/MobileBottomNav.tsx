import React from 'react';
import { Store, Search, Globe, ShoppingCart, MessageSquare } from 'lucide-react';

export type MobileNavTab = 'shop' | 'search' | 'anywhere' | 'cart' | 'support';

interface MobileBottomNavProps {
  cartCount: number;
  activeTab?: MobileNavTab;
  onScrollToShop: () => void;
  onFocusSearch: () => void;
  onOpenAccessHub: () => void;
  onOpenCart: () => void;
  onOpenSupport: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartCount,
  activeTab = 'shop',
  onScrollToShop,
  onFocusSearch,
  onOpenAccessHub,
  onOpenCart,
  onOpenSupport,
}) => {
  const itemClass = (isActive: boolean) =>
    `min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors cursor-pointer ${
      isActive
        ? 'bg-emerald-50 text-emerald-900 font-bold'
        : 'text-stone-600 hover:text-emerald-800 font-medium'
    }`;

  return (
    <nav
      aria-label="Mobile quick access navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 grid grid-cols-5 items-center gap-1 shadow-lg"
    >
      <button
        type="button"
        aria-current={activeTab === 'shop' ? 'page' : undefined}
        onClick={onScrollToShop}
        className={itemClass(activeTab === 'shop')}
      >
        <Store className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">Shop</span>
      </button>

      <button
        type="button"
        aria-current={activeTab === 'search' ? 'page' : undefined}
        onClick={onFocusSearch}
        className={itemClass(activeTab === 'search')}
      >
        <Search className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">Search</span>
      </button>

      <button
        type="button"
        aria-current={activeTab === 'anywhere' ? 'page' : undefined}
        onClick={onOpenAccessHub}
        className={itemClass(activeTab === 'anywhere')}
      >
        <Globe className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">Anywhere</span>
      </button>

      <button
        type="button"
        aria-current={activeTab === 'cart' ? 'page' : undefined}
        onClick={onOpenCart}
        className={`relative ${itemClass(activeTab === 'cart')}`}
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute top-1 right-3 bg-emerald-800 text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center tabular-nums">
            {cartCount}
          </span>
        )}
        <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">Basket</span>
      </button>

      <button
        type="button"
        aria-current={activeTab === 'support' ? 'page' : undefined}
        onClick={onOpenSupport}
        className={itemClass(activeTab === 'support')}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 leading-none whitespace-nowrap">Support</span>
      </button>
    </nav>
  );
};
