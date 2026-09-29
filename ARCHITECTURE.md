# ToGoServe Architecture Specification
**Version:** 1.1.0 (Master Directive Compliant)  
**System Environment:** `DEVELOPMENT / ARCHITECTURAL BASELINE`  
**System Classification:** AI-Native Commerce, Logistics & Multi-Agent Operating Platform  

---

## Technical Environment Status Definition

To prevent misleading claims of external readiness, system capabilities are classified under four rigorous engineering tiers:
- **UI FUNCTIONALITY:** Front-end interactive views, component layouts, and responsive interfaces rendered with domain data.
- **DEVELOPMENT FUNCTIONALITY:** Local in-memory state, deterministic domain engines, event journals (`PlatformEvent`), and simulation kernels operating in-browser/in-runtime.
- **INTEGRATED FUNCTIONALITY:** Standardized API contracts, server middleware, and adapter interfaces prepared for live provider binding.
- **PRODUCTION-READY FUNCTIONALITY:** High-availability cloud databases, real BSP-regulated financial escrow movement, live telematics satellite feeds, and formal third-party regulatory certification. **(Currently in DEVELOPMENT BASELINE stage; not yet production-certified).**

---

## 1. System Vision & Core Principles

ToGoServe is not merely a delivery marketplace; it is an **AI-native commerce and operational operating system** connecting seven primary stakeholder domains across Metro Manila and the Philippines:

1. **Customers:** Consumers, families, and enterprise procurement buyers with individual AI Customer Agents.
2. **Businesses & Merchants:** Micro, small, medium, and franchise brands with persistent AI Business Agents.
3. **Business Staff:** Store managers, kitchen prep teams, order pickers, and inventory handlers with task-scoped interfaces.
4. **Suppliers & Wholesalers:** Food service commissaries, pharmaceutical distributors, packaging vendors, and raw material providers.
5. **Drivers & Delivery Partners:** Motorcycle and multi-purpose vehicle (MPV) couriers with route-guided mobile experiences.
6. **Administrators & Super Admins:** Executive operations controllers overseeing the central Control Tower.
7. **AI Agents & System Services:** Autonomous cognitive agents operating under strict policy, tool, and human-in-the-loop limits.

### Supported Commercial Verticals
The architecture supports eight fundamental verticals with extensible schemas:
- **1. Restaurants:** Food preparation, customization, kitchen queue telemetry, thermal packaging.
- **2. Groceries:** SKU variant management, perishable items, picking checklists, weighted items.
- **3. Convenience:** Fast-turnaround essentials, 24/7 inventory sync, small basket delivery.
- **4. Pharmacy:** Regulated OTC and prescription medicines, doctor prescription verification, licensed pharmacist sign-off.
- **5. TOGO Padala:** On-demand peer-to-peer and business parcel logistics, dimension tracking, multi-stop routing.
- **6. Retail:** Lifestyle, electronics, apparel, accessories, returns, and inventory warranty tracking.
- **7. Flowers & Gifts:** Time-critical occasion delivery, delicate handling protocols, personalized greeting cards.
- **8. Pet Care:** Pet nutrition, veterinary supplies, specialized grooming, and care supplies.

---

## 2. Layered Architectural Model

ToGoServe employs a **modular, API-first, event-driven, adapter-isolated architecture** designed to leverage Google Cloud and AI Studio technologies while strictly preventing vendor lock-in.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION & CLIENT APPS                      │
│   Customer App   │  Merchant Portal  │  Rider App  │  Admin Control   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    API GATEWAY & SECURITY PERIMETER                    │
│   JWT Auth & RBAC  │ Rate Limiting │ Tenant Isolation │ Audit Observer │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                     AI ORCHESTRATION & AGENT MESH                      │
│   Mission Planner  │ Autonomy Matrix │ Tool Registry │ HITL Gatekeeper  │
│   Customer Agent   │ Business Agent  │ Dispatch AI   │ Finance Agent   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                   DOMAIN SERVICES & BUSINESS LOGIC                     │
│  Order Engine │ Catalog & Inventory │ Logistics & Dispatch │ Escrow    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    EVENT KERNEL & INTEGRATION ADAPTERS                 │
│  Domain Event Bus │ Payment Adapters │ Logistics Adapters │ Maps & GPS │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. The Multi-Agent Ecosystem

