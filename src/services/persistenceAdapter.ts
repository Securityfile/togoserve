import {
  Order,
  OrderStatus,
  Product,
  Merchant,
  RiderProfile,
  PlatformEvent,
  UserRole,
} from '../types';
import {
  DbPaymentTransaction,
  DbIdempotencyRecord,
} from '../db/schema';
import {
  IRepository,
  ITransactionContext,
  IOrderRepository,
  IProductRepository,
  IPaymentRepository,
  IIdempotencyRepository,
  IPlatformEventRepository,
} from '../repositories/interfaces';

/**
 * Universal safe storage loader/saver for browser continuity.
 */
function safeStorageLoad<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSave(key: string, value: any) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // Ignore quota errors in private browsing
  }
}

// ==========================================
// 1. TRANSACTION MANAGER (ACID / Rollback)
// ==========================================
export class TransactionManager {
  static createTransaction(correlationId?: string): ITransactionContext {
    const txId = 'tx_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
    const corrId = correlationId || 'corr_' + Math.random().toString(36).substring(2, 9);
    const rollbackActions: (() => Promise<void> | void)[] = [];

    return {
      txId,
      correlationId: corrId,
      timestamp: new Date().toISOString(),
      rollbackActions,
      registerRollback(action: () => Promise<void> | void) {
        rollbackActions.push(action);
      },
    };
  }

  static async rollback(ctx: ITransactionContext): Promise<void> {
    // Execute registered rollback actions in reverse (LIFO)
    for (let i = ctx.rollbackActions.length - 1; i >= 0; i--) {
      try {
        await ctx.rollbackActions[i]();
      } catch (err) {
        console.error(`[TransactionManager] Rollback action failed in tx ${ctx.txId}:`, err);
      }
    }
  }

  static async executeInTransaction<R>(
    operation: (ctx: ITransactionContext) => Promise<R>,
    correlationId?: string
  ): Promise<R> {
    const ctx = TransactionManager.createTransaction(correlationId);
    try {
      const result = await operation(ctx);
      return result;
    } catch (error) {
      await TransactionManager.rollback(ctx);
      throw error;
    }
  }
}

// ==========================================
// 2. IDEMPOTENCY MANAGER (Replay Protection)
// ==========================================
export class IdempotencyManager {
  private static store: Map<string, DbIdempotencyRecord> = new Map();

  static async checkOrExecute<T>(
    key: string,
    operationType: string,
    callerId: string,
    payload: any,
    executeFn: () => Promise<T>
  ): Promise<{ result: T; wasCached: boolean }> {
    const payloadHash = JSON.stringify(payload);
    const existing = IdempotencyManager.store.get(key);

    if (existing) {
      if (existing.status === 'COMPLETED' && existing.responsePayload) {
        return {
          result: existing.responsePayload as T,
          wasCached: true,
        };
      }
      if (existing.status === 'PENDING') {
        throw new Error(
          `[Idempotency] Concurrent execution in progress for key '${key}'. Please retry.`
        );
      }
    }

    // Register as PENDING
    const record: DbIdempotencyRecord = {
      idempotencyKey: key,
      operationType,
      callerId,
      status: 'PENDING',
      requestPayloadHash: payloadHash,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    IdempotencyManager.store.set(key, record);

    try {
      const result = await executeFn();
      record.status = 'COMPLETED';
      record.responsePayload = result as any;
      IdempotencyManager.store.set(key, record);
      return { result, wasCached: false };
    } catch (err: any) {
      record.status = 'FAILED';
      record.responsePayload = { error: err.message };
      IdempotencyManager.store.set(key, record);
      throw err;
    }
  }

  static getRecord(key: string): DbIdempotencyRecord | null {
    return IdempotencyManager.store.get(key) || null;
  }

  static clear(): void {
    IdempotencyManager.store.clear();
  }
}

// ==========================================
// 3. SERVER-AUTHORITATIVE AUTHORIZATION BOUNDARY
// ==========================================
export class AuthorizationBoundary {
  /**
   * Enforces that only an authenticated customer or admin can place orders.
   */
  static validateOrderCreation(userRole: UserRole, customerId: string, callerId: string): void {
    if (userRole === 'admin') return;
    if (userRole !== 'customer') {
      throw new Error(`[AuthBoundary] Only customers may place orders. Current role: '${userRole}'.`);
    }
    if (customerId && callerId && customerId !== callerId) {
      throw new Error(`[AuthBoundary] Caller '${callerId}' unauthorized to order on behalf of '${customerId}'.`);
    }
  }

