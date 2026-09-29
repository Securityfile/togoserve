# ToGoServe AI Agent Ecosystem & Orchestration Specification
**Version:** 1.0.0  
**Model Foundation:** Gemini Flash / Pro Multimodal via Controlled Function Calling  
**Orchestration Paradigm:** Deterministic Mission Decomposition & Tool Calling  

---

## 1. Agent Taxonomy & Specifications

Each agent in ToGoServe is a specialized cognitive worker with explicit tool allowances, forbidden actions, and bounded operational scopes.

```
┌────────────────────────────────────────────────────────┐
│                   AI ORCHESTRATOR                      │
│   Decomposes Customer/Merchant requests into missions  │
└───────────────────────────┬────────────────────────────┘
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│CUSTOMER AGENT│     │BUSINESS AGENT│     │DISPATCH AGENT│
│Shopping plan │     │Storefront ops│     │Fleet matching│
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│SUPPORT AGENT │     │FINANCE AGENT │
│Issue triage  │     │Escrow audit  │
└──────────────┘     └──────────────┘
```

### 1. Customer Agent (`agent_customer`)
- **Mission:** Natural language intent parsing, multi-merchant basket synthesis, budget optimization.
- **Allowed Tools:** `searchCatalog`, `compareStores`, `buildMultiStoreCart`, `getDeliveryEstimate`.
- **Forbidden Actions:** Modifying product pricing, bypassing delivery fees, executing checkout without customer PIN.

### 2. Business Agent (`agent_business`)
- **Mission:** Storefront management, operating hours configuration, promotional campaign advisories.
- **Allowed Tools:** `updateStoreSettings`, `adjustItemAvailability`, `proposePriceDiscount`.
- **Forbidden Actions:** Altering merchant bank payout credentials, increasing prices above agreed commission ceiling.

### 3. Dispatch Agent (`agent_dispatch`)
- **Mission:** Real-time candidate rider scoring, vehicle fit (insulated bag/motorcycle/MPV), dynamic ETA adjustments.
- **Allowed Tools:** `evaluateRiderPool`, `proposeRiderMatch`, `calculateDynamicETA`, `flagShortageSurge`.
- **Forbidden Actions:** Auto-assigning riders who are marked offline or on active break.

### 4. Merchant Operations Agent (`agent_merchant_ops`)
- **Mission:** Kitchen prep latency monitoring, backlog alerts, stockout advisories.
- **Allowed Tools:** `estimatePrepLatency`, `flagStockoutItem`, `requestPrepExtension`.
- **Forbidden Actions:** Rejecting orders without documented reason, cancelling confirmed batches without alert.

### 5. Procurement Agent (`agent_procurement`)
- **Mission:** Sourcing raw food supplies, packaging boxes, and cleaning goods from wholesale suppliers.
- **Allowed Tools:** `discoverSuppliers`, `requestQuoteRFQ`, `compareSupplierQuotes`.
- **Forbidden Actions:** Issuing purchase orders exceeding configured business limit without owner sign-off.

### 6. Finance & COD Audit Agent (`agent_finance`)
- **Mission:** Cash-on-Delivery discrepancy reconciliation, platform commission splits, VAT ledger calculations.
- **Allowed Tools:** `calculateNetSettlement`, `flagCODDiscrepancy`, `generateRemittanceReport`.
- **Forbidden Actions:** Direct debiting of merchant or rider bank accounts without human supervisor approval.

### 7. Customer Support Agent (`agent_support`)
- **Mission:** Resolving delivery tracking inquiries, handling damaged or missing item claims.
- **Allowed Tools:** `checkDeliveryTracking`, `intakeClaimPhoto`, `recommendRefundCredit`.
- **Forbidden Actions:** Authorizing cash refunds above ₱100 without human supervisor review.

---

## 2. Autonomy Configuration Matrix

Autonomy in ToGoServe is strictly tiered into three operational levels:

| Autonomy Mode | Behavior | Human Intervention Requirement |
| :--- | :--- | :--- |
| **ASSIST** | Generates recommendations and draft actions for user review. | Human must review and click to execute every action. |
| **AUTOMATE** | Executes pre-approved routine tasks within strict guardrails. | Post-action audit notification; automatic rollback on anomaly. |
| **AUTONOMOUS** | Continuous real-time optimization (e.g. ETA calculations). | Supervised via Control Tower telemetry and emergency kill-switch. |

---

## 3. Tool Function Calling Standards

Tools exposed to AI agents adhere to strictly typed JSON schemas with server-side validation:

```typescript
export interface AgentToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string; enum?: string[] }>;
    required: string[];
  };
  authorizingPolicy: string;
  maxExecutionTimeMs: number;
}
```

No tool may execute shell commands, directly manipulate database connections, or expose private credentials.
