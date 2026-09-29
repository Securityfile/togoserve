/**
 * ToGoServe Production Database Schema Blueprint
 * Relational Schema Definitions for PostgreSQL / Google Cloud SQL
 * 
 * Defines all 18 core entity domains + idempotency records.
 * Provides both TypeScript domain contracts and SQL DDL representations.
 */

// ==========================================
// 1. USERS & IDENTITY
// ==========================================
export type DbUserRole = 'customer' | 'merchant' | 'rider' | 'supplier' | 'admin';
export type DbUserStatus = 'active' | 'pending_verification' | 'suspended' | 'deactivated';

export interface DbUser {
  id: string; // UUID primary key
  email: string;
  phoneNumber: string; // E.164 Philippine format (+639xxxxxxxxx)
  passwordHash: string;
  role: DbUserRole;
  status: DbUserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
  lastLoginAt?: string;
}

// ==========================================
// 2. BUSINESSES
// ==========================================
export type DbBusinessStatus = 'draft' | 'under_review' | 'verified' | 'rejected' | 'suspended';

export interface DbBusiness {
  id: string; // UUID
  ownerUserId: string; // Foreign key -> users.id
  legalName: string;
  tradeName: string;
  taxIdentificationNumber: string; // Philippine BIR TIN (e.g. 000-123-456-000)
  registrationType: 'sole_proprietorship' | 'partnership' | 'corporation' | 'cooperative';
  dtiSecRegistrationNumber: string;
  barangayClearanceUrl?: string;
  mayorsPermitUrl?: string;
  birCertificateOfRegistrationUrl?: string;
  status: DbBusinessStatus;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. MERCHANTS (Physical & Virtual Stores)
// ==========================================
export interface DbMerchant {
  id: string; // UUID
  businessId: string; // Foreign key -> businesses.id
  name: string;
  category: string; // Restaurants, Groceries, Convenience, Pharmacy, Retail, Flowers, Pet Care
  cuisine?: string;
  rating: number; // e.g. 4.85
  reviewCount: number;
  address: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
  openingHours: string;
  coverImageUrl: string;
  logoUrl: string;
  commissionRate: number; // e.g. 0.15 (15%)
  isTogoServePlus: boolean;
  minOrderAmount: number;
  deliveryFeeBase: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 4. PRODUCTS & MULTI-CATEGORY ATTRIBUTES
// ==========================================
export interface DbProduct {
  id: string; // UUID
  merchantId: string; // Foreign key -> merchants.id
  category: string;
  name: string;
  description: string;
  price: number;
  costPrice: number;
  imageUrl: string;
  sku: string;
  barcode?: string;
  isAvailable: boolean;
  isPopular: boolean;
  optionsSchema?: any; // JSONB options & choices
  categoryAttributes?: any; // JSONB vertical attributes
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 5. SERVICES
// ==========================================
export interface DbService {
  id: string;
  merchantId: string;
  serviceType: 'delivery' | 'padala_courier' | 'table_reservation' | 'pharmacist_consultation';
  serviceName: string;
  description: string;
  basePrice: number;
  perKmRate?: number;
  isActive: boolean;
  slaMinutes: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 6. INVENTORY
// ==========================================
export interface DbInventory {
  id: string;
  productId: string; // Foreign key -> products.id (UNIQUE)
  currentStock: number;
  reservedStock: number; // Items currently locked in checkout
  availableStock: number; // currentStock - reservedStock
  lowStockThreshold: number;
  reorderQuantity: number;
  allowBackorder: boolean;
  outOfStockAction: 'hide' | 'show_sold_out' | 'allow_substitution';
  lastRestockedAt?: string;
  updatedAt: string;
}

// ==========================================
// 7. CARTS & CART ITEMS
// ==========================================
export interface DbCart {
  id: string;
  customerId: string; // Foreign key -> users.id
  merchantId?: string;
  sessionToken?: string;
  voucherCode?: string;
  voucherDiscount: number;
  deliveryTip: number;
  deliveryType: 'delivery' | 'pickup';
  updatedAt: string;
}

export interface DbCartItem {
  id: string;
  cartId: string; // Foreign key -> carts.id
  productId: string; // Foreign key -> products.id
  name: string;
  unitPrice: number;
  quantity: number;
  selectedOptions?: Record<string, any>; // JSONB
  specialInstructions?: string;
  totalPrice: number;
  createdAt: string;
}

// ==========================================
// 8. ORDERS & ORDER ITEMS
// ==========================================
export interface DbOrder {
  id: string;
  orderNumber: string; // e.g. TG-8821
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantLatitude: number;
  merchantLongitude: number;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  status: string; // 23-state OrderStatus
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending_cod' | 'refunded' | 'failed';
  deliveryAddress: Record<string, any>; // JSONB PhilippineAddress
  deliveryType: 'delivery' | 'pickup';
  subtotal: number;
  discount: number;
  voucherCode?: string;
  voucherDiscount: number;
  deliveryFee: number;
  serviceFee: number;
  smallOrderFee: number;
  tip: number;
  tax: number;
  total: number;
  pickupCode: string; // e.g. PU-882
  deliveryPin: string; // e.g. 4892
  notes?: string;
  timeline: any[]; // JSONB OrderTimelineEvent[]
  createdAt: string;
  updatedAt: string;
}

export interface DbOrderItem {
  id: string;
  orderId: string; // Foreign key -> orders.id
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedOptions?: Record<string, any>;
  specialInstructions?: string;
  totalPrice: number;
}

// ==========================================
// 9. PAYMENTS & TRANSACTIONS
// ==========================================
export type DbPaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface DbPaymentTransaction {
  id: string;
  orderId: string; // Foreign key -> orders.id
  payerUserId: string;
  paymentMethod: 'gcash' | 'maya' | 'qrph' | 'card' | 'online_banking' | 'wallet' | 'cod';
  amount: number;
  feeAmount: number;
  status: DbPaymentStatus;
  gatewayReference?: string;
  idempotencyKey: string; // Prevents duplicate charges
  rawGatewayResponse?: Record<string, any>; // JSONB
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 10. DELIVERIES & WAYPOINTS
// ==========================================
export interface DbDelivery {
  id: string;
  orderId: string; // Foreign key -> orders.id
  riderId?: string;
  deliveryType: 'standard_delivery' | 'padala_express' | 'padala_same_day' | 'padala_scheduled';
  vehicleType: 'motorcycle' | 'sedan' | 'mpv' | 'van' | 'truck';
  parcelDimensions?: Record<string, any>; // JSONB (weightKg, L, W, H, volumetricWeight)
  declaredValue: number;
  insuranceTierId?: string;
  insuranceFee: number;
  proofOfDelivery?: Record<string, any>; // JSONB (signatureUrl, photoUrl, verifiedPin)
  pickupTime?: string;
  deliveryTime?: string;
  status: 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface DbDeliveryWaypoint {
  id: string;
  deliveryId: string; // Foreign key -> deliveries.id
  stopNumber: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  landmark?: string;
  instructions?: string;
  status: 'pending' | 'arrived' | 'completed' | 'failed';
  codAmount?: number;
  epod?: Record<string, any>;
  updatedAt: string;
}

// ==========================================
// 11. DRIVERS & RIDERS
// ==========================================
export interface DbRider {
  id: string;
  userId: string; // Foreign key -> users.id
  name: string;
  phone: string;
  avatarUrl: string;
  rating: number;
  totalTrips: number;
  vehicleType: string;
  plateNumber: string;
  driverLicenseNumber: string;
  isOnline: boolean;
  status: 'offline' | 'available' | 'offer_received' | 'delivering' | 'suspended';
  walletBalance: number;
  latitude: number;
  longitude: number;
  todayEarnings: Record<string, any>; // JSONB
  currentOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 12. SUPPLIERS & B2B PROCUREMENT
// ==========================================
export interface DbSupplier {
  id: string;
  businessId: string; // Foreign key -> businesses.id
  companyName: string;
  category: string; // Packaging, Commissary, Produce, Dry Goods, Pharma
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  warehouseAddress: string;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DbSupplierProduct {
  id: string;
  supplierId: string; // Foreign key -> suppliers.id
  itemName: string;
  description: string;
  sku: string;
  unit: string; // Sack (25kg), Box (100 units), Crate
  bulkPricePerUnit: number;
  minimumOrderQuantity: number;
  inStockQuantity: number;
  leadTimeDays: number;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 13. CUSTOMER PROFILES & SAVED ADDRESSES
// ==========================================
export interface DbCustomerProfile {
  id: string;
  userId: string; // Foreign key -> users.id (UNIQUE)
  fullName: string;
  phoneNumber: string;
  walletBalance: number;
  isTogoServePlus: boolean;
  plusExpiresAt?: string;
  savedFavorites: string[]; // JSONB merchant ID array
  createdAt: string;
  updatedAt: string;
}

export interface DbSavedAddress {
  id: string;
  customerId: string; // Foreign key -> users.id
  label: 'Home' | 'Office' | 'Condo' | 'Parents' | 'Other';
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  building?: string;
  unitNumber?: string;
  postalCode: string;
  landmark: string;
  instructions?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
}

// ==========================================
// 14. SUPPORT TICKETS
// ==========================================
export interface DbSupportTicket {
  id: string;
  orderId?: string; // Foreign key -> orders.id
  customerId: string;
  customerName: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved';
  assignedAgent: string;
  description: string;
  resolution?: string;
  refundAmount?: number;
  createdAt: string;
  resolvedAt?: string;
}

// ==========================================
// 15. NOTIFICATIONS
// ==========================================
export interface DbNotification {
  id: string;
  recipientUserId: string; // Foreign key -> users.id
  roleTarget: DbUserRole;
  title: string;
  body: string;
  notificationType: 'order_update' | 'rider_telematics' | 'hitl_approval' | 'marketing' | 'safety';
  dataPayload?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// ==========================================
// 16. AI ACTIONS & TASK PLANS
// ==========================================
export interface DbAIAction {
  id: string;
  agentId: string;
  taskName: string;
  autonomyLevel: number; // 0 to 5
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'ESCALATED' | 'COMPLETED';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactDescription: string;
  inputPayload: Record<string, any>;
  outputPayload?: Record<string, any>;
  approvedBy?: string;
  decisionTimestamp?: string;
  createdAt: string;
}

// ==========================================
// 17. AI DECISIONS & OBSERVATIONS
// ==========================================
export interface DbAIDecision {
  id: string;
  agentId: string;
  orderId?: string;
  actionType: string;
  confidence: number;
  reasonCodes: string[];
  candidateEvaluations?: Record<string, any>;
  humanOverrideReason?: string;
  humanOverrideBy?: string;
  createdAt: string;
}

// ==========================================
// 18. AUDIT RECORDS & PLATFORM EVENTS LEDGER
// ==========================================
export interface DbPlatformEvent {
  sequenceNumber: number; // Monotonic BIGSERIAL
  eventId: string; // UUID
  eventType: string;
  timestamp: string;
  actorType: 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN' | 'AI_AGENT' | 'SYSTEM';
  actorId: string;
  entityType: string;
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata: Record<string, any>;
  correlationId: string;
  orderId?: string;
}

export interface DbAuditLog {
  id: string;
  userId: string;
  role: string;
  action: string;
  record: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress: string;
  timestamp: string;
}

// ==========================================
// 19. IDEMPOTENCY RECORDS
// ==========================================
export interface DbIdempotencyRecord {
  idempotencyKey: string; // Primary Key
  operationType: string; // e.g. 'CREATE_ORDER', 'PROCESS_PAYMENT', 'CANCEL_ORDER'
  callerId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  requestPayloadHash: string;
  responsePayload?: Record<string, any>;
  statusCode?: number;
  createdAt: string;
  expiresAt: string; // 24-hour expiry
}

// ==========================================
// POSTGRESQL DDL GENERATOR (Phase 1 Blueprint)
// ==========================================
export const POSTGRESQL_SCHEMA_DDL = `
-- TOGOSERVE PRODUCTION SCHEMA BLUEPRINT (PostgreSQL / Cloud SQL)
-- Version 1.0.0 (Master Directive Phase 03)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'customer',
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255) NOT NULL,
    tin VARCHAR(32) NOT NULL,
    registration_type VARCHAR(64) NOT NULL,
    dti_sec_registration_number VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'under_review',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Merchants Table
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    cuisine VARCHAR(128),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    address TEXT NOT NULL,
    barangay VARCHAR(128) NOT NULL,
    city VARCHAR(128) NOT NULL,
    province VARCHAR(128) NOT NULL,
    postal_code VARCHAR(16) NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    opening_hours VARCHAR(128),
    cover_image_url TEXT,
    logo_url TEXT,
    commission_rate NUMERIC(4, 2) DEFAULT 0.15,
    is_togo_serve_plus BOOLEAN DEFAULT FALSE,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_merchants_category ON merchants(category);
CREATE INDEX IF NOT EXISTS idx_merchants_city ON merchants(city);

-- 4. Products Table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    category VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
    image_url TEXT,
    sku VARCHAR(64) NOT NULL,
    barcode VARCHAR(64),
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    options_schema JSONB,
    category_attributes JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- 5. Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL DEFAULT 0,
    reserved_stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    reorder_quantity INTEGER NOT NULL DEFAULT 20,
    allow_backorder BOOLEAN DEFAULT FALSE,
    out_of_stock_action VARCHAR(32) DEFAULT 'show_sold_out',
    last_restocked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(32) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    customer_name VARCHAR(128) NOT NULL,
    customer_phone VARCHAR(32) NOT NULL,
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE RESTRICT,
    merchant_name VARCHAR(128) NOT NULL,
    rider_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL,
    payment_method VARCHAR(32) NOT NULL,
    payment_status VARCHAR(32) NOT NULL DEFAULT 'pending_cod',
    delivery_address JSONB NOT NULL,
    delivery_type VARCHAR(32) NOT NULL DEFAULT 'delivery',
    subtotal NUMERIC(10, 2) NOT NULL,
    discount NUMERIC(10, 2) DEFAULT 0,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tip NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    pickup_code VARCHAR(16) NOT NULL,
    delivery_pin VARCHAR(16) NOT NULL,
    timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 7. Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    payer_user_id UUID NOT NULL REFERENCES users(id),
    payment_method VARCHAR(32) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    fee_amount NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'pending',
    gateway_reference VARCHAR(128),
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    raw_gateway_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(order_id);

-- 8. Idempotency Records Table
CREATE TABLE IF NOT EXISTS idempotency_records (
    idempotency_key VARCHAR(128) PRIMARY KEY,
    operation_type VARCHAR(64) NOT NULL,
    caller_id VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    request_payload_hash VARCHAR(128) NOT NULL,
    response_payload JSONB,
    status_code INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON idempotency_records(expires_at);

-- 9. Platform Events Ledger (Append-Only)
CREATE TABLE IF NOT EXISTS platform_events_ledger (
    sequence_number BIGSERIAL PRIMARY KEY,
    event_id UUID UNIQUE NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    actor_type VARCHAR(32) NOT NULL,
    actor_id VARCHAR(128) NOT NULL,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(128) NOT NULL,
    previous_state VARCHAR(64),
    new_state VARCHAR(64),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id VARCHAR(128) NOT NULL,
    order_id VARCHAR(128)
);
CREATE INDEX IF NOT EXISTS idx_events_order_id ON platform_events_ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON platform_events_ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_events_correlation ON platform_events_ledger(correlation_id);
`;
