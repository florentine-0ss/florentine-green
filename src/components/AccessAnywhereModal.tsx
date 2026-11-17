import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  MapPin,
  Smartphone,
  QrCode,
  Phone,
  Check,
  Copy,
  Share2,
  Download,
  RefreshCw,
  Wifi,
  WifiOff,
  Compass,
  Store,
  Truck,
  Globe,
  MessageCircle,
} from 'lucide-react';
import { CartItem, DeliveryZoneSelection, Product } from '../types';
import { RWANDA_LOCATIONS } from '../data/mockData';
import { offlineCache } from '../services/offlineCache';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallButton } from './PWAInstallButton';

interface AccessAnywhereModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocation: DeliveryZoneSelection;
  onSelectLocation: (loc: DeliveryZoneSelection) => void;
  products: Product[];
  cart: CartItem[];
  isCompactMode: boolean;
  onToggleCompactMode: () => void;
  onRefreshOfflineCache: () => void;
  onShowToast: (msg: string) => void;
}

type HubTab = 'location' | 'offline' | 'qr' | 'channels';

export const AccessAnywhereModal: React.FC<AccessAnywhereModalProps> = ({
  isOpen,
  onClose,
  selectedLocation,
  onSelectLocation,
  products,
  cart,
  isCompactMode,
  onToggleCompactMode,
  onRefreshOfflineCache,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<HubTab>('location');
  const [draftDistrict, setDraftDistrict] = useState(selectedLocation.district);
  const [draftSector, setDraftSector] = useState(selectedLocation.sector);
  const [isLocating, setIsLocating] = useState(false);
  const [geoFeedback, setGeoFeedback] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isOnline = useOnlineStatus();
  const { isInstalled } = usePWAInstall();

  useEffect(() => {
    setDraftDistrict(selectedLocation.district);
    setDraftSector(selectedLocation.sector);
  }, [selectedLocation, isOpen]);

  const activeDistrictDef =
    RWANDA_LOCATIONS.find((d) => d.district === draftDistrict) || RWANDA_LOCATIONS[0];

  const storeAccessUrl = offlineCache.buildStoreAccessUrl({
    ...selectedLocation,
    district: draftDistrict,
    sector: draftSector,
  });

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    QRCode.toDataURL(storeAccessUrl, {
      width: 220,
      margin: 2,
      color: {
        dark: '#064e3b',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, storeAccessUrl]);

  if (!isOpen) return null;

  const handleDistrictChange = (districtName: string) => {
    setDraftDistrict(districtName);
    const found = RWANDA_LOCATIONS.find((l) => l.district === districtName);
    if (found && found.sectors.length > 0) {
      setDraftSector(found.sectors[0]);
    }
  };

  const handleApplyLocation = () => {
    const loc: DeliveryZoneSelection = {
      district: activeDistrictDef.district,
      sector: draftSector || activeDistrictDef.sectors[0],
      fee: activeDistrictDef.fee,
      estimatedHours: activeDistrictDef.estimatedHours,
      fulfillmentMode: activeDistrictDef.mode || 'delivery',
    };
    onSelectLocation(loc);
    onShowToast(`Delivery zone set to ${loc.sector} (${loc.district})`);
    onClose();
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoFeedback('Browser geolocation is unavailable on this device. Please select your area below.');
      return;
    }
    setIsLocating(true);
    setGeoFeedback(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        // Map coordinates cleanly to Rwandan regions or Diaspora Gift mode
        let targetDistrict = 'Diaspora Gift Delivery';
        if (latitude >= -2.9 && latitude <= -1.0 && longitude >= 28.8 && longitude <= 30.9) {
          if (latitude >= -2.05 && latitude <= -1.85 && longitude >= 29.98 && longitude <= 30.22) {
            targetDistrict = longitude >= 30.1 ? 'Gasabo' : latitude <= -1.97 ? 'Kicukiro' : 'Nyarugenge';
          } else if (latitude > -1.75 && longitude < 30.0) {
            targetDistrict = 'Northern Province';
          } else if (longitude <= 29.5) {
            targetDistrict = 'Western Province';
          } else if (longitude >= 30.25) {
            targetDistrict = 'Eastern Province';
          } else {
            targetDistrict = 'Southern Province';
          }
        }
        const matched = RWANDA_LOCATIONS.find((l) => l.district === targetDistrict) || RWANDA_LOCATIONS[0];
        setDraftDistrict(matched.district);
        setDraftSector(matched.sectors[0]);
        setGeoFeedback(
          targetDistrict === 'Diaspora Gift Delivery'
            ? 'Detected location outside Rwanda — Diaspora Gift Delivery selected so you can send produce to loved ones back home.'
            : `Matched your coordinates (${latitude.toFixed(2)}, ${longitude.toFixed(2)}) to ${matched.district}.`
        );
      },
      () => {
        setIsLocating(false);
        setGeoFeedback('Location access declined. Choose any Kigali district, Rwandan province, pickup locker, or Diaspora mode below.');
      },
      { timeout: 6000 }
    );
  };

  const handleCopy = async (text: string, key: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onShowToast(message);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      onShowToast('Copy unavailable in this browser context');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Fofo Green — Fresh Organic Produce',
          text: `Browse ${products.length} fresh organic farm items on Fofo Green:`,
          url: storeAccessUrl,
        });
        return;
      } catch {
        // User cancelled or share unsupported
      }
    }
    handleCopy(storeAccessUrl, 'shareUrl', 'Store access link copied to clipboard');
  };

  const whatsappText = offlineCache.buildWhatsAppOrderMessage(cart, {
    district: activeDistrictDef.district,
    sector: draftSector,
    fee: activeDistrictDef.fee,
    estimatedHours: activeDistrictDef.estimatedHours,
    fulfillmentMode: activeDistrictDef.mode || 'delivery',
  });
  const whatsappUrl = `https://wa.me/250788123456?text=${encodeURIComponent(whatsappText)}`;
  const syncedAt = offlineCache.getProductsSyncedAt();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/65 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 flex items-center justify-between gap-4 bg-stone-50">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Access Fofo Green Anywhere
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Nationwide delivery zones · Offline PWA catalog · QR mobile handoff · Phone &amp; WhatsApp ordering
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 flex items-center justify-center cursor-pointer transition-colors shrink-0"
            aria-label="Close Access Hub"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Control Navigation */}
        <div className="px-6 pt-4 pb-2 bg-white border-b border-stone-100">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-stone-100 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'location'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              <span>Location &amp; Pickup</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('offline')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'offline'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
              <span>App &amp; Offline</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'qr'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-700" />
              <span>QR &amp; Share</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('channels')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'channels'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              <span>Phone &amp; USSD</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: LOCATION & COVERAGE */}
          {activeTab === 'location' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Set Your Delivery Area or Pickup Hub
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Works in Kigali, all 4 regional provinces, 0 FRW pickup lockers, or overseas gift orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-emerald-700 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
                >
                  <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                  <span>{isLocating ? 'Detecting...' : 'Detect My Location'}</span>
                </button>
              </div>

              {geoFeedback && (
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700">
                  {geoFeedback}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Region / Fulfillment Option
                  </label>
                  <select
                    value={draftDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-900 cursor-pointer"
                  >
                    {RWANDA_LOCATIONS.map((loc) => (
                      <option key={loc.district} value={loc.district}>
                        {loc.district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Sector / Hub / Destination
                  </label>
                  <select
                    value={draftSector}
                    onChange={(e) => setDraftSector(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-medium text-stone-900 cursor-pointer"
                  >
                    {activeDistrictDef.sectors.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Coverage Summary */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <div className="text-[11px] text-stone-500 font-medium">Fulfillment</div>
                  <div className="text-sm font-bold text-stone-900 mt-1 flex items-center gap-1.5 capitalize">
                    {activeDistrictDef.mode === 'pickup' ? (
                      <Store className="w-4 h-4 text-emerald-700" />
                    ) : activeDistrictDef.mode === 'diaspora' ? (
                      <Globe className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Truck className="w-4 h-4 text-emerald-700" />
                    )}
                    <span>{activeDistrictDef.mode}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-stone-500 font-medium">Estimated Arrival</div>
                  <div className="text-sm font-bold text-stone-900 mt-1 tabular-nums">
                    {activeDistrictDef.estimatedHours}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-stone-500 font-medium">Standard Fee</div>
                  <div className="text-sm font-bold text-emerald-800 mt-1 tabular-nums">
                    {activeDistrictDef.fee === 0 ? 'Free (0 FRW)' : `${activeDistrictDef.fee.toLocaleString()} FRW`}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyLocation}
                className="w-full py-3 px-4 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-sm cursor-pointer transition-colors"
              >
                Use {draftSector} for My Shopping Session
              </button>
            </div>
          )}

          {/* TAB 2: APP INSTALL & OFFLINE CATALOG */}
          {activeTab === 'offline' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {isOnline ? (
                      <Wifi className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-amber-600" />
                    )}
                    <h3 className="text-sm font-bold text-stone-900">
                      {isInstalled
                        ? 'Installed as Standalone App'
                        : 'Install Fofo Green on Phone or Desktop'}
                    </h3>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    {isInstalled
                      ? 'Running as an installed app with automatic service-worker asset & catalog caching.'
                      : 'Add Fofo Green to your home screen for one-tap produce access even on low or intermittent mobile data.'}
                  </p>
                </div>
                <div className="shrink-0">
                  <PWAInstallButton
                    onInstalled={() => onShowToast('Fofo Green installed to your device')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
                  <div className="text-xs font-semibold text-stone-500">Offline Produce Cache</div>
                  <div className="text-2xl font-bold text-stone-900 tabular-nums">
                    {products.length} items saved
                  </div>
                  <p className="text-xs text-stone-500">
                    {syncedAt
                      ? `Last synced ${new Date(syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      : 'Cached locally in browser storage'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      onRefreshOfflineCache();
                      onShowToast(`Saved ${products.length} products for offline access`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 hover:bg-stone-50 text-xs font-semibold text-stone-800 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Catalog Now</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2">
                  <div className="text-xs font-semibold text-stone-500">Low-Bandwidth Mode</div>
                  <div className="text-base font-bold text-stone-900">
                    {isCompactMode ? 'Compact Data-Saver On' : 'Full Storefront Banner'}
                  </div>
                  <p className="text-xs text-stone-500">
                    Minimize the top promotional banner so the product catalog opens immediately on 2G/3G networks.
                  </p>
                  <button
                    type="button"
                    onClick={onToggleCompactMode}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-white cursor-pointer transition-colors"
                  >
                    <span>{isCompactMode ? 'Switch to Full View' : 'Enable Compact Data-Saver'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QR CODE & CROSS-DEVICE SHARE */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-stone-50 border border-stone-200">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR code to open Fofo Green catalog on any phone"
                    className="w-44 h-44 rounded-xl bg-white p-2 border border-stone-200"
                  />
                ) : (
                  <div className="w-44 h-44 rounded-xl bg-stone-200 flex items-center justify-center text-xs text-stone-500">
                    Generating QR...
                  </div>
                )}
                <span className="text-[11px] text-stone-500 mt-2 text-center">
                  Scan with any phone camera to open your zone
                </span>
              </div>

              <div className="sm:col-span-7 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    Take the Store to Any Device
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    Scan the QR code to switch smoothly from desktop to smartphone, or share this direct store link with family and colleagues anywhere.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-stone-100 border border-stone-200 text-xs font-mono text-stone-700 truncate">
                  {storeAccessUrl}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(storeAccessUrl, 'storeUrl', 'Direct store link copied')
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {copiedKey === 'storeUrl' ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'storeUrl' ? 'Copied' : 'Copy Direct Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>

                  {qrDataUrl && (
                    <a
                      href={qrDataUrl}
                      download="fofo-green-access-qr.png"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Save QR</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PHONE, WHATSAPP, SMS & USSD */}
          {activeTab === 'channels' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-600">
                No fast internet? You can access and order Fofo Green produce anytime over WhatsApp, SMS, voice phone, or MTN MoMo USSD.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 transition-colors flex items-start gap-3"
                >
                  <MessageCircle className="w-5 h-5 text-emerald-800 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-emerald-950">Order via WhatsApp</div>
                    <div className="text-xs text-emerald-800 mt-0.5">
                      Pre-fills your {cart.length > 0 ? `${cart.length} basket item(s)` : 'delivery area'} to +250 788 123 456
                    </div>
                  </div>
                </a>

                <a
                  href="tel:+250788234567"
                  className="p-4 rounded-2xl border border-stone-200 bg-stone-50 hover:bg-stone-100 transition-colors flex items-start gap-3"
                >
                  <Phone className="w-5 h-5 text-stone-800 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-stone-900">Voice Order Desk</div>
                    <div className="text-xs text-stone-600 mt-0.5 tabular-nums">
                      Call +250 788 234 567 (06:00 – 21:00 CAT)
                    </div>
                  </div>
                </a>
              </div>

              <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-stone-900">
                    Formatted SMS / Offline Order Summary
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(whatsappText, 'smsOrder', 'Order summary copied for SMS or WhatsApp')
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold cursor-pointer"
                  >
                    {copiedKey === 'smsOrder' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedKey === 'smsOrder' ? 'Copied' : 'Copy Order Text'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200 whitespace-pre-wrap leading-relaxed">
                  {whatsappText}
                </pre>
                <div className="text-[11px] text-stone-500">
                  Mobile Money USSD Quick Code: <strong className="text-stone-800 font-mono">*182*8*1#</strong> (MTN MoMo) · <strong className="text-stone-800 font-mono">*175#</strong> (Airtel Money)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