Every commercial entity operates with dedicated, autonomous cognitive workers operating under the **AI Orchestrator**:

| Agent Name | Primary Responsibility | Critical Tool Boundaries | Default Autonomy |
| :--- | :--- | :--- | :--- |
| **Customer Agent** | Intent recognition, multi-store shopping plans, budget allocation | Search, Cart, PlanBuilder | Assist |
| **Business Agent** | Storefront management, operating hours, pricing advisories | UpdateCatalog, AdjustPromo | Automate (within policy) |
| **Merchant Agent** | Kitchen queue estimation, order acceptance, inventory alerts | SetPrepTime, FlagStockout | Automate |
| **Product Agent** | Image enhancement, categorization, SEO tagging | ProcessAsset, GenerateCopy | Automate |
| **Content & Marketing** | Social campaign creation, localized promotional copywriting | ScheduleCampaign, GenerateArt | Assist |
| **Customer Service** | Live inquiry resolution, return intake, delivery tracking | SearchOrder, CreateTicket | Automate |
| **Procurement Agent** | B2B raw material sourcing, supplier RFQ, quote comparison | CreateRFQ, CompareQuotes | Human Approval Required |
| **Logistics/Dispatch** | Fleet candidate scoring, dynamic ETA, rerouting | EvaluateFleet, RecommendRider| Level 2 (Human Pre-Approval) |
| **Finance Agent** | COD reconciliation, settlement calculations, VAT/commission | CalculateEscrow, AuditCOD | Level 1 (Read/Calculate Only) |
| **Compliance Agent** | Prescription verification, alcohol/tobacco age gates | VerifyPrescription, FlagRisk| Human Approval Required |

---

## 4. Integration Boundaries & Adapters

To adhere to Principle 3 (No Vendor Lock-in), all external capabilities are abstracted through interfaces:

1. **Payment Gateway Adapter (`IPaymentGateway`):**
   - Implementations: `GCashPaymentAdapter`, `MayaPaymentAdapter`, `QRPhPaymentAdapter`, `CODPaymentAdapter`.
   - Security: Real money transfer is decoupled from AI decision-making; requires end-user two-factor / OTP verification.
2. **Logistics & Fleet Adapter (`ILogisticsProvider`):**
   - Implementations: `InternalFleetAdapter` (motorcycle/MPV), `PartnerCourierAdapter` (overflow routing).
3. **Spatial & Routing Adapter (`IGeolocationProvider`):**
   - Implementations: `GoogleMapsPlatformAdapter`, `OpenStreetMapFallbackAdapter`.
4. **Messaging & Notification Adapter (`IMessagingProvider`):**
   - Implementations: `SMSTwilioAdapter`, `WhatsAppBusinessAdapter`, `AppPushAdapter`.

---

## 5. Event-Driven Kernel

Every consequential change in state produces an immutable domain event conforming to the `PlatformEvent` standard:

```typescript
export interface PlatformEvent {
  eventId: string;
  eventType: PlatformEventType;
  timestamp: string;
  actorType: 'CUSTOMER' | 'MERCHANT' | 'RIDER' | 'ADMIN' | 'AI_AGENT' | 'SYSTEM';
  actorId: string;
  entityType: 'ORDER' | 'CART' | 'PAYMENT' | 'DELIVERY' | 'MERCHANT' | 'RIDER' | 'DISPATCH' | 'FINANCE';
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata: Record<string, any>;
  correlationId: string;
  orderId?: string;
}
```

Events are published synchronously to in-memory listeners and persisted to append-only storage for full reproducibility and AI RLHF training.
