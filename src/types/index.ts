export type UserRole = 'customer' | 'merchant' | 'rider' | 'admin';

export interface PhilippineAddress {
  region: string;
  province: string;
  city: string;
  barangay: string;
  street: string;
  village?: string;
  building?: string;
  unitNumber?: string;
  postalCode: string;
  landmark: string;
  instructions?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export type OrderStatus =
  | 'cart'
  | 'placed'
  | 'payment_confirmed'
  | 'merchant_notified'
  | 'merchant_accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'searching_rider'
  | 'rider_assigned'
  | 'rider_going_merchant'
  | 'rider_at_merchant'
  | 'pickup_verified'
  | 'order_picked_up'
  | 'on_the_way'
  | 'near_customer'
  | 'rider_arrived'
  | 'delivery_verified'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'disputed';

export type PaymentMethod =
  | 'gcash'
  | 'maya'
  | 'qrph'
  | 'card'
  | 'online_banking'
  | 'wallet'
  | 'cod';

export interface ProductOption {
  id: string;
  name: string;
  type: 'radio' | 'checkbox';
  required?: boolean;
  choices: {
    id: string;
    label: string;
    extraPrice: number;
  }[];
}

export interface Product {
  id: string;
  merchantId: string;
  category: string;
  name: string;
  description: string;
  price: number;
  image: string;
  sku: string;
  isPopular?: boolean;
  isAvailable: boolean;
  stock: number;
  lowStockThreshold: number;
  costPrice: number;
  options?: ProductOption[];
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedOptions?: { [optionName: string]: string | string[] };
  specialInstructions?: string;
  totalPrice: number;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  timestamp: string;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  merchantId: string;
  merchantName: string;
  merchantAddress: string;
  merchantCoordinates: { lat: number; lng: number };
  merchantPhone: string;
  riderId?: string;
  riderName?: string;
  riderPhone?: string;
  riderAvatar?: string;
  riderVehicle?: string;
  riderPlate?: string;
  riderRating?: number;
  riderCoordinates?: { lat: number; lng: number };
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending_cod' | 'refunded' | 'failed';
  deliveryAddress: PhilippineAddress;
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
  totalAmount?: number; // Convenient alias for total
  pickupCode: string; // e.g. PU-882
  deliveryPin: string; // e.g. 4892
  notes?: string;
  createdAt: string;
  updatedAt: string;
  estimatedDeliveryMinutes: number;
  timeline: OrderTimelineEvent[];
  review?: {
    merchantRating: number;
    riderRating: number;
    comment: string;
    createdAt: string;
  };
}

export interface Merchant {
  id: string;
  name: string;
  category:
    | 'Restaurants'
    | 'Groceries'
    | 'Convenience'
    | 'Pharmacy'
    | 'Retail'
    | 'Flowers'
    | 'Pet Supplies'
    | 'Coffee & Milk Tea';
  cuisine?: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  minOrder: number;
  isOpen: boolean;
  openingHours: string;
  address: string;
  barangay: string;
  city: string;
  coordinates: { lat: number; lng: number };
  coverImage: string;
  logo: string;
  promotions: string[];
  tags: string[];
  isTogoServePlus: boolean;
  commissionRate: number; // e.g. 0.18
}

export type MerchantCategory = Merchant['category'];

export interface RiderProfile {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  vehicleType: string; // e.g. Yamaha NMAX 155
  vehicle?: string; // alias
  plateNumber: string; // e.g. NCR 4821 XY
  isOnline: boolean;
  status: 'offline' | 'available' | 'offer_received' | 'delivering';
  walletBalance: number;
  todayEarnings: {
    basePay: number;
    distancePay: number;
    incentives: number;
    tips: number;
    codCollected: number;
    deductions: number;
    netEarnings: number;
  };
  completedTripsToday?: number;
  acceptanceRate?: number;
  currentOrderId?: string;
  coordinates: { lat: number; lng: number };
}

export interface DeliveryOffer {
  orderId: string;
  merchantName: string;
  merchantAddress: string;
  pickupAddress?: string; // alias
  dropoffAddress?: string; // alias
  customerArea: string;
  pickupDistanceKm: number;
  deliveryDistanceKm: number;
  totalDistanceKm: number;
  distanceKm?: number; // alias
  estimatedEarnings: number;
  estimatedDurationMin: number;
  paymentMethod: PaymentMethod;
  expiresAt: number; // timestamp
}

export interface DeliveryZone {
  id: string;
  name: string;
  city: string;
  barangays: string[];
  baseFee: number;
  perKmFee: number;
  minOrder: number;
  surgeMultiplier: number;
  radiusKm: number;
  activeRiders: number;
  activeOrders: number;
  status: 'normal' | 'high_demand' | 'surge';
}

export interface SupportTicket {
  id: string;
  orderId: string;
  customerName: string;
  category:
    | 'Missing Items'
    | 'Wrong Items'
    | 'Damaged Items'
    | 'Late Delivery'
    | 'Rider Issue'
    | 'Merchant Issue'
    | 'Payment Problem'
    | 'Refund Request'
    | 'Safety Concern';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved';
  assignedAgent: string;
  description: string;
  createdAt: string;
  resolution?: string;
  refundAmount?: number;
}

export interface AuditLog {
  id: string;
  user: string;
  role: string;
  action: string;
  record: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  ip: string;
}

export interface CODReconciliationRecord {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName: string;
  riderName: string;
  amount: number;
  status: 'pending_remittance' | 'remitted' | 'reconciled' | 'disputed';
  collectedAt: string;
  remittedAt?: string;
}

export interface PackageDeliveryRequest {
  id?: string;
  senderName: string;
  senderPhone: string;
  senderBarangay: string;
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientBarangay: string;
  recipientAddress: string;
  packageType: 'Documents' | 'Food & Groceries' | 'Fragile Items' | 'Parcels & Boxes';
  vehicleType: 'Motorcycle' | 'MPV / 4-Wheels';
  itemDescription: string;
  codAmount?: number;
  distanceKm: number;
  fare: number;
  notes?: string;
}

export * from './aiOs';
export * from './orderEngine';
