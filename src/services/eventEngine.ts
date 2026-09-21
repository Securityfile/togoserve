import {
  PlatformEvent,
  PlatformEventType,
  PlatformActorType,
  PlatformEntityType,
  ControlledOrderStatus,
  Order,
} from '../types';

// In-memory event repository
let eventStore: PlatformEvent[] = [];
const eventListeners: ((event: PlatformEvent) => void)[] = [];

export const publishPlatformEvent = (params: {
  eventType: PlatformEventType;
  actorType: PlatformActorType;
  actorId: string;
  entityType: PlatformEntityType;
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  orderId?: string;
  customTimestamp?: string;
}): PlatformEvent => {
  const event: PlatformEvent = {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventType: params.eventType,
    timestamp: params.customTimestamp || new Date().toISOString(),
    actorType: params.actorType,
    actorId: params.actorId,
    entityType: params.entityType,
    entityId: params.entityId,
    previousState: params.previousState,
    newState: params.newState,
    metadata: params.metadata || {},
    correlationId: params.correlationId || `corr_${params.orderId || params.entityId}`,
    orderId: params.orderId,
  };

  eventStore = [event, ...eventStore];

  // Notify subscribers (e.g. AI Observation Layer)
  eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error('Error in event listener:', err);
    }
  });

  return event;
};

export const subscribeToPlatformEvents = (
  listener: (event: PlatformEvent) => void
): (() => void) => {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx !== -1) {
      eventListeners.splice(idx, 1);
    }
  };
};

export const getAllPlatformEvents = (): PlatformEvent[] => {
  return [...eventStore];
};

export const getEventsForOrder = (orderId: string): PlatformEvent[] => {
  return eventStore
    .filter((e) => e.orderId === orderId || e.entityId === orderId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// Generate chronological timeline display from events
export const buildChronologicalOrderTimeline = (orderId: string) => {
  const events = getEventsForOrder(orderId);
  return events.map((e) => {
    const d = new Date(e.timestamp);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return {
      eventId: e.eventId,
      eventType: e.eventType,
      time: timeStr,
      timestamp: e.timestamp,
      actor: `${e.actorType} (${e.actorId})`,
      description: e.metadata.description || `${e.eventType} [${e.previousState || 'NONE'} → ${e.newState || 'NONE'}]`,
      metadata: e.metadata,
    };
  });
};

// Seed initial platform events for existing orders
export const seedInitialEvents = (orders: Order[]) => {
  if (eventStore.length > 0) return;

  orders.forEach((ord) => {
    const orderCreatedTime = new Date(ord.createdAt).toISOString();
    const corrId = `corr_${ord.id}`;

    publishPlatformEvent({
      eventType: 'ORDER_CREATED',
      actorType: 'CUSTOMER',
      actorId: ord.customerId,
      entityType: 'ORDER',
      entityId: ord.id,
      previousState: 'CART',
      newState: 'ORDER_PLACED',
      metadata: { total: ord.total, itemsCount: ord.items.length, merchantName: ord.merchantName },
      correlationId: corrId,
      orderId: ord.id,
      customTimestamp: orderCreatedTime,
    });

    publishPlatformEvent({
      eventType: 'PAYMENT_CONFIRMED',
      actorType: 'SYSTEM',
      actorId: 'payment_gateway_ph',
      entityType: 'PAYMENT',
      entityId: `pay_${ord.id}`,
      previousState: 'PENDING_PAYMENT',
      newState: 'PAYMENT_CONFIRMED',
      metadata: { method: ord.paymentMethod, amount: ord.total },
      correlationId: corrId,
      orderId: ord.id,
      customTimestamp: new Date(new Date(ord.createdAt).getTime() + 2000).toISOString(),
    });

    publishPlatformEvent({
      eventType: 'MERCHANT_NOTIFIED',
      actorType: 'SYSTEM',
      actorId: 'notification_engine',
      entityType: 'MERCHANT',
      entityId: ord.merchantId,
      previousState: 'PAYMENT_CONFIRMED',
      newState: 'MERCHANT_PENDING',
      metadata: { merchantId: ord.merchantId },
      correlationId: corrId,
      orderId: ord.id,
      customTimestamp: new Date(new Date(ord.createdAt).getTime() + 4000).toISOString(),
    });

    if (ord.status !== 'placed') {
      publishPlatformEvent({
        eventType: 'MERCHANT_ACCEPTED',
        actorType: 'MERCHANT',
        actorId: ord.merchantId,
        entityType: 'ORDER',
        entityId: ord.id,
        previousState: 'MERCHANT_PENDING',
        newState: 'MERCHANT_ACCEPTED',
        metadata: { prepEstimateMinutes: 18 },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 84000).toISOString(),
      });

      publishPlatformEvent({
        eventType: 'PREPARATION_STARTED',
        actorType: 'MERCHANT',
        actorId: ord.merchantId,
        entityType: 'ORDER',
        entityId: ord.id,
        previousState: 'MERCHANT_ACCEPTED',
        newState: 'PREPARING',
        metadata: { kitchenStation: 'Station-1' },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 87000).toISOString(),
      });

      publishPlatformEvent({
        eventType: 'DISPATCH_REQUESTED',
        actorType: 'SYSTEM',
        actorId: 'dispatch_engine',
        entityType: 'DISPATCH',
        entityId: `disp_${ord.id}`,
        previousState: 'PREPARING',
        newState: 'SEARCHING_RIDER',
        metadata: { zone: 'Makati Central Hub', priority: 'NORMAL' },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 540000).toISOString(),
      });
    }

    if (ord.riderId) {
      publishPlatformEvent({
        eventType: 'RIDER_ASSIGNED',
        actorType: 'ADMIN',
        actorId: 'dispatcher_ops_1',
        entityType: 'RIDER',
        entityId: ord.riderId,
        previousState: 'SEARCHING_RIDER',
        newState: 'RIDER_ASSIGNED',
        metadata: { riderName: ord.riderName, vehicle: ord.riderVehicle },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 560000).toISOString(),
      });
    }

    if (ord.status === 'completed') {
      publishPlatformEvent({
        eventType: 'DELIVERY_COMPLETED',
        actorType: 'RIDER',
        actorId: ord.riderId || 'rdr_default',
        entityType: 'DELIVERY',
        entityId: `del_${ord.id}`,
        previousState: 'DELIVERY_VERIFICATION',
        newState: 'COMPLETED',
        metadata: { podMethod: 'CUSTOMER_PIN_VERIFIED', deliveryPin: ord.deliveryPin },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 1800000).toISOString(),
      });

      publishPlatformEvent({
        eventType: 'MERCHANT_SETTLEMENT_RECORDED',
        actorType: 'SYSTEM',
        actorId: 'finance_settlement_service',
        entityType: 'FINANCE',
        entityId: `settle_${ord.id}`,
        metadata: { gross: ord.total, commissionRate: 0.18, netPayout: ord.total * 0.82 },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 1802000).toISOString(),
      });

      publishPlatformEvent({
        eventType: 'RIDER_EARNINGS_RECORDED',
        actorType: 'SYSTEM',
        actorId: 'rider_payout_service',
        entityType: 'FINANCE',
        entityId: `earn_${ord.id}`,
        metadata: { basePay: 55, distancePay: 35, tip: ord.tip, netTotal: 90 + ord.tip },
        correlationId: corrId,
        orderId: ord.id,
        customTimestamp: new Date(new Date(ord.createdAt).getTime() + 1803000).toISOString(),
      });
    }
  });
};
