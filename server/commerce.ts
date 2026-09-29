import { Request, Response } from 'express';
import { executeQuery, executeRun, runTransaction } from './db';
import { AuthenticatedRequest } from './auth';
import { realtimeHub } from './realtime';

export function handleGetMerchants(req: Request, res: Response) {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM merchants WHERE is_open = 1';
    const params: any[] = [];

    if (category && category !== 'All' && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY rating DESC';

    const merchants = executeQuery(sql, params);
    return res.json({ merchants });
  } catch (err: any) {
    return res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
}

export function handleGetProducts(req: Request, res: Response) {
  try {
    const { merchantId, category, search } = req.query;
    let sql = 'SELECT p.*, i.current_stock FROM products p LEFT JOIN inventory i ON p.id = i.product_id WHERE p.is_available = 1';
    const params: any[] = [];

    if (merchantId) {
      sql += ' AND p.merchant_id = ?';
      params.push(merchantId);
    }
    if (category) {
      sql += ' AND p.category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const products = executeQuery(sql, params);
    return res.json({ products });
  } catch (err: any) {
    return res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
}

export function handleCreateOrder(req: AuthenticatedRequest, res: Response) {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (idempotencyKey) {
    const existing = executeQuery('SELECT response_json, status_code FROM idempotency_keys WHERE idempotency_key = ?', [idempotencyKey]);
    if (existing.length > 0) {
      return res.status(existing[0].status_code).json(JSON.parse(existing[0].response_json));
    }
  }

  try {
    const userId = req.user?.userId || 'usr-customer-01';
    const {
      merchantId,
      items,
      paymentMethod = 'gcash',
      deliveryAddress,
      notes = '',
      tip = 0,
      discount = 0,
    } = req.body;

    if (!merchantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Merchant and items are required.' });
    }

    const orderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = `TG-${Math.floor(1000 + Math.random() * 9000)}`;
    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const pickupCode = Math.floor(1000 + Math.random() * 9000).toString();
    const now = new Date().toISOString();

    const result = runTransaction(() => {
      // Calculate totals
      let subtotal = 0;
      for (const it of items) {
        subtotal += (it.price || it.unitPrice || 0) * (it.quantity || 1);
      }

      const deliveryFee = 49.0;
      const serviceFee = 15.0;
      const totalAmount = Math.max(0, subtotal + deliveryFee + serviceFee + tip - discount);

      // 1. Insert order
      executeRun(
        `INSERT INTO orders (id, order_number, customer_id, merchant_id, status, subtotal, delivery_fee, service_fee, discount, tip, total_amount, payment_method, payment_status, delivery_address, notes, pin_code, pickup_code, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'Order Placed', ?, ?, ?, ?, ?, ?, ?, 'authorized', ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          orderNumber,
          userId,
          merchantId,
          subtotal,
          deliveryFee,
          serviceFee,
          discount,
          tip,
          totalAmount,
          paymentMethod,
          typeof deliveryAddress === 'string' ? deliveryAddress : JSON.stringify(deliveryAddress),
          notes,
          pinCode,
          pickupCode,
          now,
          now,
        ]
      );

      // 2. Insert order items and reserve inventory
      for (const it of items) {
        const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const pId = it.productId || it.id;
        const pName = it.name || 'Custom Item';
        const qty = it.quantity || 1;
        const price = it.price || it.unitPrice || 0;

        executeRun(
          `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, unit_price, total_price, selected_options, special_instructions)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [itemId, orderId, pId, pName, qty, price, price * qty, JSON.stringify(it.selectedOptions || {}), it.specialInstructions || '']
        );

        // Decrement inventory stock atomically
        executeRun(
          `UPDATE inventory SET current_stock = MAX(0, current_stock - ?), reserved_stock = reserved_stock + ?, updated_at = ? WHERE product_id = ?`,
          [qty, qty, now, pId]
        );
      }

      // 3. Insert Payment Record
      const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const txnRef = `TXN-${orderNumber}-${Date.now().toString(36).toUpperCase()}`;
      executeRun(
        `INSERT INTO payments (id, order_id, amount, currency, provider, transaction_reference, status, created_at)
         VALUES (?, ?, ?, 'PHP', ?, ?, 'authorized', ?)`,
        [paymentId, orderId, totalAmount, paymentMethod, txnRef, now]
      );

      // 4. Audit Log
      executeRun(
        `INSERT INTO audit_records (id, entity_type, entity_id, action, actor_user_id, actor_role, changes_json, timestamp)
         VALUES (?, 'order', ?, 'ORDER_CREATED', ?, 'customer', ?, ?)`,
        [
          `aud-${Date.now()}`,
          orderId,
          userId,
          JSON.stringify({ orderNumber, totalAmount, paymentMethod }),
          now,
        ]
      );

      return {
        orderId,
        orderNumber,
        status: 'Order Placed',
        subtotal,
        deliveryFee,
        serviceFee,
        totalAmount,
        pinCode,
        pickupCode,
        createdAt: now,
      };
    });

    // Broadcast Realtime SSE Event to Merchant & Customer & Admin
    realtimeHub.broadcast({
      type: 'ORDER_CREATED',
      payload: {
        orderId: result.orderId,
        orderNumber: result.orderNumber,
        merchantId,
        totalAmount: result.totalAmount,
        status: result.status,
      },
      targetRole: 'merchant',
    });

    const responsePayload = {
      message: 'Order created successfully with persistent transaction guarantees',
      order: result,
    };

    if (idempotencyKey) {
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      executeRun(
        `INSERT OR REPLACE INTO idempotency_keys (idempotency_key, operation_type, response_json, status_code, created_at, expires_at)
         VALUES (?, 'CREATE_ORDER', ?, 201, ?, ?)`,
        [idempotencyKey, JSON.stringify(responsePayload), now, expiresAt]
      );
    }

    return res.status(201).json(responsePayload);
  } catch (err: any) {
    console.error('[Commerce] Order creation error:', err);
    return res.status(500).json({ error: 'TRANSACTION_FAILED', message: err.message });
  }
}

export function handleUpdateOrderStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { newStatus, riderId } = req.body;
    const actorRole = req.user?.role || 'operator';
    const actorId = req.user?.userId || 'usr-system';
    const now = new Date().toISOString();

    const orders = executeQuery('SELECT * FROM orders WHERE id = ? OR order_number = ?', [id, id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }

    const order = orders[0];

    runTransaction(() => {
      executeRun(
        `UPDATE orders SET status = ?, rider_id = COALESCE(?, rider_id), updated_at = ? WHERE id = ?`,
        [newStatus, riderId || null, now, order.id]
      );

      executeRun(
        `INSERT INTO audit_records (id, entity_type, entity_id, action, actor_user_id, actor_role, changes_json, timestamp)
         VALUES (?, 'order', ?, 'STATUS_TRANSITION', ?, ?, ?, ?)`,
        [
          `aud-${Date.now()}`,
          order.id,
          actorId,
          actorRole,
          JSON.stringify({ from: order.status, to: newStatus, riderId }),
          now,
        ]
      );

      if (newStatus === 'Delivered') {
        executeRun(`UPDATE orders SET delivered_at = ? WHERE id = ?`, [now, order.id]);
        executeRun(
          `UPDATE inventory SET reserved_stock = MAX(0, reserved_stock - (SELECT IFNULL(SUM(quantity), 0) FROM order_items WHERE order_id = ?)) WHERE product_id IN (SELECT product_id FROM order_items WHERE order_id = ?)`,
          [order.id, order.id]
        );
      }
    });

    realtimeHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      payload: {
        orderId: order.id,
        orderNumber: order.order_number,
        newStatus,
        riderId,
      },
    });

    return res.json({ message: 'Order status updated successfully', status: newStatus });
  } catch (err: any) {
    return res.status(500).json({ error: 'STATUS_UPDATE_FAILED', message: err.message });
  }
}

