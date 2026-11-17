import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_REVIEWS, 
  INITIAL_ACTIVITIES, 
  INITIAL_USERS,
  INITIAL_ORDERS,
  MEAL_KITS,
  INITIAL_STOCK_BATCHES,
  INITIAL_DAMAGED_ITEMS,
  INITIAL_STOCK_ALERTS,
  INITIAL_FINANCIAL_RECORDS,
  INITIAL_RECEIPTS,
  DEFAULT_ROLE_PERMISSIONS,
  INITIAL_COUNTRY_LOCATIONS
} from './data/mockData';
import { TRANSLATIONS } from './data/translations';
import { 
  Product, 
  CartItem, 
  Language, 
  User, 
  Order, 
  CustomerReview, 
  SystemActivity, 
  PaymentMethod,
  ColorTheme,
  MealKit,
  UserRole,
  StaffPermissions,
  StockInBatch,
  DamagedStockItem,
  StockAlert,
  FinancialRecord,
  SalesReceipt,
  ReceiptFeedback,
  DeliveryZoneSelection,
  CountryLocation
} from './types';

// Components
import { RoleWorkspaceBar } from './components/RoleWorkspaceBar';
import { Navbar, NavbarSelection } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductCard } from './components/ProductCard';
import { ProductQuickViewModal } from './components/ProductQuickViewModal';
import { AboutSection } from './components/AboutSection';
import { DeliverySection } from './components/DeliverySection';
import { ReviewsSection } from './components/ReviewsSection';
import { ContactSection } from './components/ContactSection';
import { CartSidebar } from './components/CartSidebar';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/AuthModal';
import { SystemLoginModal } from './components/SystemLoginModal';
import { AdminPanel } from './components/AdminPanel';
import { StockManagerWorkspace } from './components/StockManagerWorkspace';
import { CashierWorkspace } from './components/CashierWorkspace';
import { SalesAttendantWorkspace } from './components/SalesAttendantWorkspace';
import { AccountantWorkspace } from './components/AccountantWorkspace';
import { CustomerFruitMarketModal } from './components/CustomerFruitMarketModal';
import { ReceiptModal } from './components/ReceiptModal';
import { WishlistModal } from './components/WishlistModal';
import { ThemeSelector } from './components/ThemeSelector';
import { Footer } from './components/Footer';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { FarmPassportModal } from './components/FarmPassportModal';
import { MealKitsSection } from './components/MealKitsSection';
import { CommunityChatModal } from './components/CommunityChatModal';
import { AccessAnywhereModal } from './components/AccessAnywhereModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PWAInstallButton } from './components/PWAInstallButton';
import { MobileBottomNav, MobileNavTab } from './components/MobileBottomNav';
import { RealtimeCommunityProvider } from './context/RealtimeCommunityContext';
import { LivePresenceNotifications } from './components/LivePresenceNotifications';
import { api, DatabaseHealth } from './services/api';
import { offlineCache } from './services/offlineCache';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, syncFirebaseUserProfile } from './lib/firebase';
import { getProductAccessForUser, isProductPermittedForCustomerCapacity } from './utils/purchasePermissions';

// Icons
import { SlidersHorizontal, CheckCircle2, Activity, ShieldCheck, Palette, Navigation, Database, MessageSquare, Globe, MapPin, Lock, ShoppingBag } from 'lucide-react';

