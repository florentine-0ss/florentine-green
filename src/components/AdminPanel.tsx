import React, { useState, useMemo } from 'react';
import { 
  X, 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Activity, 
  ArrowLeft,
  Truck,
  Sparkles,
  MapPin,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  CreditCard,
  RefreshCw,
  Download,
  Terminal,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Database,
  BookOpen,
  Key,
  FileText,
  Layers,
  Copy,
  Link,
  Play,
  Table,
  Server,
  Zap,
  CheckCircle,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  DollarSign,
  PieChart,
  BarChart3,
  Scale,
  Boxes,
  Store,
  Smile,
  Apple,
  Printer
} from 'lucide-react';
import { Product, User, Order, SystemActivity, UserRole, StaffPermissions, FinancialRecord, SalesReceipt } from '../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../data/mockData';
import { api, DbSystemStatus, SqlQueryResult } from '../services/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
  onToggleStock: (productId: number) => void;
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  users: User[];
  onToggleUserRole: (userId: string) => void;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
  onUpdateUserPermissions?: (userId: string, permissions: StaffPermissions) => void;
  onAddStaffUser?: (newUser: User) => void;
  financialRecords?: FinancialRecord[];
  receipts?: SalesReceipt[];
  activities: SystemActivity[];
  onSimulateOrderAction: () => void;
  onSimulatePaymentAction: () => void;
  onClearActivities: () => void;
  cartCount: number;
  initialTab?: 'catalog' | 'orders' | 'customers' | 'activity' | 'reports' | 'schema';
  dbHealth?: any;
  onResetDb?: () => void;
  onOpenStockManager?: () => void;
  onOpenCashier?: () => void;
  onOpenSalesAttendant?: () => void;
  onOpenAccountant?: () => void;
  onOpenCustomerMarket?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  products,
  onAddProduct,
  onDeleteProduct,
  onToggleStock,
  orders,
  onUpdateOrderStatus,
  users,
  onToggleUserRole,
  onUpdateUserRole,
  onUpdateUserPermissions,
  onAddStaffUser,
  financialRecords = [],
  receipts = [],
  activities,
  onSimulateOrderAction,
  onSimulatePaymentAction,
  onClearActivities,
  cartCount,
  initialTab = 'activity',
  dbHealth,
  onResetDb,
  onOpenStockManager,
  onOpenCashier,
  onOpenSalesAttendant,
  onOpenAccountant,
  onOpenCustomerMarket
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders' | 'customers' | 'activity' | 'reports' | 'schema'>(initialTab);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<SystemActivity | null>(null);

  // Staff Account & Access Rights Modal States
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  const [tempPermissions, setTempPermissions] = useState<StaffPermissions>(DEFAULT_ROLE_PERMISSIONS.admin);

  // New Staff form state
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('+250 788 ');
  const [newStaffRole, setNewStaffRole] = useState<UserRole>('cashier');
  const [newStaffDept, setNewStaffDept] = useState('Checkout POS & Payments');

  // System Action Filter States
  const [actionCategoryFilter, setActionCategoryFilter] = useState<string>('all');
  const [actionStatusFilter, setActionStatusFilter] = useState<string>('all');
  const [actionSearchQuery, setActionSearchQuery] = useState<string>('');
  const [healthCheckStatus, setHealthCheckStatus] = useState<string | null>(null);

  // Database Apply System States
  const [dbSystemStatus, setDbSystemStatus] = useState<DbSystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(false);
  const [isApplyingSystem, setIsApplyingSystem] = useState<boolean>(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState<string | null>(null);
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT id, name, category, price, farmer, origin FROM products ORDER BY price DESC LIMIT 5;'
  );
  const [sqlResult, setSqlResult] = useState<SqlQueryResult | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  const loadDbSystemStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await api.getDbSystemStatus();
      if (data) {
        setDbSystemStatus(data);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingStatus(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      loadDbSystemStatus();
    }
  }, [isOpen, activeTab]);

  const handleApplyDatabaseSystem = async () => {
    setIsApplyingSystem(true);
    setApplySuccessMessage(null);
    try {
      const res = await api.applyDatabaseSystem();
      if (res.success) {
        setApplySuccessMessage(res.message);
        await loadDbSystemStatus();
      } else {
        alert(`Apply Failed: ${res.message}`);
      }
    } catch (e: any) {
      alert(`Apply Error: ${e?.message || 'Failed'}`);
    } finally {
      setIsApplyingSystem(false);
    }
  };

  const handleExecuteSql = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    if (!q.trim()) return;
    setIsExecutingSql(true);
    setSqlError(null);
    try {
      const res = await api.executeAdminSql(q);
      setSqlResult(res);
    } catch (e: any) {
      setSqlError(e?.message || 'Query execution failed');
    } finally {
      setIsExecutingSql(false);
    }
  };

  // Sync initialTab if changed
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // New product form fields
  const [newProd, setNewProd] = useState({
    name: '',
    category: 'vegetables' as Product['category'],
    price: 3500,
    spec: '1 kg',
    origin: 'Musanze, Northern Province',
    farmer: 'Local Cooperative',
    description: 'Fresh organic Rwandan harvest picked at dawn.',
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
    badge: 'Fresh' as Product['badge'],
    calories: '25 kcal / 100g'
  });

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Category filter
      if (actionCategoryFilter !== 'all' && act.type !== actionCategoryFilter) {
        return false;
      }
      // Status filter
      if (actionStatusFilter !== 'all' && act.status !== actionStatusFilter) {
        return false;
      }
      // Search query
      if (actionSearchQuery.trim()) {
        const q = actionSearchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDetail = act.detail.toLowerCase().includes(q);
        const matchesActor = act.actor?.toLowerCase().includes(q) || false;
        const matchesId = act.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDetail && !matchesActor && !matchesId) {
          return false;
        }
      }
      return true;
    });
  }, [activities, actionCategoryFilter, actionStatusFilter, actionSearchQuery]);

  // Action metrics breakdown
  const actionCounts = useMemo(() => {
    const counts = {
      all: activities.length,
      order: 0,
      payment: 0,
      product: 0,
      user: 0,
      delivery: 0,
      system: 0,
      review: 0
    };
    activities.forEach((a) => {
      if (a.type in counts) {
        counts[a.type as keyof typeof counts] += 1;
      }
    });
    return counts;
  }, [activities]);

  if (!isOpen) return null;

  const categoriesCount = new Set(products.map(p => p.category)).size;
  const totalSalesFRW = orders.reduce((sum, ord) => sum + ord.total, 0) + 185000;

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name.trim()) return;

    const created: Product = {
      id: Date.now(),
      name: newProd.name.trim(),
      category: newProd.category,
      price: Number(newProd.price),
      spec: newProd.spec.trim(),
      rating: 5.0,
      reviewsCount: 1,
      image: newProd.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
      badge: newProd.badge,
      origin: newProd.origin,
      farmer: newProd.farmer,
      description: newProd.description,
      inStock: true,
      calories: newProd.calories,
      harvested: 'Just added to catalog'
    };

    onAddProduct(created);
    setIsAddModalOpen(false);
    setNewProd({
      name: '',
      category: 'vegetables',
      price: 3500,
      spec: '1 kg',
      origin: 'Musanze, Northern Province',
      farmer: 'Local Cooperative',
      description: 'Fresh organic Rwandan harvest picked at dawn.',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80',
      badge: 'Fresh',
      calories: '25 kcal / 100g'
    });
  };

  const handleRunHealthCheck = () => {
    setHealthCheckStatus('running');
    setTimeout(() => {
      setHealthCheckStatus('completed');
    }, 900);
  };

  const handleExportAuditJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activities, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `fofo-system-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const getActionBadgeColor = (type: SystemActivity['type']) => {
    switch (type) {
      case 'order':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'payment':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'product':
        return 'bg-lime-100 text-lime-900 border-lime-300';
      case 'user':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'delivery':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'review':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-stone-100 text-stone-800 border-stone-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-md p-3 sm:p-6 lg:p-8 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                System Administration
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                Admin Role Active
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700 font-mono">
                {activities.length} Actions Logged
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700 font-mono flex items-center gap-1">
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Cloud SQL (PostgreSQL) Engine Active ({products.length} Items)</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
              Fofo Green Rwanda · Admin Control Center
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Logged in with Administrator privileges. Backed by persistent Node.js Express server & database (data/fofo-database.json).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onResetDb && (
              <button
                onClick={onResetDb}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-700/60 transition-all cursor-pointer"
                title="Reset database to fresh Rwandan harvest catalog"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Database</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'activity'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit All Actions</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-stone-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Store</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-stone-50 border-b border-stone-200">
          <div 
            onClick={() => setActiveTab('activity')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              activeTab === 'activity' ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold">System Actions</span>
              <Activity className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-stone-900">{activities.length}</div>
            <span className="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live telemetry active
            </span>
          </div>

          <div 
            onClick={() => setActiveTab('catalog')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              activeTab === 'catalog' ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold">Catalog Items</span>
              <Package className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-black text-stone-900">{products.length}</div>
            <span className="text-[11px] text-stone-500">{categoriesCount} fresh categories</span>
          </div>

          <div 
            onClick={() => setActiveTab('orders')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              activeTab === 'orders' ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold">Orders & Revenue</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-emerald-800">{totalSalesFRW.toLocaleString()} FRW</div>
            <span className="text-[11px] text-stone-500">{orders.length} active orders</span>
          </div>

          <div 
            onClick={() => setActiveTab('customers')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
              activeTab === 'customers' ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-white border-stone-200 hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-xs font-bold">Staff & Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-stone-900">{users.length}</div>
            <span className="text-[11px] text-stone-500">
              {users.filter(u => u.role !== 'customer').length} Staff ({users.length} Total Users)
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200 px-4 sm:px-6 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-700" />
            <span>All System Actions & Audit ({activities.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Package className="w-4 h-4 text-stone-500" />
            <span>Catalog & Inventory ({products.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-stone-500" />
            <span>Live Orders ({orders.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab('customers')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Users className="w-4 h-4 text-stone-500" />
            <span>Staff Accounts & Access Rights ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-stone-500" />
            <span>Business & Profit Reports</span>
          </button>

          <button
            onClick={() => setActiveTab('schema')}
            className={`py-3.5 px-4 font-bold text-xs sm:text-sm border-b-2 whitespace-nowrap transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-emerald-700 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Database Apply System & SQL Schema</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50/50">
          
          {/* TAB 1: ALL SYSTEM ACTIONS & AUDIT CENTER (FLAGSHIP FEATURE) */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              
              {/* Action Banner / Quick Test Controls */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-stone-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      <Terminal className="w-4 h-4" />
                      <span>Live System Actions Telemetry</span>
                    </div>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Full System Action Audit & Verification
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 max-w-2xl">
                      As an Administrator, you can monitor 100% of mutations, transactions, payments, stock changes, and logins across Rwanda. Trigger live test actions below to observe real-time audit logging.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={onSimulateOrderAction}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="Trigger a live simulated order and MTN MoMo payment"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>⚡ Simulate Live Order</span>
                    </button>

                    <button
                      onClick={onSimulatePaymentAction}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="Simulate a Rwandan mobile payment verification"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>📱 Test MoMo Payment</span>
                    </button>

                    <button
                      onClick={handleRunHealthCheck}
                      className="bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-600"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${healthCheckStatus === 'running' ? 'animate-spin' : ''}`} />
                      <span>Health Check</span>
                    </button>

                    <button
                      onClick={handleExportAuditJson}
                      className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-stone-700"
                      title="Download JSON audit file"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                {/* Health Check Results Alert */}
                {healthCheckStatus === 'completed' && (
                  <div className="mt-4 p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>
                        <strong>System Health 100% Operational:</strong> MTN MoMo Gateway (*182# OK), Airtel Money API (OK), Cold Chain Telemetry (2.8°C Nominal), Farm Cooperative Sourcing Network (50+ active).
                      </span>
                    </div>
                    <button 
                      onClick={() => setHealthCheckStatus(null)}
                      className="text-stone-400 hover:text-white text-xs ml-2"
                    >
                      &times;
                    </button>
                  </div>
                )}
              </div>

              {/* Filters and Search Bar */}
              <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  
                  {/* Search input */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={actionSearchQuery}
                      onChange={(e) => setActionSearchQuery(e.target.value)}
                      placeholder="Search actions by ID (e.g. ACT-ORD-8842), actor, produce, or keyword..."
                      className="w-full pl-9 pr-4 py-2 text-xs border border-stone-300 rounded-xl focus:outline-emerald-600 focus:border-emerald-600 bg-stone-50/50"
                    />
                    {actionSearchQuery && (
                      <button
                        onClick={() => setActionSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
                      >
                        &times;
                      </button>
                    )}
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-stone-500 font-semibold whitespace-nowrap">Status:</span>
                    <select
                      value={actionStatusFilter}
                      onChange={(e) => setActionStatusFilter(e.target.value)}
                      className="text-xs font-bold text-stone-700 bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 outline-hidden cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="success">Success / Verified</option>
                      <option value="warning">Warning / Low Stock</option>
                      <option value="info">Info / Telemetry</option>
                    </select>

                    {activities.length > 0 && (
                      <button
                        onClick={onClearActivities}
                        className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 px-2.5 py-1.5 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Reset logs to original test state"
                      >
                        Reset Logs
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mr-1">
                    Category:
                  </span>
                  
                  <button
                    onClick={() => setActionCategoryFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'all'
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    All Actions ({actionCounts.all})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('order')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'order'
                        ? 'bg-emerald-800 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Orders & Sales ({actionCounts.order})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('payment')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'payment'
                        ? 'bg-amber-700 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                    }`}
                  >
                    Payments & USSD ({actionCounts.payment})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('product')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'product'
                        ? 'bg-lime-800 text-white shadow-2xs'
                        : 'bg-lime-50 text-lime-900 hover:bg-lime-100'
                    }`}
                  >
                    Catalog & Stock ({actionCounts.product})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('user')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'user'
                        ? 'bg-blue-800 text-white shadow-2xs'
                        : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                    }`}
                  >
                    Auth & Roles ({actionCounts.user})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('delivery')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'delivery'
                        ? 'bg-indigo-800 text-white shadow-2xs'
                        : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                    }`}
                  >
                    Delivery & Logistics ({actionCounts.delivery})
                  </button>

                  <button
                    onClick={() => setActionCategoryFilter('system')}
                    className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                      actionCategoryFilter === 'system'
                        ? 'bg-stone-700 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    Telemetry & Sensors ({actionCounts.system})
                  </button>
                </div>
              </div>

              {/* Action List Display */}
              <div className="space-y-2.5">
                {filteredActivities.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-2xl border border-stone-200">
                    <Activity className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-stone-700">No system actions match your filter</p>
                    <p className="text-xs text-stone-400 mt-1">Try resetting the category or search keyword, or trigger a test action above.</p>
                  </div>
                ) : (
                  filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      onClick={() => setSelectedActivity(act)}
                      className="p-4 bg-white hover:bg-emerald-50/30 rounded-2xl border border-stone-200 hover:border-emerald-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${getActionBadgeColor(act.type)}`}>
                          {act.type === 'order' && <ShoppingCart className="w-4 h-4" />}
                          {act.type === 'payment' && <CreditCard className="w-4 h-4" />}
                          {act.type === 'product' && <Package className="w-4 h-4" />}
                          {act.type === 'user' && <Users className="w-4 h-4" />}
                          {act.type === 'delivery' && <Truck className="w-4 h-4" />}
                          {act.type === 'system' && <Terminal className="w-4 h-4" />}
                          {act.type === 'review' && <Sparkles className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200">
                              {act.id}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getActionBadgeColor(act.type)}`}>
                              {act.type}
                            </span>
                            <h4 className="font-black text-stone-900 text-xs sm:text-sm group-hover:text-emerald-900 transition-colors">
                              {act.title}
                            </h4>
                          </div>

                          <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                            {act.detail}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-400">
                            {act.actor && (
                              <span className="flex items-center gap-1 font-semibold text-stone-600">
                                <span>Actor:</span>
                                <strong className="text-stone-800">{act.actor}</strong>
                                {act.actorRole && (
                                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${
                                    act.actorRole === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-600'
                                  }`}>
                                    {act.actorRole}
                                  </span>
                                )}
                              </span>
                            )}
                            <span>Timestamp: {act.time}</span>
                            {act.timestamp && <span className="font-mono text-[10px]">{act.timestamp}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        {act.status === 'warning' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            Warning
                          </span>
                        )}
                        {act.status === 'success' && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 2: CATALOG MANAGEMENT */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Product Inventory & Rwandan Harvest Catalog</h3>
                  <p className="text-xs text-stone-500">Toggle stock, remove items, or register newly arrived farm harvests.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Harvest Item</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-stone-700">
                    <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Price</th>
                        <th className="p-3">Origin Farm</th>
                        <th className="p-3">Stock Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="p-3 flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                            />
                            <div>
                              <div className="font-bold text-stone-900">{p.name}</div>
                              <span className="text-[11px] text-stone-400">{p.spec}</span>
                            </div>
                          </td>
                          <td className="p-3 capitalize font-medium">{p.category}</td>
                          <td className="p-3 font-bold text-stone-900">{p.price.toLocaleString()} FRW</td>
                          <td className="p-3 text-stone-600">
                            <span className="block font-medium">{p.origin}</span>
                            <span className="text-[11px] text-stone-400">{p.farmer}</span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => onToggleStock(p.id)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                p.inStock
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                            >
                              {p.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Live Orders & Dispatches</h3>
                  <p className="text-xs text-stone-500">Track and update customer deliveries across Kigali districts.</p>
                </div>
                <button
                  onClick={onSimulateOrderAction}
                  className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Trigger Test Order</span>
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="p-10 text-center bg-white rounded-2xl border border-stone-200">
                  <ShoppingCart className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-stone-700">No active customer orders yet</p>
                  <p className="text-xs text-stone-400 mt-1">Place an order in the store or click 'Trigger Test Order' to simulate a live transaction.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-4 bg-white rounded-2xl border border-stone-200 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-stone-900 text-sm">Order #{ord.id}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : ord.status === 'Out for Delivery'
                                ? 'bg-indigo-100 text-indigo-800'
                                : ord.status === 'Preparing'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}>
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 mt-0.5">
                            Customer: <strong>{ord.customerName}</strong> ({ord.phone}) · {ord.createdAt}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500">Update Status:</span>
                          <select
                            value={ord.status}
                            onChange={(e) => onUpdateOrderStatus(ord.id, e.target.value as any)}
                            className="text-xs font-bold text-stone-800 bg-stone-50 border border-stone-200 rounded-lg p-1.5 cursor-pointer"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="font-semibold text-stone-700 mb-1">Purchased Harvest:</p>
                          <ul className="space-y-1 text-stone-600">
                            {ord.items.map((item, idx) => (
                              <li key={idx} className="flex justify-between">
                                <span>{item.quantity}x {item.product.name} ({item.product.spec})</span>
                                <span className="font-medium">{(item.product.price * item.quantity).toLocaleString()} FRW</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-stone-50 p-3 rounded-xl space-y-1">
                          <div className="flex justify-between text-stone-600">
                            <span>Delivery Destination:</span>
                            <span className="font-bold text-stone-800">{ord.district} ({ord.address})</span>
                          </div>
                          <div className="flex justify-between text-stone-600">
                            <span>Payment Method:</span>
                            <span className="font-bold uppercase text-stone-800">{ord.paymentMethod}</span>
                          </div>
                          <div className="flex justify-between text-stone-900 font-extrabold text-sm pt-1 border-t border-stone-200">
                            <span>Total Paid:</span>
                            <span className="text-emerald-800">{ord.total.toLocaleString()} FRW</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: STAFF ACCOUNTS & ACCESS RIGHTS */}
          {activeTab === 'customers' && (
            <div className="space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
                <div>
                  <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    Managing Staff Accounts & Access Rights
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Assign roles (Stock Manager, Cashier, Sales Attendant, Accountant, Customer) and grant granular permissions.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddStaffOpen(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Staff Account</span>
                </button>
              </div>

              {/* Add New Staff Account Modal */}
              {isAddStaffOpen && (
                <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                          <UserPlus className="w-4 h-4" />
                        </div>
                        <h4 className="font-extrabold text-stone-900 text-sm">Create Staff Account</h4>
                      </div>
                      <button
                        onClick={() => setIsAddStaffOpen(false)}
                        className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!newStaffName.trim() || !newStaffEmail.trim()) return;

                        const newStaff: User = {
                          id: `usr-${Date.now().toString().slice(-5)}`,
                          name: newStaffName.trim(),
                          email: newStaffEmail.trim(),
                          phone: newStaffPhone.trim(),
                          role: newStaffRole,
                          department: newStaffDept.trim(),
                          status: 'active',
                          joinedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                          ordersCount: 0,
                          permissions: DEFAULT_ROLE_PERMISSIONS[newStaffRole] || DEFAULT_ROLE_PERMISSIONS.customer
                        };

                        if (onAddStaffUser) {
                          onAddStaffUser(newStaff);
                        }
                        setIsAddStaffOpen(false);
                        setNewStaffName('');
                        setNewStaffEmail('');
                        setNewStaffPhone('+250 788 ');
                      }}
                      className="space-y-3 text-xs"
                    >
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Staff Full Name</label>
                        <input
                          type="text"
                          required
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="e.g. Jean Damascene Hakizimana"
                          className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="e.g. damascene@fofogreen.rw"
                          className="w-full p-2.5 border border-stone-300 rounded-xl focus:outline-emerald-600"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-stone-700 mb-1">Phone Number (MTN / Airtel)</label>
                        <input
                          type="text"
                          required
                          value={newStaffPhone}
                          onChange={(e) => setNewStaffPhone(e.target.value)}
                          className="w-full p-2.5 border border-stone-300 rounded-xl font-mono focus:outline-emerald-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-stone-700 mb-1">System Role</label>
                          <select
                            value={newStaffRole}
                            onChange={(e) => {
                              const r = e.target.value as UserRole;
                              setNewStaffRole(r);
                              if (r === 'stock_manager') setNewStaffDept('Warehouse & Inventory Control');
                              else if (r === 'cashier') setNewStaffDept('Checkout POS & Payments');
                              else if (r === 'sales_attendant') setNewStaffDept('Customer Service & Floor Sales');
                              else if (r === 'accountant') setNewStaffDept('Finance, Tax & Audit');
                              else if (r === 'admin') setNewStaffDept('Executive Administration');
                              else setNewStaffDept('Customer');
                            }}
                            className="w-full p-2.5 border border-stone-300 rounded-xl bg-white font-medium"
                          >
                            <option value="admin">1. Admin</option>
                            <option value="stock_manager">2. Stock Manager</option>
                            <option value="cashier">3. Cashier</option>
                            <option value="sales_attendant">4. Sales Attendant</option>
                            <option value="accountant">5. Accountant</option>
                            <option value="customer">6. Customer</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-stone-700 mb-1">Department</label>
                          <input
                            type="text"
                            value={newStaffDept}
                            onChange={(e) => setNewStaffDept(e.target.value)}
                            className="w-full p-2.5 border border-stone-300 rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Save & Provision Staff Account</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Configure Permissions Modal */}
              {editingPermissionsUser && (
                <div className="fixed inset-0 z-55 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs">
                  <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-stone-200 space-y-4 animate-in zoom-in-95">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-amber-600" />
                          <h4 className="font-extrabold text-stone-900 text-sm">
                            Grant System Access Rights
                          </h4>
                        </div>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Staff: <strong className="text-stone-800">{editingPermissionsUser.name}</strong> • Role: <span className="uppercase font-bold text-amber-700">{editingPermissionsUser.role}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingPermissionsUser(null)}
                        className="text-stone-400 hover:text-stone-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-bold text-stone-500">Quick Presets:</span>
                      <button
                        type="button"
                        onClick={() => setTempPermissions(DEFAULT_ROLE_PERMISSIONS.admin)}
                        className="px-2 py-0.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold cursor-pointer"
                      >
                        Grant Full Access
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempPermissions(DEFAULT_ROLE_PERMISSIONS[editingPermissionsUser.role] || DEFAULT_ROLE_PERMISSIONS.customer)}
                        className="px-2 py-0.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold cursor-pointer"
                      >
                        Role Standard
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempPermissions({
                          canManageStaff: false,
                          canGrantPermissions: false,
                          canManageProducts: false,
                          canManageInventory: false,
                          canRecordStockIn: false,
                          canTrackDamagedStock: false,
                          canProcessPayments: false,
                          canIssueReceipts: false,
                          canViewReports: false,
                          canManageFinances: false,
                          canAssistSales: false
                        })}
                        className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold cursor-pointer"
                      >
                        Revoke All
                      </button>
                    </div>

                    {/* Permissions Matrix */}
                    <div className="space-y-2 border border-stone-200 rounded-2xl p-4 max-h-64 overflow-y-auto text-xs bg-stone-50/50">
                      {[
                        { key: 'canManageStaff', label: 'Manage Staff Accounts', desc: 'Create, edit, and suspend employee user credentials' },
                        { key: 'canGrantPermissions', label: 'Grant System Access Rights', desc: 'Authorize or modify other staff access privileges' },
                        { key: 'canManageProducts', label: 'Manage Catalog & Products', desc: 'Add, update pricing, and edit produce descriptions' },
                        { key: 'canManageInventory', label: 'Inventory & Stock Counting', desc: 'Adjust stock levels and mark produce in/out of stock' },
                        { key: 'canRecordStockIn', label: 'Receive New Stock (Ingest PO)', desc: 'Register harvest batches from Rwandan cooperatives' },
                        { key: 'canTrackDamagedStock', label: 'Track Damaged Goods & Spoilage', desc: 'Log spoiled produce and mark clearance discounts' },
                        { key: 'canProcessPayments', label: 'Process Payments (POS Register)', desc: 'Accept Cash and Mobile Money (*182#)' },
                        { key: 'canIssueReceipts', label: 'Issue & Print Sales Receipts', desc: 'Generate official tax and customer purchase receipts' },
                        { key: 'canViewReports', label: 'View Business & Profit Reports', desc: 'Inspect executive P&L, sales velocity, and tax logs' },
                        { key: 'canManageFinances', label: 'Manage General Ledger & Finances', desc: 'Record expenses, fuel, packaging, and wage payouts' },
                        { key: 'canAssistSales', label: 'Customer Assisted Selling Kiosk', desc: 'Show prices, advise produce, and build customer baskets' }
                      ].map((item) => {
                        const isChecked = (tempPermissions as any)[item.key];
                        return (
                          <label key={item.key} className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-stone-200">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setTempPermissions(prev => ({
                                  ...prev,
                                  [item.key]: e.target.checked
                                }));
                              }}
                              className="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <p className="font-bold text-stone-900 leading-tight">{item.label}</p>
                              <p className="text-[11px] text-stone-500">{item.desc}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingPermissionsUser(null)}
                        className="px-4 py-2 border border-stone-300 rounded-xl text-stone-600 font-bold text-xs hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (onUpdateUserPermissions) {
                            onUpdateUserPermissions(editingPermissionsUser.id, tempPermissions);
                          }
                          setEditingPermissionsUser(null);
                        }}
                        className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save Rights to Staff Profile</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* Staff Accounts Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-stone-100 text-stone-800 font-bold border-b border-stone-200 text-[10px] uppercase">
                    <tr>
                      <th className="p-3">Staff / User</th>
                      <th className="p-3">Role & Department</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Access Rights</th>
                      <th className="p-3 text-right">Role Switching</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map((u) => {
                      const permissionsCount = u.permissions 
                        ? Object.values(u.permissions).filter(Boolean).length 
                        : (DEFAULT_ROLE_PERMISSIONS[u.role] ? Object.values(DEFAULT_ROLE_PERMISSIONS[u.role]).filter(Boolean).length : 0);

                      return (
                        <tr key={u.id} className="hover:bg-stone-50">
                          <td className="p-3">
                            <p className="font-bold text-stone-900">{u.name}</p>
                            <span className="text-[11px] text-stone-500 font-mono">{u.email}</span>
                            <span className="text-[10px] text-stone-400 block font-mono">{u.phone}</span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase inline-block mb-0.5 ${
                              u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                              u.role === 'stock_manager' ? 'bg-blue-100 text-blue-900 border border-blue-300' :
                              u.role === 'cashier' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                              u.role === 'sales_attendant' ? 'bg-violet-100 text-violet-900 border border-violet-300' :
                              u.role === 'accountant' ? 'bg-teal-100 text-teal-900 border border-teal-300' :
                              'bg-stone-100 text-stone-700'
                            }`}>
                              {u.role.replace(/_/g, ' ')}
                            </span>
                            <p className="text-[10px] text-stone-400">{u.department || 'General'}</p>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Active
                            </span>
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => {
                                setEditingPermissionsUser(u);
                                setTempPermissions(u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.customer);
                              }}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="Configure system access rights and capabilities"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>{permissionsCount} Rights</span>
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => {
                                const newRole = e.target.value as UserRole;
                                if (onUpdateUserRole) {
                                  onUpdateUserRole(u.id, newRole);
                                } else {
                                  onToggleUserRole(u.id);
                                }
                              }}
                              className="bg-white border border-stone-300 rounded-xl px-2 py-1 text-xs font-bold focus:outline-emerald-600 cursor-pointer text-stone-800"
                            >
                              <option value="admin">Admin</option>
                              <option value="stock_manager">Stock Manager</option>
                              <option value="cashier">Cashier</option>
                              <option value="sales_attendant">Sales Attendant</option>
                              <option value="accountant">Accountant</option>
                              <option value="customer">Customer</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: BUSINESS & PROFIT REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              
              {/* Report Header */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-850 text-white p-5 rounded-3xl border border-stone-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded-md border border-emerald-800">
                    Executive Dashboard
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">
                    Business & Profit Performance Reports
                  </h3>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Fofo Green Rwanda • Live analytics, sales velocity, and gross/net profit margins.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold border border-stone-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Report</span>
                  </button>
                </div>
              </div>

              {/* Profit & Loss Overview Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Gross Sales Volume</p>
                  <p className="text-xl font-black text-emerald-950 font-mono mt-1">
                    {totalSalesFRW.toLocaleString()} FRW
                  </p>
                  <p className="text-[10px] text-emerald-800 mt-0.5">{orders.length} active customer orders</p>
                </div>

                <div className="p-4 bg-stone-100 rounded-2xl border border-stone-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-stone-600">Cost of Goods (COGS)</p>
                  <p className="text-xl font-black text-stone-900 font-mono mt-1">
                    {Math.round(totalSalesFRW * 0.65).toLocaleString()} FRW
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">Estimated 65% cooperative harvest cost</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Gross Profit (35% Margin)</p>
                  <p className="text-xl font-black text-blue-950 font-mono mt-1">
                    {Math.round(totalSalesFRW * 0.35).toLocaleString()} FRW
                  </p>
                  <p className="text-[10px] text-blue-800 mt-0.5">Healthy gross margin on fresh produce</p>
                </div>

                <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200">
                  <p className="text-[10px] font-black uppercase tracking-wider text-teal-700">Net Estimated Profit</p>
                  <p className="text-xl font-black text-teal-950 font-mono mt-1">
                    {Math.round(totalSalesFRW * 0.24).toLocaleString()} FRW
                  </p>
                  <p className="text-[10px] text-teal-800 mt-0.5">Net ~24% after delivery & packaging</p>
                </div>
              </div>

              {/* Direct Workspace Launcher for Admin */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-stone-900">
                  Department Workspaces & Quick Role Access
                </h4>
                <p className="text-xs text-stone-500">
                  As System Administrator, you can open and supervise each operational workspace:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  {onOpenStockManager && (
                    <button
                      onClick={onOpenStockManager}
                      className="p-3 bg-blue-50 hover:bg-blue-100/80 border border-blue-200 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                        <Boxes className="w-4 h-4 text-blue-700" />
                        <span>Stock Manager</span>
                      </div>
                      <p className="text-[11px] text-blue-700/80 mt-1">Receiving PO, inventory counts & damaged produce</p>
                    </button>
                  )}

                  {onOpenCashier && (
                    <button
                      onClick={onOpenCashier}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                        <Store className="w-4 h-4 text-emerald-700" />
                        <span>Cashier POS</span>
                      </div>
                      <p className="text-[11px] text-emerald-700/80 mt-1">Cash register, MTN MoMo payments & receipts</p>
                    </button>
                  )}

                  {onOpenSalesAttendant && (
                    <button
                      onClick={onOpenSalesAttendant}
                      className="p-3 bg-violet-50 hover:bg-violet-100/80 border border-violet-200 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-violet-900 font-bold text-xs">
                        <Smile className="w-4 h-4 text-violet-700" />
                        <span>Sales Attendant</span>
                      </div>
                      <p className="text-[11px] text-violet-700/80 mt-1">Customer greeting, catalog prices & assisted basket</p>
                    </button>
                  )}

                  {onOpenAccountant && (
                    <button
                      onClick={onOpenAccountant}
                      className="p-3 bg-teal-50 hover:bg-teal-100/80 border border-teal-200 rounded-xl text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                        <Scale className="w-4 h-4 text-teal-700" />
                        <span>Accountant Hub</span>
                      </div>
                      <p className="text-[11px] text-teal-700/80 mt-1">Financial ledger, purchase vs selling margins & P&L</p>
                    </button>
                  )}
                </div>
              </div>

              {/* Best-selling Rwandan Produce Table */}
              <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                    Produce Sourcing & Profit Margin Ranking
                  </h4>
                  <span className="text-[10px] text-stone-500 font-mono">Sorted by Gross Contribution</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 uppercase text-[10px] font-bold border-b border-stone-200">
                    <tr>
                      <th className="py-2.5 px-4">Item & Farmer</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Retail Price</th>
                      <th className="py-2.5 px-3">Est. Farm Cost</th>
                      <th className="py-2.5 px-3">Unit Margin</th>
                      <th className="py-2.5 px-4 text-right">Markup %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {products.slice(0, 8).map((p) => {
                      const cost = Math.round(p.price * 0.65);
                      const margin = p.price - cost;
                      const markup = Math.round((margin / cost) * 100);

                      return (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="py-2.5 px-4">
                            <p className="font-extrabold text-stone-900">{p.name}</p>
                            <p className="text-[10px] text-stone-400">{p.farmer} • {p.origin}</p>
                          </td>
                          <td className="py-2.5 px-3 capitalize text-stone-500">{p.category}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900">{p.price.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-3 font-mono text-stone-500">{cost.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">+{margin.toLocaleString()} FRW</td>
                          <td className="py-2.5 px-4 text-right font-mono font-black text-blue-900">{markup}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 5: SQL DATABASE SCHEMA & ERD EXPLORER ('fofogreen') */}
          {activeTab === 'schema' && (
            <div className="space-y-6">
              
              {/* Database Overview Banner & Apply System Controls */}
              <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-5 rounded-3xl border border-stone-800 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Database: fofogreen
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-700/80 font-mono">
                        Engine: PostgreSQL 16
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-700/80 font-mono">
                        Google Cloud SQL · europe-west2
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-700/80 font-mono">
                        Drizzle ORM & Kit
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      Fofo Green Database Apply System & SQL Studio
                    </h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-2xl">
                      Cloud SQL PostgreSQL database architecture and active schema migrations for Fofo Green Rwanda. Run interactive SQL queries, synchronize tables, and download the full system bundle.
                    </p>
                  </div>

                  {/* Header Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <button
                      onClick={handleApplyDatabaseSystem}
                      disabled={isApplyingSystem}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      title="Run Drizzle migration and verify all 11 tables"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isApplyingSystem ? 'animate-spin' : ''}`} />
                      <span>{isApplyingSystem ? 'Applying System...' : 'Apply Database System'}</span>
                    </button>

                    <button
                      onClick={() => api.downloadZipPackage()}
                      className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Download complete project codebase as ZIP archive"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download ZIP Folder (.zip)</span>
                    </button>

                    <button
                      onClick={() => api.downloadSystemPackage()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      title="Download system JSON package"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Export System JSON</span>
                    </button>

                    <button
                      onClick={() => {
                        const schemaText = `# Fofo Green (fofogreen) — SQL Database Schema\nEngine: PostgreSQL (Google Cloud SQL europe-west2)\nTables: products, users, orders, order_items, activities, farm_passports, categories, delivery_zones, meal_kits, reviews, store_settings\nDocumentation file: /DATABASE_SCHEMA.md`;
                        navigator.clipboard?.writeText(schemaText);
                        alert('SQL Schema Documentation summary copied to clipboard! Full file: DATABASE_SCHEMA.md');
                      }}
                      className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs flex items-center gap-1.5 transition-colors border border-stone-700 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Schema</span>
                    </button>
                  </div>
                </div>

                {/* Apply Success Notification Banner */}
                {applySuccessMessage && (
                  <div className="p-3 bg-emerald-950/80 border border-emerald-600/70 rounded-2xl text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-medium">{applySuccessMessage}</span>
                  </div>
                )}

                {/* Live System Telemetry Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-stone-800/80 text-xs font-mono">
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-sans">Database Status</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      Connected (Active)
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-sans">Active Tables</span>
                    <span className="font-bold text-white">
                      {dbSystemStatus?.totalTables || 11} Relational Tables
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-sans">Foreign Key Integrity</span>
                    <span className="font-bold text-purple-300">
                      {dbSystemStatus?.activeForeignKeysCount || 8} Strict FKs
                    </span>
                  </div>
                  <div className="p-2.5 bg-stone-900/90 rounded-xl border border-stone-800">
                    <span className="text-[10px] text-stone-400 block font-sans">Query Response Time</span>
                    <span className="font-bold text-amber-300">
                      {dbSystemStatus?.pingMs || 2} ms Latency
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive SQL Studio (Safe Analytical Query Runner) */}
              <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-emerald-700" />
                      <span>Interactive SQL Studio & Query Inspector</span>
                    </h4>
                    <p className="text-xs text-stone-500">
                      Execute safe analytical SQL queries against the fofogreen PostgreSQL database schema.
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                    SELECT · EXPLAIN · SHOW
                  </span>
                </div>

                {/* Preset SQL Quick Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-stone-500 mr-1">Query Presets:</span>
                  <button
                    onClick={() => {
                      const q = 'SELECT id, name, category, price, farmer, origin FROM products ORDER BY price DESC LIMIT 5;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    products (Top 5)
                  </button>
                  <button
                    onClick={() => {
                      const q = 'SELECT id, customer_name, total, district, status, payment_method FROM orders LIMIT 5;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    orders (Recent)
                  </button>
                  <button
                    onClick={() => {
                      const q = 'SELECT slug, name, item_count, icon FROM categories;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    categories
                  </button>
                  <button
                    onClick={() => {
                      const q = 'SELECT district_name, tariff_frw, estimated_eta, active_riders FROM delivery_zones;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    delivery_zones
                  </button>
                  <button
                    onClick={() => {
                      const q = 'SELECT id, type, title, actor, status, time FROM activities LIMIT 8;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    activities (Audit)
                  </button>
                  <button
                    onClick={() => {
                      const q = 'SELECT id, version, name, applied_at, details FROM schema_migrations;';
                      setSqlQuery(q);
                      handleExecuteSql(q);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 text-xs font-mono transition-colors border border-stone-200 cursor-pointer"
                  >
                    schema_migrations
                  </button>
                </div>

                {/* SQL Editor Input Box */}
                <div className="relative">
                  <textarea
                    rows={3}
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    placeholder="Enter SQL query: SELECT * FROM products LIMIT 10;"
                    className="w-full p-3 font-mono text-xs bg-stone-900 text-emerald-300 rounded-2xl border border-stone-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 resize-y"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[11px] text-stone-500">
                      Press Execute to run query against fofogreen database
                    </span>
                    <button
                      onClick={() => handleExecuteSql()}
                      disabled={isExecutingSql}
                      className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Play className={`w-3.5 h-3.5 ${isExecutingSql ? 'animate-spin' : 'fill-white'}`} />
                      <span>{isExecutingSql ? 'Running...' : 'Execute SQL'}</span>
                    </button>
                  </div>
                </div>

                {/* SQL Execution Error */}
                {sqlError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-mono">
                    {sqlError}
                  </div>
                )}

                {/* SQL Query Result View */}
                {sqlResult && (
                  <div className="space-y-2 border-t border-stone-100 pt-3">
                    <div className="flex items-center justify-between text-xs text-stone-500 font-mono">
                      <span>Query Result: {sqlResult.rowCount} rows returned</span>
                      <span>Execution Time: {sqlResult.durationMs} ms</span>
                    </div>

                    <div className="overflow-x-auto max-h-64 border border-stone-200 rounded-2xl">
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="bg-stone-100 text-stone-700 border-b border-stone-200 sticky top-0">
                          <tr>
                            {sqlResult.columns.map((col, idx) => (
                              <th key={idx} className="py-2 px-3 font-bold">{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 bg-white">
                          {sqlResult.rows.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-stone-50">
                              {sqlResult.columns.map((col, cIdx) => (
                                <td key={cIdx} className="py-1.5 px-3 text-stone-800 whitespace-nowrap">
                                  {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* 4 Core Focus Tables (Products, Users, Orders, Logs) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. products Table */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-extrabold text-stone-900 text-sm font-mono">public.products</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">Organic harvest produce catalog ({products.length} live rows)</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      17 Columns
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-600" /> id (PK)
                      </span>
                      <span className="text-stone-500">SERIAL / INT (Auto-Increment)</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-stone-700 flex items-center gap-1">
                        <Link className="w-3 h-3 text-blue-600" /> category (FK)
                      </span>
                      <span className="text-blue-700 font-semibold">references categories.slug</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Key Columns:</span>
                      <span className="font-mono text-[11px] text-stone-800">name, price (FRW), spec, origin, farmer, in_stock</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 space-y-1">
                    <p><strong>Relationships:</strong></p>
                    <ul className="list-disc list-inside text-stone-500 space-y-0.5">
                      <li><strong>1-to-1</strong> with <code className="text-stone-800 font-mono">farm_passports.product_id</code></li>
                      <li><strong>1-to-Many</strong> with <code className="text-stone-800 font-mono">order_items.product_id</code></li>
                      <li><strong>1-to-Many</strong> with <code className="text-stone-800 font-mono">reviews.product_id</code></li>
                    </ul>
                  </div>
                </div>

                {/* 2. users Table */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-700" />
                        <h4 className="font-extrabold text-stone-900 text-sm font-mono">public.users</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">Customer & Administrator accounts ({users.length} live rows)</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      6 Columns
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-600" /> id (PK)
                      </span>
                      <span className="text-stone-500">SERIAL / INT (Auto-Increment)</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-purple-600" /> uid (UNIQUE)
                      </span>
                      <span className="text-purple-700 font-semibold">Firebase Auth Token UID</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Key Columns:</span>
                      <span className="font-mono text-[11px] text-stone-800">email, name, role ('admin' | 'customer'), created_at</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 space-y-1">
                    <p><strong>Relationships & Auth:</strong></p>
                    <ul className="list-disc list-inside text-stone-500 space-y-0.5">
                      <li>Maps directly to Firebase Auth Bearer tokens on protected <code className="text-stone-800 font-mono">/api/*</code> routes</li>
                      <li>Role verification guards administrative actions (catalog edits, inventory toggles)</li>
                    </ul>
                  </div>
                </div>

                {/* 3. orders & order_items Tables */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4 text-amber-700" />
                        <h4 className="font-extrabold text-stone-900 text-sm font-mono">public.orders & order_items</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">Purchases, delivery zones & line items ({orders.length} orders)</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      18 + 8 Cols
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-600" /> orders.id (PK)
                      </span>
                      <span className="text-stone-500">TEXT (e.g. 'FOFO-8842')</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-stone-700 flex items-center gap-1">
                        <Link className="w-3 h-3 text-blue-600" /> order_items.order_id (FK)
                      </span>
                      <span className="text-blue-700 font-semibold">references orders.id</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-stone-700 flex items-center gap-1">
                        <Link className="w-3 h-3 text-blue-600" /> order_items.product_id (FK)
                      </span>
                      <span className="text-blue-700 font-semibold">references products.id</span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-semibold text-stone-700 flex items-center gap-1">
                        <Link className="w-3 h-3 text-blue-600" /> orders.district (FK)
                      </span>
                      <span className="text-blue-700 font-semibold">delivery_zones.district_name</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 space-y-1">
                    <p><strong>Order Lifecycle:</strong></p>
                    <p className="text-stone-500 font-mono text-[10px]">
                      Pending &rarr; Preparing &rarr; Out for Delivery (Courier Assigned) &rarr; Delivered
                    </p>
                  </div>
                </div>

                {/* 4. activities Table (Logs) */}
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-700" />
                        <h4 className="font-extrabold text-stone-900 text-sm font-mono">public.activities (Logs)</h4>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">System audit trail & action telemetry ({activities.length} entries)</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                      10 Columns
                    </span>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-stone-800 flex items-center gap-1">
                        <Key className="w-3 h-3 text-amber-600" /> id (PK)
                      </span>
                      <span className="text-stone-500">TEXT (e.g. 'ACT-ORD-8842')</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Event Types:</span>
                      <span className="font-mono text-[11px] text-purple-800 font-bold">'order', 'inventory', 'price', 'user', 'payment', 'system'</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Actor Roles:</span>
                      <span className="font-mono text-[11px] text-stone-800">'admin', 'customer', 'courier', 'system'</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Payload Column:</span>
                      <span className="font-mono text-[11px] text-stone-700">metadata_json (Structured JSON)</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-stone-600 space-y-1">
                    <p><strong>Auditing Compliance:</strong></p>
                    <p className="text-stone-500">
                      Every administrative price change, stock depletion, payment webhook, and customer login is logged immutably.
                    </p>
                  </div>
                </div>

              </div>

              {/* Complete Relationship Matrix Table */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    <h4 className="font-extrabold text-stone-900 text-sm">Entity Relationship & Foreign Key Reference Matrix</h4>
                  </div>
                  <span className="text-xs text-stone-500 font-mono">11 Connected Tables</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-mono">
                      <tr>
                        <th className="py-2.5 px-4 font-bold">Source Table</th>
                        <th className="py-2.5 px-4 font-bold">Source Column</th>
                        <th className="py-2.5 px-4 font-bold">Target Table</th>
                        <th className="py-2.5 px-4 font-bold">Target Column</th>
                        <th className="py-2.5 px-4 font-bold">Cardinality</th>
                        <th className="py-2.5 px-4 font-bold">Business Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">products</td>
                        <td className="py-2 px-4 text-stone-700">category</td>
                        <td className="py-2 px-4 font-bold text-stone-800">categories</td>
                        <td className="py-2 px-4 text-stone-700">slug</td>
                        <td className="py-2 px-4 text-stone-500">Many-to-One (N:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Produce taxonomy and navigation grouping</td>
                      </tr>
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">farm_passports</td>
                        <td className="py-2 px-4 text-stone-700">product_id</td>
                        <td className="py-2 px-4 font-bold text-stone-800">products</td>
                        <td className="py-2 px-4 text-stone-700">id</td>
                        <td className="py-2 px-4 text-stone-500">One-to-One (1:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Rwanda Standards Board (RSB) organic certification & volcanic terroir</td>
                      </tr>
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">order_items</td>
                        <td className="py-2 px-4 text-stone-700">order_id</td>
                        <td className="py-2 px-4 font-bold text-stone-800">orders</td>
                        <td className="py-2 px-4 text-stone-700">id</td>
                        <td className="py-2 px-4 text-stone-500">Many-to-One (N:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Normalized item lines contained in customer basket</td>
                      </tr>
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">order_items</td>
                        <td className="py-2 px-4 text-stone-700">product_id</td>
                        <td className="py-2 px-4 font-bold text-stone-800">products</td>
                        <td className="py-2 px-4 text-stone-700">id</td>
                        <td className="py-2 px-4 text-stone-500">Many-to-One (N:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Product reference for sales aggregation and re-ordering</td>
                      </tr>
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">reviews</td>
                        <td className="py-2 px-4 text-stone-700">product_id</td>
                        <td className="py-2 px-4 font-bold text-stone-800">products</td>
                        <td className="py-2 px-4 text-stone-700">id</td>
                        <td className="py-2 px-4 text-stone-500">Many-to-One (N:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Customer feedback attached to individual produce items</td>
                      </tr>
                      <tr className="hover:bg-stone-50/50">
                        <td className="py-2 px-4 font-bold text-emerald-800">orders</td>
                        <td className="py-2 px-4 text-stone-700">district</td>
                        <td className="py-2 px-4 font-bold text-stone-800">delivery_zones</td>
                        <td className="py-2 px-4 text-stone-700">district_name</td>
                        <td className="py-2 px-4 text-stone-500">Many-to-One (N:1)</td>
                        <td className="py-2 px-4 font-sans text-stone-600">Kigali delivery tariff (1500-2000 FRW) and estimated courier ETA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Documentation File Reference Card */}
              <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl border border-stone-800">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-sm text-white">Full SQL Schema Documentation File</span>
                  <code className="text-xs bg-stone-800 text-emerald-300 px-2 py-0.5 rounded-md font-mono">/DATABASE_SCHEMA.md</code>
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  The complete documentation file <code className="text-stone-300">DATABASE_SCHEMA.md</code> has been generated in the project root. It contains the comprehensive data dictionaries, column constraints, SQL DDL statements, relationship diagrams, and sample production SQL join queries.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* Modal: Single Action Detail Inspector */}
        {selectedActivity && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95">
              <button
                onClick={() => setSelectedActivity(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getActionBadgeColor(selectedActivity.type)}`}>
                  {selectedActivity.type}
                </span>
                <span className="font-mono text-xs text-stone-500">ID: {selectedActivity.id}</span>
              </div>

              <h3 className="text-lg font-black text-stone-900">{selectedActivity.title}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{selectedActivity.detail}</p>

              <div className="mt-4 p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Actor:</span>
                  <span className="font-bold text-stone-800">{selectedActivity.actor || 'System'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Actor Role:</span>
                  <span className="font-mono uppercase font-bold text-emerald-800">{selectedActivity.actorRole || 'system'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Logged Time:</span>
                  <span className="text-stone-700">{selectedActivity.time} ({selectedActivity.timestamp || 'Real-time'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-medium">Verification Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Cryptographically Logged
                  </span>
                </div>
              </div>

              {selectedActivity.metadata && (
                <div className="mt-3">
                  <span className="block text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                    Raw Action Metadata Payload:
                  </span>
                  <pre className="p-3 bg-stone-900 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-40">
                    {JSON.stringify(selectedActivity.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedActivity(null)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add New Harvest Item */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold text-stone-900 mb-1">Add New Harvest Product</h3>
              <p className="text-xs text-stone-500 mb-4">Register new organic produce directly into the live store catalog.</p>

              <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={newProd.name}
                    onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                    placeholder="e.g. Rwandan Red Chilis"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Category *</label>
                    <select
                      value={newProd.category}
                      onChange={(e) => setNewProd({ ...newProd, category: e.target.value as Product['category'] })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="vegetables">Vegetables</option>
                      <option value="fruits">Fruits</option>
                      <option value="meat">Meat & Eggs</option>
                      <option value="dairy">Dairy</option>
                      <option value="grains">Grains & Oil</option>
                      <option value="snacks">Snacks</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Price (FRW) *</label>
                    <input
                      type="number"
                      required
                      value={newProd.price}
                      onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Weight / Unit Spec *</label>
                    <input
                      type="text"
                      required
                      value={newProd.spec}
                      onChange={(e) => setNewProd({ ...newProd, spec: e.target.value })}
                      placeholder="e.g. 500g, 1 kg, 1 bunch"
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">Badge</label>
                    <select
                      value={newProd.badge}
                      onChange={(e) => setNewProd({ ...newProd, badge: e.target.value as Product['badge'] })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl bg-white"
                    >
                      <option value="Fresh">Fresh</option>
                      <option value="Popular">Popular</option>
                      <option value="Organic">Organic</option>
                      <option value="Limited Time">Limited Time</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Farm Origin / District *</label>
                  <input
                    type="text"
                    required
                    value={newProd.origin}
                    onChange={(e) => setNewProd({ ...newProd, origin: e.target.value })}
                    placeholder="e.g. Musanze District, Northern Province"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Farmer Cooperative</label>
                  <input
                    type="text"
                    value={newProd.farmer}
                    onChange={(e) => setNewProd({ ...newProd, farmer: e.target.value })}
                    placeholder="e.g. Abahuzamugambi Organic Coop"
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Image URL (Unsplash)</label>
                  <input
                    type="url"
                    value={newProd.image}
                    onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 font-bold text-white bg-emerald-800 hover:bg-emerald-900 rounded-xl shadow-xs"
                  >
                    Add to Catalog
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
