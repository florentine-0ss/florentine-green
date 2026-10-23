import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Receipt, 
  CheckCircle2, 
  Printer, 
  Calculator, 
  Coins, 
  ShieldCheck, 
  ArrowRight,
  User,
  History,
  Store,
  Sparkles
} from 'lucide-react';
import { Product, SalesReceipt, ReceiptItem, PaymentMethod } from '../types';

interface CashierWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onCompleteSale: (receipt: SalesReceipt) => void;
  cashierName?: string;
  onViewReceipt: (receipt: SalesReceipt) => void;
  receiptsHistory: SalesReceipt[];
}

export const CashierWorkspace: React.FC<CashierWorkspaceProps> = ({
  isOpen,
  onClose,
  products,
  onCompleteSale,
  cashierName = 'Chantal Uwera',
  onViewReceipt,
  receiptsHistory
}) => {
  // POS Ticket State
  const [ticketItems, setTicketItems] = useState<Array<{ product: Product; quantity: number }>>([
    { product: products[0] || { id: 1, name: 'Organic Vine Tomatoes', price: 3500, spec: '1 kg', category: 'vegetables', rating: 4.8, reviewsCount: 10, image: '', origin: '', farmer: '', description: '', inStock: true }, quantity: 2 },
    { product: products[6] || { id: 7, name: 'Rwandan Hass Avocados', price: 1800, spec: '1 kg', category: 'fruits', rating: 4.9, reviewsCount: 15, image: '', origin: '', farmer: '', description: '', inStock: true }, quantity: 1 }
  ]);

  const [customerName, setCustomerName] = useState('Walk-in Customer (Kigali)');
  const [customerPhone, setCustomerPhone] = useState('+250 788 123 456');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'mtn' | 'airtel' | 'card'>('cash');
  const [cashTendered, setCashTendered] = useState<number>(10000);
  const [momoTxId, setMomoTxId] = useState(`MOMO-${Math.floor(100000 + Math.random() * 900000)}`);
  const [momoUssdSent, setMomoUssdSent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountFrw, setDiscountFrw] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'register' | 'history'>('register');

  if (!isOpen) return null;

  // Calculations
  const subtotal = ticketItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  const grandTotal = Math.max(0, subtotal - discountFrw);
  const changeToReturn = paymentMode === 'cash' ? Math.max(0, cashTendered - grandTotal) : 0;

  // Shift Drawer Summary
  const todayReceipts = receiptsHistory.filter(r => r.cashierName.includes('Chantal') || true);
  const totalCashCollected = todayReceipts
    .filter(r => r.paymentMethod === 'cash')
    .reduce((sum, r) => sum + r.total, 0);
  const totalMomoCollected = todayReceipts
    .filter(r => r.paymentMethod === 'mtn' || r.paymentMethod === 'airtel')
    .reduce((sum, r) => sum + r.total, 0);

  // Add Item to ticket
  const addItemToTicket = (product: Product) => {
    setTicketItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setTicketItems(prev => {
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

  const removeItem = (productId: number) => {
    setTicketItems(prev => prev.filter(i => i.product.id !== productId));
  };

  // Simulate USSD Prompt
  const handleSendUssd = () => {
    setMomoUssdSent(true);
    setTimeout(() => {
      setMomoTxId(`MOMO-${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1200);
  };

  // Complete Sale & Issue Receipt
  const handleCompleteSale = () => {
    if (ticketItems.length === 0) return;
    setIsProcessing(true);

    const receiptNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineItems: ReceiptItem[] = ticketItems.map(i => ({
      id: i.product.id,
      name: i.product.name,
      spec: i.product.spec,
      quantity: i.quantity,
      unitPrice: i.product.price,
      total: i.product.price * i.quantity
    }));

    const newReceipt: SalesReceipt = {
      receiptNumber,
      orderId: `POS-${Date.now().toString().slice(-5)}`,
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone,
      items: lineItems,
      subtotal,
      discount: discountFrw,
      deliveryFee: 0,
      total: grandTotal,
      paymentMethod: paymentMode,
      paymentReference: paymentMode === 'cash' ? `CASH-REG-${Date.now().toString().slice(-4)}` : momoTxId,
      amountTendered: paymentMode === 'cash' ? cashTendered : grandTotal,
      changeGiven: paymentMode === 'cash' ? changeToReturn : 0,
      cashierName,
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
    };

    setTimeout(() => {
      setIsProcessing(false);
      onCompleteSale(newReceipt);
      onViewReceipt(newReceipt);
      setTicketItems([]);
      setDiscountFrw(0);
      setMomoUssdSent(false);
    }, 600);
  };

  // Filter products for grid
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cashier Top Banner */}
        <div className="bg-emerald-950 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 text-emerald-300 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded-md">
                  Role 3 • Cashier POS
                </span>
                <span className="text-xs text-emerald-300">{cashierName}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Front Register & Payment Terminal
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-3 bg-emerald-900/60 px-3 py-1.5 rounded-xl border border-emerald-800 text-xs text-emerald-200 font-mono">
              <span>Shift Cash: <strong>{totalCashCollected.toLocaleString()} FRW</strong></span>
              <span>•</span>
              <span>MoMo: <strong>{totalMomoCollected.toLocaleString()} FRW</strong></span>
            </div>

            <div className="flex items-center bg-emerald-900 rounded-xl p-0.5 border border-emerald-800 text-xs">
              <button
                onClick={() => setActiveTab('register')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'register' ? 'bg-white text-emerald-950 shadow-2xs' : 'text-emerald-300 hover:text-white'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'history' ? 'bg-white text-emerald-950 shadow-2xs' : 'text-emerald-300 hover:text-white'
                }`}
              >
                History ({receiptsHistory.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-emerald-300 hover:text-white hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Live POS Register */}
        {activeTab === 'register' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[75vh] divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
            
            {/* Left 7 Columns: Product Selection Grid */}
            <div className="lg:col-span-7 p-5 overflow-y-auto space-y-4 max-h-[75vh]">
              
              {/* Search & Categories */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fruit, veg, dairy..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-emerald-600"
                  />
                </div>

                <div className="flex gap-1 overflow-x-auto pb-1 text-xs shrink-0">
                  {['all', 'fruits', 'vegetables', 'dairy', 'snacks'].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-emerald-800 text-white shadow-2xs'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Produce Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {filteredProducts.map(p => (
                  <div
                    key={p.id}
                    onClick={() => addItemToTicket(p)}
                    className="p-2.5 bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-stone-200 group-hover:scale-105 transition-transform"
                      />
                      <div className="overflow-hidden">
                        <p className="font-extrabold text-xs text-stone-900 leading-tight truncate">{p.name}</p>
                        <p className="text-[10px] text-stone-500 font-mono">{p.spec}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-stone-200 flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-emerald-800">
                        {p.price.toLocaleString()} FRW
                      </span>
                      <span className="w-5 h-5 rounded-full bg-emerald-700 group-hover:bg-emerald-800 text-white flex items-center justify-center text-xs font-bold">
                        +
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right 5 Columns: Sales Ticket & Payment Processor */}
            <div className="lg:col-span-5 p-5 bg-stone-50/50 flex flex-col justify-between max-h-[75vh] overflow-y-auto space-y-4">
              
              <div className="space-y-4">
                {/* Customer Details */}
                <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">Customer Name</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full font-bold text-stone-800 bg-transparent border-b border-stone-300 focus:outline-hidden py-0.5 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase">Phone (MoMo / SMS)</label>
                    <input
                      type="text"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full font-mono font-bold text-stone-800 bg-transparent border-b border-stone-300 focus:outline-hidden py-0.5 text-xs"
                    />
                  </div>
                </div>

                {/* Ticket Item List */}
                <div className="bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs max-h-48 overflow-y-auto space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-stone-400 pb-1 border-b border-stone-100">
                    <span>Item ({ticketItems.length})</span>
                    <span>Qty & Total</span>
                  </div>

                  {ticketItems.length === 0 ? (
                    <p className="text-center text-stone-400 py-6 text-xs">
                      No items in current sale. Tap produce on the left to add.
                    </p>
                  ) : (
                    ticketItems.map(item => (
                      <div key={item.product.id} className="flex items-center justify-between py-1 border-b border-stone-100 last:border-b-0 text-xs">
                        <div className="truncate max-w-40">
                          <p className="font-extrabold text-stone-900 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-stone-400 font-mono">
                            {item.product.price.toLocaleString()} FRW / {item.product.spec}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex items-center bg-stone-100 rounded-lg border border-stone-200 p-0.5">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-xs">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-5 h-5 flex items-center justify-center text-stone-600 hover:bg-white rounded cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <span className="font-mono font-bold text-stone-900 w-16 text-right">
                            {(item.product.price * item.quantity).toLocaleString()}
                          </span>

                          <button
                            onClick={() => removeItem(item.product.id)}
                            className="text-stone-300 hover:text-rose-600 cursor-pointer p-0.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotals & Discounts */}
                <div className="bg-white p-3 rounded-2xl border border-stone-200 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">{subtotal.toLocaleString()} FRW</span>
                  </div>
                  <div className="flex justify-between items-center text-stone-600">
                    <span>Discount (FRW):</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={discountFrw}
                      onChange={(e) => setDiscountFrw(Number(e.target.value))}
                      className="w-24 text-right font-mono text-xs border border-stone-300 rounded-lg px-2 py-0.5 focus:outline-emerald-600"
                    />
                  </div>
                  <div className="flex justify-between text-base font-black text-stone-900 pt-1.5 border-t border-stone-200">
                    <span>Total Due:</span>
                    <span className="font-mono text-emerald-800">{grandTotal.toLocaleString()} FRW</span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase mb-1">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('cash')}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        paymentMode === 'cash'
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4" />
                      <span>Cash</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('mtn')}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        paymentMode === 'mtn'
                          ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>MTN MoMo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMode('airtel')}
                      className={`p-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                        paymentMode === 'airtel'
                          ? 'bg-rose-700 text-white border-rose-700 shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Airtel Money</span>
                    </button>
                  </div>
                </div>

                {/* Mode-specific Fields */}
                {paymentMode === 'cash' && (
                  <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950">Cash Tendered (FRW):</span>
                      <input
                        type="number"
                        step="500"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(Number(e.target.value))}
                        className="w-32 text-right font-mono font-bold text-xs bg-white border border-emerald-300 rounded-lg px-2.5 py-1 focus:outline-emerald-600"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-200">
                      <span className="font-extrabold text-stone-700">Change to Return:</span>
                      <span className="font-mono font-black text-sm text-emerald-900">
                        {changeToReturn.toLocaleString()} FRW
                      </span>
                    </div>
                  </div>
                )}

                {(paymentMode === 'mtn' || paymentMode === 'airtel') && (
                  <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950">
                        {paymentMode === 'mtn' ? 'MTN MoMo (*182#)' : 'Airtel Money (*175#)'}:
                      </span>
                      <button
                        type="button"
                        onClick={handleSendUssd}
                        className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg font-bold cursor-pointer"
                      >
                        {momoUssdSent ? 'USSD Sent ✓' : 'Send Push Prompt'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-600">
                      <span>Transaction Ref:</span>
                      <span className="font-mono font-bold text-stone-900">{momoTxId}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Complete & Issue Receipt Button */}
              <button
                type="button"
                disabled={ticketItems.length === 0 || isProcessing}
                onClick={handleCompleteSale}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>
                  {isProcessing ? 'Processing Transaction...' : `Complete Sale & Issue Receipt (${grandTotal.toLocaleString()} FRW)`}
                </span>
              </button>

            </div>

          </div>
        ) : (
          /* Tab 2: Sales History */
          <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-700">
                Processed Sales Receipts & Transaction Confirmations ({receiptsHistory.length})
              </h3>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                  <tr>
                    <th className="py-2.5 px-4">Receipt #</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Total Paid</th>
                    <th className="py-2.5 px-3">Payment</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {receiptsHistory.map(r => (
                    <tr key={r.receiptNumber} className="hover:bg-emerald-50/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-emerald-900">{r.receiptNumber}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-800">{r.customerName}</td>
                      <td className="py-2.5 px-3 text-stone-600">{r.items.length} items</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{r.total.toLocaleString()} FRW</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md font-bold text-[10px] uppercase bg-stone-100 text-stone-700">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-stone-400 font-mono">{r.issuedAt}</td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => onViewReceipt(r)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-100 text-emerald-900 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          View / Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
