import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';
import bcrypt from 'bcryptjs';

let SQL: SqlJsStatic | null = null;
let dbInstance: Database | null = null;

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'togoserve.sqlite');

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const buffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(buffer);
      console.log(`[Database] Loaded persistent SQLite database from ${DB_FILE}`);
    } catch (err) {
      console.warn('[Database] Could not open existing database file, initializing fresh:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
    console.log(`[Database] Initializing new SQLite database`);
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  // Initialize schema
  initializeSchema(dbInstance);

  // Seed default dataset if users table is empty
  seedInitialData(dbInstance);

  // Persist to disk
  saveDb();

  return dbInstance;
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_FILE, buffer);
  } catch (err) {
    console.error('[Database] Failed to persist SQLite database to disk:', err);
  }
}

export function executeQuery<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized');
  const stmt = dbInstance.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export function executeRun(sql: string, params: any[] = []): void {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run(sql, params);
  saveDb();
}

export function runTransaction<T>(work: () => T): T {
  if (!dbInstance) throw new Error('Database not initialized');
  dbInstance.run('BEGIN TRANSACTION;');
  try {
    const result = work();
    dbInstance.run('COMMIT;');
    saveDb();
    return result;
  } catch (err) {
    try {
      dbInstance.run('ROLLBACK;');
    } catch (_rbErr) {
      // Transaction was already aborted or rolled back by SQLite engine
    }
    throw err;
  }
}

