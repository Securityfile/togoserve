# ToGoServe Persistence Migration Plan
**Version:** 1.0.0  
**Phase Target:** Transition from Local Development Storage to Production Relational Database  
**Target Persistence Engine:** Google Cloud SQL (PostgreSQL) / Distributed Relational Engine with Drizzle ORM  
**Governing Rule:** No irreversible migrations shall be executed prematurely. This document details the architectural blueprint, entity schemas, migration phases, dual-write strategy, and rollback safeguards.

---

## 1. Current State of Persistence (Audit)

In the current `DEVELOPMENT / ARCHITECTURAL BASELINE`, persistence relies on a browser-based client-side adapter (`loadStorage` / `saveStorage` in `src/context/AppContext.tsx`) utilizing browser `localStorage` and in-memory singletons (`src/services/eventEngine.ts`, `src/services/aiObservationLayer.ts`).

### Current In-Browser Persistence Inventory:
| LocalStorage Key | Entity Group | Volatility & Limitations |
| :--- | :--- | :--- |
| `togo_live_role` | Active Role Selection | Per-browser session only; resets in incognito |
| `togo_live_address` | Customer Delivery Address | Single address object; cannot sync across multiple devices |
| `togo_live_cart` | Shopping Basket Items | Not preserved across browser clear or devices; cannot support multi-device abandonment |
| `togo_live_cust_wallet` | Customer Digital Balance | In-memory number; vulnerable to client-side manipulation; non-authoritative |
| `togo_live_plus_member` | TOGO SERVE+ Membership | Boolean flag; not tied to an active billing subscription record |
| `togo_live_favorites` | Customer Saved Merchants | Array of IDs; not indexed or linked to user account |
| `togo_live_orders` | Global Order Ledger | Array of orders; lacks concurrent locking, row-level security, and server reconciliation |
| `togo_live_merchants` | Merchant Catalogues | Client-modified catalog; local edits not visible to other browser clients |
| `togo_live_products` | Product & Inventory Records | Stock counts decremented in-browser only; race conditions during concurrent checkouts |
| `togo_live_rider` | Courier Telematics & Earnings | Local state only; other users cannot see the rider's real-time position or online state |
| `togo_live_zones` | Metro Manila Delivery Zones | Surge multipliers and active rider counts stored locally |
| `togo_live_tickets` | Customer Support Tickets | Local tickets cannot be triaged by real central support operations |
| `togo_live_cod` | COD Remittance Ledger | Non-authoritative cash tracking; risk of unrecorded cash discrepancies |

---

## 2. 17 Core Entity Domains Requiring Migration

Each of the following 17 entities must migrate from browser-side state to server-authoritative relational tables with primary keys, foreign key constraints, JSONB schemas for dynamic category attributes, and strict indexing.

### 1. Users
- **Current State:** Role string stored in `togo_live_role`.
- **Target Schema (`users`):**
  - `id` (UUID, PK), `email` (VARCHAR, UNIQUE), `phone_number` (VARCHAR, UNIQUE, Indexed), `password_hash` (VARCHAR), `role` (ENUM: `customer`, `merchant`, `rider`, `supplier`, `admin`), `is_active` (BOOLEAN), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
- **Migration Priority:** Critical (Phase 02 / 03).

### 2. Businesses
- **Current State:** Implicit in merchant object.
- **Target Schema (`businesses`):**
  - `id` (UUID, PK), `owner_user_id` (UUID, FK -> users), `legal_name` (VARCHAR), `trade_name` (VARCHAR), `tin` (VARCHAR, Tax Identification Number), `sec_dti_registration` (VARCHAR), `status` (ENUM: `pending_review`, `verified`, `suspended`), `created_at` (TIMESTAMPTZ).

### 3. Merchants
- **Current State:** `togo_live_merchants` (array of objects in localStorage).
- **Target Schema (`merchants`):**
  - `id` (UUID, PK), `business_id` (UUID, FK -> businesses), `name` (VARCHAR), `category` (ENUM: `Restaurants`, `Groceries`, `Convenience`, `Pharmacy`, `Retail`, `Flowers`, `Pet Supplies`), `cuisine` (VARCHAR), `rating` (DECIMAL(2,1)), `review_count` (INTEGER), `address` (TEXT), `barangay` (VARCHAR), `city` (VARCHAR), `lat` (DECIMAL(9,6)), `lng` (DECIMAL(9,6)), `is_open` (BOOLEAN), `opening_hours` (VARCHAR), `cover_image_url` (TEXT), `logo_url` (TEXT), `commission_rate` (DECIMAL(4,2)), `is_togo_plus` (BOOLEAN), `created_at` (TIMESTAMPTZ).

