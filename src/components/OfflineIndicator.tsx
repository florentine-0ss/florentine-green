import React from 'react';
import { WifiOff, Smartphone } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  cachedProductsCount: number;
  onOpenAccessHub: () => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  cachedProductsCount,
  onOpenAccessHub,
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-950 text-amber-50 border-b border-amber-800 px-4 py-2 text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-300 shrink-0" />
          <span className="font-semibold">
            Offline Mode Active — Showing {cachedProductsCount} cached produce items. Your cart stays saved.
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenAccessHub}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Order via Phone / SMS / USSD</span>
        </button>
      </div>
    </div>
  );
};