function initializeSchema(db: Database): void {
  db.run(`
    -- 1. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      is_email_verified INTEGER NOT NULL DEFAULT 1,
      is_phone_verified INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. Businesses
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      legal_name TEXT NOT NULL,
      trade_name TEXT NOT NULL,
      tin TEXT NOT NULL,
      registration_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'verified',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. Business Locations
    CREATE TABLE IF NOT EXISTS business_locations (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      location_name TEXT NOT NULL,
      address TEXT NOT NULL,
      barangay TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_headquarters INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- 4. Merchants
    CREATE TABLE IF NOT EXISTS merchants (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cuisine TEXT,
      rating REAL NOT NULL DEFAULT 5.0,
      review_count INTEGER NOT NULL DEFAULT 0,
      address TEXT NOT NULL,
      barangay TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      opening_hours TEXT NOT NULL DEFAULT '8:00 AM - 10:00 PM',
      cover_image_url TEXT,
      logo_url TEXT,
      commission_rate REAL NOT NULL DEFAULT 0.15,
      is_togoserve_plus INTEGER NOT NULL DEFAULT 1,
      min_order_amount REAL NOT NULL DEFAULT 100.0,
      delivery_fee_base REAL NOT NULL DEFAULT 49.0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    );

    -- 5. Merchant Staff
    CREATE TABLE IF NOT EXISTS merchant_staff (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      staff_role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 6. Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    -- 7. Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost_price REAL NOT NULL DEFAULT 0.0,
      image_url TEXT,
      sku TEXT NOT NULL,
      is_available INTEGER NOT NULL DEFAULT 1,
      is_popular INTEGER NOT NULL DEFAULT 0,
      options_schema TEXT,
      category_attributes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    -- 8. Product Variants
    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      price_modifier REAL NOT NULL DEFAULT 0.0,
      stock_quantity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 9. Services
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      base_fare REAL NOT NULL,
      per_km_rate REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    -- 10. Inventory
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL UNIQUE,
      current_stock INTEGER NOT NULL DEFAULT 50,
      reserved_stock INTEGER NOT NULL DEFAULT 0,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      reorder_point INTEGER NOT NULL DEFAULT 15,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 11. Inventory Reservations
    CREATE TABLE IF NOT EXISTS inventory_reservations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'reserved',
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 12. Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      default_address_id TEXT,
      wallet_balance REAL NOT NULL DEFAULT 0.0,
      is_togo_plus INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 13. Customer Addresses
    CREATE TABLE IF NOT EXISTS customer_addresses (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL,
      label TEXT NOT NULL,
      full_address TEXT NOT NULL,
      street TEXT NOT NULL,
      barangay TEXT NOT NULL,
      city TEXT NOT NULL,
      province TEXT NOT NULL,
      postal_code TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 14. Carts
    CREATE TABLE IF NOT EXISTS carts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL UNIQUE,
      merchant_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 15. Cart Items
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      selected_options TEXT,
      special_instructions TEXT,
      price REAL NOT NULL,
      FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    -- 16. Orders
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      rider_id TEXT,
      status TEXT NOT NULL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL,
      service_fee REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0.0,
      tip REAL NOT NULL DEFAULT 0.0,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      notes TEXT,
      pin_code TEXT NOT NULL,
      pickup_code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      estimated_delivery_time TEXT,
      delivered_at TEXT,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    -- 17. Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      selected_options TEXT,
      special_instructions TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 18. Payments
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'PHP',
      provider TEXT NOT NULL,
      transaction_reference TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 19. Refunds
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      payment_id TEXT,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL,
      approved_by_user_id TEXT,
      processed_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 20. Promotions
    CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_spend REAL NOT NULL DEFAULT 0.0,
      max_discount REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      valid_until TEXT NOT NULL
    );

    -- 21. Loyalty
    CREATE TABLE IF NOT EXISTS loyalty (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL UNIQUE,
      points_balance INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL DEFAULT 'bronze',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 22. Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      categories TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL
    );

    -- 23. Purchase Orders
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY,
      po_number TEXT UNIQUE NOT NULL,
      merchant_id TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- 24. Procurement Requests
    CREATE TABLE IF NOT EXISTS procurement_requests (
      id TEXT PRIMARY KEY,
      merchant_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      urgency TEXT NOT NULL DEFAULT 'normal',
      status TEXT NOT NULL DEFAULT 'submitted',
      created_at TEXT NOT NULL,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    -- 25. Drivers / Riders
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      license_number TEXT NOT NULL,
      vehicle_id TEXT,
      is_online INTEGER NOT NULL DEFAULT 1,
      current_latitude REAL NOT NULL DEFAULT 14.5547,
      current_longitude REAL NOT NULL DEFAULT 121.0244,
      total_deliveries INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 4.95,
      wallet_balance REAL NOT NULL DEFAULT 0.0,
      cod_collected REAL NOT NULL DEFAULT 0.0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 26. Vehicles
    CREATE TABLE IF NOT EXISTS vehicles (
      id TEXT PRIMARY KEY,
      driver_id TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      plate_number TEXT NOT NULL,
      model TEXT NOT NULL,
      is_approved INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
    );

    -- 27. Deliveries
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      driver_id TEXT,
      pickup_address TEXT NOT NULL,
      dropoff_address TEXT NOT NULL,
      status TEXT NOT NULL,
      vehicle_type TEXT NOT NULL,
      distance_km REAL NOT NULL,
      fare REAL NOT NULL,
      cargo_protection_tier TEXT,
      declared_value REAL,
      created_at TEXT NOT NULL,
      picked_up_at TEXT,
      delivered_at TEXT,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 28. Delivery Stops (Waypoints)
    CREATE TABLE IF NOT EXISTS delivery_stops (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      stop_sequence INTEGER NOT NULL,
      address TEXT NOT NULL,
      recipient_name TEXT NOT NULL,
      recipient_phone TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
    );

    -- 29. GPS Events
    CREATE TABLE IF NOT EXISTS gps_events (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      heading REAL,
      recorded_at TEXT NOT NULL,
      FOREIGN KEY (delivery_id) REFERENCES deliveries(id) ON DELETE CASCADE
    );

    -- 30. Proof of Delivery (e-POD)
    CREATE TABLE IF NOT EXISTS proof_of_delivery (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      delivery_id TEXT,
      recipient_name TEXT NOT NULL,
      pin_verified INTEGER NOT NULL DEFAULT 0,
      signature_url TEXT,
      photo_url TEXT,
      notes TEXT,
      captured_at TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 31. Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 32. Support Tickets
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      order_id TEXT,
      subject TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open',
      assigned_agent_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 33. Reviews
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      driver_id TEXT,
      merchant_rating INTEGER NOT NULL,
      driver_rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 34. AI Actions
    CREATE TABLE IF NOT EXISTS ai_actions (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      action_type TEXT NOT NULL,
      input_prompt TEXT,
      output_payload TEXT,
      confidence REAL NOT NULL,
      requires_approval INTEGER NOT NULL DEFAULT 0,
      is_approved INTEGER NOT NULL DEFAULT 0,
      approved_by TEXT,
      executed_at TEXT,
      created_at TEXT NOT NULL
    );

    -- 35. AI Decisions
    CREATE TABLE IF NOT EXISTS ai_decisions (
      id TEXT PRIMARY KEY,
      action_id TEXT,
      decision_context TEXT,
      reason_codes TEXT,
      risk_tier TEXT NOT NULL DEFAULT 'low',
      created_at TEXT NOT NULL
    );

    -- 36. AI Conversations
    CREATE TABLE IF NOT EXISTS ai_conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      message TEXT NOT NULL,
      sender TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- 37. AI Tasks
    CREATE TABLE IF NOT EXISTS ai_tasks (
      id TEXT PRIMARY KEY,
      task_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      details TEXT,
      created_at TEXT NOT NULL
    );

    -- 38. Audit Records
    CREATE TABLE IF NOT EXISTS audit_records (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      action TEXT NOT NULL,
      actor_user_id TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      changes_json TEXT,
      timestamp TEXT NOT NULL
    );

    -- 39. Platform Events
    CREATE TABLE IF NOT EXISTS platform_events (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      emitted_at TEXT NOT NULL
    );

    -- 40. Idempotency Keys
    CREATE TABLE IF NOT EXISTS idempotency_keys (
      idempotency_key TEXT PRIMARY KEY,
      operation_type TEXT NOT NULL,
      response_json TEXT NOT NULL,
      status_code INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    -- Core Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_products_merchant ON products(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
    CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders(merchant_id);
    CREATE INDEX IF NOT EXISTS idx_orders_rider ON orders(rider_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_records(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);
}

function seedInitialData(db: Database): void {
  const userCheck = db.exec('SELECT COUNT(*) as count FROM users');
  const count = userCheck[0]?.values[0]?.[0] as number;
  if (count && count > 0) {
    return; // Already seeded
  }

  console.log('[Database] Seeding initial production user accounts and commerce verticals...');

  const now = new Date().toISOString();

  // Salt and hash passwords using bcrypt
  const hash = (plain: string) => bcrypt.hashSync(plain, 10);

  // 1. Seed Real User Personas with Secure bcrypt Passwords
  const users = [
    {
      id: 'usr-customer-01',
      email: 'customer@togoserve.com',
      password: hash('Customer123!'),
      fullName: 'Maria Santos',
      phone: '+639171234567',
      role: 'customer',
    },
    {
      id: 'usr-merchant-01',
      email: 'merchant@kusinafilipina.ph',
      password: hash('Merchant123!'),
      fullName: 'Chef Eduardo Cruz',
      phone: '+639189876543',
      role: 'merchant',
    },
    {
      id: 'usr-owner-01',
      email: 'owner@metrofresh.ph',
      password: hash('Owner123!'),
      fullName: 'Carmelo Ramos',
      phone: '+639201112233',
      role: 'business_owner',
    },
    {
      id: 'usr-staff-01',
      email: 'staff@kusinafilipina.ph',
      password: hash('Staff123!'),
      fullName: 'Ana Dizon',
      phone: '+639204445566',
      role: 'business_staff',
    },
    {
      id: 'usr-rider-01',
      email: 'rider@togoserve.com',
      password: hash('Rider123!'),
      fullName: 'Danilo "Kuya Dan" Santos',
      phone: '+639293334444',
      role: 'rider',
    },
    {
      id: 'usr-supplier-01',
      email: 'supplier@agrifresh.ph',
      password: hash('Supplier123!'),
      fullName: 'Roberto Tan',
      phone: '+639335556677',
      role: 'supplier',
    },
    {
      id: 'usr-admin-01',
      email: 'admin@togoserve.com',
      password: hash('AdminPass2026!'),
      fullName: 'System Administrator',
      phone: '+639170000001',
      role: 'admin',
    },
    {
      id: 'usr-op-01',
      email: 'operator@togoserve.com',
      password: hash('Operator2026!'),
      fullName: 'Metro Manila Dispatch Operator',
      phone: '+639170000002',
      role: 'platform_operator',
    },
  ];

  for (const u of users) {
    db.run(
      `INSERT INTO users (id, email, password_hash, full_name, phone_number, role, status, is_email_verified, is_phone_verified, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', 1, 1, ?, ?)`,
      [u.id, u.email, u.password, u.fullName, u.phone, u.role, now, now]
    );
  }

  // Seed Customer Record
  db.run(
    `INSERT INTO customers (id, user_id, default_address_id, wallet_balance, is_togo_plus, created_at)
     VALUES ('cust-01', 'usr-customer-01', 'addr-01', 1250.0, 1, ?)`,
    [now]
  );

  db.run(
    `INSERT INTO customer_addresses (id, customer_id, label, full_address, street, barangay, city, province, postal_code, latitude, longitude, is_default, created_at)
     VALUES ('addr-01', 'cust-01', 'Home (BGC)', 'Unit 24B, High Street Residences, Bonifacio Global City, Taguig', '26th Street', 'Fort Bonifacio', 'Taguig City', 'Metro Manila', '1634', 14.5507, 121.0504, 1, ?)`,
    [now]
  );

  // Seed Driver Record
  db.run(
    `INSERT INTO drivers (id, user_id, license_number, vehicle_id, is_online, current_latitude, current_longitude, total_deliveries, rating, wallet_balance, cod_collected, created_at)
     VALUES ('r1', 'usr-rider-01', 'N01-18-992812', 'veh-01', 1, 14.5547, 121.0244, 482, 4.95, 3420.0, 850.0, ?)`,
    [now]
  );

  db.run(
    `INSERT INTO vehicles (id, driver_id, vehicle_type, plate_number, model, is_approved)
     VALUES ('veh-01', 'r1', 'motorcycle', 'ND-8821', 'Yamaha NMAX 155 (ABS)', 1)`
  );

  // Seed Businesses
  const businesses = [
    {
      id: 'biz-01',
      ownerUserId: 'usr-merchant-01',
      legalName: 'Heritage Culinary Ventures Corp.',
      tradeName: 'Kusina Filipina Heritage',
      tin: '008-219-482-000',
      regType: 'corporation',
    },
    {
      id: 'biz-02',
      ownerUserId: 'usr-owner-01',
      legalName: 'MetroFresh Retail Holdings Inc.',
      tradeName: 'MetroFresh Supermarket',
      tin: '009-441-218-000',
      regType: 'corporation',
    },
    {
      id: 'biz-03',
      ownerUserId: 'usr-merchant-01',
      legalName: 'Mercury Express Healthcare Retail Corp.',
      tradeName: 'Generika Botika Central',
      tin: '003-881-291-000',
      regType: 'corporation',
    },
  ];

  for (const b of businesses) {
    db.run(
      `INSERT INTO businesses (id, owner_user_id, legal_name, trade_name, tin, registration_type, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'verified', ?, ?)`,
      [b.id, b.ownerUserId, b.legalName, b.tradeName, b.tin, b.regType, now, now]
    );
  }

  // Seed 8 Commercial Verticals Merchants
  const merchants = [
    {
      id: 'm1',
      bizId: 'biz-01',
      name: 'Kusina Filipina Heritage',
      category: 'Restaurants',
      cuisine: 'Traditional Filipino, Inasal, Crispy Pata',
      rating: 4.85,
      reviews: 1420,
      address: '77 Ayala Avenue, Legazpi Village',
      barangay: 'San Lorenzo',
      city: 'Makati City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm4',
      bizId: 'biz-02',
      name: 'MetroFresh Supermarket',
      category: 'Groceries',
      cuisine: 'Fresh Produce, Meats, Pantry Staples',
      rating: 4.88,
      reviews: 840,
      address: 'Market! Market! Complex, BGC',
      barangay: 'Fort Bonifacio',
      city: 'Taguig City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm5',
      bizId: 'biz-02',
      name: '7-Fast Convenience 24/7',
      category: 'Convenience',
      cuisine: 'Ready Meals, Cold Beverages, Snacks',
      rating: 4.75,
      reviews: 512,
      address: 'Corner 5th & 32nd St, BGC',
      barangay: 'Fort Bonifacio',
      city: 'Taguig City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm6',
      bizId: 'biz-03',
      name: 'Generika Botika Central',
      category: 'Pharmacy',
      cuisine: 'Prescription Rx, OTC Medicines, Vitamins',
      rating: 4.92,
      reviews: 730,
      address: 'Ground Floor, Medical Plaza, Amorsolo St.',
      barangay: 'Legazpi Village',
      city: 'Makati City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm7',
      bizId: 'biz-01',
      name: 'Dangwa Florals & Bouquets',
      category: 'Flowers',
      cuisine: 'Fresh Roses, Sunflowers, Sympathy, Gifts',
      rating: 4.89,
      reviews: 310,
      address: 'Dos Castillas St., Sampaloc',
      barangay: 'Zone 51',
      city: 'Manila City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1508615070457-7baeba4003ab?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm8',
      bizId: 'biz-02',
      name: 'Bantay & Miming Pet Depot',
      category: 'Pet Care',
      cuisine: 'Pet Nutrition, Treats, Grooming Essentials',
      rating: 4.9,
      reviews: 240,
      address: '28th Street near High Street',
      barangay: 'Fort Bonifacio',
      city: 'Taguig City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=200&q=80',
    },
    {
      id: 'm9',
      bizId: 'biz-01',
      name: 'MetroStyle Apparel & Lifestyle',
      category: 'Retail',
      cuisine: 'Filipino Urbanwear, Canvas Bags, Footwear',
      rating: 4.78,
      reviews: 180,
      address: 'Greenbelt 5 Boutique Area',
      barangay: 'San Lorenzo',
      city: 'Makati City',
      province: 'Metro Manila',
      cover: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      logo: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=200&q=80',
    },
  ];

  for (const m of merchants) {
    db.run(
      `INSERT INTO merchants (id, business_id, name, category, cuisine, rating, review_count, address, barangay, city, province, latitude, longitude, is_open, opening_hours, cover_image_url, logo_url, commission_rate, is_togoserve_plus, min_order_amount, delivery_fee_base, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 14.5547, 121.0244, 1, '8:00 AM - 10:00 PM', ?, ?, 0.15, 1, 100.0, 49.0, ?, ?)`,
      [m.id, m.bizId, m.name, m.category, m.cuisine, m.rating, m.reviews, m.address, m.barangay, m.city, m.province, m.cover, m.logo, now, now]
    );
  }

  // Seed Products across 8 Verticals
  const products = [
    {
      id: 'p1',
      mId: 'm1',
      cat: 'Filipino Mains',
      name: 'Chicken Inasal Solo with Garlic Rice',
      desc: 'Bacolod style marinated grilled quarter chicken with bottomless chicken oil and sinamak dip.',
      price: 199.0,
      img: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=600&q=80',
      sku: 'INA-001',
    },
    {
      id: 'p2',
      mId: 'm1',
      cat: 'Filipino Mains',
      name: 'Crispy Pork Belly Lechon Kawali',
      desc: 'Deep fried crispy pork belly served with homemade liver sauce and spiced cane vinegar.',
      price: 285.0,
      img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      sku: 'LECH-002',
    },
    {
      id: 'p8',
      mId: 'm4',
      cat: 'Grains & Rice',
      name: 'Sinandomeng Premium Rice 5kg',
      desc: 'Locally grown soft fragrant white rice. Harvested in Nueva Ecija.',
      price: 265.0,
      img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
      sku: 'GROC-RICE-05',
    },
    {
      id: 'p10',
      mId: 'm4',
      cat: 'Fresh Produce',
      name: 'Native Red Onions & Garlic Bundle (1kg)',
      desc: 'Bongabon Nueva Ecija native small red onions and Ilocos white garlic.',
      price: 185.0,
      img: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
      sku: 'GROC-ONION-01',
    },
    {
      id: 'p11',
      mId: 'm5',
      cat: 'Ready to Eat',
      name: 'Jumbo Siopao Asado with Sweet Sauce',
      desc: 'Steamed fluffy bun filled with tender slow-cooked pork asado and salted egg slice.',
      price: 55.0,
      img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=600&q=80',
      sku: 'CONV-SIO-01',
    },
    {
      id: 'p14',
      mId: 'm6',
      cat: 'Over-The-Counter',
      name: 'Biogesic Paracetamol 500mg (20 Tablets)',
      desc: 'Fast relief for headache and fever. Gentle on empty stomach.',
      price: 90.0,
      img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
      sku: 'PHARM-BIO-20',
    },
    {
      id: 'p17',
      mId: 'm6',
      cat: 'Prescription Rx',
      name: 'Amoxicillin 500mg Capsules (Strip of 10)',
      desc: 'Antibiotic therapy for bacterial infections. Requires registered pharmacist prescription verification.',
      price: 120.0,
      img: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
      sku: 'PHARM-AMOX-10',
    },
    {
      id: 'p18',
      mId: 'm7',
      cat: 'Bouquets',
      name: 'Benguet Ecuadorian Red Roses (Dozen)',
      desc: 'Hand-tied arrangement with eucalyptus foliage, baby’s breath and luxury satin ribbon.',
      price: 1450.0,
      img: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=600&q=80',
      sku: 'FLW-ROSE-12',
    },
    {
      id: 'p20',
      mId: 'm8',
      cat: 'Pet Nutrition',
      name: 'Pedigree Beef & Veggies Adult Dry Dog Food (3kg)',
      desc: 'Formulated with essential nutrients, calcium, and zinc for healthy coat and vitality.',
      price: 495.0,
      img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80',
      sku: 'PET-DOG-03',
    },
    {
      id: 'p22',
      mId: 'm9',
      cat: 'Men Urbanwear',
      name: 'MetroStyle Relaxed Linen Camp Shirt',
      desc: 'Breathable lightweight tropical linen button-down shirt designed for Philippine warm weather.',
      price: 890.0,
      img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80',
      sku: 'RET-SHIRT-M',
    },
  ];

  for (const p of products) {
    db.run(
      `INSERT INTO products (id, merchant_id, category, name, description, price, cost_price, image_url, sku, is_available, is_popular, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
      [p.id, p.mId, p.cat, p.name, p.desc, p.price, p.price * 0.7, p.img, p.sku, now, now]
    );

    // Initial Inventory
    db.run(
      `INSERT INTO inventory (id, product_id, current_stock, reserved_stock, low_stock_threshold, reorder_point, updated_at)
       VALUES ('inv-' || ?, ?, 100, 0, 15, 25, ?)`,
      [p.id, p.id, now]
    );
  }

  // Seed Initial Audit Record
  db.run(
    `INSERT INTO audit_records (id, entity_type, entity_id, action, actor_user_id, actor_role, changes_json, timestamp)
     VALUES ('aud-init-01', 'system', 'sys-01', 'DATABASE_SCHEMA_BOOTSTRAP', 'usr-admin-01', 'admin', '{"version":"2.0.0","engine":"sqlite3_wasm","status":"live_production"}', ?)`,
    [now]
  );
}