### 4. Products
- **Current State:** `togo_live_products` (array in localStorage).
- **Target Schema (`products`):**
  - `id` (UUID, PK), `merchant_id` (UUID, FK -> merchants), `category` (VARCHAR), `name` (VARCHAR), `description` (TEXT), `base_price` (DECIMAL(10,2)), `cost_price` (DECIMAL(10,2)), `image_url` (TEXT), `sku` (VARCHAR, Indexed), `is_available` (BOOLEAN), `category_attributes` (JSONB - stores restaurant allergens, grocery UOM, pharmacy Rx flags, retail variants, flower arrangements, pet care species), `created_at` (TIMESTAMPTZ).

### 5. Services
- **Current State:** Implicit or proxied via mock data.
- **Target Schema (`services`):**
  - `id` (UUID, PK), `merchant_id` (UUID, FK -> merchants), `service_name` (VARCHAR), `service_type` (ENUM: `delivery`, `padala_courier`, `table_reservation`, `prescription_validation`), `base_rate` (DECIMAL(10,2)), `per_km_rate` (DECIMAL(10,2)), `is_active` (BOOLEAN).

### 6. Inventory
- **Current State:** `stock` and `lowStockThreshold` integers inside product objects in localStorage.
- **Target Schema (`inventory`):**
  - `id` (UUID, PK), `product_id` (UUID, FK -> products, UNIQUE), `current_stock` (INTEGER), `low_stock_threshold` (INTEGER), `reorder_quantity` (INTEGER), `allow_backorder` (BOOLEAN), `out_of_stock_action` (ENUM: `hide`, `show_sold_out`, `substitute`), `last_restocked_at` (TIMESTAMPTZ).

### 7. Carts
- **Current State:** `togo_live_cart` (array in localStorage).
- **Target Schema (`carts` & `cart_items`):**
  - `carts`: `id` (UUID, PK), `customer_id` (UUID, FK -> users), `session_token` (VARCHAR), `updated_at` (TIMESTAMPTZ).
  - `cart_items`: `id` (UUID, PK), `cart_id` (UUID, FK -> carts), `product_id` (UUID, FK -> products), `quantity` (INTEGER), `unit_price` (DECIMAL(10,2)), `selected_options` (JSONB), `special_instructions` (TEXT).

### 8. Orders
- **Current State:** `togo_live_orders` (array in localStorage).
- **Target Schema (`orders` & `order_items`):**
  - `orders`: `id` (UUID, PK), `order_number` (VARCHAR, UNIQUE, Indexed), `customer_id` (UUID, FK -> users), `merchant_id` (UUID, FK -> merchants), `rider_id` (UUID, FK -> riders, NULLABLE), `status` (ENUM - 23 OrderStatus states), `subtotal` (DECIMAL(10,2)), `delivery_fee` (DECIMAL(10,2)), `discount` (DECIMAL(10,2)), `tip` (DECIMAL(10,2)), `total_amount` (DECIMAL(10,2)), `pickup_code` (VARCHAR(6)), `delivery_pin` (VARCHAR(4)), `delivery_address` (JSONB), `timeline_events` (JSONB), `created_at` (TIMESTAMPTZ), `updated_at` (TIMESTAMPTZ).
  - `order_items`: `id` (UUID, PK), `order_id` (UUID, FK -> orders), `product_id` (UUID, FK -> products), `name` (VARCHAR), `unit_price` (DECIMAL(10,2)), `quantity` (INTEGER), `total_price` (DECIMAL(10,2)), `options` (JSONB), `notes` (TEXT).