  /**
   * Enforces that only the assigned merchant can accept/prepare orders or edit their catalog.
   */
  static validateMerchantAction(userRole: UserRole, targetMerchantId: string, callerMerchantId?: string): void {
    if (userRole === 'admin') return;
    if (userRole !== 'merchant') {
      throw new Error(`[AuthBoundary] Merchant authorization required. Current role: '${userRole}'.`);
    }
    if (callerMerchantId && targetMerchantId !== callerMerchantId) {
      throw new Error(`[AuthBoundary] Access denied to merchant '${targetMerchantId}'.`);
    }
  }

  /**
   * Enforces that only the assigned rider can pick up or deliver an order.
   */
  static validateRiderAction(userRole: UserRole, assignedRiderId?: string, callerRiderId?: string): void {
    if (userRole === 'admin') return;
    if (userRole !== 'rider') {
      throw new Error(`[AuthBoundary] Rider authorization required. Current role: '${userRole}'.`);
    }
    if (assignedRiderId && callerRiderId && assignedRiderId !== callerRiderId) {
      throw new Error(`[AuthBoundary] Rider '${callerRiderId}' is not assigned to this delivery.`);
    }
  }

  /**
   * Enforces supervisory sign-off on refunds.
   * Autonomous/User refunds > ₱500 require Admin supervisor approval.
   */
  static validateRefundAuthorization(userRole: UserRole, refundAmount: number): void {
    if (refundAmount > 500 && userRole !== 'admin') {
      throw new Error(
        `[AuthBoundary] Refund of ₱${refundAmount} exceeds autonomous limit (₱500). Supervisor sign-off required.`
      );
    }
  }
}

// ==========================================
// 4. BASE REPOSITORY (DUAL-WRITE ADAPTER)
// ==========================================
export class BaseRepository<T extends { id: string }> implements IRepository<T> {
  protected items: Map<string, T> = new Map();
  protected storageKey?: string;

  constructor(storageKey?: string, initialData?: T[]) {
    this.storageKey = storageKey;
    const initialList = storageKey
      ? safeStorageLoad<T[]>(storageKey, initialData || [])
      : initialData || [];

    initialList.forEach((item) => {
      this.items.set(item.id, item);
    });
  }

  protected persistSnapshot(): void {
    if (this.storageKey) {
      safeStorageSave(this.storageKey, Array.from(this.items.values()));
    }
  }

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }

  async findMany(filter?: Partial<T> | ((item: T) => boolean)): Promise<T[]> {
    const all = Array.from(this.items.values());
    if (!filter) return all;
    if (typeof filter === 'function') {
      return all.filter(filter);
    }
    return all.filter((item) => {
      return Object.entries(filter).every(([k, v]) => (item as any)[k] === v);
    });
  }

  async create(entity: T): Promise<T> {
    this.items.set(entity.id, entity);
    this.persistSnapshot();
    return entity;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const existing = this.items.get(id);
    if (!existing) {
      throw new Error(`[Repository] Entity with ID '${id}' not found.`);
    }
    const updated = { ...existing, ...updates };
    this.items.set(id, updated);
    this.persistSnapshot();
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.items.delete(id);
    if (deleted) this.persistSnapshot();
    return deleted;
  }

  async count(filter?: Partial<T> | ((item: T) => boolean)): Promise<number> {
    const matches = await this.findMany(filter);
    return matches.length;
  }
}

// ==========================================
// 5. DOMAIN-SPECIFIC REPOSITORIES
// ==========================================

