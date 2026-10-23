import React, { useState } from 'react';
import { 
  X, 
  Apple, 
  Search, 
  Sparkles, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Heart, 
  Banknote, 
  Smartphone, 
  CheckCircle2, 
  Receipt, 
  Star, 
  Send,
  MapPin,
  Leaf,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { Product, SalesReceipt, ReceiptItem, CustomerReview } from '../types';

interface CustomerFruitMarketModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onOrderComplete: (receipt: SalesReceipt) => void;
  onAddReview: (review: CustomerReview) => void;
  onOpenReceipt: (receipt: SalesReceipt) => void;
  customerName?: string;
  customerPhone?: string;
}

export const CustomerFruitMarketModal: React.FC<CustomerFruitMarketModalProps> = ({
  isOpen,
  onClose,
  products,
  onOrderComplete,
  onAddReview,
  onOpenReceipt,
  customerName = 'Divine Uwase',
  customerPhone = '+250 789 112 334'
}) => {
  const [activeTab, setActiveTab] = useState<'fruits' | 'checkout' | 'receipt'>('fruits');
  const [searchQuery, setSearchQuery] = useState('');
  const [fruitFilter, setFruitFilter] = useState<'all' | 'berries' | 'tropical' | 'citrus'>('all');

  // Customer Basket
  const [basket, setBasket] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mtn' | 'airtel'>('mtn');
  const [deliveryAddress, setDeliveryAddress] = useState('Kiyovu Sector, Nyarugenge, Kigali');
  const [orderPhone, setOrderPhone] = useState(customerPhone);
  const [orderName, setOrderName] = useState(customerName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedReceipt, setGeneratedReceipt] = useState<SalesReceipt | null>(null);

  // Customer Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  // Filter only fruits (or fresh fruits + related organic picks)
  const fruitProducts = products.filter(p => {
    const isFruit = p.category === 'fruits' || p.category === 'snacks' || p.name.toLowerCase().includes('fruit') || p.name.toLowerCase().includes('berry') || p.name.toLowerCase().includes('mango') || p.name.toLowerCase().includes('avocado');
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return isFruit && matchesSearch;
  });

  const addToBasket = (product: Product) => {
    setBasket(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateBasketQuantity = (productId: number, delta: number) => {
    setBasket(prev => {
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

  const basketSubtotal = basket.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = 2000;
  const grandTotal = basketSubtotal + deliveryFee;

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (basket.length === 0) return;
    setIsSubmitting(true);

    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItems: ReceiptItem[] = basket.map(i => ({
      id: i.product.id,
      name: i.product.name,
      spec: i.product.spec,
      quantity: i.quantity,
      unitPrice: i.product.price,
      total: i.product.price * i.quantity
    }));

    const receipt: SalesReceipt = {
      receiptNumber: receiptNum,
      orderId: `FGG-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: orderName,
      customerPhone: orderPhone,
      items: lineItems,
      subtotal: basketSubtotal,
      discount: 0,
      deliveryFee: deliveryFee,
      total: grandTotal,
      paymentMethod: paymentMethod,
      paymentReference: paymentMethod === 'cash' ? 'CASH-ON-DELIVERY' : `MOMO-${Math.floor(100000 + Math.random() * 900000)}`,
      cashierName: 'Fofo Green Fast Dispatch',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setGeneratedReceipt(receipt);
      onOrderComplete(receipt);
      setActiveTab('receipt');
    }, 700);
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackComment.trim()) return;

    const newRev: CustomerReview = {
      id: Date.now(),
      name: orderName,
      location: 'Kigali, Rwanda',
      rating: feedbackRating,
      comment: feedbackComment,
      date: 'Just now',
      verified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=80',
      productName: basket[0]?.product.name || 'Organic Rwandan Fruits'
    };

    onAddReview(newRev);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-rose-950 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-rose-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600/30 border border-rose-400/40 text-rose-300 flex items-center justify-center">
              <Apple className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-rose-800 text-rose-200 px-2 py-0.5 rounded-md">
                  Role 6 • Customer Portal
                </span>
                <span className="text-xs text-rose-300">{orderName}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Fresh Rwandan Fruit Market & Orders
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-rose-900 rounded-xl p-0.5 border border-rose-800 text-xs">
              <button
                onClick={() => setActiveTab('fruits')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'fruits' ? 'bg-white text-rose-950 shadow-2xs' : 'text-rose-200 hover:text-white'
                }`}
              >
                1. Browse Fruits
              </button>
              <button
                onClick={() => setActiveTab('checkout')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'checkout' ? 'bg-white text-rose-950 shadow-2xs' : 'text-rose-200 hover:text-white'
                }`}
              >
                2. Cart & Pay ({basket.length})
              </button>
              {generatedReceipt && (
                <button
                  onClick={() => setActiveTab('receipt')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    activeTab === 'receipt' ? 'bg-white text-rose-950 shadow-2xs' : 'text-rose-200 hover:text-white'
                  }`}
                >
                  3. Receipt & Feedback
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-rose-300 hover:text-white hover:bg-rose-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Browse Available Fruits & Prices */}
        {activeTab === 'fruits' && (
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-4">
            
            {/* Search and Highlight Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search fresh mangoes, pineapples, avocados..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-rose-600"
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-rose-950 font-bold">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>100% Volcanic Soil • Certified Organic Rwandan Fruits</span>
              </div>
            </div>

            {/* Fruits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fruitProducts.map((p) => {
                const inBasket = basket.find(item => item.product.id === p.id);
                return (
                  <div
                    key={p.id}
                    className="bg-white border border-stone-200 hover:border-rose-300 rounded-2xl p-3.5 flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div>
                      <div className="relative rounded-xl overflow-hidden mb-2 bg-stone-100 aspect-4/3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute bottom-2 left-2 bg-emerald-800 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md shadow-2xs">
                          {p.badge || 'Sweet Organic'}
                        </span>
                        <span className="absolute top-2 right-2 bg-stone-900/80 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                          {p.spec}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-stone-900 text-sm leading-tight">{p.name}</h4>
                      <p className="text-xs text-stone-500 line-clamp-2 mt-1">{p.description}</p>
                      
                      <div className="mt-2 text-[10px] text-stone-600 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="truncate">{p.origin}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-stone-400">Price</p>
                        <p className="font-mono font-black text-sm text-rose-900">
                          {p.price.toLocaleString()} FRW
                        </p>
                      </div>

                      {inBasket ? (
                        <div className="flex items-center bg-rose-50 rounded-xl border border-rose-200 p-0.5">
                          <button
                            onClick={() => updateBasketQuantity(p.id, -1)}
                            className="w-6 h-6 flex items-center justify-center text-rose-800 hover:bg-white rounded-lg cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-mono font-bold text-xs text-rose-950">
                            {inBasket.quantity}
                          </span>
                          <button
                            onClick={() => updateBasketQuantity(p.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-rose-800 hover:bg-white rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToBasket(p)}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Select Fruit</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Bar: Go to Checkout */}
            {basket.length > 0 && (
              <div className="sticky bottom-0 bg-stone-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs text-stone-300">
                    Selected: <strong className="text-white">{basket.length} fruit items</strong>
                  </p>
                  <p className="text-base font-black font-mono text-emerald-400">
                    {basketSubtotal.toLocaleString()} FRW
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('checkout')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Proceed to Payment (Cash / MoMo)</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Make Payment using Cash or Mobile Money */}
        {activeTab === 'checkout' && (
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Order Basket Summary */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  Your Selected Fruits ({basket.length})
                </h3>

                {basket.length === 0 ? (
                  <p className="text-stone-400 text-xs py-8 text-center">
                    Basket is empty. Return to "Browse Fruits" to pick your fresh produce.
                  </p>
                ) : (
                  <div className="divide-y divide-stone-200 space-y-2">
                    {basket.map(item => (
                      <div key={item.product.id} className="pt-2 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-extrabold text-stone-900">{item.product.name}</p>
                          <p className="text-[10px] text-stone-500 font-mono">
                            {item.product.price.toLocaleString()} FRW × {item.quantity}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-stone-900">
                          {(item.product.price * item.quantity).toLocaleString()} FRW
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-stone-300 space-y-1 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Fruits Subtotal:</span>
                    <span className="font-mono">{basketSubtotal.toLocaleString()} FRW</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Kigali Express Delivery:</span>
                    <span className="font-mono">{deliveryFee.toLocaleString()} FRW</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-200">
                    <span>Total to Pay:</span>
                    <span className="font-mono text-emerald-800">{grandTotal.toLocaleString()} FRW</span>
                  </div>
                </div>
              </div>

              {/* Payment Details Form */}
              <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 space-y-4 shadow-2xs">
                  <h3 className="text-xs font-black uppercase tracking-wider text-stone-900">
                    Delivery & Payment Method
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Customer Full Name</label>
                    <input
                      type="text"
                      required
                      value={orderName}
                      onChange={(e) => setOrderName(e.target.value)}
                      className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number (MoMo / Delivery SMS)</label>
                    <input
                      type="text"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-rose-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">Kigali Delivery Address</label>
                    <input
                      type="text"
                      required
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-rose-600"
                    />
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">Choose Payment Method</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          paymentMethod === 'cash'
                            ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Banknote className="w-4 h-4" />
                        <span>Cash on Delivery</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mtn')}
                        className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          paymentMethod === 'mtn'
                            ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>MTN MoMo (*182#)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('airtel')}
                        className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                          paymentMethod === 'airtel'
                            ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                            : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Airtel Money (*175#)</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={basket.length === 0 || isSubmitting}
                    className="w-full bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmitting ? 'Confirming Purchase...' : `Pay & Place Order (${grandTotal.toLocaleString()} FRW)`}
                    </span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* Tab 3: Receipt & Customer Feedback */}
        {activeTab === 'receipt' && generatedReceipt && (
          <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
            
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-emerald-950">
                    Order Confirmed & Receipt Issued!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Receipt #{generatedReceipt.receiptNumber} • Paid with {generatedReceipt.paymentMethod.toUpperCase()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onOpenReceipt(generatedReceipt)}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Open Full Printable Receipt</span>
              </button>
            </div>

            {/* Customer Feedback / Rating Form */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h4 className="font-extrabold text-xs uppercase tracking-wider text-stone-900">
                  Provide Feedback on Your Fruit Purchase
                </h4>
              </div>

              {feedbackSubmitted ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">Thank you, {orderName}! Your feedback has been verified and published.</p>
                  <p className="text-stone-600 italic">"{feedbackComment}"</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <p className="text-xs text-stone-600">
                    How was the sweetness, freshness, and packaging of your fruits?
                  </p>

                  <div className="flex items-center gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setFeedbackRating(s)}
                        className="p-1 cursor-pointer hover:scale-115 transition-transform"
                      >
                        <Star className={`w-6 h-6 ${s <= feedbackRating ? 'fill-current text-amber-400' : 'text-stone-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-stone-700 ml-2">
                      {feedbackRating} / 5 Stars
                    </span>
                  </div>

                  <div>
                    <textarea
                      rows={3}
                      required
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      placeholder="Share your thoughts on the freshness of the avocados, mangoes, or pineapples..."
                      className="w-full text-xs p-3 border border-stone-300 rounded-xl focus:outline-rose-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-rose-700 hover:bg-rose-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Customer Review</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
