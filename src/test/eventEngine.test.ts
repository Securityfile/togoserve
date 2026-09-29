import { describe, it, expect, vi } from 'vitest';
import {
  publishPlatformEvent,
  subscribeToPlatformEvents,
  getPlatformEvents,
} from '../services/eventEngine';
import { PlatformEvent } from '../types/orderEngine';

describe('Event-Driven Platform Kernel', () => {
  it('should publish and subscribe to immutable domain events', () => {
    const subscriber = vi.fn();
    const unsubscribe = subscribeToPlatformEvents(subscriber);

    const testEvent: PlatformEvent = {
      eventId: `test_${Date.now()}`,
      eventType: 'ORDER_CREATED',
      timestamp: new Date().toISOString(),
      actorType: 'CUSTOMER',
      actorId: 'cust_test_101',
      entityType: 'ORDER',
      entityId: 'ord_test_001',
      previousState: 'PENDING_PAYMENT',
      newState: 'ORDER_PLACED',
      metadata: { total: 450, paymentMethod: 'gcash' },
      correlationId: 'corr_test_001',
      orderId: 'ord_test_001',
    };

    const published = publishPlatformEvent(testEvent);

    expect(subscriber).toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalledWith(published);

    const events = getPlatformEvents();
    expect(events.some((e) => e.eventId === published.eventId)).toBe(true);

    unsubscribe();
  });

  it('should enforce required event metadata and correlation ID', () => {
    const rawEvent = {
      eventType: 'DISPATCH_REQUESTED' as const,
      actorType: 'SYSTEM' as const,
      actorId: 'dispatch_kernel',
      entityType: 'DISPATCH' as const,
      entityId: 'disp_102',
      metadata: { reason: 'Order ready at Mang Inasal' },
      correlationId: 'corr_disp_102',
    };

    const published = publishPlatformEvent(rawEvent);
    expect(published.eventId).toBeDefined();
    expect(published.timestamp).toBeDefined();
    expect(published.correlationId).toBe('corr_disp_102');
  });
});
