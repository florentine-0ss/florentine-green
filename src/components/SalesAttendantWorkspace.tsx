import React, { useState } from 'react';
import { 
  X, 
  Smile, 
  Search, 
  Sparkles, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight, 
  Send, 
  CheckCircle2, 
  HelpCircle, 
  Heart, 
  Info, 
  Layers, 
  Lightbulb, 
  Compass, 
  MapPin,
  Leaf
} from 'lucide-react';
import { Product } from '../types';

interface SalesAttendantWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  attendantName?: string;
  onSendToCashier: (basket: Array<{ product: Product; quantity: number }>, customerNote: string) => void;
}

export const SalesAttendantWorkspace: React.FC<SalesAttendantWorkspaceProps> = ({
  isOpen,
  onClose,
  products,
  attendantName = 'Kevin Niyonzima',
  onSendToCashier
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customerAssistedBasket, setCustomerAssistedBasket] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('Customer in Store');
  const [recommendationFilter, setRecommendationFilter] = useState<'all' | 'smoothie' | 'organic_volcano' | 'quick_dinner'>('all');
  const [handoverSuccess, setHandoverSuccess] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);

  if (!isOpen) return null;

  // Add to assisted basket
  const addToBasket = (product: Product) => {
    setCustomerAssistedBasket(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateBasketQuantity = (productId: number, delta: number) => {
    setCustomerAssistedBasket(prev => {
      return prev
        .map(i => {
          if (i.product.id === productId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as Array<{ product: Product; quantity: number }>;
    });
  };

  const removeFromBasket = (productId: number) => {
    setCustomerAssistedBasket(prev => prev.filter(i => i.product.id !== productId));
  };

  const basketTotal = customerAssistedBasket.reduce(
    (acc, curr) => acc + (curr.product.price * curr.quantity), 
    0
  );

  const handleHandover = () => {
    if (customerAssistedBasket.length === 0) return;
    onSendToCashier(customerAssistedBasket, `Assisted by ${attendantName} for ${customerName}`);
    setHandoverSuccess(true);
    setTimeout(() => {
      setHandoverSuccess(false);
      setCustomerAssistedBasket([]);
    }, 2500);
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesRec = true;
    if (recommendationFilter === 'smoothie') {
      matchesRec = p.category === 'fruits' || p.name.toLowerCase().includes('spinach') || p.name.toLowerCase().includes('honey');
    } else if (recommendationFilter === 'organic_volcano') {
      matchesRec = p.origin.toLowerCase().includes('musanze') || p.origin.toLowerCase().includes('volcano') || p.origin.toLowerCase().includes('huye');
    } else if (recommendationFilter === 'quick_dinner') {
      matchesRec = p.category === 'vegetables' || p.category === 'meat' || p.category === 'dairy';
    }

    return matchesSearch && matchesCategory && matchesRec;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Sales Attendant Banner */}
        <div className="bg-violet-950 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-violet-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300 flex items-center justify-center">
              <Smile className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-violet-800 text-violet-200 px-2 py-0.5 rounded-md">
                  Role 4 • Sales Attendant
                </span>
                <span className="text-xs text-violet-300">{attendantName}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Customer Welcoming & Assisted Shopping Kiosk
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-violet-900 text-violet-200 px-3 py-1.5 rounded-xl border border-violet-800 font-semibold hidden sm:inline">
              Murakaza Neza! Fresh Harvest Advice
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-violet-300 hover:text-white hover:bg-violet-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Welcoming & Daily Recommendation Bar */}
        <div className="bg-gradient-to-r from-violet-50 to-purple-50 p-4 border-b border-violet-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-700 shrink-0" />
            <p className="text-violet-950 font-medium">
              <strong>Today's Fresh Harvest:</strong> Musanze volcanic carrots and sweet Gakenke pineapples arrived at 06:30 AM!
            </p>
          </div>

          {/* Quick Recommendation Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            <span className="text-stone-500 font-bold shrink-0">Recommend:</span>
            <button
              onClick={() => setRecommendationFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                recommendationFilter === 'all' ? 'bg-violet-800 text-white shadow-2xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              All Produce
            </button>
            <button
              onClick={() => setRecommendationFilter('smoothie')}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                recommendationFilter === 'smoothie' ? 'bg-violet-800 text-white shadow-2xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              🥤 Fresh Smoothies & Juices
            </button>
            <button
              onClick={() => setRecommendationFilter('organic_volcano')}
              className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                recommendationFilter === 'organic_volcano' ? 'bg-violet-800 text-white shadow-2xs' : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              🌋 Musanze & Huye Volcanic Soil
            </button>
          </div>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[72vh] divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          
          {/* Left 8 Cols: Product Catalog & Price Guide for Customer Assistance */}
          <div className="lg:col-span-8 p-5 overflow-y-auto space-y-4 max-h-[72vh]">
            
            {/* Search & Categories */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask for produce name, origin, or farmer..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-violet-600"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-xs shrink-0">
                {['all', 'fruits', 'vegetables', 'dairy', 'snacks'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-violet-800 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Assistance Product Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  className="bg-white border border-stone-200 hover:border-violet-300 rounded-2xl p-3 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                >
                  <div>
                    <div className="relative rounded-xl overflow-hidden mb-2 bg-stone-100 aspect-4/3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {p.badge && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-2xs">
                          {p.badge}
                        </span>
                      )}
                      <span className="absolute bottom-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                        {p.spec}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-xs text-stone-900 leading-tight">{p.name}</h4>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{p.description}</p>
                    
                    <div className="mt-2 text-[10px] text-stone-600 flex items-center gap-1 font-medium">
                      <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">{p.origin}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">Price</p>
                      <p className="font-mono font-black text-sm text-emerald-800">
                        {p.price.toLocaleString()} FRW
                      </p>
                    </div>

                    <button
                      onClick={() => addToBasket(p)}
                      className="px-2.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add to Basket</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Right 4 Cols: Assisted Customer Basket & Cashier Handoff */}
          <div className="lg:col-span-4 p-5 bg-stone-50/60 flex flex-col justify-between max-h-[72vh] overflow-y-auto space-y-4">
            
            <div className="space-y-4">
              {/* Customer Tag */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200 text-xs shadow-2xs">
                <label className="block text-[10px] font-bold text-stone-400 uppercase">Assisting Customer Name / Note</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mrs. Uwera (Fruit basket selection)"
                  className="w-full font-bold text-stone-800 bg-transparent border-b border-stone-300 focus:outline-hidden py-1 text-xs"
                />
              </div>

              {/* Success Notification */}
              {handoverSuccess && (
                <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Basket handed off to Cashier POS queue successfully!</span>
                </div>
              )}

              {/* Assisted Basket List */}
              <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs max-h-60 overflow-y-auto space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
                  <span>Customer Selections ({customerAssistedBasket.length})</span>
                  <span>Amount</span>
                </div>

                {customerAssistedBasket.length === 0 ? (
                  <p className="text-center text-stone-400 py-8 text-xs">
                    Customer has not picked items yet. Tap "Add to Basket" to assist them.
                  </p>
                ) : (
                  customerAssistedBasket.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-b-0 text-xs">
                      <div className="truncate max-w-36">
                        <p className="font-extrabold text-stone-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">
                          {item.product.price.toLocaleString()} FRW / {item.product.spec}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-stone-100 rounded-lg p-0.5 border border-stone-200">
                          <button
                            onClick={() => updateBasketQuantity(item.product.id, -1)}
                            className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-5 text-center font-mono font-bold text-xs">{item.quantity}</span>
                          <button
                            onClick={() => updateBasketQuantity(item.product.id, 1)}
                            className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-mono font-bold text-stone-900 w-14 text-right">
                          {(item.product.price * item.quantity).toLocaleString()}
                        </span>

                        <button
                          onClick={() => removeFromBasket(item.product.id)}
                          className="text-stone-300 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Basket Running Total */}
              <div className="bg-white p-3 rounded-2xl border border-stone-200 text-xs shadow-2xs space-y-1">
                <div className="flex justify-between text-stone-600">
                  <span>Selected Items Count:</span>
                  <span className="font-mono font-bold">{customerAssistedBasket.length} items</span>
                </div>
                <div className="flex justify-between text-base font-black text-stone-900 pt-1 border-t border-stone-200">
                  <span>Estimated Total:</span>
                  <span className="font-mono text-emerald-800">{basketTotal.toLocaleString()} FRW</span>
                </div>
              </div>
            </div>

            {/* Hand Off to Cashier Button */}
            <button
              onClick={handleHandover}
              disabled={customerAssistedBasket.length === 0}
              className="w-full bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Hand Off Basket to Cashier POS Register</span>
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
