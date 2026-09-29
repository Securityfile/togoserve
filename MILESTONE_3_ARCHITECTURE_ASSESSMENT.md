# Milestone 3 — Production Persistence & Transaction Foundation
## Architecture Assessment & Technical Specification
**Version:** 1.0.0  
**Phase Target:** Master Directive Phase 03 & Milestone 3  
**System Classification:** `DEVELOPMENT / ARCHITECTURAL BASELINE`  
**Governing Rule:** No irreversible production cutovers, no premature deletion of localStorage continuity, and no fake claims of external database certification.

---

## 1. Executive Context & Scope

ToGoServe has successfully established its baseline domain models, event journal, human-in-the-loop governance mesh, 10 operational simulation scenarios, all 8 commercial verticals (Restaurants, Groceries, Convenience, Pharmacy, TOGO Padala, Retail, Flowers, Pet Care), and logistics dimensional calculations (verified by 22/22 automated tests).

However, as highlighted in `CURRENT_STATE_AUDIT.md` and `PERSISTENCE_MIGRATION_PLAN.md`:
- Authoritative state currently resides inside client-side browser `localStorage` and in-memory module singletons.
- This creates architectural vulnerabilities: no multi-client concurrency control, client-side wallet/price spoofing risk, race conditions on inventory decrements, lack of server-enforced authorization boundaries, and absence of formal transaction rollback/idempotency guarantees.

**Milestone 3 Goal:** Build the production persistence and transaction foundation without performing a destructive cutover. Establish repository abstractions, transactional boundaries, idempotency controls, server-authoritative validations, dual-write capability, and comprehensive failure/recovery test harnesses while maintaining 100% development continuity.

---

## 2. Current Persistence Audit & Dependency Inventory

### Direct `localStorage` Invocations
All browser persistence currently funnels through two generic helper functions in `src/context/AppContext.tsx`:
```typescript
const loadStorage = <T>(key: string, fallback: T): T => { ... localStorage.getItem(key) ... }
const saveStorage = (key: string, value: any) => { ... localStorage.setItem(key, JSON.stringify(value)) ... }
```

### Complete Inventory of Stored Keys & Data Shapes
| Key | Entity Domain | Current Type Shape | Mutating Invocations | Risk / Concurrency Limitation |
| :--- | :--- | :--- | :--- | :--- |
| `togo_live_role` | Active User Role | `UserRole` ('customer' \| 'merchant' \| 'rider' \| 'admin') | `setRole` | Client-controlled; no cryptographic session proof |
| `togo_live_address` | Active Address | `PhilippineAddress` | `setSelectedAddress` | Single address; no multi-address profile sync |
| `togo_live_cart` | Shopping Basket | `OrderItem[]` | `addToCart`, `updateCartItemQty`, `removeFromCart`, `clearCart` | Browser-local; no server-side cart reservation |
| `togo_live_cust_wallet` | Digital Wallet | `number` (PHP) | `setCustomerWalletBalance`, `createOrder`, `refundOrder` | Vulnerable to client tampering; uncertified balance |
| `togo_live_plus_member` | TOGO+ Membership | `boolean` | `toggleTogoServePlus`, `setIsTogoServePlusMember` | Not linked to recurring subscription ledger |
| `togo_live_favorites` | Saved Merchants | `string[]` | `toggleFavorite` | Array of strings; unindexed |
| `togo_live_orders` | Orders Ledger | `Order[]` | `createOrder`, `updateOrderStatus`, `cancelOrder`, `refundOrder`, `rateOrder` | **High Risk:** Array overwrite on every order mutation; no row locks; race conditions during concurrent updates |
| `togo_live_merchants` | Stores Catalog | `Merchant[]` | `updateMerchantSettings` | Edits made by one user are invisible to other sessions |
| `togo_live_products` | Inventory & Items | `Product[]` | `updateProductStock`, `toggleProductAvailability` | **High Risk:** In-browser stock decrement; no atomic reservation; double-sell risk |
| `togo_live_rider` | Courier Telematics | `RiderProfile` | `toggleRiderOnline`, `acceptDeliveryOffer`, `verifyPickup`, `verifyDelivery`, `stepRiderLocation` | Single driver; simulated coordinates; no real fleet pool |
| `togo_live_zones` | Metro Manila Zones | `DeliveryZone[]` | `updateDeliveryZone`, `updateZoneSurge` | Local surge updates not shared across dispatchers |
| `togo_live_tickets` | Support Desk | `SupportTicket[]` | `createSupportTicket`, `resolveSupportTicket` | Local queue only |
| `togo_live_cod` | Cash Remittance | `CODReconciliationRecord[]` | `remitCod`, `reconcileCod` | Non-authoritative cash ledger |

