import { describe, it, expect, beforeEach } from 'vitest';
import {
  IdempotencyManager,
  AuthorizationBoundary,
} from '../services/persistenceAdapter';

describe('Milestone 3 — Idempotency & Authorization Boundaries', () => {
  beforeEach(() => {
    IdempotencyManager.clear();
  });

  // ==========================================
  // IDEMPOTENCY TESTS
  // ==========================================
  it('executes operation once and caches response for subsequent matching keys', async () => {
    let executionCounter = 0;

    const opPayload = { orderId: 'ord_123', amount: 500 };
    const operation = async () => {
      executionCounter++;
      return { status: 'CONFIRMED', authCode: 'AUTH_8829' };
    };

    // First call: executes operation
    const firstCall = await IdempotencyManager.checkOrExecute(
      'idem_key_abc',
      'PROCESS_PAYMENT',
      'user_maria',
      opPayload,
      operation
    );
    expect(firstCall.wasCached).toBe(false);
    expect(firstCall.result.status).toBe('CONFIRMED');
    expect(executionCounter).toBe(1);

    // Second call with same key: returns cached response without running operation
    const secondCall = await IdempotencyManager.checkOrExecute(
      'idem_key_abc',
      'PROCESS_PAYMENT',
      'user_maria',
      opPayload,
      operation
    );
    expect(secondCall.wasCached).toBe(true);
    expect(secondCall.result.status).toBe('CONFIRMED');
    expect(executionCounter).toBe(1); // Did not re-execute!
  });

  it('rejects concurrent duplicate execution while an operation is pending', async () => {
    let releaseLock: () => void = () => {};
    const hangingPromise = new Promise<{ done: boolean }>((resolve) => {
      releaseLock = () => resolve({ done: true });
    });

    // Start long-running async operation (runs in background)
    const p1 = IdempotencyManager.checkOrExecute(
      'idem_concurrent_key',
      'CREATE_ORDER',
      'user_maria',
      {},
      () => hangingPromise
    );

    // Attempt second execution with same key before first completes
    await expect(
      IdempotencyManager.checkOrExecute(
        'idem_concurrent_key',
        'CREATE_ORDER',
        'user_maria',
        {},
        async () => ({ done: true })
      )
    ).rejects.toThrow(/Concurrent execution in progress/);

    // Cleanup
    releaseLock();
    await p1;
  });

  // ==========================================
  // AUTHORIZATION BOUNDARY TESTS
  // ==========================================
  it('enforces customer authorization boundaries on order creation', () => {
    // 1. Valid customer creating order
    expect(() =>
      AuthorizationBoundary.validateOrderCreation('customer', 'c_maria', 'c_maria')
    ).not.toThrow();

    // 2. Admin can create on behalf
    expect(() =>
      AuthorizationBoundary.validateOrderCreation('admin', 'c_maria', 'admin_1')
    ).not.toThrow();

    // 3. Merchant cannot place consumer orders
    expect(() =>
      AuthorizationBoundary.validateOrderCreation('merchant', 'c_maria', 'c_maria')
    ).toThrow(/Only customers may place orders/);

    // 4. Customer cannot place order pretending to be another customer
    expect(() =>
      AuthorizationBoundary.validateOrderCreation('customer', 'c_other_user', 'c_maria')
    ).toThrow(/unauthorized to order on behalf/);
  });

  it('enforces merchant authorization boundaries on store mutations', () => {
    // 1. Valid merchant updating own store
    expect(() =>
      AuthorizationBoundary.validateMerchantAction('merchant', 'm1', 'm1')
    ).not.toThrow();

    // 2. Admin can update any store
    expect(() =>
      AuthorizationBoundary.validateMerchantAction('admin', 'm1', 'admin_1')
    ).not.toThrow();

    // 3. Customer cannot perform merchant actions
    expect(() =>
      AuthorizationBoundary.validateMerchantAction('customer', 'm1', 'm1')
    ).toThrow(/Merchant authorization required/);

    // 4. Merchant cannot update a competitor store
    expect(() =>
      AuthorizationBoundary.validateMerchantAction('merchant', 'm2', 'm1')
    ).toThrow(/Access denied to merchant 'm2'/);
  });

  it('enforces supervisor sign-off on refunds exceeding autonomous limits (> ₱500)', () => {
    // 1. Low-risk autonomous refund (₱250) allowed for non-admin
    expect(() =>
      AuthorizationBoundary.validateRefundAuthorization('customer', 250)
    ).not.toThrow();

    // 2. High-value refund (₱850) rejected without admin supervisor role
    expect(() =>
      AuthorizationBoundary.validateRefundAuthorization('customer', 850)
    ).toThrow(/exceeds autonomous limit/);

    // 3. Admin supervisor can authorize high-value refund (₱850)
    expect(() =>
      AuthorizationBoundary.validateRefundAuthorization('admin', 850)
    ).not.toThrow();
  });
});
