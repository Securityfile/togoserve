import { describe, it, expect, beforeAll } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, executeQuery, executeRun, runTransaction } from '../../server/db';
import { generateToken, verifyToken, AuthUserPayload } from '../../server/auth';
import { realtimeHub } from '../../server/realtime';

describe('Production Backend Persistence & Authentication Suite', () => {
  beforeAll(async () => {
    await getDb();
  });

  describe('1. SQLite Persistent Database & Schema Validation', () => {
    it('initializes and verifies the core entity tables', () => {
      const tables = executeQuery<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );
      const tableNames = tables.map((t) => t.name);

      expect(tableNames).toContain('users');
      expect(tableNames).toContain('businesses');
      expect(tableNames).toContain('merchants');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('inventory');
      expect(tableNames).toContain('orders');
      expect(tableNames).toContain('order_items');
      expect(tableNames).toContain('payments');
      expect(tableNames).toContain('deliveries');
      expect(tableNames).toContain('proof_of_delivery');
      expect(tableNames).toContain('audit_records');
      expect(tableNames).toContain('idempotency_keys');
    });

    it('successfully queries seeded Philippine merchants and products across verticals', () => {
      const merchants = executeQuery('SELECT * FROM merchants');
      expect(merchants.length).toBeGreaterThanOrEqual(7);

      const categories = merchants.map((m: any) => m.category);
      expect(categories).toContain('Restaurants');
      expect(categories).toContain('Groceries');
      expect(categories).toContain('Convenience');
      expect(categories).toContain('Pharmacy');
      expect(categories).toContain('Flowers');
      expect(categories).toContain('Pet Care');
      expect(categories).toContain('Retail');

      const products = executeQuery('SELECT * FROM products');
      expect(products.length).toBeGreaterThanOrEqual(10);
    });

    it('enforces ACID transaction boundary with atomic rollback on failure', () => {
      const initialUsersCount = executeQuery('SELECT COUNT(*) as count FROM users')[0].count;

      expect(() => {
        runTransaction(() => {
          executeRun(
            `INSERT INTO users (id, email, password_hash, full_name, phone_number, role, created_at, updated_at)
             VALUES ('test-rollback-user', 'rollback@test.ph', 'hash', 'Test Rollback', '+639111111111', 'customer', '2026-01-01', '2026-01-01')`
          );
          // Deliberate error to trigger rollback
          throw new Error('Simulated mid-transaction failure');
        });
      }).toThrow('Simulated mid-transaction failure');

      const afterUsersCount = executeQuery('SELECT COUNT(*) as count FROM users')[0].count;
      expect(afterUsersCount).toBe(initialUsersCount);
    });
  });

  describe('2. Real Authentication, Passwords & JWT Sessions', () => {
    it('verifies seeded user accounts have valid bcrypt hashed passwords', () => {
      const customer = executeQuery('SELECT * FROM users WHERE email = ?', ['customer@togoserve.com'])[0];
      expect(customer).toBeDefined();
      expect(customer.password_hash.startsWith('$2')).toBe(true);

      const isValid = bcrypt.compareSync('Customer123!', customer.password_hash);
      expect(isValid).toBe(true);

      const isInvalid = bcrypt.compareSync('WrongPassword', customer.password_hash);
      expect(isInvalid).toBe(false);
    });

    it('generates and verifies secure JWT tokens with role claims', () => {
      const payload: AuthUserPayload = {
        userId: 'usr-customer-01',
        email: 'customer@togoserve.com',
        role: 'customer',
        fullName: 'Maria Santos',
      };

      const token = generateToken(payload);
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = verifyToken(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe('usr-customer-01');
      expect(decoded?.role).toBe('customer');
      expect(decoded?.email).toBe('customer@togoserve.com');
    });

    it('rejects tampered or forged JWT tokens', () => {
      const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.tampered_signature';
      const result = verifyToken(forgedToken);
      expect(result).toBeNull();
    });
  });

  describe('3. Real-Time Platform Event Hub', () => {
    it('broadcasts real-time events without throwing errors', () => {
      expect(() => {
        realtimeHub.broadcast({
          type: 'ORDER_CREATED',
          payload: { orderNumber: 'TG-TEST-01', status: 'Order Placed' },
        });
      }).not.toThrow();
    });
  });
});