### 9. Payments
- **Current State:** Transient string in order object (`gcash`, `maya`, `cod`).
- **Target Schema (`payment_transactions`):**
  - `id` (UUID, PK), `order_id` (UUID, FK -> orders), `payer_user_id` (UUID, FK -> users), `method` (ENUM: `gcash`, `maya`, `qrph`, `card`, `cod`, `wallet`), `amount` (DECIMAL(10,2)), `fee` (DECIMAL(10,2)), `gateway_reference` (VARCHAR, NULLABLE), `status` (ENUM: `pending`, `authorized`, `captured`, `failed`, `refunded`), `raw_gateway_response` (JSONB), `created_at` (TIMESTAMPTZ).

### 10. Deliveries
- **Current State:** In-memory status stepping in `src/components/rider/`.
- **Target Schema (`deliveries` & `delivery_stops`):**
  - `deliveries`: `id` (UUID, PK), `order_id` (UUID, FK -> orders), `rider_id` (UUID, FK -> riders), `delivery_type` (ENUM: `restaurant_delivery`, `padala_express`, `padala_scheduled`, `padala_multistop`), `vehicle_type` (ENUM: `motorcycle`, `sedan`, `mpv`, `van`, `truck`), `parcel_dimensions` (JSONB: length, width, height, weight, volumetric_weight), `declared_value` (DECIMAL(10,2)), `insurance_opt_in` (BOOLEAN), `proof_of_delivery` (JSONB: signature_url, photo_url, verified_pin, recipient_name), `pickup_time` (TIMESTAMPTZ), `delivered_time` (TIMESTAMPTZ).

### 11. Drivers
- **Current State:** `togo_live_rider` (single object in localStorage).
- **Target Schema (`riders`):**
  - `id` (UUID, PK), `user_id` (UUID, FK -> users), `full_name` (VARCHAR), `phone` (VARCHAR), `vehicle_type` (VARCHAR), `plate_number` (VARCHAR), `license_number` (VARCHAR), `is_online` (BOOLEAN), `status` (ENUM: `available`, `delivering`, `suspended`), `current_lat` (DECIMAL(9,6)), `current_lng` (DECIMAL(9,6)), `wallet_balance` (DECIMAL(10,2)), `rating` (DECIMAL(2,1)), `total_trips` (INTEGER), `created_at` (TIMESTAMPTZ).

### 12. Suppliers
- **Current State:** Defined in architectural contracts (`AgentDataContract`).
- **Target Schema (`suppliers` & `supplier_products`):**
  - `suppliers`: `id` (UUID, PK), `business_id` (UUID, FK -> businesses), `company_name` (VARCHAR), `warehouse_address` (TEXT), `delivery_coverage` (JSONB), `status` (VARCHAR).
  - `supplier_products`: `id` (UUID, PK), `supplier_id` (UUID, FK -> suppliers), `item_name` (VARCHAR), `bulk_unit` (VARCHAR), `unit_price` (DECIMAL(10,2)), `moq` (INTEGER).

### 13. Customer Profiles
- **Current State:** In-memory name, phone, and `togo_live_address` object.
- **Target Schema (`customer_profiles` & `saved_addresses`):**
  - `customer_profiles`: `id` (UUID, PK), `user_id` (UUID, FK -> users, UNIQUE), `display_name` (VARCHAR), `primary_phone` (VARCHAR), `is_togo_plus` (BOOLEAN), `togo_plus_expires_at` (TIMESTAMPTZ), `wallet_balance` (DECIMAL(10,2)).
  - `saved_addresses`: `id` (UUID, PK), `user_id` (UUID, FK -> users), `label` (VARCHAR: Home, Office, Condo), `region` (VARCHAR), `province` (VARCHAR), `city` (VARCHAR), `barangay` (VARCHAR), `street` (TEXT), `unit_number` (VARCHAR), `landmark` (VARCHAR), `lat` (DECIMAL(9,6)), `lng` (DECIMAL(9,6)), `is_default` (BOOLEAN).

### 14. Support Tickets
- **Current State:** `togo_live_tickets` (array in localStorage).
- **Target Schema (`support_tickets` & `ticket_messages`):**
  - `support_tickets`: `id` (UUID, PK), `ticket_number` (VARCHAR, UNIQUE), `order_id` (UUID, FK -> orders, NULLABLE), `customer_id` (UUID, FK -> users), `category` (VARCHAR), `priority` (ENUM: `low`, `medium`, `high`, `urgent`), `status` (ENUM: `open`, `investigating`, `resolved`), `assigned_agent` (VARCHAR), `description` (TEXT), `resolution_notes` (TEXT), `refund_amount` (DECIMAL(10,2)), `created_at` (TIMESTAMPTZ), `resolved_at` (TIMESTAMPTZ).

