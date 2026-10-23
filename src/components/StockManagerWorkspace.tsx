import React, { useState } from 'react';
import { 
  X, 
  Package, 
  PlusCircle, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle2, 
  Bell, 
  Search, 
  Filter, 
  Calendar, 
  Truck, 
  Layers, 
  Clock, 
  Sparkles,
  ArrowDownCircle,
  ShieldAlert,
  Tag,
  RefreshCw,
  Send,
  Boxes
} from 'lucide-react';
import { Product, StockInBatch, DamagedStockItem, StockAlert } from '../types';

interface StockManagerWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onUpdateProductStock: (productId: number, newStock: boolean, newQuantity?: number) => void;
  stockBatches: StockInBatch[];
  onAddStockBatch: (batch: StockInBatch) => void;
  damagedItems: DamagedStockItem[];
  onAddDamagedItem: (item: DamagedStockItem) => void;
  stockAlerts: StockAlert[];
  onNotifyManager: (alert: StockAlert) => void;
  managerName?: string;
}

export const StockManagerWorkspace: React.FC<StockManagerWorkspaceProps> = ({
  isOpen,
  onClose,
  products,
  onUpdateProductStock,
  stockBatches,
  onAddStockBatch,
  damagedItems,
  onAddDamagedItem,
  stockAlerts,
  onNotifyManager,
  managerName = 'Florentine Mushimiyimana (Admin)'
}) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'receive' | 'damaged' | 'alerts'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Receive stock form state
  const [selectedProductId, setSelectedProductId] = useState<number>(products[0]?.id || 1);
  const [supplierName, setSupplierName] = useState('Abakundakurima Cooperative (Bugesera)');
  const [quantityReceived, setQuantityReceived] = useState<number>(50);
  const [unitCostFrw, setUnitCostFrw] = useState<number>(2000);
  const [sellingPriceFrw, setSellingPriceFrw] = useState<number>(3000);
  const [batchNumber, setBatchNumber] = useState(`RW-BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [receivingNotes, setReceivingNotes] = useState('');
  const [receiveSuccess, setReceiveSuccess] = useState(false);

  // Damaged stock form state
  const [damagedProductId, setDamagedProductId] = useState<number>(products[0]?.id || 1);
  const [damagedQty, setDamagedQty] = useState<number>(2);
  const [damageReason, setDamageReason] = useState<DamagedStockItem['reason']>('spoilage_rot');
  const [damageAction, setDamageAction] = useState<DamagedStockItem['actionTaken']>('discounted_clearance');
  const [damageNotes, setDamageNotes] = useState('');
  const [damageSuccess, setDamageSuccess] = useState(false);

  // Low stock notification state
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<string[]>([]);
  const [notifySuccessMsg, setNotifySuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.farmer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Handle Receive Stock submit
  const handleReceiveStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);

    const newBatch: StockInBatch = {
      id: `BATCH-${Date.now().toString().slice(-6)}`,
      productId: prod.id,
      productName: prod.name,
      supplier: supplierName,
      quantityReceived,
      unitCostFrw,
      sellingPriceFrw,
      batchNumber,
      receivedDate: new Date().toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      receivedBy: 'Eric Mugisha (Stock Manager)',
      notes: receivingNotes
    };

    onAddStockBatch(newBatch);
    onUpdateProductStock(prod.id, true);

    setReceiveSuccess(true);
    setTimeout(() => {
      setReceiveSuccess(false);
      setBatchNumber(`RW-BATCH-${Math.floor(1000 + Math.random() * 9000)}`);
      setReceivingNotes('');
    }, 2500);
  };

  // Handle Damaged Stock submit
  const handleDamagedStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === damagedProductId);
    if (!prod) return;

    const estimatedCost = Math.round(prod.price * 0.65);
    const loss = damageAction === 'discounted_clearance' 
      ? Math.round(estimatedCost * 0.5 * damagedQty)
      : estimatedCost * damagedQty;

    const newDamaged: DamagedStockItem = {
      id: `DMG-${Date.now().toString().slice(-4)}`,
      productId: prod.id,
      productName: prod.name,
      quantity: damagedQty,
      unitCostFrw: estimatedCost,
      reason: damageReason,
      reportedDate: new Date().toISOString().split('T')[0],
      reportedBy: 'Eric Mugisha (Stock Manager)',
      actionTaken: damageAction,
      lossAmountFrw: loss,
      notes: damageNotes
    };

    onAddDamagedItem(newDamaged);
    setDamageSuccess(true);
    setTimeout(() => {
      setDamageSuccess(false);
      setDamageNotes('');
    }, 2500);
  };

  // Handle Low stock alert notification to Admin
  const handleNotifyManager = (alert: StockAlert) => {
    onNotifyManager(alert);
    setNotifiedAlertIds(prev => [...prev, alert.id]);
    setNotifySuccessMsg(`High-priority restock dispatch sent to ${managerName} for ${alert.productName}!`);
    setTimeout(() => setNotifySuccessMsg(null), 4000);
  };

  // Total calculated loss
  const totalDamagedLoss = damagedItems.reduce((acc, curr) => acc + curr.lossAmountFrw, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Workspace Top Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-800 text-blue-200 px-2 py-0.5 rounded-md">
                  Role 2 • Stock Manager
                </span>
                <span className="text-xs text-blue-300">Eric Mugisha</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Warehouse & Stock Control Center
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-300 bg-blue-900/60 px-3 py-1.5 rounded-xl border border-blue-800 font-medium">
              Kigali Cold-Chain Hub
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-blue-300 hover:text-white hover:bg-blue-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-white text-blue-900 border-stone-300 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-700" />
            <span>1. Current Inventory Levels ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receive')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'receive'
                ? 'bg-white text-blue-900 border-stone-300 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>2. Receive New Stock (Ingest PO)</span>
          </button>

          <button
            onClick={() => setActiveTab('damaged')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'damaged'
                ? 'bg-white text-blue-900 border-stone-300 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>3. Damaged & Spoilage Tracker ({damagedItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'alerts'
                ? 'bg-white text-blue-900 border-stone-300 shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4 text-rose-600" />
            <span>4. Low Stock Alerts & Notify Manager</span>
            {stockAlerts.filter(a => a.status === 'pending').length > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {stockAlerts.filter(a => a.status === 'pending').length}
              </span>
            )}
          </button>
        </div>

        {/* Success toast notification */}
        {notifySuccessMsg && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-6 py-2.5 flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{notifySuccessMsg}</span>
          </div>
        )}

        {/* Tab 1: Current Inventory Levels */}
        {activeTab === 'inventory' && (
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search item, origin, or farm..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-300 rounded-xl text-xs focus:outline-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-stone-600 shrink-0">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-stone-300 rounded-xl text-xs px-2.5 py-1.5 focus:outline-blue-600 text-stone-800 font-medium"
                >
                  <option value="all">All Categories</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="fruits">Fresh Fruits</option>
                  <option value="dairy">Dairy & Eggs</option>
                  <option value="grains">Grains & Honey</option>
                  <option value="meat">Pasture Meats</option>
                  <option value="snacks">Dried Snacks</option>
                </select>
              </div>
            </div>

            {/* Inventory Table */}
            <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 uppercase font-black text-[10px] tracking-wider border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4">Item & Origin</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Price / Spec</th>
                    <th className="py-3 px-3">Stock Status</th>
                    <th className="py-3 px-4 text-right">Quick Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                          <div>
                            <p className="font-extrabold text-stone-900">{p.name}</p>
                            <p className="text-[11px] text-stone-500">{p.farmer} • {p.origin}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-bold uppercase text-[10px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <span className="font-bold text-stone-900">{p.price.toLocaleString()} FRW</span>
                        <span className="text-[10px] text-stone-400 block">{p.spec}</span>
                      </td>
                      <td className="py-3 px-3">
                        {p.inStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => onUpdateProductStock(p.id, !p.inStock)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              p.inStock
                                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                                : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                            }`}
                          >
                            {p.inStock ? 'Mark Out of Stock' : 'Restock Item'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* Tab 2: Receive New Stock (Ingest PO) */}
        {activeTab === 'receive' && (
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200">
              <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700" />
                Receiving Dock • Ingest Harvest Batch & Supplier PO
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Record newly arrived farm produce, verify Rwandan cooperative source, and update digital inventory.
              </p>
            </div>

            {receiveSuccess && (
              <div className="p-4 bg-emerald-600 text-white rounded-2xl flex items-center gap-2 font-bold text-xs animate-in zoom-in-95">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Batch {batchNumber} recorded successfully! Inventory levels increased.</span>
              </div>
            )}

            <form onSubmit={handleReceiveStockSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs">
              
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Select Produce Item</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setSelectedProductId(id);
                    const prod = products.find(p => p.id === id);
                    if (prod) {
                      setSellingPriceFrw(prod.price);
                      setUnitCostFrw(Math.round(prod.price * 0.65));
                      setSupplierName(prod.farmer || 'Rwandan Cooperative');
                    }
                  }}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium focus:outline-blue-600"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.spec}) - Current: {p.price.toLocaleString()} FRW
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Cooperative / Farm Supplier</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Abakundakurima Cooperative (Bugesera)"
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Quantity Received (units/kg)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Unit Cost Price (FRW / unit)</label>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={unitCostFrw}
                  onChange={(e) => setUnitCostFrw(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Batch / Lot Tracking Number</label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Shelf Life / Expiration Window</label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium focus:outline-blue-600"
                >
                  <option value={3}>3 Days (Highly perishable berries/greens)</option>
                  <option value={7}>7 Days (Tomatoes, avocados, carrots)</option>
                  <option value={14}>14 Days (Pineapples, citrus, squash)</option>
                  <option value={30}>30 Days (Eggs, sealed honey, dry grains)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-stone-700 mb-1">Inspection Notes & RSB Quality Check</label>
                <textarea
                  rows={2}
                  value={receivingNotes}
                  onChange={(e) => setReceivingNotes(e.target.value)}
                  placeholder="Produce inspected: zero rot, firm skin, natural mountain aroma, clean crates..."
                  className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-blue-600"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Receipt & Update Inventory Catalog</span>
                </button>
              </div>

            </form>

            {/* Recent Batches Received */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                Recent Ingested Batches ({stockBatches.length})
              </h4>
              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Batch #</th>
                      <th className="py-2.5 px-3">Produce</th>
                      <th className="py-2.5 px-3">Supplier</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Cost</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stockBatches.map((b) => (
                      <tr key={b.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-900">{b.batchNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{b.productName}</td>
                        <td className="py-2.5 px-3 text-stone-600 truncate max-w-44">{b.supplier}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-800">+{b.quantityReceived}</td>
                        <td className="py-2.5 px-3 font-mono text-stone-700">{b.unitCostFrw.toLocaleString()} FRW</td>
                        <td className="py-2.5 px-3 text-stone-500 font-mono">{b.expiryDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 3: Damaged Stock & Spoilage Tracker */}
        {activeTab === 'damaged' && (
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">Total Damaged Recorded</p>
                <p className="text-xl font-black text-amber-950 mt-1">{damagedItems.length} Incidents</p>
              </div>
              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">Net Spoilage Loss (FRW)</p>
                <p className="text-xl font-black text-rose-950 mt-1">{totalDamagedLoss.toLocaleString()} FRW</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Clearance Salvaged</p>
                <p className="text-xl font-black text-emerald-950 mt-1">
                  {damagedItems.filter(i => i.actionTaken === 'discounted_clearance').length} Rescued
                </p>
              </div>
            </div>

            {/* Log Damaged Produce Form */}
            <form onSubmit={handleDamagedStockSubmit} className="bg-stone-50 p-5 rounded-2xl border border-stone-200 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Record Damaged Stock or Items Nearing Spoilage
              </h3>

              {damageSuccess && (
                <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Damaged stock entry recorded and updated in financial loss ledger.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Select Affected Item</label>
                  <select
                    value={damagedProductId}
                    onChange={(e) => setDamagedProductId(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.spec})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Quantity Affected</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Number(e.target.value))}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Damage / Spoilage Reason</label>
                  <select
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                  >
                    <option value="spoilage_rot">Natural Spoilage / Mold</option>
                    <option value="damaged_in_transit">Transit Bruise / Crushed</option>
                    <option value="expired">Expired Past Shelf Life</option>
                    <option value="bruised">Overripe Softness</option>
                    <option value="pest_blemish">Pest Blemish</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Corrective Action Taken</label>
                  <select
                    value={damageAction}
                    onChange={(e) => setDamageAction(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                  >
                    <option value="discounted_clearance">Sell on 50% Quick Clearance (Reduce Waste)</option>
                    <option value="composted">Safely Composted for Organic Fertilizer</option>
                    <option value="disposed">Disposed / Incinerated</option>
                    <option value="supplier_claim">Returned to Cooperative Supplier Claim</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">Condition Observation Notes</label>
                  <input
                    type="text"
                    value={damageNotes}
                    onChange={(e) => setDamageNotes(e.target.value)}
                    placeholder="e.g. 2 ripe papayas crushed in bottom crate during delivery"
                    className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Log Spoilage Incident & Update Inventory Count</span>
              </button>
            </form>

            {/* Damaged Stock Ledger Table */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 mb-2">
                Damaged Stock Ledger ({damagedItems.length})
              </h4>
              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-3">Produce</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3">Action Taken</th>
                      <th className="py-2.5 px-3">Loss (FRW)</th>
                      <th className="py-2.5 px-3">Reported Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {damagedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{item.productName}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-700">-{item.quantity}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                            {item.reason.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-600 capitalize">
                          {item.actionTaken.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-rose-800">
                          {item.lossAmountFrw.toLocaleString()} FRW
                        </td>
                        <td className="py-2.5 px-3 text-stone-400 font-mono">{item.reportedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Low Stock Alerts & Notify Manager */}
        {activeTab === 'alerts' && (
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
            
            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200">
              <h3 className="text-sm font-extrabold text-rose-950 flex items-center gap-2">
                <Bell className="w-4 h-4 text-rose-700" />
                Low Stock Threshold Monitor & Manager Dispatch
              </h3>
              <p className="text-xs text-rose-800 mt-1">
                Automated stock monitoring triggers alerts when produce drops below minimum safety threshold.
                Stock Managers can notify the System Administrator / General Manager with one click.
              </p>
            </div>

            <div className="space-y-3">
              {stockAlerts.map((alert) => {
                const isNotified = notifiedAlertIds.includes(alert.id) || alert.status === 'reordered';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-50/70 border-rose-300'
                        : 'bg-amber-50/70 border-amber-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        alert.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                      }`}>
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-stone-900 text-sm">{alert.productName}</h4>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            alert.severity === 'critical' ? 'bg-rose-200 text-rose-950' : 'bg-amber-200 text-amber-950'
                          }`}>
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-stone-600 mt-0.5">
                          Current Stock: <strong className="text-stone-900 font-mono">{alert.currentStock} units</strong> • Threshold: <span className="font-mono">{alert.threshold} units</span>
                        </p>
                        <p className="text-[10px] text-stone-400 mt-0.5">Alert Triggered: {alert.dateNotified}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {isNotified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Manager Notified
                        </span>
                      ) : (
                        <button
                          onClick={() => handleNotifyManager(alert)}
                          className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Notify General Manager</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
