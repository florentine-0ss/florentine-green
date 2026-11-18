import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart,
  User as UserIcon,
  Globe,
  ShieldCheck,
  Menu,
  X,
  Palette,
  Navigation,
  Minimize2,
  Maximize2,
  ChevronDown,
  LogOut,
  Download,
  Compass,
  MessageSquare,
  Heart,
  Presentation,
} from 'lucide-react';
import { Language, User, ColorTheme } from '../types';
import { TRANSLATIONS } from '../data/translations';
import { useRealtimeCommunity } from '../context/RealtimeCommunityContext';

export type NavbarSelection =
  | 'home'
  | 'shop'
  | 'baskets'
  | 'delivery'
  | 'about'
  | 'contact'
  | 'access-anywhere'
  | 'community-chat'
  | 'order-tracker'
  | 'wishlist'
  | 'cart'
  | 'theme-selector'
  | 'toggle-banner'
  | 'download-zip'
  | 'presentation'
  | 'role-admin'
  | 'role-stock'
  | 'role-cashier'
  | 'role-sales'
  | 'role-accountant'
  | 'role-customer';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  cartCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
  currentUser: User | null;
  onLogout: () => void;
  activitiesCount?: number;
  currentTheme: ColorTheme;
  onOpenThemeSelector: () => void;
  onOpenOrderTracker?: () => void;
  isHeroMinimized?: boolean;
  onToggleMinimizeHero?: () => void;
  onOpenStockManager?: () => void;
  onOpenCashier?: () => void;
  onOpenSalesAttendant?: () => void;
  onOpenAccountant?: () => void;
  onOpenCustomerFruitMarket?: () => void;
  onOpenCommunityChat?: () => void;
  onOpenAccessHub?: () => void;
  onOpenPresentation?: () => void;
  activeNav?: NavbarSelection;
  onSelectNav?: (selection: NavbarSelection) => void;
}

const SECTION_IDS: Array<'home' | 'shop' | 'baskets' | 'delivery' | 'about' | 'contact'> = [
  'home',
  'shop',
  'baskets',
  'delivery',
  'about',
  'contact',
];

