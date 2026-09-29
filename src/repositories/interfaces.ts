import {
  Order,
  OrderStatus,
  Product,
  Merchant,
  RiderProfile,
  PlatformEvent,
  AuditLog,
  SupportTicket,
  CODReconciliationRecord,
  DeliveryZone,
} from '../types';
import {
  DbUser,
  DbPaymentTransaction,
  DbIdempotencyRecord,
} from '../db/schema';

/**
 * Base generic repository interface.
 */
export interface IRepository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  findMany(filter?: Partial<T> | ((item: T) => boolean)): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  count(filter?: Partial<T> | ((item: T) => boolean)): Promise<number>;
}

/**
 * Transaction Context and Atomic Execution Manager.
 */
export interface ITransactionContext {
  txId: string;
  correlationId: string;
  timestamp: string;
  rollbackActions: (() => Promise<void> | void)[];
  registerRollback(action: () => Promise<void> | void): void;
}

/**
 * Order Repository Interface with domain-specific operations.
 */
export interface IOrderRepository extends IRepository<Order> {
  findByOrderNumber(orderNumber: string): Promise<Order | null>;
  findByCustomerId(customerId: string): Promise<Order[]>;
  findByMerchantId(merchantId: string): Promise<Order[]>;
  findByRiderId(riderId: string): Promise<Order[]>;
  updateStatusWithTimeline(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    txContext?: ITransactionContext
  ): Promise<Order>;
}

/**
 * Product & Inventory Repository Interface.
 */
export interface IProductRepository extends IRepository<Product> {
  findByMerchantId(merchantId: string): Promise<Product[]>;
  findByCategory(category: string): Promise<Product[]>;
  reserveStock(productId: string, quantity: number, txContext?: ITransactionContext): Promise<boolean>;
  releaseStock(productId: string, quantity: number, txContext?: ITransactionContext): Promise<boolean>;
  updateStock(productId: string, newStock: number): Promise<Product>;
}

/**
 * Payment & Escrow Repository Interface.
 */
export interface IPaymentRepository extends IRepository<DbPaymentTransaction> {
  findByOrderId(orderId: string): Promise<DbPaymentTransaction[]>;
  findByIdempotencyKey(key: string): Promise<DbPaymentTransaction | null>;
  confirmPayment(id: string, gatewayRef?: string, txContext?: ITransactionContext): Promise<DbPaymentTransaction>;
}

/**
 * Idempotency Records Repository Interface.
 */
export interface IIdempotencyRepository {
  getRecord(key: string): Promise<DbIdempotencyRecord | null>;
  saveRecord(record: DbIdempotencyRecord): Promise<void>;
  clearExpired(): Promise<number>;
}

/**
 * Platform Event & Audit Repository Interface.
 */
export interface IPlatformEventRepository {
  appendEvent(event: PlatformEvent): Promise<PlatformEvent>;
  getAllEvents(): Promise<PlatformEvent[]>;
  getEventsByOrder(orderId: string): Promise<PlatformEvent[]>;
  getEventsByCorrelation(correlationId: string): Promise<PlatformEvent[]>;
}
