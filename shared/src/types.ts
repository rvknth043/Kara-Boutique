// ========================================
// USER TYPES
// ========================================

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  google_id?: string;
  role: UserRole;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserAddress {
  id: string;
  user_id: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_default: boolean;
  created_at: Date;
}

// ========================================
// PRODUCT TYPES
// ========================================

export enum ProductSize {
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
  XXL = 'XXL'
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  meta_title?: string;
  meta_description?: string;
  is_active: boolean;
  display_order: number;
  created_at: Date;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category_id: string;
  base_price: number;
  discount_price?: number;
  hsn_code?: string;
  is_active: boolean;
  is_featured: boolean;
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: ProductSize;
  color: string;
  stock_quantity: number;
  reserved_quantity: number;
  sku: string;
  is_active: boolean;
  created_at: Date;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  color_variant?: string;
  display_order: number;
  is_primary: boolean;
  created_at: Date;
}

export interface SizeChart {
  id: string;
  product_id: string;
  size: ProductSize;
  bust?: string;
  waist?: string;
  hips?: string;
  length?: string;
  shoulder?: string;
  created_at: Date;
}

export interface ProductWithDetails extends Product {
  category: Category;
  images: ProductImage[];
  variants: ProductVariant[];
  size_chart?: SizeChart[];
  avg_rating?: number;
  review_count?: number;
}

// ========================================
// CART & WISHLIST TYPES
// ========================================

export interface CartItem {
  id: string;
  user_id: string;
  product_variant_id: string;
  quantity: number;
  product?: ProductWithDetails;
  variant?: ProductVariant;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  added_at: Date;
  product?: Product;
}

// ========================================
// ORDER TYPES
// ========================================

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum OrderStatus {
  PLACED = 'placed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned'
}

export enum PaymentMethod {
  UPI = 'UPI',
  CARD = 'CARD',
  NETBANKING = 'NETBANKING',
  WALLET = 'WALLET',
  COD = 'COD'
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  total_amount: number;
  shipping_charge: number;
  discount_amount: number;
  final_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_method: PaymentMethod;
  shipping_address_id: string;
  tracking_number?: string;
  invoice_url?: string;
  created_at: Date;
  shipped_at?: Date;
  delivered_at?: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface OrderWithDetails extends Order {
  items: OrderItemWithProduct[];
  shipping_address: UserAddress;
}

export interface OrderItemWithProduct extends OrderItem {
  product: ProductWithDetails;
  variant: ProductVariant;
}

// ========================================
// PAYMENT TYPES
// ========================================

export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  CASHFREE = 'cashfree',
  PAYU = 'payu'
}

export interface Payment {
  id: string;
  order_id: string;
  transaction_id?: string;
  gateway: PaymentGateway;
  amount: number;
  status: string;
  webhook_data?: any;
  created_at: Date;
  updated_at: Date;
}

// ========================================
// COUPON TYPES
// ========================================

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_value: number;
  max_discount?: number;
  usage_limit?: number;
  used_count: number;
  expiry_date: Date;
  is_active: boolean;
  created_at: Date;
}

// ========================================
// REVIEW TYPES
// ========================================

export interface Review {
  id: string;
  user_id: string;
  product_id: string;
  order_id: string;
  rating: number;
  review_text?: string;
  is_verified: boolean;
  is_flagged: boolean;
  created_at: Date;
}

export interface ReviewWithUser extends Review {
  user: {
    full_name: string;
  };
}

export interface ReviewFlag {
  id: string;
  review_id: string;
  user_id: string;
  reason: string;
  flagged_at: Date;
}

// ========================================
// INVENTORY TYPES
// ========================================

export enum InventoryChangeType {
  ORDER = 'order',
  RESTOCK = 'restock',
  MANUAL = 'manual',
  RETURN = 'return',
  CANCEL = 'cancel'
}

export interface InventoryLog {
  id: string;
  product_variant_id: string;
  change_type: InventoryChangeType;
  quantity_changed: number;
  previous_quantity: number;
  new_quantity: number;
  admin_id?: string;
  notes?: string;
  created_at: Date;
}

// ========================================
// ABANDONED CART TYPES
// ========================================

export interface AbandonedCart {
  id: string;
  user_id?: string;
  session_id?: string;
  cart_data: any;
  email_sent_stage: number;
  last_email_sent_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// ========================================
// PINCODE COD TYPES
// ========================================

export interface PincodeCOD {
  id: string;
  pincode: string;
  city: string;
  state: string;
  is_cod_available: boolean;
  is_serviceable: boolean;
  created_at: Date;
  updated_at: Date;
}

// ========================================
// ADMIN TYPES
// ========================================

export interface Admin2FA {
  id: string;
  admin_id: string;
  totp_secret?: string;
  is_totp_enabled: boolean;
  phone_verified: boolean;
  backup_codes?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  module: string;
  entity_id?: string;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: Date;
}

// ========================================
// API REQUEST/RESPONSE TYPES
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ========================================
// AUTH TYPES
// ========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface OTPLoginRequest {
  phone: string;
  otp?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ========================================
// PRODUCT FILTER TYPES
// ========================================

export interface ProductFilters {
  category?: string;
  size?: ProductSize[];
  color?: string[];
  min_price?: number;
  max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  search?: string;
}

// ========================================
// ANALYTICS TYPES
// ========================================

export interface SalesSummary {
  total_revenue: number;
  total_orders: number;
  avg_order_value: number;
  chart_data: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  total_sales: number;
  total_revenue: number;
  units_sold: number;
}

// ========================================
// SHIPPING TYPES
// ========================================

export interface ShippingRate {
  pincode: string;
  is_cod_available: boolean;
  shipping_charge: number;
  estimated_days: number;
}

export interface TrackingInfo {
  tracking_number: string;
  current_status: string;
  estimated_delivery: Date;
  tracking_events: {
    status: string;
    location: string;
    timestamp: Date;
  }[];
}

// ========================================
// RECOMMENDATION TYPES
// ========================================

export interface RecommendationResult {
  frequently_bought_together: Product[];
  similar_products: Product[];
  personalized_suggestions: Product[];
}

// ========================================
// EXPORT ALL
// ========================================

export * from './index';