const PRIMARY_TABS: Array<{ id: 'home' | 'shop' | 'delivery' | 'community-chat'; labelKey?: 'home' | 'shop' | 'delivery'; fallback: string }> = [
  { id: 'home', labelKey: 'home', fallback: 'Home' },
  { id: 'shop', labelKey: 'shop', fallback: 'Shop' },
  { id: 'delivery', labelKey: 'delivery', fallback: 'Delivery' },
  { id: 'community-chat', fallback: 'Support Chat' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  cartCount,
  wishlistCount,
  onOpenCart,
  onOpenWishlist,
  onOpenAuth,
  onOpenAdmin,
  currentUser,
  onLogout,
  activitiesCount = 0,
  onOpenThemeSelector,
  onOpenOrderTracker,
  isHeroMinimized = true,
  onToggleMinimizeHero,
  onOpenStockManager,
  onOpenCashier,
  onOpenSalesAttendant,
  onOpenAccountant,
  onOpenCustomerFruitMarket,
  onOpenCommunityChat,
  onOpenAccessHub,
  onOpenPresentation,
  activeNav,
  onSelectNav,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [selectedNavOption, setSelectedNavOption] = useState<NavbarSelection>(activeNav || 'home');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const manualSelectLockRef = useRef<number>(0);
  const t = TRANSLATIONS[currentLang].nav;

  const { unreadCount } = useRealtimeCommunity();

  useEffect(() => {
    if (activeNav) {
      setSelectedNavOption(activeNav);
    }
  }, [activeNav]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Track visible page section on scroll so selection state stays accurate
  useEffect(() => {
    const handleScroll = () => {
      if (Date.now() < manualSelectLockRef.current) return;

      if (window.scrollY < 140) {
        setSelectedNavOption('home');
        return;
      }

      const viewportAnchor = 180;
      let currentSection: NavbarSelection = 'home';

      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportAnchor) {
          currentSection = id;
        }
      }

      setSelectedNavOption(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavSelect = (value: NavbarSelection) => {
    if (!value) return;
    manualSelectLockRef.current = Date.now() + 900;
    setSelectedNavOption(value);
    onSelectNav?.(value);
    setMobileMenuOpen(false);

    if (['home', 'shop', 'baskets', 'delivery', 'about', 'contact'].includes(value)) {
      scrollTo(value);
    } else if (value === 'access-anywhere') {
      onOpenAccessHub?.();
    } else if (value === 'community-chat') {
      onOpenCommunityChat?.();
    } else if (value === 'order-tracker') {
      onOpenOrderTracker?.();
    } else if (value === 'toggle-banner') {
      onToggleMinimizeHero?.();
    } else if (value === 'download-zip') {
      window.location.href = '/api/system/download-zip';
    } else if (value === 'presentation') {
      onOpenPresentation?.();
    } else if (value === 'theme-selector') {
      onOpenThemeSelector();
    } else if (value === 'wishlist') {
      onOpenWishlist();
    } else if (value === 'cart') {
      onOpenCart();
    } else if (value === 'role-admin') {
      onOpenAdmin();
    } else if (value === 'role-stock') {
      onOpenStockManager?.();
    } else if (value === 'role-cashier') {
      onOpenCashier?.();
    } else if (value === 'role-sales') {
      onOpenSalesAttendant?.();
    } else if (value === 'role-accountant') {
      onOpenAccountant?.();
    } else if (value === 'role-customer') {
      onOpenCustomerFruitMarket?.();
    }
  };

  const isPrimarySelected = (id: 'home' | 'shop' | 'delivery' | 'community-chat') =>
    selectedNavOption === id;

  const isMoreSelectionActive = !PRIMARY_TABS.some((tab) => tab.id === selectedNavOption);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* 1. Brand Identity */}
          <button
            type="button"
            onClick={() => handleNavSelect('home')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0 select-none group text-left"
            title="Fofo Green Rwanda"
          >
            <div className="w-9 h-9 rounded-xl bg-theme-primary flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-extrabold text-lg text-stone-900 tracking-tight font-serif">
                Fofo
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Green
              </span>
            </div>
          </button>

          {/* 2. Primary Navigation Selection Bar + Unified Menu Selector */}
          <nav
            aria-label="Primary navigation"
            className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-stone-100/90 border border-stone-200"
          >
            {PRIMARY_TABS.map((tab) => {
              const selected = isPrimarySelected(tab.id);
              const label = tab.labelKey ? t[tab.labelKey] || tab.fallback : tab.fallback;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => handleNavSelect(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'text-stone-700 hover:text-stone-950 hover:bg-white/70'
                  }`}
                >
                  <span>{label}</span>
                  {tab.id === 'community-chat' && unreadCount > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                        selected
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="relative flex items-center">
              <select
                value={isMoreSelectionActive ? selectedNavOption : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    handleNavSelect(e.target.value as NavbarSelection);
                  }
                }}
                aria-label="More store sections and tools"
                className={`appearance-none pl-3 pr-7 py-1.5 rounded-lg text-xs font-semibold cursor-pointer outline-hidden transition-all ${
                  isMoreSelectionActive
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'bg-transparent text-stone-700 hover:text-stone-950 hover:bg-white/70'
                }`}
              >
                <option value="" disabled className="text-stone-500 bg-white">
                  More...
                </option>
                <optgroup label="Store Sections" className="text-stone-900 bg-white">
                  <option value="baskets">Recipe Baskets &amp; Kits</option>
                  <option value="about">About Our Farms</option>
                  <option value="contact">Contact &amp; WhatsApp</option>
                </optgroup>
                <optgroup label="Quick Tools" className="text-stone-900 bg-white">
                  <option value="presentation">PowerPoint Presentation (.pptx)</option>
                  <option value="access-anywhere">Access Anywhere (Zones &amp; QR)</option>
                  <option value="order-tracker">Track Live Order</option>
                  <option value="wishlist">Saved Wishlist ({wishlistCount})</option>
                  <option value="theme-selector">Color Theme</option>
                  <option value="toggle-banner">
                    {isHeroMinimized ? 'Expand Hero Banner' : 'Compact Store View'}
                  </option>
                  <option value="download-zip">Download System (ZIP)</option>
                </optgroup>
                <optgroup label="Workspaces" className="text-stone-900 bg-white">
                  <option value="role-admin">Admin Control Center</option>
                  <option value="role-stock">Stock Manager</option>
                  <option value="role-cashier">Cashier POS</option>
                  <option value="role-sales">Sales Attendant</option>
                  <option value="role-accountant">Accountant Ledger</option>
                  <option value="role-customer">Customer Fruit Market</option>
                </optgroup>
              </select>
              <ChevronDown
                className={`w-3.5 h-3.5 absolute right-2 pointer-events-none ${
                  isMoreSelectionActive ? 'text-white' : 'text-stone-500'
                }`}
              />
            </div>
          </nav>

          {/* 3. Streamlined Utility Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Compact Language Selector */}
            <div className="hidden sm:flex items-center bg-stone-100 rounded-xl px-2.5 py-1.5 border border-stone-200 text-xs">
              <Globe className="w-3.5 h-3.5 text-stone-500 mr-1 shrink-0" />
              <select
                value={currentLang}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-stone-800 font-semibold outline-hidden cursor-pointer uppercase text-xs"
                aria-label="Select language"
              >
                <option value="en">EN</option>
                <option value="rw">RW</option>
                <option value="fr">FR</option>
                <option value="es">ES</option>
                <option value="ar">AR</option>
              </select>
            </div>

            {/* Shopping Basket Button with Selection State */}
            <button
              type="button"
              onClick={() => handleNavSelect('cart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs whitespace-nowrap shrink-0 transition-all cursor-pointer tabular-nums ${
                selectedNavOption === 'cart'
                  ? 'bg-stone-900 text-white ring-2 ring-emerald-600/30'
                  : 'bg-theme-primary hover:opacity-95 text-white'
              }`}
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">{t.cart}</span>
              <span className="bg-white/20 text-white text-xs font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center">
                {cartCount}
              </span>
            </button>

            {/* User Account / Sign In */}
            <div className="relative" ref={dropdownRef}>
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    userDropdownOpen
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-800'
                  }`}
                  title="Account menu"
                >
                  <span className="w-6 h-6 rounded-lg bg-emerald-800 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline max-w-24 truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-300 hover:border-emerald-700 hover:bg-emerald-50/50 text-stone-800 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                >
                  <UserIcon className="w-3.5 h-3.5 text-stone-600" />
                  <span>{t.signIn}</span>
                </button>
              )}

              {userDropdownOpen && currentUser && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 text-xs">
                  <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/60">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-stone-900 truncate">{currentUser.name}</p>
                      <span className="text-[10px] text-emerald-800 font-bold uppercase shrink-0">
                        {currentUser.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">{currentUser.email}</p>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    {onOpenCommunityChat && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('community-chat');
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                          selectedNavOption === 'community-chat'
                            ? 'bg-emerald-800 text-white'
                            : 'hover:bg-stone-100 text-stone-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          <span>Support Chat</span>
                        </span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold tabular-nums">{unreadCount}</span>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNavSelect('wishlist');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-stone-500" />
                        <span>Wishlist</span>
                      </span>
                      <span className="text-[11px] text-stone-500 tabular-nums">{wishlistCount}</span>
                    </button>

                    {currentUser.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('role-admin');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-700" />
                          <span>Admin Panel</span>
                        </span>
                        <span className="text-[11px] text-stone-500 tabular-nums">{activitiesCount}</span>
                      </button>
                    )}

                    {onOpenPresentation && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('presentation');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Presentation className="w-4 h-4 text-emerald-700" />
                        <span>PowerPoint Deck (.pptx)</span>
                      </button>
                    )}

                    {onOpenAccessHub && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('access-anywhere');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Compass className="w-4 h-4 text-emerald-700" />
                        <span>Access Anywhere</span>
                      </button>
                    )}

                    {onOpenOrderTracker && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('order-tracker');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <Navigation className="w-4 h-4 text-emerald-700" />
                        <span>Track Order</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleNavSelect('theme-selector');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Palette className="w-4 h-4 text-stone-500" />
                      <span>Color Theme</span>
                    </button>

                    {onToggleMinimizeHero && (
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          handleNavSelect('toggle-banner');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        {isHeroMinimized ? (
                          <Maximize2 className="w-4 h-4 text-stone-500" />
                        ) : (
                          <Minimize2 className="w-4 h-4 text-stone-500" />
                        )}
                        <span>{isHeroMinimized ? 'Expand Hero Banner' : 'Compact Store View'}</span>
                      </button>
                    )}

                    <a
                      href="/api/system/download-zip"
                      download="fofogreen-system.zip"
                      onClick={() => setUserDropdownOpen(false)}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-stone-100 text-stone-800 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4 text-stone-500" />
                      <span>Download System (ZIP)</span>
                    </a>
                  </div>

                  <div className="pt-1 mt-1 border-t border-stone-100 px-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-1.5 rounded-xl hover:bg-rose-50 text-rose-700 font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors cursor-pointer ${
                mobileMenuOpen
                  ? 'bg-emerald-800 text-white'
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer with Active Selection State */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-stone-200 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          <div className="space-y-1">
            {(
              [
                { id: 'home', label: t.home || 'Home' },
                { id: 'shop', label: t.shop },
                { id: 'baskets', label: 'Recipe Baskets & Kits' },
                { id: 'delivery', label: t.delivery },
                { id: 'about', label: t.about },
                { id: 'contact', label: t.contact },
                { id: 'community-chat', label: 'Support Chat' },
              ] as Array<{ id: NavbarSelection; label: string }>
            ).map((item) => {
              const selected = selectedNavOption === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => handleNavSelect(item.id)}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl font-semibold text-sm flex items-center justify-between cursor-pointer transition-colors ${
                    selected
                      ? 'bg-emerald-800 text-white'
                      : 'text-stone-800 hover:bg-stone-100'
                  }`}
                >
                  <span>{item.label}</span>
                  {selected && <span className="text-[11px] opacity-85">Active</span>}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-stone-100 grid grid-cols-2 gap-2">
            {onOpenPresentation && (
              <button
                type="button"
                onClick={() => handleNavSelect('presentation')}
                className={`col-span-2 p-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedNavOption === 'presentation'
                    ? 'bg-emerald-800 border-emerald-800 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-800'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>PowerPoint Deck (.pptx)</span>
              </button>
            )}
            {onOpenAccessHub && (
              <button
                type="button"
                onClick={() => handleNavSelect('access-anywhere')}
                className={`col-span-2 p-2.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedNavOption === 'access-anywhere'
                    ? 'bg-emerald-800 border-emerald-800 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Access Anywhere</span>
              </button>
            )}
            {onOpenOrderTracker && (
              <button
                type="button"
                onClick={() => handleNavSelect('order-tracker')}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-xs text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                <span>Track Order</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => handleNavSelect('theme-selector')}
              className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-xs text-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-emerald-700" />
              <span>Theme</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-between gap-2">
            <select
              value={currentLang}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="bg-stone-100 border border-stone-200 rounded-xl px-3 py-2 text-xs font-semibold text-stone-800 uppercase"
              aria-label="Select language"
            >
              <option value="en">EN</option>
              <option value="rw">RW</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
              <option value="ar">AR</option>
            </select>

            {currentUser ? (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout();
                }}
                className="px-3 py-2 rounded-xl text-xs text-rose-700 font-semibold hover:bg-rose-50 cursor-pointer"
              >
                Sign Out ({currentUser.name.split(' ')[0]})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="flex-1 py-2 text-center font-semibold text-white bg-theme-primary rounded-xl text-xs cursor-pointer"
              >
                {t.signIn}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