export default function App() {
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [reviews, setReviews] = useState<CustomerReview[]>(INITIAL_REVIEWS);
  const [activities, setActivities] = useState<SystemActivity[]>(INITIAL_ACTIVITIES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [countryLocations, setCountryLocations] = useState<CountryLocation[]>(INITIAL_COUNTRY_LOCATIONS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dbHealth, setDbHealth] = useState<DatabaseHealth | null>(null);

  // 6 Roles Operational Domain States
  const [stockBatches, setStockBatches] = useState<StockInBatch[]>(INITIAL_STOCK_BATCHES);
  const [damagedItems, setDamagedItems] = useState<DamagedStockItem[]>(INITIAL_DAMAGED_ITEMS);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>(INITIAL_STOCK_ALERTS);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(INITIAL_FINANCIAL_RECORDS);
  const [receiptsHistory, setReceiptsHistory] = useState<SalesReceipt[]>(INITIAL_RECEIPTS);

  // Dedicated Workspaces Modal Triggers
  const [isStockManagerOpen, setIsStockManagerOpen] = useState(false);
  const [isCashierOpen, setIsCashierOpen] = useState(false);
  const [isSalesAttendantOpen, setIsSalesAttendantOpen] = useState(false);
  const [isAccountantOpen, setIsAccountantOpen] = useState(false);
  const [isCustomerMarketOpen, setIsCustomerMarketOpen] = useState(false);
  const [isCommunityChatOpen, setIsCommunityChatOpen] = useState(false);
  const [activeReceiptModal, setActiveReceiptModal] = useState<SalesReceipt | null>(null);
  const [openChatAfterLogin, setOpenChatAfterLogin] = useState(false);
  const [openMarketAfterLogin, setOpenMarketAfterLogin] = useState(false);

  // Customer Purchase Access & Pending Action Refs
  const [permittedOnly, setPermittedOnly] = useState<boolean>(false);
  const pendingCartActionRef = useRef<{ product: Product; quantity: number } | null>(null);
  const pendingCheckoutRef = useRef<{ discount: number; payment: PaymentMethod } | null>(null);
  const manualSessionRef = useRef<boolean>(false);

  const openCommunityChat = () => {
    setIsCommunityChatOpen(true);
  };

  const handleQuickJoinChatCustomer = (displayName: string) => {
    const cleanName = displayName.trim().slice(0, 60);
    if (!cleanName) return;
    const joinedCustomer: User = {
      id: `usr-joined-${Date.now().toString().slice(-5)}`,
      name: cleanName,
      email: `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@guest.fofogreen.rw`,
      phone: '+250 788 000 000',
      role: 'customer',
      joinedDate: 'Just joined',
      ordersCount: 0,
      status: 'active',
      department: 'Public Chat Member',
      permissions: DEFAULT_ROLE_PERMISSIONS.customer,
      lastLogin: 'Just now',
    };
    manualSessionRef.current = true;
    setCurrentUser(joinedCustomer);
    setUsers((prev) => [joinedCustomer, ...prev.filter((u) => u.id !== joinedCustomer.id)]);
    setPermittedOnly(true);
    showToast(`Joined chat as ${cleanName}`);

    const joinAct: SystemActivity = {
      id: `ACT-JOIN-${Date.now().toString().slice(-4)}`,
      title: 'Customer Joined Public Chat',
      detail: `${cleanName} joined the public community support chat.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'user',
      status: 'info',
      actor: cleanName,
      actorRole: 'customer',
    };
    setActivities((prev) => [joinAct, ...prev]);
  };

  const openCustomerMarket = () => {
    if (!currentUser) {
      setOpenMarketAfterLogin(true);
      setIsAuthOpen(true);
      showToast('Sign in as a customer to enter the Customer Market');
      return;
    }
    setIsCustomerMarketOpen(true);
  };

  // Sync Firebase Auth session when returning to app (without overriding manual role/demo switches)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || manualSessionRef.current) return;
      try {
        const profile = await syncFirebaseUserProfile(fbUser, 'customer');
        if (manualSessionRef.current) return;
        setCurrentUser(profile);
        setUsers((prev) => [profile, ...prev.filter((u) => u.id !== profile.id)]);
        if (profile.role === 'customer') {
          setPermittedOnly(true);
        }
      } catch (err) {
        console.warn('[Auth] Failed to hydrate Firebase session:', err);
      }
    });
    return () => unsubscribe();
  }, []);

  // Connect to persistent Node.js Express backend and database (with offline cache fallback)
  useEffect(() => {
    async function loadBackendData() {
      try {
        const health = await api.checkHealth();
        if (health) setDbHealth(health);

        const [dbProds, dbOrds, dbRevs, dbActs, dbLocs] = await Promise.all([
          api.getProducts(),
          api.getOrders(),
          api.getReviews(),
          api.getActivities(),
          api.getLocations()
        ]);

        if (dbProds && dbProds.length > 0) {
          setProducts(dbProds);
          offlineCache.saveProducts(dbProds);
        }
        if (dbOrds && dbOrds.length > 0) setOrders(dbOrds);
        if (dbRevs && dbRevs.length > 0) setReviews(dbRevs);
        if (dbActs && dbActs.length > 0) setActivities(dbActs);
        if (dbLocs && dbLocs.length > 0) setCountryLocations(dbLocs);
      } catch (err) {
        console.warn('[Fofo] Backend initial sync — checking offline cache:', err);
        const cachedProds = offlineCache.loadProducts();
        if (cachedProds && cachedProds.length > 0) {
          setProducts(cachedProds);
        }
      }
    }
    loadBackendData();
  }, []);

  // Cart, Wishlist & Active Delivery Location State (persisted for anytime access)
  const [cart, setCart] = useState<CartItem[]>(() => offlineCache.loadCart());
  const [wishlist, setWishlist] = useState<Product[]>(() => offlineCache.loadWishlist());
  const [selectedLocation, setSelectedLocation] = useState<DeliveryZoneSelection>(() =>
    offlineCache.loadLocation()
  );
  const [isAccessHubOpen, setIsAccessHubOpen] = useState(false);
  const deepLinkAppliedRef = useRef(false);

  useEffect(() => {
    offlineCache.saveCart(cart);
  }, [cart]);

  useEffect(() => {
    offlineCache.saveWishlist(wishlist);
  }, [wishlist]);

  useEffect(() => {
    offlineCache.saveLocation(selectedLocation);
  }, [selectedLocation]);

  useEffect(() => {
    if (products.length > 0) {
      offlineCache.saveProducts(products);
    }
  }, [products]);

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSystemLoginOpen, setIsSystemLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState<'catalog' | 'orders' | 'customers' | 'activity' | 'reports' | 'schema' | 'chat' | 'locations'>('activity');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod>('mtn');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileNavTab>('shop');

  // New Features: Order Tracking Radar & Farm Passport
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const [farmPassportProduct, setFarmPassportProduct] = useState<Product | null>(null);

  // Theme / Color Palette State
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>('lush-emerald');
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);

  // Homepage Banner Minimization State (allows toggling between clear hero banner & compact store mode)
  const [isHeroMinimized, setIsHeroMinimized] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('fofo_hero_minimized');
      if (stored !== null) return stored === 'true';
      return false; // Show the clear, bright homepage by default
    } catch {
      return false;
    }
  });

  const handleToggleHeroMinimized = () => {
    setIsHeroMinimized((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('fofo_hero_minimized', String(next));
      } catch {}
      showToast(next ? 'Homepage minimized — full navigation & store visible' : 'Homepage banner expanded');
      return next;
    });
  };

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleThemeChange = (newTheme: ColorTheme) => {
    setCurrentTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    showToast(`Color theme updated`);
  };

  // Support deep-link sharing & QR scanning (?product=, ?category=, ?q=, ?zone=)
  useEffect(() => {
    if (deepLinkAppliedRef.current || products.length === 0) return;
    deepLinkAppliedRef.current = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const prodParam = params.get('product');
      const catParam = params.get('category');
      const qParam = params.get('q');
      const zoneParam = params.get('zone');

      if (zoneParam) {
        const matchedZone = countryLocations.find(
          (l) => l.district.toLowerCase() === zoneParam.toLowerCase()
        );
        if (matchedZone) {
          setSelectedLocation({
            district: matchedZone.district,
            sector: matchedZone.sectors[0],
            fee: matchedZone.fee,
            estimatedHours: matchedZone.estimatedHours,
            fulfillmentMode: matchedZone.mode || 'delivery',
          });
        }
      }

      if (catParam) {
        setSelectedCategory(catParam);
        setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 200);
      }

      if (qParam) {
        setSearchQuery(qParam);
        setTimeout(() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }), 200);
      }

      if (prodParam) {
        const pid = Number(prodParam);
        const found = products.find((p) => p.id === pid);
        if (found) {
          setQuickViewProduct(found);
        }
      }
    } catch {
      // Ignore malformed query params
    }
  }, [products]);

  const handleShareProduct = async (product: Product) => {
    const shareUrl = offlineCache.buildProductShareUrl(product.id);
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} — Fofo Green`,
          text: `${product.name} (${product.price.toLocaleString()} FRW / ${product.spec})`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(`Direct product link copied for ${product.name}`);
    } catch {
      setQuickViewProduct(product);
    }
  };

  // Active Country Locations exposed to customers and storefront
  const activeCountryLocations = useMemo(() => {
    const active = countryLocations.filter((loc) => loc.isActive !== false);
    return active.length > 0 ? active : countryLocations;
  }, [countryLocations]);

  // Translations shortcut
  const t = TRANSLATIONS[currentLang];

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const customerPermittedCount = useMemo(
    () => products.filter((p) => isProductPermittedForCustomerCapacity(p, currentUser)).length,
    [products, currentUser]
  );

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Customer permitted products filter
      if (permittedOnly && !isProductPermittedForCustomerCapacity(p, currentUser)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesFarmer = p.farmer.toLowerCase().includes(q);
        const matchesOrigin = p.origin.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesFarmer && !matchesOrigin) {
          return false;
        }
      }
      // In stock only
      if (inStockOnly && !p.inStock) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // featured maintains original order
    });
  }, [products, selectedCategory, searchQuery, inStockOnly, sortBy, permittedOnly, currentUser]);

  // Prompt customer sign-in before adding or purchasing products
  const handleRequireAuthForProduct = (product: Product, quantity: number = 1) => {
    pendingCartActionRef.current = { product, quantity };
    setIsAuthOpen(true);
    showToast('Sign in as a customer to purchase permitted products');
  };

  // Cart operations (gated by customer sign-in and purchase capacity)
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    if (!currentUser) {
      handleRequireAuthForProduct(product, quantity);
      return;
    }

    const access = getProductAccessForUser(product, currentUser);
    if (!access.permitted) {
      showToast(access.reason);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added ${product.name} to basket`);
  };

  const handleUpdateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveCartItem(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveCartItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Wishlist operations
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        showToast(`Removed from wishlist`);
        return prev.filter((p) => p.id !== product.id);
      }
      showToast(`Saved ${product.name} to wishlist`);
      return [...prev, product];
    });
  };

  const handleRemoveFromWishlist = (productId: number) => {
    setWishlist((prev) => prev.filter((p) => p.id !== productId));
  };

  // Checkout handling (requires signed-in customer session)
  const handleProceedToCheckout = (discount: number, payment: PaymentMethod) => {
    if (!currentUser) {
      pendingCheckoutRef.current = { discount, payment };
      setIsAuthOpen(true);
      showToast('Please sign in as a customer to complete your purchase');
      return;
    }
    setCheckoutDiscount(discount);
    setCheckoutPaymentMethod(payment);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleOrderComplete = async (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]); // Clear cart
    
    // Save to persistent Node.js Database
    try {
      await api.createOrder(newOrder);
    } catch (err) {
      console.warn('Failed to sync order to database:', err);
    }

    // Log system activity
    const newAct: SystemActivity = {
      id: `ACT-ORD-${newOrder.id}`,
      title: `Order #${newOrder.id} Placed & Paid`,
      detail: `${newOrder.customerName} (${newOrder.phone}) authorized ${newOrder.total.toLocaleString()} FRW via ${newOrder.paymentMethod.toUpperCase()} (${newOrder.district})`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'order',
      status: 'success',
      actor: newOrder.customerName,
      actorRole: 'customer',
      metadata: {
        orderId: newOrder.id,
        itemsCount: newOrder.items.length,
        total: newOrder.total,
        payment: newOrder.paymentMethod,
        district: newOrder.district
      }
    };
    setActivities((prev) => [newAct, ...prev]);
    setTrackingOrderId(newOrder.id);
  };

  const handleOpenOrderTracker = (orderId?: string) => {
    if (orderId) setTrackingOrderId(orderId);
    setIsOrderTrackerOpen(true);
  };

  const handleOpenFarmPassport = (product: Product) => {
    setFarmPassportProduct(product);
  };

  const handleAddBundleToCart = (kit: MealKit) => {
    if (!currentUser) {
      const firstProd = products.find((p) => kit.productIds.includes(p.id));
      if (firstProd) {
        pendingCartActionRef.current = { product: firstProd, quantity: 1 };
      }
      setIsAuthOpen(true);
      showToast('Sign in as a customer to purchase harvest meal kits');
      return;
    }
    kit.productIds.forEach((pid) => {
      const prod = products.find((p) => p.id === pid);
      if (prod && getProductAccessForUser(prod, currentUser).permitted) {
        handleAddToCart(prod, 1);
      }
    });
    const newAct: SystemActivity = {
      id: `ACT-KIT-${Date.now().toString().slice(-4)}`,
      title: 'Harvest Meal Kit Added to Cart',
      detail: `Customer selected "${kit.name}" recipe bundle (${kit.bundlePrice.toLocaleString()} FRW).`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'order',
      status: 'info',
      actor: currentUser ? currentUser.name : 'Customer',
      actorRole: 'customer',
      metadata: { kitId: kit.id, price: kit.bundlePrice }
    };
    setActivities((prev) => [newAct, ...prev]);
    showToast(`Added ${kit.name} to cart!`);
    setIsCartOpen(true);
  };

  // Admin operations with Node.js Database persistence
  const handleAddProduct = async (newProd: Product) => {
    setProducts((prev) => [newProd, ...prev]);
    showToast(`Added ${newProd.name} to product catalog`);
    try {
      await api.addProduct(newProd);
    } catch (e) {
      console.warn('Sync product add error:', e);
    }
    const newAct: SystemActivity = {
      id: `ACT-PRD-${Date.now().toString().slice(-4)}`,
      title: `Harvest Item Added to Catalog`,
      detail: `${newProd.name} (${newProd.price.toLocaleString()} FRW) registered from ${newProd.origin}`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'product',
      status: 'success',
      actor: currentUser ? currentUser.name : 'System Admin',
      actorRole: 'admin',
      metadata: { productId: newProd.id, name: newProd.name, category: newProd.category, price: newProd.price }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleDeleteProduct = async (productId: number) => {
    const deleted = products.find((p) => p.id === productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    showToast('Product removed from catalog');
    try {
      await api.deleteProduct(productId);
    } catch (e) {
      console.warn('Sync product delete error:', e);
    }
    const newAct: SystemActivity = {
      id: `ACT-DEL-${Date.now().toString().slice(-4)}`,
      title: `Product Removed from Store`,
      detail: `Item "${deleted?.name || productId}" was removed from the live inventory`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'product',
      status: 'warning',
      actor: currentUser ? currentUser.name : 'System Admin',
      actorRole: 'admin',
      metadata: { productId, name: deleted?.name }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleToggleStock = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    const newStatus = target ? !target.inStock : false;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, inStock: !p.inStock } : p
      )
    );
    try {
      await api.updateProduct(productId, { inStock: newStatus });
    } catch (e) {
      console.warn('Sync stock toggle error:', e);
    }
    const newAct: SystemActivity = {
      id: `ACT-STK-${Date.now().toString().slice(-4)}`,
      title: `Stock Status Updated: ${newStatus ? 'In Stock' : 'Out of Stock'}`,
      detail: `"${target?.name}" marked as ${newStatus ? 'AVAILABLE' : 'OUT OF STOCK'}`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'product',
      status: newStatus ? 'success' : 'warning',
      actor: currentUser ? currentUser.name : 'System Admin',
      actorRole: 'admin',
      metadata: { productId, name: target?.name, inStock: newStatus }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleToggleCustomerPermitted = async (productId: number) => {
    const target = products.find((p) => p.id === productId);
    const nextPermitted = target?.customerPurchasable === false ? true : false;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, customerPurchasable: nextPermitted } : p
      )
    );
    showToast(
      nextPermitted
        ? `"${target?.name}" is now permitted for Customer purchases`
        : `"${target?.name}" moved to Staff / Wholesale Reserve`
    );
    try {
      await api.updateProduct(productId, { customerPurchasable: nextPermitted });
    } catch (e) {
      console.warn('Sync customer purchase permission error:', e);
    }
    const newAct: SystemActivity = {
      id: `ACT-CPERM-${Date.now().toString().slice(-4)}`,
      title: `Customer Access Updated: ${nextPermitted ? 'Permitted' : 'Staff Reserve'}`,
      detail: `"${target?.name}" set to ${nextPermitted ? 'Customer Permitted' : 'Wholesale / Staff Only'}`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'product',
      status: nextPermitted ? 'success' : 'info',
      actor: currentUser ? currentUser.name : 'System Admin',
      actorRole: 'admin',
      metadata: { productId, name: target?.name, customerPurchasable: nextPermitted }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
    showToast(`Order #${orderId} marked as ${status}`);
    try {
      await api.updateOrderStatus(orderId, status);
    } catch (e) {
      console.warn('Sync order status error:', e);
    }
    const newAct: SystemActivity = {
      id: `ACT-ORD-${Date.now().toString().slice(-4)}`,
      title: `Order Status Changed: ${status.toUpperCase()}`,
      detail: `Order #${orderId} was updated to status: ${status}`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'order',
      status: 'success',
      actor: currentUser ? currentUser.name : 'System Admin',
      actorRole: 'admin',
      metadata: { orderId, newStatus: status }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleToggleUserRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newRole: UserRole = u.role === 'admin' ? 'customer' : 'admin';
          showToast(`User ${u.name} role changed to ${newRole.toUpperCase()}`);
          return { ...u, role: newRole, permissions: DEFAULT_ROLE_PERMISSIONS[newRole] };
        }
        return u;
      })
    );
  };

  const handleUpdateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          showToast(`Staff ${u.name} role changed to ${newRole.toUpperCase().replace(/_/g, ' ')}`);
          return { ...u, role: newRole, permissions: DEFAULT_ROLE_PERMISSIONS[newRole] };
        }
        return u;
      })
    );
  };

  const handleUpdateUserPermissions = (userId: string, permissions: StaffPermissions) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          showToast(`Updated access rights for ${u.name}`);
          return { ...u, permissions };
        }
        return u;
      })
    );
    const act: SystemActivity = {
      id: `ACT-PERM-${Date.now().toString().slice(-4)}`,
      title: 'Staff Access Rights Modified',
      detail: `Administrator updated granular permission rights for user ID ${userId}.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'user',
      status: 'success',
      actor: currentUser?.name || 'Admin',
      actorRole: 'admin',
      metadata: { userId }
    };
    setActivities((prev) => [act, ...prev]);
  };

  const handleAddStaffUser = (newUser: User) => {
    setUsers((prev) => [newUser, ...prev]);
    showToast(`Added staff account: ${newUser.name} (${newUser.role.toUpperCase()})`);
    const act: SystemActivity = {
      id: `ACT-STAFF-${Date.now().toString().slice(-4)}`,
      title: 'New Staff Member Provisioned',
      detail: `${newUser.name} provisioned as ${newUser.role.toUpperCase()} in ${newUser.department || 'Operations'}.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'user',
      status: 'success',
      actor: currentUser?.name || 'Admin',
      actorRole: 'admin',
      metadata: { staffId: newUser.id, role: newUser.role }
    };
    setActivities((prev) => [act, ...prev]);
  };

  // 1-Click Role Switcher across all 6 roles
  const handleSwitchRole = (newRole: UserRole) => {
    manualSessionRef.current = true;
    const matched = users.find(u => u.role === newRole);
    if (matched) {
      setCurrentUser({
        ...matched,
        status: matched.status || 'active',
        permissions: matched.permissions || DEFAULT_ROLE_PERMISSIONS[newRole]
      });
    } else {
      const fallbackUser: User = {
        id: `usr-${newRole}-session`,
        name: newRole === 'admin' ? 'Florentine Mushimiyimana (Admin)' :
              newRole === 'stock_manager' ? 'Eric Mugisha (Stock Manager)' :
              newRole === 'cashier' ? 'Chantal Uwera (Cashier)' :
              newRole === 'sales_attendant' ? 'Kevin Niyonzima (Sales Attendant)' :
              newRole === 'accountant' ? 'Aimee Mukamana (Accountant)' :
              'Divine Uwase (Customer)',
        email: `${newRole}@fofogreen.rw`,
        phone: '+250 788 123 456',
        role: newRole,
        joinedDate: 'Jan 2024',
        ordersCount: 4,
        status: 'active',
        permissions: DEFAULT_ROLE_PERMISSIONS[newRole]
      };
      setCurrentUser(fallbackUser);
    }

    const roleLabels: Record<UserRole, string> = {
      admin: '1. Admin (System Administrator)',
      stock_manager: '2. Stock Manager (Warehouse & Inventory)',
      cashier: '3. Cashier (POS Register & Payments)',
      sales_attendant: '4. Sales Attendant (Customer Kiosk)',
      accountant: '5. Accountant (Financial Ledger & P&L)',
      customer: '6. Customer (Fruit Market & Feedback)'
    };

    showToast(`Active Role: ${roleLabels[newRole]}`);

    const act: SystemActivity = {
      id: `ACT-SWITCH-${Date.now().toString().slice(-4)}`,
      title: 'Active Workspace Role Switched',
      detail: `Switched operational view to ${roleLabels[newRole]}.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'user',
      status: 'info',
      actor: currentUser?.name || 'Staff User',
      actorRole: newRole,
      metadata: { newRole }
    };
    setActivities((prev) => [act, ...prev]);

    // Open corresponding workspace immediately
    if (newRole === 'admin') {
      setPermittedOnly(false);
      setIsAdminOpen(true);
    } else if (newRole === 'stock_manager') {
      setPermittedOnly(false);
      setIsStockManagerOpen(true);
    } else if (newRole === 'cashier') {
      setPermittedOnly(false);
      setIsCashierOpen(true);
    } else if (newRole === 'sales_attendant') {
      setPermittedOnly(false);
      setIsSalesAttendantOpen(true);
    } else if (newRole === 'accountant') {
      setPermittedOnly(false);
      setIsAccountantOpen(true);
    } else if (newRole === 'customer') {
      setPermittedOnly(true);
      setSelectedCategory('all');
      setIsCustomerMarketOpen(true);
    }
  };

  const handleOpenActiveWorkspace = () => {
    const role = currentUser?.role || 'admin';
    if (role === 'admin') setIsAdminOpen(true);
    else if (role === 'stock_manager') setIsStockManagerOpen(true);
    else if (role === 'cashier') setIsCashierOpen(true);
    else if (role === 'sales_attendant') setIsSalesAttendantOpen(true);
    else if (role === 'accountant') setIsAccountantOpen(true);
    else if (role === 'customer') setIsCustomerMarketOpen(true);
  };

  // Operational Role Handlers
  const handleAddStockBatch = (batch: StockInBatch) => {
    setStockBatches((prev) => [batch, ...prev]);
    // Also record inventory purchase expense for accountant
    const totalCost = batch.quantityReceived * batch.unitCostFrw;
    const finRecord: FinancialRecord = {
      id: `FIN-${Date.now().toString().slice(-5)}`,
      date: batch.receivedDate,
      type: 'expense',
      category: 'inventory_purchase',
      description: `Stock In: ${batch.quantityReceived} units ${batch.productName} from ${batch.supplier}`,
      amount: totalCost,
      paymentMethod: 'mtn',
      reference: batch.batchNumber,
      recordedBy: batch.receivedBy
    };
    setFinancialRecords((prev) => [finRecord, ...prev]);
    showToast(`Stock Ingested: Batch ${batch.batchNumber} (+${batch.quantityReceived} units)`);
  };

  const handleAddDamagedItem = (item: DamagedStockItem) => {
    setDamagedItems((prev) => [item, ...prev]);
    const finRecord: FinancialRecord = {
      id: `FIN-DMG-${Date.now().toString().slice(-4)}`,
      date: item.reportedDate,
      type: 'expense',
      category: 'spoilage_loss',
      description: `Damaged Produce Write-off: ${item.quantity}x ${item.productName} (${item.reason})`,
      amount: item.lossAmountFrw,
      paymentMethod: 'cash',
      reference: item.id,
      recordedBy: item.reportedBy
    };
    setFinancialRecords((prev) => [finRecord, ...prev]);
    showToast(`Logged damaged stock: -${item.quantity} ${item.productName}`);
  };

  const handleNotifyManagerFromStock = (alert: StockAlert) => {
    setStockAlerts((prev) =>
      prev.map(a => a.id === alert.id ? { ...a, status: 'acknowledged' } : a)
    );
    showToast(`Dispatch notice sent to General Manager for ${alert.productName}!`);
    const act: SystemActivity = {
      id: `ACT-ALT-${Date.now().toString().slice(-4)}`,
      title: `Low Stock Alert Escalated to Manager`,
      detail: `Stock Manager notified General Manager: ${alert.productName} has only ${alert.currentStock} units remaining (Threshold: ${alert.threshold}).`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'product',
      status: 'warning',
      actor: 'Eric Mugisha (Stock Manager)',
      actorRole: 'admin',
      metadata: { productId: alert.productId, stock: alert.currentStock }
    };
    setActivities((prev) => [act, ...prev]);
  };

  const handleCashierCompleteSale = (receipt: SalesReceipt) => {
    setReceiptsHistory((prev) => [receipt, ...prev]);
    // Record income for accountant
    const finRecord: FinancialRecord = {
      id: `FIN-SALES-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: receipt.paymentMethod === 'cash' ? 'pos_cash_sale' : 'momo_sale',
      description: `POS Sale Receipt #${receipt.receiptNumber} (${receipt.items.length} items)`,
      amount: receipt.total,
      paymentMethod: receipt.paymentMethod,
      reference: receipt.receiptNumber,
      recordedBy: `${receipt.cashierName} (Cashier)`
    };
    setFinancialRecords((prev) => [finRecord, ...prev]);
    showToast(`Sale confirmed! Receipt #${receipt.receiptNumber} issued.`);
  };

  const handleCustomerFruitOrder = (receipt: SalesReceipt) => {
    setReceiptsHistory((prev) => [receipt, ...prev]);
    const finRecord: FinancialRecord = {
      id: `FIN-ORD-${Date.now().toString().slice(-5)}`,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: receipt.paymentMethod === 'cash' ? 'pos_cash_sale' : 'momo_sale',
      description: `Customer Fruit Order Receipt #${receipt.receiptNumber}`,
      amount: receipt.total,
      paymentMethod: receipt.paymentMethod,
      reference: receipt.receiptNumber,
      recordedBy: 'Customer Online Checkout'
    };
    setFinancialRecords((prev) => [finRecord, ...prev]);
    showToast(`Fruit order placed! Receipt #${receipt.receiptNumber} generated.`);
  };

  const handleReceiptFeedback = (receiptNumber: string, feedback: ReceiptFeedback) => {
    setReceiptsHistory((prev) =>
      prev.map(r => r.receiptNumber === receiptNumber ? { ...r, feedback } : r)
    );
    // Also post to customer reviews feed!
    const newRev: CustomerReview = {
      id: Date.now(),
      name: feedback.customerName || 'Customer',
      location: 'Kigali, Rwanda',
      rating: feedback.rating,
      comment: feedback.comment,
      date: 'Just now',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      productName: 'Organic Rwandan Produce'
    };
    setReviews((prev) => [newRev, ...prev]);
    showToast('Customer feedback and 5-star rating recorded!');
  };

  const handleAddFinancialRecord = (record: FinancialRecord) => {
    setFinancialRecords((prev) => [record, ...prev]);
    showToast(`Recorded ${record.type.toUpperCase()}: ${record.amount.toLocaleString()} FRW (${record.description})`);
  };

  const handleAttendantSendToCashier = (basketItems: Array<{ product: Product; quantity: number }>, note: string) => {
    showToast(`Assisted basket sent to Cashier POS queue (${basketItems.length} items)!`);
    const act: SystemActivity = {
      id: `ACT-ATT-${Date.now().toString().slice(-4)}`,
      title: 'Sales Attendant Assisted Basket Handed Off',
      detail: `Sales Attendant assisted customer with ${basketItems.length} items. Handed off to Cashier. Note: "${note}"`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'order',
      status: 'info',
      actor: 'Kevin Niyonzima (Sales Attendant)',
      actorRole: 'customer',
      metadata: { itemsCount: basketItems.length, note }
    };
    setActivities((prev) => [act, ...prev]);
  };

  // Simulate Actions for Admin
  const handleSimulateOrderAction = () => {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const orderNum = Math.floor(1000 + Math.random() * 9000);
    const simulatedOrder: Order = {
      id: `FGG-${orderNum}`,
      customerName: 'Jean-Luc Habimana',
      phone: '+250 783 994 012',
      items: [{ product: randomProduct, quantity: 2 }],
      subtotal: randomProduct.price * 2,
      discount: 0,
      deliveryFee: 2000,
      total: randomProduct.price * 2 + 2000,
      paymentMethod: 'mtn',
      address: 'Kacyiru, KG 563 St',
      district: 'Gasabo',
      status: 'Preparing',
      createdAt: 'Just now'
    };

    setOrders((prev) => [simulatedOrder, ...prev]);
    showToast(`⚡ Simulated Order #${simulatedOrder.id} placed by ${simulatedOrder.customerName}`);

    const newAct: SystemActivity = {
      id: `ACT-ORD-${orderNum}`,
      title: `Simulated Live Order #${simulatedOrder.id}`,
      detail: `${simulatedOrder.customerName} ordered 2x ${randomProduct.name} (${simulatedOrder.total.toLocaleString()} FRW via MTN MoMo *182#)`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'order',
      status: 'success',
      actor: 'Jean-Luc Habimana',
      actorRole: 'customer',
      metadata: { orderId: simulatedOrder.id, items: 2, total: simulatedOrder.total, district: 'Gasabo' }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleSimulatePaymentAction = () => {
    const ref = `MTN-RW-${Math.floor(100000 + Math.random() * 900000)}`;
    showToast(`📱 MTN Mobile Money USSD payment authorized (${ref})`);

    const newAct: SystemActivity = {
      id: `ACT-PAY-${Date.now().toString().slice(-4)}`,
      title: 'MTN Mobile Money *182# Payment Verified',
      detail: `Instant USSD push confirmed for 18,500 FRW. TxRef: ${ref}. Push gateway response code: 200 OK.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'payment',
      status: 'success',
      actor: 'MTN MoMo Gateway',
      actorRole: 'system',
      metadata: { ref, amount: 18500, gateway: 'MTN MoMo Rwanda', ussdCode: '*182*8*1#', status: 'COMPLETED' }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleClearActivities = () => {
    setActivities(INITIAL_ACTIVITIES);
    showToast('System action logs reset to default test state');
  };

  // User login handler — unlocks permitted products immediately when logged in as customer
  const handleUserLogin = (user: User) => {
    const normalizedUser: User = {
      ...user,
      status: user.status || 'active',
      permissions: user.permissions || DEFAULT_ROLE_PERMISSIONS[user.role],
    };
    manualSessionRef.current = true;
    setCurrentUser(normalizedUser);
    setUsers((prev) => [normalizedUser, ...prev.filter((member) => member.id !== normalizedUser.id)]);

    const wasChatQueued = openChatAfterLogin;
    if (wasChatQueued) {
      setIsCommunityChatOpen(true);
      setOpenChatAfterLogin(false);
    }

    const authAct: SystemActivity = {
      id: `ACT-AUTH-${Date.now().toString().slice(-4)}`,
      title: normalizedUser.role === 'admin' ? 'Admin Session Authenticated' : 'Customer Account Login',
      detail: `${normalizedUser.name} (${normalizedUser.email}) signed in with role: ${normalizedUser.role.toUpperCase()}`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'user',
      status: 'success',
      actor: normalizedUser.name,
      actorRole: normalizedUser.role,
      metadata: { email: normalizedUser.email, phone: normalizedUser.phone, role: normalizedUser.role }
    };
    setActivities((prev) => [authAct, ...prev]);

    if (normalizedUser.role === 'admin') {
      setPermittedOnly(false);
      pendingCartActionRef.current = null;
      pendingCheckoutRef.current = null;
      setOpenMarketAfterLogin(false);
      showToast(`Logged in as Administrator: ${normalizedUser.name}`);
      // Immediately open Admin Panel on the Activity / System Actions Audit tab!
      setAdminInitialTab('activity');
      setIsAdminOpen(true);
      return;
    }

    if (normalizedUser.role === 'customer') {
      setPermittedOnly(true);
      setSelectedCategory('all');

      const permittedCount = products.filter((p) =>
        isProductPermittedForCustomerCapacity(p, normalizedUser)
      ).length;

      let itemQueuedAdded = false;
      const pendingAdd = pendingCartActionRef.current;
      if (pendingAdd) {
        pendingCartActionRef.current = null;
        const access = getProductAccessForUser(pendingAdd.product, normalizedUser);
        if (access.permitted) {
          setCart((prev) => {
            const existing = prev.find((item) => item.product.id === pendingAdd.product.id);
            if (existing) {
              return prev.map((item) =>
                item.product.id === pendingAdd.product.id
                  ? { ...item, quantity: item.quantity + pendingAdd.quantity }
                  : item
              );
            }
            return [...prev, { product: pendingAdd.product, quantity: pendingAdd.quantity }];
          });
          itemQueuedAdded = true;
          showToast(`Signed in — added ${pendingAdd.product.name} to basket`);
        } else {
          showToast(access.reason);
        }
      }

      const pendingCheckout = pendingCheckoutRef.current;
      if (pendingCheckout) {
        pendingCheckoutRef.current = null;
        if (cart.length > 0 || itemQueuedAdded) {
          setCheckoutDiscount(pendingCheckout.discount);
          setCheckoutPaymentMethod(pendingCheckout.payment);
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
          return;
        }
      }

      if (openMarketAfterLogin) {
        setOpenMarketAfterLogin(false);
        setIsCustomerMarketOpen(true);
        return;
      }

      if (!wasChatQueued && !itemQueuedAdded) {
        showToast(
          `Signed in as ${normalizedUser.name} — ${permittedCount} permitted products unlocked for purchase`
        );
        setTimeout(() => {
          document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
        }, 120);
      }
      return;
    }

    // Other operational staff roles
    setPermittedOnly(false);
    setOpenMarketAfterLogin(false);
    showToast(`Welcome back, ${normalizedUser.name}!`);
  };

  // Reviews operations
  const handleAddReview = async (newRevData: Omit<CustomerReview, 'id' | 'date' | 'verified'>) => {
    try {
      const savedReview = await api.addReview(newRevData);
      setReviews((prev) => [savedReview, ...prev]);
    } catch {
      const newReview: CustomerReview = {
        ...newRevData,
        id: Date.now(),
        date: 'Just now',
        verified: true
      };
      setReviews((prev) => [newReview, ...prev]);
    }
    showToast('Thank you! Your review has been saved in the database.');

    const newAct: SystemActivity = {
      id: `ACT-REV-${Date.now().toString().slice(-4)}`,
      title: 'Customer Review Posted',
      detail: `${newRevData.name} gave ${newRevData.rating}/5 stars: "${newRevData.comment.slice(0, 45)}..."`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'review',
      status: 'info',
      actor: newRevData.name,
      actorRole: 'customer',
      metadata: { rating: newRevData.rating, location: newRevData.location }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  // Admin Country Location Management Handlers
  const handleAddCountryLocation = async (locPayload: Omit<CountryLocation, 'id'>) => {
    const role = currentUser?.role || 'admin';
    const created = await api.addLocation(locPayload, role);
    setCountryLocations((prev) => [created, ...prev]);
    showToast(`Added location: ${created.district} (${created.country})`);

    const newAct: SystemActivity = {
      id: `ACT-LOC-${Date.now().toString().slice(-4)}`,
      title: 'Country Delivery Location Added',
      detail: `${created.district} (${created.country} · ${created.province}) added with ${created.sectors.length} sectors/hubs at ${created.fee.toLocaleString()} FRW.`,
      time: 'Just now',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      type: 'delivery',
      status: 'success',
      actor: currentUser?.name || 'System Admin',
      actorRole: 'admin',
      metadata: { locationId: created.id, country: created.country, district: created.district }
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const handleUpdateCountryLocation = async (id: string, updates: Partial<CountryLocation>) => {
    const role = currentUser?.role || 'admin';
    const updated = await api.updateLocation(id, updates, role);
    setCountryLocations((prev) => prev.map((l) => (l.id === id ? updated : l)));

    if (selectedLocation.district === updated.district && updated.isActive) {
      setSelectedLocation((prev) => ({
        district: updated.district,
        sector: updated.sectors.includes(prev.sector) ? prev.sector : (updated.sectors[0] || updated.district),
        fee: updated.fee,
        estimatedHours: updated.estimatedHours,
        fulfillmentMode: updated.mode || 'delivery',
      }));
    }
    showToast(`Updated location: ${updated.district}`);
  };

  const handleDeleteCountryLocation = async (id: string) => {
    const role = currentUser?.role || 'admin';
    const target = countryLocations.find((l) => l.id === id);
    await api.deleteLocation(id, role);
    setCountryLocations((prev) => prev.filter((l) => l.id !== id));
    showToast(`Removed location: ${target?.district || id}`);
  };

  const handleResetDatabase = async () => {
    const success = await api.resetDatabase();
    if (success) {
      const [freshProds, freshOrders, freshRevs, freshActs, freshLocs] = await Promise.all([
        api.getProducts(),
        api.getOrders(),
        api.getReviews(),
        api.getActivities(),
        api.getLocations()
      ]);
      setProducts(freshProds);
      setOrders(freshOrders);
      setReviews(freshRevs);
      setActivities(freshActs);
      if (freshLocs && freshLocs.length > 0) setCountryLocations(freshLocs);
      showToast('Database reset to fresh Rwandan farm catalog seed');
    }
  };

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isRtl = currentLang === 'ar';

  return (
    <RealtimeCommunityProvider
      currentUser={currentUser}
      isChatModalOpen={isCommunityChatOpen}
      onOpenChatModal={openCommunityChat}
    >
      <LivePresenceNotifications />
      <div className={`min-h-screen pb-16 md:pb-0 bg-[#fafaf8] text-stone-900 font-sans selection:bg-emerald-200 selection:text-emerald-950 ${isRtl ? 'rtl' : 'ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-stone-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-stone-700 text-xs font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 6-Role Fast Switcher & Workspace Launcher */}
      <RoleWorkspaceBar
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenActiveWorkspace={handleOpenActiveWorkspace}
        onOpenAuth={() => setIsAuthOpen(true)}
        stockAlertsCount={stockAlerts.filter(a => a.status === 'pending').length}
      />

      {/* Admin Notification Bar if logged in as Admin */}
      {currentUser?.role === 'admin' && (
        <div className="bg-stone-900 text-white border-b border-stone-800 px-4 py-1.5 text-xs relative z-30 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-extrabold text-amber-400">ADMINISTRATOR SESSION:</span>
              <span className="font-semibold text-stone-200">{currentUser.name}</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-700/80 flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Cloud SQL (PostgreSQL): {products.length} Products · {orders.length} Orders</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAdminInitialTab('activity');
                  setIsAdminOpen(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Check All System Actions ({activities.length})</span>
              </button>

              <button
                onClick={() => {
                  setAdminInitialTab('customers');
                  setIsAdminOpen(true);
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer"
              >
                Staff Access Rights
              </button>

              <button
                onClick={() => {
                  setAdminInitialTab('locations');
                  setIsAdminOpen(true);
                }}
                className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0"
                title="Add or manage country delivery locations"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                <span>Country Locations ({countryLocations.length})</span>
              </button>

              <button
                onClick={() => {
                  setAdminInitialTab('chat');
                  setIsAdminOpen(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-black px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="View and moderate all Customer Support Chat Messages in Admin Panel"
              >
                <MessageSquare className="w-3.5 h-3.5 text-stone-950" />
                <span>Support Messages (Q&A)</span>
              </button>

              <button
                onClick={openCommunityChat}
                className="bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/80 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Launch Live Customer Support Chat Modal"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Chat Lounge</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Connectivity Banner (non-sticky, active only when offline) */}
      <OfflineIndicator
        cachedProductsCount={products.length}
        onOpenAccessHub={() => setIsAccessHubOpen(true)}
      />

      {/* Top Navigation */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        cartCount={cartTotalItems}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenAdmin={() => {
          setAdminInitialTab('activity');
          setIsAdminOpen(true);
        }}
        currentUser={currentUser}
        onLogout={() => {
          manualSessionRef.current = false;
          setPermittedOnly(false);
          pendingCartActionRef.current = null;
          pendingCheckoutRef.current = null;
          setOpenMarketAfterLogin(false);
          signOut(auth).catch(() => {});
          setCurrentUser(null);
          showToast('Signed out successfully');
        }}
        activitiesCount={activities.length}
        currentTheme={currentTheme}
        onOpenThemeSelector={() => setIsThemeSelectorOpen(true)}
        onOpenOrderTracker={() => handleOpenOrderTracker()}
        isHeroMinimized={isHeroMinimized}
        onToggleMinimizeHero={handleToggleHeroMinimized}
        onOpenStockManager={() => setIsStockManagerOpen(true)}
        onOpenCashier={() => setIsCashierOpen(true)}
        onOpenSalesAttendant={() => setIsSalesAttendantOpen(true)}
        onOpenAccountant={() => setIsAccountantOpen(true)}
        onOpenCustomerFruitMarket={openCustomerMarket}
        onOpenCommunityChat={openCommunityChat}
        onOpenAccessHub={() => setIsAccessHubOpen(true)}
        activeNav={
          (isCommunityChatOpen
            ? 'community-chat'
            : isCartOpen
            ? 'cart'
            : isAccessHubOpen
            ? 'access-anywhere'
            : isOrderTrackerOpen
            ? 'order-tracker'
            : isWishlistOpen
            ? 'wishlist'
            : isThemeSelectorOpen
            ? 'theme-selector'
            : isAdminOpen
            ? 'role-admin'
            : undefined) as NavbarSelection | undefined
        }
      />

      {/* Hero Section with Live Search and Minimize Mode */}
      <HeroSection
        currentLang={currentLang}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onQuickCategoryClick={(cat) => setSelectedCategory(cat)}
        currentTheme={currentTheme}
        isMinimized={isHeroMinimized}
        onToggleMinimize={handleToggleHeroMinimized}
      />

      {/* Category Pills Bar */}
      <CategoryFilter
        currentLang={currentLang}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        categoryCounts={categoryCounts}
      />

      {/* Featured Products Grid Section */}
      <section id="shop" className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Fresh Harvest
            </div>
            <h2 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
              {t.shop.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t.shop.subtitle}
            </p>
          </div>

          {/* Controls: Search notice, In-stock checkbox & Sort dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-2xs cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-emerald-700 focus:ring-emerald-600"
              />
              <span>{t.shop.inStockOnly}</span>
            </label>

            <div className="flex items-center gap-2 bg-white border border-stone-200 px-3 py-2 rounded-xl shadow-2xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-xs text-stone-500 font-medium">{t.shop.sortBy}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs font-bold text-stone-800 outline-hidden cursor-pointer"
              >
                <option value="featured">{t.shop.sortFeatured}</option>
                <option value="price-asc">{t.shop.sortPriceLow}</option>
                <option value="price-desc">{t.shop.sortPriceHigh}</option>
                <option value="rating">{t.shop.sortRating}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Access Anywhere & Active Zone Bar */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-700">
            <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold text-stone-900">
              {selectedLocation.sector} · {selectedLocation.district}
            </span>
            <span className="text-stone-400" aria-hidden="true">/</span>
            <span className="tabular-nums text-stone-600">
              {selectedLocation.estimatedHours} ·{' '}
              {selectedLocation.fee === 0
                ? 'Free Pickup (0 FRW)'
                : `${selectedLocation.fee.toLocaleString()} FRW`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAccessHubOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-700" />
              <span>Change Zone / Access Anywhere</span>
            </button>
            <PWAInstallButton
              compact
              onInstalled={() => showToast('Fofo Green installed to your device')}
            />
          </div>
        </div>

        {/* Customer Purchasing Capacity Bar */}
        <div className="mb-6 p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {!currentUser ? (
            <>
              <div className="flex items-center gap-2.5 text-xs text-stone-700">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong className="text-stone-900">Sign in to buy:</strong> Sign in as a customer to immediately access{' '}
                  <span className="tabular-nums font-semibold text-emerald-800">{customerPermittedCount}</span> permitted products for purchase.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsAuthOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Customer Sign In</span>
              </button>
            </>
          ) : currentUser.role === 'customer' ? (
            <>
              <div className="flex items-center gap-2.5 text-xs text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="tabular-nums">
                  <strong className="text-stone-900">Customer Access Active:</strong>{' '}
                  <strong className="text-emerald-800">{customerPermittedCount}</strong> permitted products ready to buy for{' '}
                  <span className="font-semibold text-stone-900">{currentUser.name}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPermittedOnly((prev) => !prev)}
                  className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                    permittedOnly
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {permittedOnly ? 'Showing Permitted Only' : 'Show All Catalog'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomerMarketOpen(true)}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  Open Customer Market
                </button>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors tabular-nums"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Basket ({cartTotalItems})</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 text-xs text-stone-700">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="tabular-nums">
                  Signed in as <strong className="text-stone-900">{currentUser.name}</strong> ({currentUser.role.replace(/_/g, ' ')}) ·{' '}
                  <strong className="text-emerald-800">{customerPermittedCount}</strong> customer-permitted products
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPermittedOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  permittedOnly
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-stone-50 border-stone-300 text-stone-700 hover:bg-stone-100'
                }`}
              >
                {permittedOnly ? 'Showing Customer-Permitted' : 'Filter Customer-Permitted'}
              </button>
            </>
          )}
        </div>

        {/* Results Count / Search indicator */}
        <div className="flex items-center justify-between text-xs text-stone-500 mb-6 pb-2 border-b border-stone-200/80">
          <div>
            Showing <strong className="text-stone-900">{filteredProducts.length}</strong> fresh harvest items
            {selectedCategory !== 'all' && (
              <span> in <strong className="text-emerald-800 capitalize">{selectedCategory}</strong></span>
            )}
            {searchQuery && (
              <span> matching "<strong className="text-emerald-800">{searchQuery}</strong>"</span>
            )}
          </div>
          {(selectedCategory !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 shadow-xs">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <SlidersHorizontal className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-stone-800">No produce found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              We couldn't find any products matching your current category or search criteria. Try clearing filters or exploring other categories.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="mt-5 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Show All 26 Harvest Items
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.product.id === product.id);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  isInWishlist={wishlist.some((w) => w.id === product.id)}
                  onToggleWishlist={handleToggleWishlist}
                  onAddToCart={handleAddToCart}
                  cartQuantity={cartItem ? cartItem.quantity : 0}
                  onUpdateCartQuantity={handleUpdateCartQuantity}
                  onQuickView={(p) => setQuickViewProduct(p)}
                  onOpenFarmPassport={handleOpenFarmPassport}
                  onShareProduct={handleShareProduct}
                  purchaseAccess={getProductAccessForUser(product, currentUser)}
                  onRequireAuth={(p) => handleRequireAuthForProduct(p, 1)}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Rwandan Harvest Recipe Meal Kits & Veggie Baskets Section */}
      <MealKitsSection
        currentLang={currentLang}
        products={products}
        onAddBundleToCart={handleAddBundleToCart}
      />

      {/* About Section */}
      <AboutSection currentLang={currentLang} />

      {/* Customer Reviews & Feedback Section */}
      <ReviewsSection
        currentLang={currentLang}
        reviews={reviews}
        onAddReview={handleAddReview}
      />

      {/* Delivery Zones & Logistics */}
      <DeliverySection 
        currentLang={currentLang}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        locations={activeCountryLocations}
        onShopClick={() => {
          const el = document.getElementById('shop');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Contact Section */}
      <ContactSection currentLang={currentLang} />

      {/* Footer */}
      <Footer currentLang={currentLang} />

      {/* Product Quick View Modal */}
      <ProductQuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={Boolean(quickViewProduct && wishlist.some((w) => w.id === quickViewProduct.id))}
        onOpenFarmPassport={handleOpenFarmPassport}
        onShowToast={showToast}
        purchaseAccess={quickViewProduct ? getProductAccessForUser(quickViewProduct, currentUser) : undefined}
        onRequireAuth={(p, q) => handleRequireAuthForProduct(p, q)}
      />

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        currentLang={currentLang}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Wishlist Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onAddToCart={(p) => handleAddToCart(p, 1)}
      />

      {/* Checkout Modal with Reliable Return Button & Live Tracker Handlers */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        currentLang={currentLang}
        discountAmount={checkoutDiscount}
        initialPaymentMethod={checkoutPaymentMethod}
        selectedLocation={selectedLocation}
        locations={activeCountryLocations}
        onOrderComplete={handleOrderComplete}
        onReturnToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartOpen(true);
        }}
        onOpenOrderTracker={(orderId) => {
          setIsCheckoutOpen(false);
          handleOpenOrderTracker(orderId);
        }}
      />

      {/* Auth Modal with Admin Role and Customer Role */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLogin={handleUserLogin}
        onOpenSystemLogin={() => setIsSystemLoginOpen(true)}
        currentLang={currentLang}
      />

      {/* System Login Modal (Terminal) */}
      <SystemLoginModal
        isOpen={isSystemLoginOpen}
        onClose={() => setIsSystemLoginOpen(false)}
        onAdminAuthenticated={(adminUser) => {
          handleUserLogin(adminUser);
        }}
      />

      {/* Admin Panel Console & All System Actions Audit */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onAddProduct={handleAddProduct}
        onDeleteProduct={handleDeleteProduct}
        onToggleStock={handleToggleStock}
        onToggleCustomerPermitted={handleToggleCustomerPermitted}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        users={users}
        onToggleUserRole={handleToggleUserRole}
        onUpdateUserRole={handleUpdateUserRole}
        onUpdateUserPermissions={handleUpdateUserPermissions}
        onAddStaffUser={handleAddStaffUser}
        locations={countryLocations}
        onAddLocation={handleAddCountryLocation}
        onUpdateLocation={handleUpdateCountryLocation}
        onDeleteLocation={handleDeleteCountryLocation}
        financialRecords={financialRecords}
        receipts={receiptsHistory}
        activities={activities}
        onSimulateOrderAction={handleSimulateOrderAction}
        onSimulatePaymentAction={handleSimulatePaymentAction}
        onClearActivities={handleClearActivities}
        cartCount={cartTotalItems}
        initialTab={adminInitialTab}
        dbHealth={dbHealth}
        onResetDb={handleResetDatabase}
        onOpenStockManager={() => setIsStockManagerOpen(true)}
        onOpenCashier={() => setIsCashierOpen(true)}
        onOpenSalesAttendant={() => setIsSalesAttendantOpen(true)}
        onOpenAccountant={() => setIsAccountantOpen(true)}
        onOpenCustomerMarket={() => setIsCustomerMarketOpen(true)}
        onOpenCommunityChat={openCommunityChat}
      />

      {/* Role 2: Stock Manager Workspace */}
      <StockManagerWorkspace
        isOpen={isStockManagerOpen}
        onClose={() => setIsStockManagerOpen(false)}
        products={products}
        onUpdateProductStock={handleToggleStock}
        stockBatches={stockBatches}
        onAddStockBatch={handleAddStockBatch}
        damagedItems={damagedItems}
        onAddDamagedItem={handleAddDamagedItem}
        stockAlerts={stockAlerts}
        onNotifyManager={handleNotifyManagerFromStock}
      />

      {/* Role 3: Cashier POS Register Workspace */}
      <CashierWorkspace
        isOpen={isCashierOpen}
        onClose={() => setIsCashierOpen(false)}
        products={products}
        onCompleteSale={handleCashierCompleteSale}
        onViewReceipt={(receipt) => setActiveReceiptModal(receipt)}
        receiptsHistory={receiptsHistory}
        cashierName={currentUser?.role === 'cashier' ? currentUser.name : 'Chantal Uwera (Cashier)'}
      />

      {/* Role 4: Sales Attendant Workspace */}
      <SalesAttendantWorkspace
        isOpen={isSalesAttendantOpen}
        onClose={() => setIsSalesAttendantOpen(false)}
        products={products}
        attendantName={currentUser?.role === 'sales_attendant' ? currentUser.name : 'Kevin Niyonzima (Sales Attendant)'}
        onSendToCashier={handleAttendantSendToCashier}
      />

      {/* Role 5: Accountant Financial Workspace */}
      <AccountantWorkspace
        isOpen={isAccountantOpen}
        onClose={() => setIsAccountantOpen(false)}
        products={products}
        financialRecords={financialRecords}
        onAddFinancialRecord={handleAddFinancialRecord}
        receipts={receiptsHistory}
        accountantName={currentUser?.role === 'accountant' ? currentUser.name : 'Aimee Mukamana (Accountant)'}
      />

      {/* Role 6: Customer Fruit Market & Feedback Modal */}
      <CustomerFruitMarketModal
        isOpen={isCustomerMarketOpen}
        onClose={() => setIsCustomerMarketOpen(false)}
        products={products}
        onOrderComplete={handleCustomerFruitOrder}
        onAddReview={handleAddReview}
        onOpenReceipt={(receipt) => setActiveReceiptModal(receipt)}
        customerName={currentUser?.name || 'Divine Uwase'}
        customerPhone={currentUser?.phone || '+250 789 112 334'}
        currentUser={currentUser}
      />

      {/* Official Sales Receipt Modal with Printing & Customer Feedback */}
      <ReceiptModal
        isOpen={Boolean(activeReceiptModal)}
        onClose={() => setActiveReceiptModal(null)}
        receipt={activeReceiptModal}
        onSubmitFeedback={handleReceiptFeedback}
      />

      {/* Theme / Color Palette Selector Modal */}
      <ThemeSelector
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        isOpen={isThemeSelectorOpen}
        onClose={() => setIsThemeSelectorOpen(false)}
      />

      {/* Live Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        orders={orders}
        currentLang={currentLang}
        initialOrderId={trackingOrderId}
      />

      {/* Rwandan Farm-to-Fork Digital Transparency Passport Modal */}
      <FarmPassportModal
        product={farmPassportProduct}
        isOpen={Boolean(farmPassportProduct)}
        onClose={() => setFarmPassportProduct(null)}
        currentLang={currentLang}
      />

      {/* Real-Time Community Lounge & Member Chat Modal */}
      <CommunityChatModal
        isOpen={isCommunityChatOpen}
        onClose={() => setIsCommunityChatOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onQuickJoinCustomer={handleQuickJoinChatCustomer}
        availableProducts={products}
        joinedUsers={users}
      />

      {/* Access Anywhere Modal (Nationwide Zones, Offline PWA, QR Handoff, WhatsApp/USSD) */}
      <AccessAnywhereModal
        isOpen={isAccessHubOpen}
        onClose={() => setIsAccessHubOpen(false)}
        selectedLocation={selectedLocation}
        onSelectLocation={setSelectedLocation}
        locations={activeCountryLocations}
        products={products}
        cart={cart}
        isCompactMode={isHeroMinimized}
        onToggleCompactMode={handleToggleHeroMinimized}
        onRefreshOfflineCache={() => offlineCache.saveProducts(products)}
        onShowToast={showToast}
      />

      {/* Mobile Bottom Thumb-Zone Navigation (< 768px) */}
      <MobileBottomNav
        cartCount={cartTotalItems}
        activeTab={
          isCommunityChatOpen
            ? 'support'
            : isCartOpen
            ? 'cart'
            : isAccessHubOpen
            ? 'anywhere'
            : activeMobileTab
        }
        onScrollToShop={() => {
          setActiveMobileTab('shop');
          document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
        }}
        onFocusSearch={() => {
          setActiveMobileTab('search');
          const hero = document.getElementById('home');
          hero?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            const input = hero?.querySelector<HTMLInputElement>('input[type="text"]');
            input?.focus();
          }, 250);
        }}
        onOpenAccessHub={() => {
          setActiveMobileTab('anywhere');
          setIsAccessHubOpen(true);
        }}
        onOpenCart={() => {
          setActiveMobileTab('cart');
          setIsCartOpen(true);
        }}
        onOpenSupport={() => {
          setActiveMobileTab('support');
          openCommunityChat();
        }}
      />

      {/* Floating Member Lounge & Live Chat Capsule (desktop; mobile uses MobileBottomNav Support) */}
      <button
        onClick={openCommunityChat}
        className="hidden md:flex fixed bottom-6 left-6 z-40 bg-emerald-900 hover:bg-emerald-800 active:scale-95 text-white px-4 py-2.5 rounded-full shadow-2xl border border-emerald-600/70 items-center gap-2.5 transition-all cursor-pointer group"
        title="Open Fofo Green Member Lounge & Live Chat (Urubuga rw'Abanyamuryango)"
      >
        <div className="relative">
          <MessageSquare className="w-4 h-4 text-emerald-300 transition-transform group-hover:scale-110" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-xs font-black tracking-tight leading-none flex items-center gap-1.5">
            <span>Member Lounge</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[9px] text-emerald-200 font-bold leading-none mt-0.5">Live Community Chat</span>
        </div>
      </button>
    </div>
  </RealtimeCommunityProvider>
  );
}
