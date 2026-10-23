import React, { useState } from 'react';
import { 
  X, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Plus, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Banknote, 
  PieChart, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Search,
  Scale
} from 'lucide-react';
import { Product, FinancialRecord, ProfitAndLossReport, SalesReceipt } from '../types';

interface AccountantWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  financialRecords: FinancialRecord[];
  onAddFinancialRecord: (record: FinancialRecord) => void;
  receipts: SalesReceipt[];
  accountantName?: string;
}

export const AccountantWorkspace: React.FC<AccountantWorkspaceProps> = ({
  isOpen,
  onClose,
  products,
  financialRecords,
  onAddFinancialRecord,
  receipts,
  accountantName = 'Aimee Mukamana'
}) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'ledger' | 'margins' | 'reports'>('pnl');
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('month');

  // Ledger filter
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // New Transaction Form State
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [newType, setNewType] = useState<'income' | 'expense'>('expense');
  const [newCategory, setNewCategory] = useState<FinancialRecord['category']>('inventory_purchase');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState<number>(50000);
  const [newPaymentMethod, setNewPaymentMethod] = useState<'cash' | 'mtn' | 'airtel' | 'card'>('mtn');
  const [newReference, setNewReference] = useState(`REF-${Date.now().toString().slice(-5)}`);
  const [recordSuccess, setRecordSuccess] = useState(false);

  if (!isOpen) return null;

  // Real-time P&L Calculations
  const totalSalesRevenue = financialRecords
    .filter(r => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const inventoryPurchases = financialRecords
    .filter(r => r.type === 'expense' && (r.category === 'inventory_purchase' || r.category === 'farmer_payout'))
    .reduce((sum, r) => sum + r.amount, 0);

  const spoilageLosses = financialRecords
    .filter(r => r.type === 'expense' && r.category === 'spoilage_loss')
    .reduce((sum, r) => sum + r.amount, 0);

  const operatingExpenses = financialRecords
    .filter(r => r.type === 'expense' && r.category !== 'inventory_purchase' && r.category !== 'farmer_payout' && r.category !== 'spoilage_loss')
    .reduce((sum, r) => sum + r.amount, 0);

  const grossProfit = totalSalesRevenue - inventoryPurchases;
  const grossMarginPercent = totalSalesRevenue > 0 ? Math.round((grossProfit / totalSalesRevenue) * 100) : 0;
  const netProfit = grossProfit - operatingExpenses - spoilageLosses;
  const netMarginPercent = totalSalesRevenue > 0 ? Math.round((netProfit / totalSalesRevenue) * 100) : 0;

  // Handle new record submit
  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim() || newAmount <= 0) return;

    const record: FinancialRecord = {
      id: `FIN-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      type: newType,
      category: newCategory,
      description: newDesc,
      amount: newAmount,
      paymentMethod: newPaymentMethod,
      reference: newReference,
      recordedBy: `${accountantName} (Accountant)`
    };

    onAddFinancialRecord(record);
    setRecordSuccess(true);
    setTimeout(() => {
      setRecordSuccess(false);
      setIsAddRecordOpen(false);
      setNewDesc('');
      setNewReference(`REF-${Date.now().toString().slice(-5)}`);
    }, 1500);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (FRW)', 'Payment Method', 'Reference', 'Recorded By'];
    const rows = financialRecords.map(r => [
      r.id,
      r.date,
      r.type.toUpperCase(),
      r.category,
      `"${r.description.replace(/"/g, '""')}"`,
      r.amount,
      r.paymentMethod.toUpperCase(),
      r.reference,
      `"${r.recordedBy}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fofogreen_financial_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAudit = () => {
    window.print();
  };

  // Filtered records
  const filteredRecords = financialRecords.filter(r => {
    const matchesType = ledgerTypeFilter === 'all' || r.type === ledgerTypeFilter;
    const matchesSearch = r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-teal-950 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-teal-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-400/40 text-teal-300 flex items-center justify-center">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-teal-800 text-teal-200 px-2 py-0.5 rounded-md">
                  Role 5 • Accountant
                </span>
                <span className="text-xs text-teal-300">{accountantName}</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight">
                Finance, Ledger & Profit Reports
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-teal-900 hover:bg-teal-800 text-teal-200 hover:text-white rounded-xl text-xs font-bold border border-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrintAudit}
              className="px-3 py-1.5 bg-teal-900 hover:bg-teal-800 text-teal-200 hover:text-white rounded-xl text-xs font-bold border border-teal-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-teal-300 hover:text-white hover:bg-teal-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'pnl' ? 'bg-white text-teal-950 border-stone-300 shadow-2xs' : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <PieChart className="w-4 h-4 text-teal-700" />
            <span>1. Profit & Loss (P&L) Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'ledger' ? 'bg-white text-teal-950 border-stone-300 shadow-2xs' : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>2. Income & Expenditures Ledger ({financialRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('margins')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-t border-x flex items-center gap-2 cursor-pointer ${
              activeTab === 'margins' ? 'bg-white text-teal-950 border-stone-300 shadow-2xs' : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-blue-700" />
            <span>3. Purchase vs Selling Margins ({products.length})</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 max-h-[72vh] overflow-y-auto space-y-6">
          
          {/* Top KPI Cards (Common) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Gross Sales Revenue</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-emerald-950 mt-1 font-mono">
                {totalSalesRevenue.toLocaleString()} FRW
              </p>
              <p className="text-[10px] text-emerald-800 mt-0.5">Cash + MoMo verified deposits</p>
            </div>

            <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200">
              <div className="flex items-center justify-between text-stone-600">
                <span className="text-[10px] font-black uppercase tracking-wider">Cost of Goods (COGS)</span>
                <ArrowDownRight className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-stone-900 mt-1 font-mono">
                {inventoryPurchases.toLocaleString()} FRW
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5">Direct farm & coop harvest costs</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
              <div className="flex items-center justify-between text-blue-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Gross Profit Margin</span>
                <span className="text-xs font-mono font-bold">{grossMarginPercent}%</span>
              </div>
              <p className="text-xl font-black text-blue-950 mt-1 font-mono">
                {grossProfit.toLocaleString()} FRW
              </p>
              <p className="text-[10px] text-blue-800 mt-0.5">Revenue minus farm cost</p>
            </div>

            <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
              <div className="flex items-center justify-between text-teal-700">
                <span className="text-[10px] font-black uppercase tracking-wider">Net Operating Profit</span>
                <span className="text-xs font-mono font-bold text-teal-800">{netMarginPercent}% Net</span>
              </div>
              <p className="text-xl font-black text-teal-950 mt-1 font-mono">
                {netProfit.toLocaleString()} FRW
              </p>
              <p className="text-[10px] text-teal-800 mt-0.5">After OpEx & spoilage deductions</p>
            </div>
          </div>

          {/* Tab 1: P&L Statement */}
          {activeTab === 'pnl' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div>
                    <h3 className="font-extrabold text-sm text-stone-900">
                      Standardized Statement of Profit and Loss (P&L)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Fofo Green Rwanda Ltd. • Audited Period: Current Fiscal Month
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-teal-100 text-teal-900 px-3 py-1 rounded-full">
                    Currency: Rwandan Franc (FRW)
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 font-bold text-stone-900 bg-stone-50 px-3 rounded-lg">
                    <span>1. OPERATING REVENUE</span>
                    <span className="font-mono">{totalSalesRevenue.toLocaleString()} FRW</span>
                  </div>
                  <div className="pl-6 flex justify-between py-1 text-stone-600">
                    <span>• Cash Register Sales:</span>
                    <span className="font-mono">
                      {financialRecords.filter(r => r.category === 'pos_cash_sale').reduce((s, r) => s + r.amount, 0).toLocaleString()} FRW
                    </span>
                  </div>
                  <div className="pl-6 flex justify-between py-1 text-stone-600">
                    <span>• Mobile Money Settlements (MTN/Airtel):</span>
                    <span className="font-mono">
                      {financialRecords.filter(r => r.category === 'momo_sale').reduce((s, r) => s + r.amount, 0).toLocaleString()} FRW
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 font-bold text-stone-900 bg-stone-50 px-3 rounded-lg mt-2">
                    <span>2. COST OF GOODS SOLD (COGS)</span>
                    <span className="font-mono text-rose-800">({inventoryPurchases.toLocaleString()} FRW)</span>
                  </div>
                  <div className="pl-6 flex justify-between py-1 text-stone-600">
                    <span>• Harvest payments to agricultural cooperatives:</span>
                    <span className="font-mono">{inventoryPurchases.toLocaleString()} FRW</span>
                  </div>

                  <div className="flex justify-between py-2 font-black text-sm text-blue-900 bg-blue-50/80 px-3 rounded-xl border border-blue-200">
                    <span>GROSS PROFIT:</span>
                    <span className="font-mono">{grossProfit.toLocaleString()} FRW ({grossMarginPercent}%)</span>
                  </div>

                  <div className="flex justify-between py-1.5 font-bold text-stone-900 bg-stone-50 px-3 rounded-lg mt-3">
                    <span>3. OPERATING EXPENDITURES (OPEX)</span>
                    <span className="font-mono text-rose-800">({operatingExpenses.toLocaleString()} FRW)</span>
                  </div>
                  <div className="pl-6 flex justify-between py-1 text-stone-600">
                    <span>• Logistics, Dispatch & Motorcycle Fuel:</span>
                    <span className="font-mono">
                      {financialRecords.filter(r => r.category === 'logistics_fuel').reduce((s, r) => s + r.amount, 0).toLocaleString()} FRW
                    </span>
                  </div>
                  <div className="pl-6 flex justify-between py-1 text-stone-600">
                    <span>• Biodegradable Eco-Packaging & Crates:</span>
                    <span className="font-mono">
                      {financialRecords.filter(r => r.category === 'packaging').reduce((s, r) => s + r.amount, 0).toLocaleString()} FRW
                    </span>
                  </div>

                  <div className="flex justify-between py-1.5 font-bold text-stone-900 bg-stone-50 px-3 rounded-lg mt-2">
                    <span>4. SPOILAGE & DAMAGED STOCK LOSSES</span>
                    <span className="font-mono text-rose-800">({spoilageLosses.toLocaleString()} FRW)</span>
                  </div>

                  <div className="flex justify-between py-3 font-black text-base text-teal-950 bg-teal-100/90 px-4 rounded-xl border border-teal-300 mt-4 shadow-2xs">
                    <span>NET OPERATING PROFIT:</span>
                    <span className="font-mono text-teal-900">{netProfit.toLocaleString()} FRW ({netMarginPercent}% Net Margin)</span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Income & Expenditures Ledger */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              
              {/* Ledger Action Header */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search description, reference..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-teal-600"
                    />
                  </div>

                  <div className="flex gap-1 text-xs shrink-0">
                    <button
                      onClick={() => setLedgerTypeFilter('all')}
                      className={`px-2.5 py-1 rounded-xl font-bold ${ledgerTypeFilter === 'all' ? 'bg-teal-800 text-white' : 'bg-white border text-stone-600'}`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('income')}
                      className={`px-2.5 py-1 rounded-xl font-bold ${ledgerTypeFilter === 'income' ? 'bg-emerald-700 text-white' : 'bg-white border text-stone-600'}`}
                    >
                      Income
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('expense')}
                      className={`px-2.5 py-1 rounded-xl font-bold ${ledgerTypeFilter === 'expense' ? 'bg-rose-700 text-white' : 'bg-white border text-stone-600'}`}
                    >
                      Expense
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddRecordOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Transaction</span>
                </button>
              </div>

              {/* Add Transaction Modal/Card */}
              {isAddRecordOpen && (
                <form onSubmit={handleAddRecordSubmit} className="bg-white p-5 rounded-2xl border border-teal-200 shadow-md space-y-3 animate-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-teal-900">
                      Record Income or Expenditure Voucher
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddRecordOpen(false)}
                      className="text-stone-400 hover:text-stone-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {recordSuccess && (
                    <div className="p-3 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Financial ledger voucher recorded!</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Transaction Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-bold"
                      >
                        <option value="expense">Expense (Outgoing Payment)</option>
                        <option value="income">Income (Incoming Revenue)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Category</label>
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value as any)}
                        className="w-full text-xs p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                      >
                        <option value="inventory_purchase">Inventory Purchase (Cooperative harvest)</option>
                        <option value="farmer_payout">Direct Farmer Payout</option>
                        <option value="logistics_fuel">Logistics & Delivery Fuel</option>
                        <option value="packaging">Eco-Packaging & Crates</option>
                        <option value="utilities">Cold Storage Utilities</option>
                        <option value="wages">Staff Wages & Allowances</option>
                        <option value="spoilage_loss">Spoilage Write-Off</option>
                        <option value="pos_cash_sale">POS Cash Sales</option>
                        <option value="momo_sale">Mobile Money Settlement</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Amount (FRW)</label>
                      <input
                        type="number"
                        min="100"
                        step="500"
                        required
                        value={newAmount}
                        onChange={(e) => setNewAmount(Number(e.target.value))}
                        className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Description / Memo</label>
                      <input
                        type="text"
                        required
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        placeholder="e.g. Fuel receipt for motorcycle dispatch #2"
                        className="w-full text-xs p-2.5 border border-stone-300 rounded-xl focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">Reference / Voucher No.</label>
                      <input
                        type="text"
                        required
                        value={newReference}
                        onChange={(e) => setNewReference(e.target.value)}
                        className="w-full text-xs p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-teal-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to Official General Ledger</span>
                  </button>
                </form>
              )}

              {/* Ledger Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4">Date & Ref</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Method</th>
                      <th className="py-2.5 px-3">Amount (FRW)</th>
                      <th className="py-2.5 px-4 text-right">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-stone-50">
                        <td className="py-2.5 px-4">
                          <p className="font-mono font-bold text-stone-800">{r.reference}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{r.date}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            r.type === 'income' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                          }`}>
                            {r.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 font-medium max-w-64 truncate">
                          {r.description}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-stone-500 font-bold text-[10px]">
                          {r.paymentMethod}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          <span className={r.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}>
                            {r.type === 'income' ? '+' : '-'}{r.amount.toLocaleString()} FRW
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-stone-400 text-[11px]">
                          {r.recordedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Tab 3: Purchase vs Selling Margins */}
          {activeTab === 'margins' && (
            <div className="space-y-4">
              <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200">
                <h3 className="text-sm font-extrabold text-blue-950 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-700" />
                  Product Margin & Markup Health Analysis
                </h3>
                <p className="text-xs text-blue-800 mt-1">
                  Monitoring wholesale purchase cost from Rwandan cooperatives vs retail selling prices to ensure healthy gross margins.
                </p>
              </div>

              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 text-stone-500 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4">Produce Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Est. Purchase Cost</th>
                      <th className="py-2.5 px-3">Retail Selling Price</th>
                      <th className="py-2.5 px-3">Gross Unit Margin</th>
                      <th className="py-2.5 px-3">Markup %</th>
                      <th className="py-2.5 px-4 text-right">Margin Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.map(p => {
                      const cost = Math.round(p.price * 0.65);
                      const unitMargin = p.price - cost;
                      const markupPct = Math.round((unitMargin / cost) * 100);
                      const isHealthy = markupPct >= 35;

                      return (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-4 font-bold text-stone-900">{p.name}</td>
                          <td className="py-2.5 px-3 capitalize text-stone-500">{p.category}</td>
                          <td className="py-2.5 px-3 font-mono text-stone-600">{cost.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{p.price.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">+{unitMargin.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-3 font-mono font-extrabold text-blue-900">{markupPct}%</td>
                          <td className="py-2.5 px-4 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isHealthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                            }`}>
                              {isHealthy ? 'Healthy Margin' : 'Review Pricing'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
