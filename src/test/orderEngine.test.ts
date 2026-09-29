import { describe, it, expect } from 'vitest';
import { VALID_ORDER_TRANSITIONS, UnifiedOrderStatus } from '../types/orderEngine';

describe('Order State Machine & Transition Rules', () => {
  it('should allow valid happy path order transitions', () => {
    expect(VALID_ORDER_TRANSITIONS['CART']).toContain('PENDING_PAYMENT');
    expect(VALID_ORDER_TRANSITIONS['PENDING_PAYMENT']).toContain('PAYMENT_CONFIRMED');
    expect(VALID_ORDER_TRANSITIONS['PAYMENT_CONFIRMED']).toContain('ORDER_PLACED');
    expect(VALID_ORDER_TRANSITIONS['ORDER_PLACED']).toContain('MERCHANT_PENDING');
    expect(VALID_ORDER_TRANSITIONS['MERCHANT_PENDING']).toContain('MERCHANT_ACCEPTED');
    expect(VALID_ORDER_TRANSITIONS['MERCHANT_ACCEPTED']).toContain('PREPARING');
    expect(VALID_ORDER_TRANSITIONS['PREPARING']).toContain('READY_FOR_PICKUP');
    expect(VALID_ORDER_TRANSITIONS['READY_FOR_PICKUP']).toContain('SEARCHING_RIDER');
    expect(VALID_ORDER_TRANSITIONS['SEARCHING_RIDER']).toContain('RIDER_ASSIGNED');
    expect(VALID_ORDER_TRANSITIONS['RIDER_ASSIGNED']).toContain('RIDER_TO_MERCHANT');
    expect(VALID_ORDER_TRANSITIONS['PICKUP_VERIFIED']).toContain('IN_DELIVERY');
    expect(VALID_ORDER_TRANSITIONS['DELIVERY_VERIFICATION']).toContain('DELIVERED');
    expect(VALID_ORDER_TRANSITIONS['DELIVERED']).toContain('COMPLETED');
  });

  it('should prevent unauthorized state skipping (e.g. CART directly to COMPLETED)', () => {
    const validFromCart = VALID_ORDER_TRANSITIONS['CART'];
    expect(validFromCart).not.toContain('COMPLETED');
    expect(validFromCart).not.toContain('IN_DELIVERY');
    expect(validFromCart).not.toContain('DELIVERED');
  });

  it('should support valid exception transitions for cancellations and refunds', () => {
    expect(VALID_ORDER_TRANSITIONS['MERCHANT_PENDING']).toContain('MERCHANT_REJECTED');
    expect(VALID_ORDER_TRANSITIONS['MERCHANT_REJECTED']).toContain('REFUNDED');
    expect(VALID_ORDER_TRANSITIONS['COMPLETED']).toContain('REFUND_REQUESTED');
    expect(VALID_ORDER_TRANSITIONS['REFUND_REQUESTED']).toContain('REFUNDED');
  });
});
