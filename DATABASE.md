# ToGoServe Domain Entity & Database Schema Specification
**Version:** 1.0.0  
**Storage Architecture:** Relational Core + Append-Only Event Journal + Document Store  
**Consistency Model:** Strong consistency for orders and financial balances; eventual consistency for analytics  

---

## 1. Core Domain Entity Model

The ToGoServe database is architected around 40+ specialized domain entities divided into 7 functional clusters:

```
┌────────────────────────────────────────────────────────┐
│                   COMMERCE & CATALOG                   │
│   Business ──► Storefront ──► Category ──► Product     │
│   Product ──► ProductVariant ──► Inventory ──► Price   │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  ORDERS &    │     │  LOGISTICS & │     │  FINANCE &   │
│  TRANSACTIONS│     │  DISPATCH    │     │  SETTLEMENTS │
│ Order/Items  │     │ Delivery/Stop│     │ Payment/Escrow│
│ Cart/CartItem│     │ Driver/GPS   │     │ Refund/Payout│
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌────────────────────────────────────────────────────────┐
│                AI GOVERNANCE & AUDITING                │
│   AIAgent ──► AITool ──► AIAction ──► Approval Queue   │
│   AuditLog ──► PlatformEvent ──► EvaluationDataset     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Key Domain Schemas & Relationships

### 2.1 Commercial Entities
- **`Business`:**
  `id`, `organizationId`, `name`, `legalName`, `category` (Restaurant, Grocery, Pharmacy, etc.), `status`, `operatingHours`, `contactPhone`, `taxIdNumber`, `createdAt`.
- **`Storefront`:**
  `id`, `businessId`, `slug`, `themeConfig`, `heroImageUrl`, `logoUrl`, `tagline`, `isPublished`, `seoMetadata`.
- **`Product` & `ProductVariant`:**
  `id`, `businessId`, `categoryId`, `name`, `description`, `basePrice`, `sku`, `isAvailable`, `isPerishable`, `requiresPrescription`, `handlingType`, `imageUrl`, `metadata`.
- **`Inventory` & `InventoryMovement`:**
  `id`, `variantId`, `currentStock`, `reorderThreshold`, `movementType` (`SALE`, `RESTOCK`, `DAMAGE`, `SPOILED`), `quantity`, `referenceId`.

### 2.2 Order & Transaction Lifecycle
- **`Order`:**
  `id`, `orderNumber`, `customerId`, `merchantId`, `status` (`ORDER_PLACED` → `MERCHANT_ACCEPTED` → `PREPARING` → `SEARCHING_RIDER` → `IN_DELIVERY` → `COMPLETED` / `CANCELLED`), `subtotal`, `deliveryFee`, `serviceFee`, `discount`, `tip`, `total`, `paymentMethod` (`GCash`, `Maya`, `QRPh`, `COD`), `paymentStatus`, `deliveryAddress`, `handshakePin`, `createdAt`.
- **`OrderItem`:**
  `id`, `orderId`, `productId`, `variantId`, `name`, `unitPrice`, `quantity`, `specialInstructions`, `options`.
- **`Payment` & `Refund`:**
  `id`, `orderId`, `transactionReference`, `amount`, `status`, `gatewayProvider`, `authorizedAt`, `settledAt`.

### 2.3 Logistics & Fleet Management
- **`Delivery` & `DeliveryStop`:**
  `id`, `orderId`, `driverId`, `vehicleType` (`MOTORCYCLE`, `MPV`), `pickupAddress`, `dropoffAddress`, `estimatedMinutes`, `actualMinutes`, `distanceKm`, `status`.
- **`DriverLocation` (Live Telemetry):**
  `id`, `driverId`, `coordinates` (lat, lng), `speedKmH`, `bearing`, `batteryLevel`, `isOnline`, `timestamp`.
- **`ProofOfDelivery` (POD):**
  `id`, `deliveryId`, `verificationMethod` (`PIN`, `SIGNATURE`, `PHOTO`), `signatureUrl`, `photoUrl`, `verifiedAt`.

### 2.4 AI Governance & Operational Audit
- **`AIAgent`:**
  `id`, `name`, `department`, `autonomyLevel` (0-5), `allowedTools`, `restrictedActions`, `version`, `status`.
- **`AIAction` & `Approval`:**
  `id`, `agentId`, `orderId`, `actionType`, `confidenceScore`, `reasonCodes`, `status` (`PENDING`, `APPROVED`, `REJECTED`, `MODIFIED`), `reviewerId`, `outcomeNote`.
- **`AuditLog`:**
  `id`, `actorId`, `actorType`, `action`, `affectedEntity`, `previousState`, `newState`, `timestamp`, `ipAddress`.

---

## 3. Database Indexing & Partitioning Strategy

1. **High-Frequency Lookups:**
   - Index on `orders(customerId, status, createdAt DESC)`
   - Index on `orders(merchantId, status, createdAt DESC)`
   - Index on `deliveries(driverId, status)`
2. **Spatial Queries:**
   - GiST index on `business_locations(coordinates)` and `driver_locations(coordinates)` for sub-second proximity dispatching.
3. **Partitioning:**
   - `platform_events` and `driver_locations` partitioned monthly by timestamp to maintain linear query performance.
