import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Star,
  Heart,
  Plus,
  Minus,
  ShoppingCart,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Share2,
  QrCode,
  Copy,
  Check,
  MessageCircle,
  Leaf,
} from 'lucide-react';
import { Product } from '../types';
import { offlineCache } from '../services/offlineCache';

interface ProductQuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  isInWishlist: boolean;
  onToggleWishlist: (product: Product) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onOpenFarmPassport?: (product: Product) => void;
  onShowToast?: (msg: string) => void;
  purchaseAccess?: {
    permitted: boolean;
    requiresSignIn: boolean;
    reason: string;
  };
  onRequireAuth?: (product: Product, quantity: number) => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  isInWishlist,
  onToggleWishlist,
  onAddToCart,
  onOpenFarmPassport,
  onShowToast,
  purchaseAccess,
  onRequireAuth,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setShowQr(false);
    setCopiedLink(false);
    setImgError(false);
  }, [product?.id]);

  useEffect(() => {
    if (!isOpen || !product || !showQr) return;
    let cancelled = false;
    const shareUrl = offlineCache.buildProductShareUrl(product.id);
    QRCode.toDataURL(shareUrl, {
      width: 176,
      margin: 2,
      color: { dark: '#064e3b', light: '#ffffff' },
    })
      .then((data) => {
        if (!cancelled) setQrUrl(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, product, showQr]);

  if (!isOpen || !product) return null;

  const shareUrl = offlineCache.buildProductShareUrl(product.id);
  const whatsappUrl = `https://wa.me/250788123456?text=${encodeURIComponent(
    `Muraho Fofo Green! I want to order ${quantity}x ${product.name} (${product.spec}) — ${shareUrl}`
  )}`;

  const canBuy = purchaseAccess ? purchaseAccess.permitted : product.inStock;
  const needsAuth = Boolean(purchaseAccess?.requiresSignIn);

  const handleAdd = () => {
    if (needsAuth && onRequireAuth) {
      onRequireAuth(product, quantity);
      onClose();
      return;
    }
    if (!canBuy) return;
    onAddToCart(product, quantity);
    onClose();
  };

  const handleCopyShareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — Fofo Green`,
          text: `${product.name} (${product.price.toLocaleString()} FRW / ${product.spec})`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onShowToast?.(`Direct link copied for ${product.name}`);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      onShowToast?.('Unable to copy link in this browser');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-stone-600 hover:text-stone-900 flex items-center justify-center shadow-md transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left: Product Image */}
          <div className="relative aspect-square md:aspect-auto md:h-full bg-stone-100 min-h-[280px]">
            {imgError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-100 text-emerald-800 p-6 text-center">
                <Leaf className="w-10 h-10 mb-2 text-emerald-700" />
                <span className="text-sm font-bold text-stone-800">{product.name}</span>
              </div>
            ) : (
              <img
                src={product.image}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            )}
            {product.badge && (
              <span className="absolute top-4 left-4 bg-emerald-700 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">
                {product.badge}
              </span>
            )}
          </div>

          {/* Right: Info & Controls */}
          <div className="p-6 md:p-8 flex flex-col justify-between space-y-5">
            <div>
              {/* Origin Tag */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>{product.origin}</span>
              </div>

              <h2 className="text-2xl font-bold text-stone-900 leading-tight">
                {product.name}
              </h2>

              <p className="text-xs text-stone-500 mt-1">
                Farmed by <strong className="text-stone-800">{product.farmer}</strong>
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="ml-1 text-sm font-bold text-stone-800 tabular-nums">{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-500">{product.reviewsCount} customer reviews</span>
              </div>

              {/* Price */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl font-black text-stone-900 tabular-nums">
                  {product.price.toLocaleString()} FRW
                </span>
                {product.oldPrice && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    {product.oldPrice.toLocaleString()} FRW
                  </span>
                )}
                <span className="text-xs font-medium text-stone-500">/ {product.spec}</span>
              </div>

              {/* Description */}
              <p className="mt-3 text-stone-600 text-xs sm:text-sm leading-relaxed">
                {product.description}
              </p>

              {/* Quick Specs Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-b border-stone-100 py-3">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Certified Organic</span>
                </div>
                {product.calories && (
                  <div className="flex items-center gap-1.5 text-stone-600">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{product.calories}</span>
                  </div>
                )}
                {product.harvested && (
                  <div className="col-span-2 text-stone-500 text-[11px]">
                    Freshness: <span className="font-semibold text-emerald-800">{product.harvested}</span>
                  </div>
                )}
              </div>

              {/* Anywhere Access Tools: Share Link, QR Code & WhatsApp */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer transition-colors"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied' : 'Share Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQr((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                    showQr
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQr ? 'Hide QR' : 'Scan QR'}</span>
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-semibold transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Order</span>
                </a>
              </div>

              {showQr && (
                <div className="mt-3 p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3">
                  {qrUrl && (
                    <img
                      src={qrUrl}
                      alt={`QR code for ${product.name}`}
                      className="w-20 h-20 rounded-lg bg-white p-1 border border-stone-200 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="text-xs font-bold text-stone-900">Open on Any Phone</div>
                    <div className="text-[11px] text-stone-500 truncate font-mono">{shareUrl}</div>
                    <button
                      type="button"
                      onClick={handleCopyShareLink}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy product URL</span>
                    </button>
                  </div>
                </div>
              )}

              {onOpenFarmPassport && (
                <div className="mt-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFarmPassport(product);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Inspect Rwandan Farm Passport &amp; Soil Credentials</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                {/* Quantity selector */}
                <div className="flex items-center border border-stone-200 rounded-xl p-1 bg-stone-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-stone-900 tabular-nums">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white text-stone-700 hover:bg-stone-200 flex items-center justify-center font-bold text-sm shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Add to Basket button */}
                <button
                  onClick={handleAdd}
                  disabled={!canBuy && !needsAuth}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl shadow-md transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    needsAuth
                      ? 'bg-stone-900 hover:bg-stone-800 text-white'
                      : 'bg-emerald-800 hover:bg-emerald-900 text-white'
                  }`}
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="tabular-nums">
                    {needsAuth
                      ? 'Sign In as Customer to Buy'
                      : !canBuy
                      ? purchaseAccess?.reason || 'Unavailable'
                      : `Add to Basket (${(product.price * quantity).toLocaleString()} FRW)`}
                  </span>
                </button>

                {/* Wishlist button */}
                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                    isInWishlist
                      ? 'border-rose-300 bg-rose-50 text-rose-600'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-rose-600' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
