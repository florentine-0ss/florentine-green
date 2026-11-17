import { CartItem, DeliveryZoneSelection, Product } from '../types';
import { RWANDA_LOCATIONS } from '../data/mockData';

const CACHE_KEYS = {
  PRODUCTS: 'fofo_offline_products_v1',
  PRODUCTS_SYNCED_AT: 'fofo_offline_products_synced_at',
  CART: 'fofo_saved_cart_v1',
  WISHLIST: 'fofo_saved_wishlist_v1',
  LOCATION: 'fofo_selected_location_v1',
};

export const DEFAULT_LOCATION_SELECTION: DeliveryZoneSelection = {
  district: RWANDA_LOCATIONS[0].district,
  sector: RWANDA_LOCATIONS[0].sectors[0],
  fee: RWANDA_LOCATIONS[0].fee,
  estimatedHours: RWANDA_LOCATIONS[0].estimatedHours,
  fulfillmentMode: 'delivery',
};

export const offlineCache = {
  saveProducts(products: Product[]) {
    try {
      if (!products || products.length === 0) return;
      localStorage.setItem(CACHE_KEYS.PRODUCTS, JSON.stringify(products));
      localStorage.setItem(CACHE_KEYS.PRODUCTS_SYNCED_AT, new Date().toISOString());
    } catch {
      // Ignore quota issues cleanly
    }
  },

  loadProducts(): Product[] | null {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.PRODUCTS);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
    } catch {
      return null;
    }
  },

  getProductsSyncedAt(): string | null {
    try {
      return localStorage.getItem(CACHE_KEYS.PRODUCTS_SYNCED_AT);
    } catch {
      return null;
    }
  },

  saveCart(cart: CartItem[]) {
    try {
      localStorage.setItem(CACHE_KEYS.CART, JSON.stringify(cart));
    } catch {}
  },

  loadCart(): CartItem[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.CART);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveWishlist(wishlist: Product[]) {
    try {
      localStorage.setItem(CACHE_KEYS.WISHLIST, JSON.stringify(wishlist));
    } catch {}
  },

  loadWishlist(): Product[] {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.WISHLIST);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveLocation(loc: DeliveryZoneSelection) {
    try {
      localStorage.setItem(CACHE_KEYS.LOCATION, JSON.stringify(loc));
    } catch {}
  },

  loadLocation(): DeliveryZoneSelection {
    try {
      const raw = localStorage.getItem(CACHE_KEYS.LOCATION);
      if (!raw) return DEFAULT_LOCATION_SELECTION;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.district && parsed.sector) {
        return parsed;
      }
      return DEFAULT_LOCATION_SELECTION;
    } catch {
      return DEFAULT_LOCATION_SELECTION;
    }
  },

  buildProductShareUrl(productId: number): string {
    if (typeof window === 'undefined') return `/?product=${productId}`;
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('product', String(productId));
    return url.toString();
  },

  buildStoreAccessUrl(location?: DeliveryZoneSelection, category?: string): string {
    if (typeof window === 'undefined') return '/';
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    if (location?.district) {
      url.searchParams.set('zone', location.district);
    }
    if (category && category !== 'all') {
      url.searchParams.set('category', category);
    }
    return url.toString();
  },

  buildWhatsAppOrderMessage(cart: CartItem[], location: DeliveryZoneSelection): string {
    if (cart.length === 0) {
      return `Muraho Fofo Green! I would like to order fresh produce for ${location.sector} (${location.district}).`;
    }
    const lines = cart.map(
      (item, idx) =>
        `${idx + 1}. ${item.product.name} (${item.product.spec}) x${item.quantity} = ${(
          item.product.price * item.quantity
        ).toLocaleString()} FRW`
    );
    const subtotal = cart.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const fee = subtotal >= 25000 ? 0 : location.fee;
    const total = subtotal + fee;
    return [
      'FOFO GREEN ORDER REQUEST',
      `Area: ${location.sector}, ${location.district} (${location.fulfillmentMode})`,
      ...lines,
      `Delivery/Hub Fee: ${fee.toLocaleString()} FRW`,
      `Total: ${total.toLocaleString()} FRW`,
    ].join('\n');
  },
};
