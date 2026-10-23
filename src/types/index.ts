export interface Product {
  id: number;
  name: string;
  category: 'vegetables' | 'fruits' | 'meat' | 'dairy' | 'grains' | 'snacks';
  price: number;
  oldPrice?: number;
  spec: string;
  rating: number;
  reviewsCount: number;
  image: string;
  badge?: 'Fresh' | 'Popular' | 'Limited Time' | 'Organic';
  origin: string;
  farmer: string;
  description: string;
  inStock: boolean;
  calories?: string;
  harvested?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Language = 'en' | 'rw' | 'fr' | 'es' | 'ar';

export type PaymentMethod = 'mtn' | 'airtel' | 'card' | 'cod';

export type UserRole = 
  | 'admin' 
  | 'stock_manager' 
  | 'cashier' 
  | 'sales_attendant' 
  | 'accountant' 
  | 'customer';

export interface StaffPermissions {
  canManageStaff: boolean;
  canGrantPermissions: boolean;
  canManageProducts: boolean;
  canManageInventory: boolean;
  canRecordStockIn: boolean;
  canTrackDamagedStock: boolean;
  canProcessPayments: boolean;
  canIssueReceipts: boolean;
  canViewReports: boolean;
  canManageFinances: boolean;
  canAssistSales: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  joinedDate: string;
  ordersCount: number;
  status?: 'active' | 'suspended' | 'pending';
  department?: string;
  permissions?: StaffPermissions;
  lastLogin?: string;
}

// 2. Stock Manager Types
export interface StockInBatch {
  id: string;
  productId: number;
  productName: string;
  supplier: string;
  quantityReceived: number;
  unitCostFrw: number;
  sellingPriceFrw: number;
  batchNumber: string;
  receivedDate: string;
  expiryDate: string;
  receivedBy: string;
  notes?: string;
}

export interface DamagedStockItem {
  id: string;
  productId: number;
  productName: string;
  quantity: number;
  unitCostFrw: number;
  reason: 'damaged_in_transit' | 'spoilage_rot' | 'expired' | 'pest_blemish' | 'bruised';
  reportedDate: string;
  reportedBy: string;
  actionTaken: 'disposed' | 'discounted_clearance' | 'composted' | 'supplier_claim';
  lossAmountFrw: number;
  notes?: string;
}

export interface StockAlert {
  id: string;
  productId: number;
  productName: string;
  currentStock: number;
  threshold: number;
  severity: 'low' | 'critical' | 'out_of_stock';
  dateNotified: string;
  status: 'pending' | 'acknowledged' | 'reordered';
  notifiedManagerName?: string;
}

// 3. Cashier & Receipt Types
export interface ReceiptItem {
  id: number;
  name: string;
  spec: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptFeedback {
  rating: number;
  comment: string;
  customerName?: string;
  submittedAt: string;
  tags?: string[];
}

export interface SalesReceipt {
  receiptNumber: string;
  orderId: string;
  customerName: string;
  customerPhone?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod | 'cash';
  paymentReference: string;
  amountTendered?: number;
  changeGiven?: number;
  cashierName: string;
  issuedAt: string;
  feedback?: ReceiptFeedback;
}

// 5. Accountant Financial Types
export interface FinancialRecord {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: 
    | 'sales_revenue' 
    | 'pos_cash_sale'
    | 'momo_sale'
    | 'inventory_purchase' 
    | 'farmer_payout' 
    | 'logistics_fuel' 
    | 'packaging' 
    | 'utilities' 
    | 'wages'
    | 'spoilage_loss';
  description: string;
  amount: number;
  paymentMethod: PaymentMethod | 'cash';
  reference: string;
  recordedBy: string;
}

export interface ProfitAndLossReport {
  period: string;
  grossSalesRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  spoilageLosses: number;
  netProfit: number;
  netMarginPercent: number;
  totalTransactionsCount: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  address: string;
  district: string;
  status: 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered';
  createdAt: string;
  courierName?: string;
  courierPhone?: string;
  courierVehicle?: string;
  estimatedMinutes?: number;
  temperatureCelsius?: number;
}

export interface MealKit {
  id: string;
  name: string;
  nameRw?: string;
  tagline: string;
  description: string;
  prepTime: string;
  servings: string;
  difficulty: 'Easy' | 'Medium' | 'Chef Special';
  image: string;
  badge: string;
  bundlePrice: number;
  originalPrice: number;
  discountPercent: number;
  itemsIncluded: string[];
  productIds: number[];
  recipeSteps: string[];
  nutritionHighlights: string;
}

export interface FarmPassport {
  productId: number;
  cooperativeName: string;
  district: string;
  elevation: string;
  soilType: string;
  leadFarmer: string;
  harvestTime: string;
  batchNumber: string;
  rsbCertification: string;
  pesticideFree: boolean;
  waterSource: string;
  farmerStory: string;
}

export interface CustomerReview {
  id: number;
  name: string;
  location: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  avatar: string;
  productName?: string;
}

export interface SystemActivity {
  id: string;
  title: string;
  detail: string;
  time: string;
  timestamp?: string;
  type: 'order' | 'product' | 'user' | 'system' | 'payment' | 'delivery' | 'review';
  status?: 'success' | 'pending' | 'warning' | 'info';
  actor?: string;
  actorRole?: UserRole | 'system';
  metadata?: Record<string, any>;
}

export type ColorTheme = 
  | 'lush-emerald' 
  | 'vibrant-lime' 
  | 'sunlit-terracotta' 
  | 'ocean-teal' 
  | 'golden-harvest' 
  | 'royal-forest' 
  | 'ruby-berry' 
  | 'midnight-emerald';