export class OrderRepository extends BaseRepository<Order> implements IOrderRepository {
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const matches = await this.findMany((o) => o.orderNumber === orderNumber);
    return matches[0] || null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.findMany((o) => o.customerId === customerId);
  }

  async findByMerchantId(merchantId: string): Promise<Order[]> {
    return this.findMany((o) => o.merchantId === merchantId);
  }

  async findByRiderId(riderId: string): Promise<Order[]> {
    return this.findMany((o) => o.riderId === riderId);
  }

  async updateStatusWithTimeline(
    orderId: string,
    newStatus: OrderStatus,
    note?: string,
    txContext?: ITransactionContext
  ): Promise<Order> {
    const order = await this.findById(orderId);
    if (!order) {
      throw new Error(`[OrderRepository] Order '${orderId}' not found.`);
    }

    const previousStatus = order.status;
    const previousTimeline = [...order.timeline];

    const timelineEvent = {
      status: newStatus,
      label: newStatus.replace(/_/g, ' ').toUpperCase(),
      timestamp: new Date().toISOString(),
      description: note || `Order status updated to ${newStatus}`,
    };

    const updated = await this.update(orderId, {
      status: newStatus,
      timeline: [...order.timeline, timelineEvent],
      updatedAt: new Date().toISOString(),
    });

    if (txContext) {
      // Register atomic rollback if transaction fails later
      txContext.registerRollback(async () => {
        await this.update(orderId, {
          status: previousStatus,
          timeline: previousTimeline,
        });
      });
    }

    return updated;
  }
}

export class ProductRepository extends BaseRepository<Product> implements IProductRepository {
  async findByMerchantId(merchantId: string): Promise<Product[]> {
    return this.findMany((p) => p.merchantId === merchantId);
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.findMany((p) => p.category === category);
  }

  async reserveStock(productId: string, quantity: number, txContext?: ITransactionContext): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product) return false;
    if (product.stock < quantity) {
      throw new Error(
        `[ProductRepository] Insufficient stock for product '${product.name}' (${product.id}). Available: ${product.stock}, requested: ${quantity}.`
      );
    }

    const prevStock = product.stock;
    await this.update(productId, {
      stock: product.stock - quantity,
      isAvailable: product.stock - quantity > 0,
    });

    if (txContext) {
      txContext.registerRollback(async () => {
        await this.update(productId, {
          stock: prevStock,
          isAvailable: prevStock > 0,
        });
      });
    }

    return true;
  }

  async releaseStock(productId: string, quantity: number, txContext?: ITransactionContext): Promise<boolean> {
    const product = await this.findById(productId);
    if (!product) return false;

    const prevStock = product.stock;
    await this.update(productId, {
      stock: product.stock + quantity,
      isAvailable: true,
    });

    if (txContext) {
      txContext.registerRollback(async () => {
        await this.update(productId, {
          stock: prevStock,
          isAvailable: prevStock > 0,
        });
      });
    }

    return true;
  }

  async updateStock(productId: string, newStock: number): Promise<Product> {
    return this.update(productId, {
      stock: Math.max(0, newStock),
      isAvailable: newStock > 0,
    });
  }
}

export class PaymentRepository extends BaseRepository<DbPaymentTransaction> implements IPaymentRepository {
  async findByOrderId(orderId: string): Promise<DbPaymentTransaction[]> {
    return this.findMany((p) => p.orderId === orderId);
  }

  async findByIdempotencyKey(key: string): Promise<DbPaymentTransaction | null> {
    const matches = await this.findMany((p) => p.idempotencyKey === key);
    return matches[0] || null;
  }

  async confirmPayment(
    id: string,
    gatewayRef?: string,
    txContext?: ITransactionContext
  ): Promise<DbPaymentTransaction> {
    const payment = await this.findById(id);
    if (!payment) {
      throw new Error(`[PaymentRepository] Payment transaction '${id}' not found.`);
    }

    const prevStatus = payment.status;
    const prevRef = payment.gatewayReference;

    const updated = await this.update(id, {
      status: 'captured',
      gatewayReference: gatewayRef || payment.gatewayReference || 'GW_' + Date.now(),
      updatedAt: new Date().toISOString(),
    });

    if (txContext) {
      txContext.registerRollback(async () => {
        await this.update(id, {
          status: prevStatus,
          gatewayReference: prevRef,
        });
      });
    }

    return updated;
  }
}
