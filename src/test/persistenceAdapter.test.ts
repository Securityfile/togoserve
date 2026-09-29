import { describe, it, expect, beforeEach } from 'vitest';
import {
  OrderRepository,
  ProductRepository,
  PaymentRepository,
} from '../services/persistenceAdapter';
import { Order, Product } from '../types';

describe('Milestone 3 — Persistence Adapter & Repository Layer', () => {
  let orderRepo: OrderRepository;
  let productRepo: ProductRepository;
  let paymentRepo: PaymentRepository;

  const mockProduct: Product = {
    id: 'prod_test_01',
    merchantId: 'm1',
    category: 'Mains',
    name: 'Grilled Pork Liempo',
    description: 'Charcoal-grilled pork belly with spiced soy dip.',
    price: 240,
    image: 'https://example.com/liempo.jpg',
    sku: 'KF-LIEMPO-01',
    isAvailable: true,
    stock: 15,
    lowStockThreshold: 3,
    costPrice: 110,
  };

  const mockOrder: Order = {
    id: 'ord_test_01',
    orderNumber: 'TG-9901',
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
      landmark: 'One Serendra',
      coordinates: { lat: 14.5503, lng: 121.0504 },
    },
    deliveryType: 'delivery',
    subtotal: 240,
    discount: 0,
    voucherDiscount: 0,
    deliveryFee: 49,
    serviceFee: 15,
    smallOrderFee: 0,
    tip: 20,
    tax: 0,
    total: 324,
    pickupCode: 'PU-991',
    deliveryPin: '7721',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimatedDeliveryMinutes: 25,
    timeline: [],
  };

  beforeEach(() => {
    orderRepo = new OrderRepository(undefined, [mockOrder]);
    productRepo = new ProductRepository(undefined, [mockProduct]);
    paymentRepo = new PaymentRepository(undefined, []);
  });

  it('supports basic CRUD operations across entities', async () => {
    // 1. Find by ID
    const found = await orderRepo.findById('ord_test_01');
    expect(found).not.toBeNull();
    expect(found?.orderNumber).toBe('TG-9901');

    // 2. Create entity
    const newProduct: Product = {
      ...mockProduct,
      id: 'prod_test_02',
      name: 'Sinigang Salmon Belly',
      sku: 'KF-SAL-02',
      stock: 10,
    };
    await productRepo.create(newProduct);
    const totalCount = await productRepo.count();
    expect(totalCount).toBe(2);

    // 3. Update entity
    const updated = await productRepo.update('prod_test_02', { price: 290 });
    expect(updated.price).toBe(290);

    // 4. Delete entity
    const deleted = await productRepo.delete('prod_test_02');
    expect(deleted).toBe(true);
    expect(await productRepo.findById('prod_test_02')).toBeNull();
  });

  it('executes domain-specific queries without direct localStorage dependencies', async () => {
    const byNumber = await orderRepo.findByOrderNumber('TG-9901');
    expect(byNumber?.id).toBe('ord_test_01');

    const byCustomer = await orderRepo.findByCustomerId('c_maria');
    expect(byCustomer.length).toBe(1);

    const byMerchant = await orderRepo.findByMerchantId('m1');
    expect(byMerchant.length).toBe(1);

    const nonExistent = await orderRepo.findByOrderNumber('TG-0000');
    expect(nonExistent).toBeNull();
  });

  it('appends chronological timeline events atomically during status transitions', async () => {
    const updated = await orderRepo.updateStatusWithTimeline(
      'ord_test_01',
      'merchant_accepted',
      'Kitchen accepted order'
    );

    expect(updated.status).toBe('merchant_accepted');
    expect(updated.timeline.length).toBe(1);
    expect(updated.timeline[0].status).toBe('merchant_accepted');
    expect(updated.timeline[0].description).toBe('Kitchen accepted order');
  });

  it('manages product stock reservations and releases safely', async () => {
    // Initial stock is 15
    const reserved = await productRepo.reserveStock('prod_test_01', 5);
    expect(reserved).toBe(true);
    const prodAfterReserve = await productRepo.findById('prod_test_01');
    expect(prodAfterReserve?.stock).toBe(10);

    // Release 2 back to inventory
    const released = await productRepo.releaseStock('prod_test_01', 2);
    expect(released).toBe(true);
    const prodAfterRelease = await productRepo.findById('prod_test_01');
    expect(prodAfterRelease?.stock).toBe(12);

    // Reject reservation if stock is insufficient
    await expect(productRepo.reserveStock('prod_test_01', 50)).rejects.toThrow(
      /Insufficient stock/
    );
  });
});