### Domain Services Assuming In-Memory / Browser Persistence
1. `src/services/eventEngine.ts`: In-memory array `platformEventsJournal: PlatformEvent[]`. Events are lost on page refresh unless re-seeded.
2. `src/services/aiObservationLayer.ts`: In-memory singletons `observationStore`, `decisionStore`, `trainingDatasetStore`.
3. `src/services/simulationEngine.ts`: Directly calls `publishPlatformEvent`, invokes `AppContext` callbacks via dependency injection.
4. `src/services/padalaEngine.ts`: Pure functional calculation module (stateless).

---

## 3. Dependency Map

### Current Architecture (Tightly Coupled to Browser State)
```
┌────────────────────────────────────────────────────────────────────────┐
│                        UI LAYER & ROLE PORTALS                         │
│  CustomerApp  │  MerchantApp  │  RiderApp  │  AICommandCenter Control  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Direct React Hook)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT AppContext.tsx                            │
│  - React useState hooks for 13 entities                                │
│  - useEffect hooks synchronizing directly to window.localStorage       │
│  - In-memory event array subscriptions                                 │
└──────────────┬──────────────────────────────────────────┬──────────────┘
               │ (Direct Browser Call)                    │ (Direct Memory)
               ▼                                          ▼
┌───────────────────────────────┐          ┌─────────────────────────────┐
│      window.localStorage      │          │    In-Memory Singletons     │
│   (13 JSON stringified keys)  │          │ (eventEngine, aiObservation)│
└───────────────────────────────┘          └─────────────────────────────┘
```

### Proposed Milestone 3 Architecture (Decoupled Repository Boundary)
```
┌────────────────────────────────────────────────────────────────────────┐
│                        UI LAYER & ROLE PORTALS                         │
│  CustomerApp  │  MerchantApp  │  RiderApp  │  AICommandCenter Control  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       DOMAIN SERVICES & CONTEXT                        │
│   OrderService   │   CatalogService   │   LogisticsService             │
│   FinanceService │   GovernanceService│   EventService                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     REPOSITORY ABSTRACTION INTERFACE                   │
│   IRepository<T> (CRUD + Queries + Atomic Transactions)                │
│   IOrderRepository  │  IProductRepository  │  IUserRepository          │
│   IPaymentRepository│  IDeliveryRepository │  IEventRepository         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 PERSISTENCE ADAPTER ROUTER (Dual-Write)                │
│  - Idempotency Gatekeeper (Token check before write)                   │
│  - Server-Authoritative Authorization Validator                        │
│  - Transaction Boundary Coordinator (Commit / Rollback)                │
└───────────────────────┬────────────────────────┬───────────────────────┘
                        │                        │
       (Development)    ▼                        ▼ (Production Target)
┌───────────────────────────────┐       ┌────────────────────────────────┐
│   Development Repository      │       │     Relational Repository      │
│  - In-Memory Structured Store │       │  - PostgreSQL / Cloud SQL DDL  │
│  - LocalStorage Snapshots     │       │  - Drizzle ORM Schema Models   │
│  - Zero Network Dependencies  │       │  - ACID Foreign Key Integrity  │
└───────────────────────────────┘       └────────────────────────────────┘
```

---

## 4. Proposed Milestone 3 Technical Architecture

### A. The 18 Entity Domain Schemas
Milestone 3 defines formal relational contracts across all 18 entities identified in `PERSISTENCE_MIGRATION_PLAN.md`:
1. `users` — Authentication identity, role, phone, email, password hash, status.
2. `businesses` — Legal business registration, trade name, TIN, DTI/SEC status.
3. `merchants` — Physical and virtual storefronts, categories, geocoordinates, commission.
4. `products` — Items catalog with multi-category JSONB attributes for all 8 verticals.
5. `services` — Specialized commercial capabilities (Padala courier, table reservation, Rx review).
6. `inventory` — Stock levels, reserved quantities, low-stock thresholds, backorder policies.
7. `carts` & `cart_items` — Server-persisted session baskets with options and quantities.
8. `orders` & `order_items` — Authoritative 23-state order lifecycle with delivery pin, codes, totals.
9. `payments` — Transaction ledger (GCash, Maya, QR Ph, Card, COD) with gateway references.
10. `deliveries` & `delivery_waypoints` — Multi-stop telematics, vehicle type, volumetric dimensions, e-POD.
11. `riders` — Courier identity, license, vehicle details, online state, wallet balance.
12. `suppliers` & `supplier_products` — B2B wholesale network, bulk MOQs, wholesale prices.
13. `customer_profiles` & `saved_addresses` — Customer profiles, multi-address book with coordinates.
14. `support_tickets` & `ticket_messages` — Triage queue, refund amounts, priority, resolution logs.
15. `notifications` — Role-targeted alerts (order updates, rider arrival, promos).
16. `ai_actions` — Task plans, agent execution requests, autonomy level checks.
17. `ai_decisions` — Observational logs, dispatch candidate scores, supervisor overrides.
18. `audit_records` & `platform_events` — Immutable append-only audit trail and domain event ledger.