export function handleVerifyPod(req: AuthenticatedRequest, res: Response) {
  try {
    const { orderId, pinCode, photoUrl, recipientName } = req.body;
    const orders = executeQuery('SELECT * FROM orders WHERE id = ? OR order_number = ?', [orderId, orderId]);

    if (orders.length === 0) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }

    const order = orders[0];
    if (order.pin_code !== pinCode) {
      return res.status(400).json({ error: 'INVALID_PIN', message: 'Delivery PIN code does not match customer recipient token.' });
    }

    const podId = `pod-${Date.now()}`;
    const now = new Date().toISOString();

    runTransaction(() => {
      executeRun(
        `INSERT OR REPLACE INTO proof_of_delivery (id, order_id, recipient_name, pin_verified, photo_url, captured_at)
         VALUES (?, ?, ?, 1, ?, ?)`,
        [podId, order.id, recipientName || 'Customer Recipient', photoUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80', now]
      );

      executeRun(`UPDATE orders SET status = 'Delivered', delivered_at = ?, updated_at = ? WHERE id = ?`, [now, now, order.id]);
    });

    realtimeHub.broadcast({
      type: 'ORDER_STATUS_CHANGED',
      payload: {
        orderId: order.id,
        orderNumber: order.order_number,
        newStatus: 'Delivered',
        ePodVerified: true,
      },
    });

    return res.json({ message: 'e-POD verified successfully. Order marked as Delivered.', podId });
  } catch (err: any) {
    return res.status(500).json({ error: 'EPOD_VERIFY_FAILED', message: err.message });
  }
}

export function handleGetOrders(req: AuthenticatedRequest, res: Response) {
  try {
    const { role, userId } = req.user || { role: 'admin', userId: '' };
    const { merchantId, riderId } = req.query;

    let sql = 'SELECT * FROM orders';
    const params: any[] = [];

    if (role === 'customer' && userId) {
      sql += ' WHERE customer_id = ?';
      params.push(userId);
    } else if (merchantId) {
      sql += ' WHERE merchant_id = ?';
      params.push(merchantId);
    } else if (riderId) {
      sql += ' WHERE rider_id = ?';
      params.push(riderId);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const orders = executeQuery(sql, params);

    // Attach items
    const ordersWithItems = orders.map((o) => {
      const items = executeQuery('SELECT * FROM order_items WHERE order_id = ?', [o.id]);
      return { ...o, items };
    });

    return res.json({ orders: ordersWithItems });
  } catch (err: any) {
    return res.status(500).json({ error: 'DB_ERROR', message: err.message });
  }
}