### 15. Notifications
- **Current State:** In-app state and toast triggers.
- **Target Schema (`notifications`):**
  - `id` (UUID, PK), `recipient_user_id` (UUID, FK -> users), `title` (VARCHAR), `body` (TEXT), `type` (ENUM: `order_status`, `rider_arrival`, `promo`, `security_alert`), `data` (JSONB), `is_read` (BOOLEAN), `created_at` (TIMESTAMPTZ).

### 16. AI Actions & Decisions
- **Current State:** In-memory `aiDecisions` and `aiApprovalQueue`.
- **Target Schema (`ai_decisions` & `ai_approval_queue`):**
  - `ai_decisions`: `id` (UUID, PK), `agent_id` (VARCHAR), `order_id` (UUID, FK -> orders, NULLABLE), `action_type` (VARCHAR), `confidence` (DECIMAL(3,2)), `reason_codes` (JSONB), `payload` (JSONB), `override_reason` (VARCHAR, NULLABLE), `supervisor_user_id` (UUID, FK -> users, NULLABLE), `created_at` (TIMESTAMPTZ).
  - `ai_approval_queue`: `id` (UUID, PK), `agent_id` (VARCHAR), `task_name` (VARCHAR), `risk_level` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `impact_description` (TEXT), `payload` (JSONB), `status` (ENUM: `PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`, `ESCALATED`), `decision_by` (VARCHAR), `decision_timestamp` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).

### 17. Audit Records
- **Current State:** In-memory `platformEvents` (`PlatformEvent`) and `AuditLog`.
- **Target Schema (`platform_events_ledger` & `audit_logs`):**
  - `platform_events_ledger`: `id` (UUID, PK), `sequence_number` (BIGSERIAL, UNIQUE), `event_type` (VARCHAR, Indexed), `actor_type` (ENUM: `CUSTOMER`, `MERCHANT`, `RIDER`, `AI_AGENT`, `SYSTEM`, `ADMIN`), `actor_id` (VARCHAR), `entity_type` (VARCHAR), `entity_id` (VARCHAR), `metadata` (JSONB), `created_at` (TIMESTAMPTZ).
  - `audit_logs`: `id` (UUID, PK), `user_id` (VARCHAR), `role` (VARCHAR), `action` (VARCHAR), `record_id` (VARCHAR), `previous_value` (JSONB), `new_value` (JSONB), `ip_address` (VARCHAR), `created_at` (TIMESTAMPTZ).

---

## 3. Four-Phase Migration Execution Plan

```
┌─────────────────────────────────────────────────────────────┐
│ PHASE 1: Schema Blueprint & ORM Models (Development)        │
│ - Create Drizzle schema definitions and migrations           │
│ - Zero destructive changes to current runtime              │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 2: Dual-Read / Dual-Write Adapter                     │
│ - API routes on Express read/write to database if connected │
│ - Fallback gracefully to memory/storage if DB offline       │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 3: Data Seeding & One-Time Batch Migration            │
│ - Idempotent seed script transfers initial Metro Manila data│
│ - Verify foreign keys, UUID consistency & JSONB schemas     │
└──────────────────────────────┬──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ PHASE 4: Cutover & Deprecation of LocalStorage              │
│ - Client stores JWT/session token only                      │
│ - Server is single authoritative source of truth            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Rollback & Disaster Safeguards

1. **Reversible Migrations Only:** All DDL migrations must provide a paired `down` migration script.
2. **Read-Fallback Mode:** If the database becomes unreachable, the client runtime falls back to local cached snapshots without throwing unhandled exceptions.
3. **Audit Ledger Immutability:** Event ledger tables will employ PostgreSQL row append rules (`BEFORE UPDATE OR DELETE ON platform_events_ledger FOR EACH ROW EXECUTE FUNCTION reject_mutation()`) to ensure compliance with financial and supervisory audit guidelines.
