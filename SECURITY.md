# ToGoServe Security Architecture & Compliance Policy
**Version:** 1.0.0  
**Classification:** Operational Security Standard  
**Compliance Target:** BSP Payment Guidelines, DTI Consumer Act, Philippine Data Privacy Act (DPA RA 10173)  

---

## 1. Security Architecture Principles

Security at ToGoServe is grounded in defense-in-depth, strict role-based access control (RBAC), tenant isolation, and cryptographic authorization for all commercial transactions. **AI agents are explicitly prohibited from having direct write access to financial ledgers or unconstrained system administration.**

---

## 2. Identity, Authentication & Role Hierarchy

ToGoServe enforces least privilege access across 8 discrete roles:

```
┌──────────────────────────────────────────────────────────┐
│                   SUPER ADMINISTRATOR                    │
│   Full tenant audit, master kill switches, policy edits   │
└────────────────────────────┬─────────────────────────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ADMINISTRATOR │      │BUSINESS OWNER│      │   SUPPLIER   │
│Control Tower │      │Store admin   │      │Wholesale ops │
└──────┬───────┘      └──────┬───────┘      └──────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│DRIVER/COURIER│      │BUSINESS STAFF│
│Order handling│      │Kitchen prep  │
└──────────────┘      └──────────────┘
       │
       ▼
┌──────────────┐
│   CUSTOMER   │
│Orders & chat │
└──────────────┘
```

### Authentication Standards
- **Token Security:** Short-lived JWTs (15-minute access tokens) with secure HTTP-only refresh tokens.
- **Client Storage:** Zero sensitive secrets, private keys, or API tokens stored in client local storage.
- **Rider Verification:** Driver operational sessions require periodic identity challenges and photo verification.
- **Customer Delivery Handshake:** Delivery completion requires a time-synchronized 4-digit cryptographic Handshake PIN or photo proof of delivery (POD).

---

## 3. AI Safety, Guardrails & Defense-in-Depth

### 3.1 Prompt Injection Defenses
All user inputs to AI agents (Customer, Merchant, Support) pass through a multi-tier sanitizer:
1. **Structural Delimiters:** System prompts and user context are strictly isolated using delimiter boundaries.
2. **Intent Whitelisting:** Prompts are validated against authorized domain vocabularies before execution.
3. **Tool Parameter Schema Enforcement:** Tools invoked by AI models must strictly match typed JSON schemas. Unrecognized keys or invalid types cause immediate tool rejection.

### 3.2 Anti-Hallucination Commercial Gates
The AI system is strictly bounded by deterministic domain facts:
- **No Fabricated Pricing:** Prices are resolved directly from database product entity records. AI models cannot compute final prices outside authorized discount policies.
- **No Fabricated Inventory:** Real-time stock counts are fetched via deterministic tools. An AI cannot promise delivery of items flagged out-of-stock.
- **No Fabricated Medical / Legal Claims:** Pharmacy recommendations require verified catalog entries and cannot make diagnostic or off-label curative promises.

---

## 4. Financial Movement & Regulated Workflows

### 4.1 Separation of AI Reasoning from Money Movement
AI agents may **propose** financial actions (e.g. recommending a ₱540 refund or calculating a ₱25 surge bonus), but **never authorize execution directly**.
- **Under Limit (₱0 - ₱100):** May be automated if verified against SOP rules (e.g. missing drink credit with receipt photo).
- **Above Limit (> ₱100):** Must be enqueued into the Human-in-the-Loop Operational Approval Desk.
- **Fund Settlement:** Actual disbursement to bank accounts, GCash, or Maya wallets requires cryptographic authorization by an authenticated Human Finance Supervisor.

### 4.2 Regulated Pharmacy & Substance Workflows
- **Prescription Check:** Orders containing Rx medications cannot progress to `PREPARING` without a validated doctor's prescription and digital sign-off from a licensed pharmacist.
- **Age Verification:** Liquor and tobacco products require government-issued ID upload and courier physical verification upon delivery.

---

## 5. Audit Logging & Non-Repudiation

Every consequential action generates an immutable audit record containing:
- `actorId` and `actorType` (Human vs AI Agent)
- `agentVersion`, `modelVersion`, and `promptVersion`
- Exact tool called and input parameters
- Policy rule authorizing the action
- Human reviewer ID (for approved items)
- Timestamp with millisecond precision
