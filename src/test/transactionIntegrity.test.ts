import { describe, it, expect, beforeEach } from 'vitest';
import {
  TransactionManager,
  OrderRepository,
  ProductRepository,
  PaymentRepository,
} from '../services/persistenceAdapter';
import { Order, Product } from '../types';

describe('Milestone 3 — Transaction Integrity & Atomic Rollback Engine', () => {
  let orderRepo: OrderRepository;
  let productRepo: ProductRepository;
  let paymentRepo: PaymentRepository;

  const mockProduct: Product = {
    id: 'prod_tx_01',
    merchantId: 'm1',
    category: 'Mains',
    name: 'Bacolod Chicken Inasal',
    description: 'Grilled marinated chicken.',
    price: 200,
    image: 'https://example.com/inasal.jpg',
    sku: 'KF-INA-TX',
    isAvailable: true,
    stock: 10,
    lowStockThreshold: 2,
    costPrice: 90,
  };

  beforeEach(() => {
    orderRepo = new OrderRepository(undefined, []);
    productRepo = new ProductRepository(undefined, [mockProduct]);
    paymentRepo = new PaymentRepository(undefined, []);
  });

  it('commits multi-entity mutations atomically when all transaction steps succeed', async () => {
    const result = await TransactionManager.executeInTransaction(async (tx) => {
      // Step 1: Reserve 3 units of stock
      await productRepo.reserveStock('prod_tx_01', 3, tx);

      // Step 2: Create order
      const newOrder: Order = {
        id: 'ord_tx_success',
        orderNumber: 'TG-7701',
        customerId: 'c_maria',
        customerName: 'Maria Santos',
        customerPhone: '+63 917 888 2341',
        merchantId: 'm1',
        merchantName: 'Kusina Filipina',
        merchantAddress: 'BGC, Taguig',
        merchantCoordinates: { lat: 14.5491, lng: 121.052 },
        merchantPhone: '+63 2 8821 0000',
        items: [],
        status: 'merchant_notified',
        paymentMethod: 'gcash',
        paymentStatus: 'paid',
        deliveryAddress: {
          region: 'NCR',
          province: 'Metro Manila',
          city: 'Taguig',
          barangay: 'Fort Bonifacio',
          street: '26th St',
          postalCode: '1634',
          landmark: 'Serendra',
          coordinates: { lat: 14.5503, lng: 121.0504 },
        },
        deliveryType: 'delivery',
        subtotal: 600,
        discount: 0,
        voucherDiscount: 0,
        deliveryFee: 49,
        serviceFee: 15,
        smallOrderFee: 0,
        tip: 0,
        tax: 0,
        total: 664,
        pickupCode: 'PU-771',
        deliveryPin: '5512',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDeliveryMinutes: 25,
        timeline: [],
      };
      await orderRepo.create(newOrder);

      // Step 3: Record payment transaction
      const paymentTx = await paymentRepo.create({
        id: 'pay_tx_01',
        orderId: newOrder.id,
        payerUserId: 'c_maria',
        paymentMethod: 'gcash',
        amount: 664,
        feeAmount: 0,
        status: 'captured',
        idempotencyKey: 'idem_key_7701',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return { order: newOrder, payment: paymentTx };
    });

    // Verification: All steps persisted
    const updatedProd = await productRepo.findById('prod_tx_01');
    expect(updatedProd?.stock).toBe(7); // 10 - 3 = 7

    const createdOrder = await orderRepo.findById('ord_tx_success');
    expect(createdOrder).not.toBeNull();

    const createdPayment = await paymentRepo.findById('pay_tx_01');
    expect(createdPayment?.status).toBe('captured');
  });

  it('rolls back previous steps automatically when a downstream step fails', async () => {
    const initialProduct = await productRepo.findById('prod_tx_01');
    expect(initialProduct?.stock).toBe(10);

    // Attempt an interrupted transaction that fails at Step 3
    const txPromise = TransactionManager.executeInTransaction(async (tx) => {
      // Step 1: Reserve 4 units of stock (stock becomes 6)
      await productRepo.reserveStock('prod_tx_01', 4, tx);

      // Step 2: Update status on an order
      const newOrder: Order = {
        id: 'ord_tx_fail',
        orderNumber: 'TG-FAIL-01',
        customerId: 'c_maria',
        customerName: 'Maria Santos',
        customerPhone: '+63 917 888 2341',
        merchantId: 'm1',
        merchantName: 'Kusina Filipina',
        merchantAddress: 'BGC, Taguig',
        merchantCoordinates: { lat: 14.5491, lng: 121.052 },
        merchantPhone: '+63 2 8821 0000',
        items: [],
        status: 'placed',
        paymentMethod: 'card',
        paymentStatus: 'pending_cod',
        deliveryAddress: {
          region: 'NCR',
          province: 'Metro Manila',
          city: 'Taguig',
          barangay: 'Fort Bonifacio',
          street: '26th St',
          postalCode: '1634',
          landmark: 'Serendra',
          coordinates: { lat: 14.5503, lng: 121.0504 },
        },
        deliveryType: 'delivery',
        subtotal: 800,
        discount: 0,
        voucherDiscount: 0,
        deliveryFee: 49,
        serviceFee: 15,
        smallOrderFee: 0,
        tip: 0,
        tax: 0,
        total: 864,
        pickupCode: 'PU-999',
        deliveryPin: '1111',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        estimatedDeliveryMinutes: 25,
        timeline: [],
      };
      await orderRepo.create(newOrder);

      // Step 3: Simulated Payment Gateway Timeout / Network Interruption
      throw new Error('PAYMENT_GATEWAY_TIMEOUT: Downstream settlement connection dropped.');
    });

    // Expect transaction to reject with error
    await expect(txPromise).rejects.toThrow('PAYMENT_GATEWAY_TIMEOUT');

    // Verification: Stock was rolled back to exactly 10!
    const rolledBackProduct = await productRepo.findById('prod_tx_01');
    expect(rolledBackProduct?.stock).toBe(10);
  });

  it('assigns unique transaction and correlation IDs to every transaction context', () => {
    const tx1 = TransactionManager.createTransaction('corr_custom_123');
    expect(tx1.txId).toMatch(/^tx_/);
    expect(tx1.correlationId).toBe('corr_custom_123');

    const tx2 = TransactionManager.createTransaction();
    expect(tx2.txId).toMatch(/^tx_/);
    expect(tx2.correlationId).toMatch(/^corr_/);
    expect(tx1.txId).not.toBe(tx2.txId);
  });
});