### B. Transaction Integrity Model
To ensure ACID semantics without premature cloud deployment:
1. **Unit of Work & Transaction Context (`TransactionContext`):**
   - Encapsulates operations that must succeed or fail together (e.g. `createOrder` must: [1] reserve inventory, [2] create order record, [3] initialize payment transaction, [4] publish `ORDER_PLACED` event).
   - If any step fails (e.g., insufficient stock), all modifications roll back to the pre-transaction snapshot.
2. **Correlation ID & Transaction ID Tracking:**
   - Every transaction generates a unique `txId` (e.g. `tx_ord_98a72e`) and attaches `correlationId` to all downstream events.

### C. Idempotency Architecture
Prevent double-charging, duplicated orders, and repeat inventory deductions:
1. **Idempotency Key (`idempotencyKey`):**
   - Generated by caller (UUIDv4 or hash of user + intent + timestamp).
2. **Idempotency Gatekeeper:**
   - Checks `idempotency_records` table / store:
     - `PENDING`: Concurrent duplicate detected; reject or await resolution.
     - `COMPLETED`: Return cached response immediately without re-executing business logic.
     - `EXPIRED` / Not Found: Proceed with execution, record result, cache response.
3. **Protected Critical Workflows:**
   - Order creation (`createOrder`)
   - Payment confirmation (`confirmPayment`)
   - Order cancellation (`cancelOrder`)
   - Refund disbursement (`refundOrder`)
   - Courier assignment (`assignDriver`)

### D. Server-Authoritative Authorization Boundaries
Client-side checks are purely for UI convenience. The persistence boundary enforces:
1. **Customer Boundary:** A customer user can only mutate their own cart, addresses, and orders.
2. **Merchant Boundary:** A merchant can only modify stock, operating hours, and order states for their own `merchantId`.
3. **Driver Boundary:** A rider can only accept available offers, verify pickup with correct merchant pickup code, and verify delivery with matching 4-digit recipient PIN.
4. **Administrative Boundary:** Financial refunds exceeding ₱500 and zone surge multiplier changes require verified `admin` role and supervisor approval queue confirmation.

### E. Persistence Adapter & Dual-Write Architecture
1. **`IPersistenceAdapter` Interface:**
   - Standard CRUD operations (`findById`, `findMany`, `create`, `update`, `delete`).
   - Query filters, pagination, and atomic batch mutations.
2. **`DevelopmentStorageAdapter`:**
   - In-memory transactional maps with dual-write backup to browser `localStorage`.
   - Preserves 100% of current functionality while decoupling application code from direct `localStorage` calls.
3. **`RelationalStorageBlueprint`:**
   - Complete PostgreSQL DDL and Drizzle-compatible schema definitions ready for Cloud SQL provisioning when Phase 03 cutover is authorized.

---

## 5. Risks and Migration Hazards

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **Data Desynchronization** | Discrepancy between in-memory state and localStorage snapshot | Write-through transactional adapter ensures snapshot updates synchronously upon commit. |
| **Broken Existing Tests** | Refactoring context breaks existing 22 tests | Repository layer conforms strictly to existing interfaces; tests run against repository in-memory engine. |
| **Premature Cloud Cutover** | Attempting live Cloud SQL connection in unprovisioned environment throws fatal errors | Repository defaults to `DevelopmentStorageAdapter`; external DB adapter is modular and isolated behind a feature flag / config check. |
| **Idempotency Stale Cache** | Idempotency record never cleared after an unexpected crash | Expire idempotency records after 24 hours with status recovery hooks. |
| **Race Conditions on Stock** | Two customers purchasing last item simultaneously | Atomic stock reservation with rollback if current stock < requested quantity. |

---

## 6. Implementation Plan Sequence

1. **Step 1: Relational Schema Blueprint (`src/db/schema.ts`)**
   - Create comprehensive, type-safe database schemas for all 18 entities using PostgreSQL-compliant types and relationships.
2. **Step 2: Repository Interfaces (`src/repositories/interfaces.ts`)**
   - Define clean, domain-driven contracts: `IUserRepository`, `IOrderRepository`, `IProductRepository`, `IPaymentRepository`, `IDeliveryRepository`, `IAuditRepository`, etc.
3. **Step 3: Persistence Adapter & Transaction Engine (`src/services/persistenceAdapter.ts`)**
   - Implement `TransactionManager`, `IdempotencyManager`, and `DevelopmentStorageAdapter`.
4. **Step 4: Refactor AppContext to use Repository Boundary**
   - Route state queries and mutations through repository layer while preserving client developer ergonomics and localStorage session persistence.
5. **Step 5: Automated Testing Harness**
   - Add unit and integration tests:
     - `persistenceAdapter.test.ts` (CRUD, queries, snapshots).
     - `transactionIntegrity.test.ts` (atomic commit, failure rollback, isolation).
     - `idempotency.test.ts` (duplicate token detection, cached response return).
     - `authorizationBoundary.test.ts` (server-side role enforcement).
6. **Step 6: Verification & Self-Validation**
   - Run `npm test`, `npm run lint`, and `compile_applet`.
   - Update documentation and create milestone commit.
