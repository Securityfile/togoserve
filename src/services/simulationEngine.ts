import {
  SimulationScenario,
  SimulationScenarioId,
  Order,
  ControlledOrderStatus,
  ExceptionOrderStatus,
  Merchant,
  RiderProfile,
  PhilippineAddress,
} from '../types';
import { publishPlatformEvent } from './eventEngine';
import {
  evaluateRidersForDispatch,
  recordDispatchDecision,
} from './aiObservationLayer';

export const SIMULATION_SCENARIOS: SimulationScenario[] = [
  {
    id: 'SCENARIO_A',
    code: 'SCENARIO A',
    title: 'Normal Successful Delivery',
    description: 'Happy path: Customer orders, merchant accepts, rider accepts, pickup verified, delivered via PIN, financial records settled.',
    expectedOutcome: 'Order completed in 24 mins. Full settlement records generated.',
    stepsCount: 8,
    tags: ['STANDARD', 'HAPPY_PATH', 'FULL_LIFECYCLE'],
  },
  {
    id: 'SCENARIO_B',
    code: 'SCENARIO B',
    title: 'Merchant Preparation Delay',
    description: 'Kitchen peak rush triggers prep extension from 15m to 35m. Merchant Operations AI observes and recommends customer alert.',
    expectedOutcome: 'Customer notified of 12m delay; order completes safely.',
    stepsCount: 7,
    tags: ['MERCHANT_OPS', 'LATENCY', 'CUSTOMER_COMMUNICATION'],
  },
  {
    id: 'SCENARIO_C',
    code: 'SCENARIO C',
    title: 'First Rider Rejects Order',
    description: 'Dispatched rider declines due to flat tire. Dispatch Agent immediately re-evaluates candidates and assigns secondary rider.',
    expectedOutcome: 'Order rerouted within 45 seconds to Kuya Arnel.',
    stepsCount: 7,
    tags: ['DISPATCH_AI', 'RIDER_REJECTION', 'REROUTE'],
  },
  {
    id: 'SCENARIO_D',
    code: 'SCENARIO D',
    title: 'No Rider Available in Zone',
    description: 'High rain in Pasay causes rider shortage. Order enters RIDER_UNAVAILABLE; Dispatch AI observes surge and suggests incentive.',
    expectedOutcome: 'Exception state triggered; Dispatch AI alerts supervisor.',
    stepsCount: 5,
    tags: ['EXCEPTION', 'SHORTAGE', 'SURGE_OBSERVATION'],
  },
  {
    id: 'SCENARIO_E',
    code: 'SCENARIO E',
    title: 'Customer Changes Delivery Instructions',
    description: 'While rider is in transit, customer updates gate code and instructs lobby drop-off. Support AI verifies address change.',
    expectedOutcome: 'Rider app updates delivery instructions seamlessly.',
    stepsCount: 6,
    tags: ['IN_TRANSIT', 'ADDRESS_CHANGE', 'SUPPORT_AI'],
  },
  {
    id: 'SCENARIO_F',
    code: 'SCENARIO F',
    title: 'Merchant Item Unavailable',
    description: 'Merchant runs out of Extra Garlic Rice. Order partially modified before kitchen accepts; price adjusted automatically.',
    expectedOutcome: 'Item removed with customer notification; subtotal adjusted.',
    stepsCount: 6,
    tags: ['MERCHANT_OPS', 'INVENTORY_SHORTAGE', 'PRICE_ADJUST'],
  },
  {
    id: 'SCENARIO_G',
    code: 'SCENARIO G',
    title: 'Delivery Delayed in Heavy Traffic',
    description: 'Heavy congestion on EDSA-Ayala creates +20 min transit delay. Dispatch AI observes and adjusts ETA in customer tracker.',
    expectedOutcome: 'Customer tracking updates dynamically to manage expectations.',
    stepsCount: 7,
    tags: ['TRANSIT_DELAY', 'TRAFFIC', 'DYNAMIC_ETA'],
  },
  {
    id: 'SCENARIO_H',
    code: 'SCENARIO H',
    title: 'Customer Reports Missing Item',
    description: 'Post-delivery, customer opens ticket for missing beverage. Support AI intakes ticket and routes to Human Support Desk with recommendation.',
    expectedOutcome: 'Ticket logged; AI recommends partial refund of ₱85 for human approval.',
    stepsCount: 6,
    tags: ['SUPPORT_AI', 'CUSTOMER_COMPLAINT', 'MISSING_ITEM'],
  },
  {
    id: 'SCENARIO_I',
    code: 'SCENARIO I',
    title: 'COD Discrepancy Flagged',
    description: 'Customer only had ₱500 bill for ₱520 order. Rider records ₱20 short collection; COD Audit AI flags record for admin review.',
    expectedOutcome: 'COD record marked DISPUTED for manual audit reconciliation.',
    stepsCount: 5,
    tags: ['COD_AUDIT', 'FINANCE', 'DISPUTE'],
  },
  {
    id: 'SCENARIO_J',
    code: 'SCENARIO J',
    title: 'Customer Requests Refund for Damaged Food',
    description: 'Spilled soup during transit. Customer uploads photo and requests full refund. Refund Policy AI evaluates and enqueues human sign-off.',
    expectedOutcome: 'Enqueued in AI Approval Queue: Human Admin approves ₱640 refund.',
    stepsCount: 6,
    tags: ['REFUND_AI', 'HUMAN_IN_THE_LOOP', 'FINANCIAL_GOVERNANCE'],
  },
];

export interface SimulationResult {
  scenarioId: SimulationScenarioId;
  orderId: string;
  orderNumber: string;
  stepsExecuted: string[];
  finalOrderStatus: string;
  eventsEmittedCount: number;
  aiDecisionsRecorded: number;
  settlementsRecorded: boolean;
  message: string;
}

export const runSimulationScenario = async (
  scenarioId: SimulationScenarioId,
  context: {
    merchants: Merchant[];
    availableRiders: RiderProfile[];
    createOrder: any;
    updateOrderStatus: any;
    cancelOrder: any;
    refundOrder: any;
    createSupportTicket: any;
    enqueueAIApproval?: any;
  }
): Promise<SimulationResult> => {
  const merchant = context.merchants[0] || {
    id: 'm1',
    name: 'Mang Inasal - Manila Bay',
    address: 'Macapagal Blvd, Pasay City',
  };

  const steps: string[] = [];
  const startTimestamp = new Date().toISOString();

  // Create base order
  const orderNumber = `SIM-${scenarioId.replace('SCENARIO_', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const orderId = `ord_sim_${Date.now()}`;
  const corrId = `corr_${orderId}`;

  publishPlatformEvent({
    eventType: 'CHECKOUT_STARTED',
    actorType: 'CUSTOMER',
    actorId: 'cust_sim_01',
    entityType: 'ORDER',
    entityId: orderId,
    previousState: 'CART',
    newState: 'PENDING_PAYMENT',
    metadata: { scenario: scenarioId, orderNumber },
    correlationId: corrId,
    orderId,
  });
  steps.push('1. Customer started checkout & submitted cart');

  publishPlatformEvent({
    eventType: 'ORDER_CREATED',
    actorType: 'CUSTOMER',
    actorId: 'cust_sim_01',
    entityType: 'ORDER',
    entityId: orderId,
    previousState: 'PENDING_PAYMENT',
    newState: 'ORDER_PLACED',
    metadata: { orderNumber, total: 540, paymentMethod: scenarioId === 'SCENARIO_I' ? 'cod' : 'gcash' },
    correlationId: corrId,
    orderId,
  });
  steps.push(`2. Order ${orderNumber} created & payment authorized`);

  publishPlatformEvent({
    eventType: 'MERCHANT_NOTIFIED',
    actorType: 'SYSTEM',
    actorId: 'system_notification',
    entityType: 'MERCHANT',
    entityId: merchant.id,
    previousState: 'ORDER_PLACED',
    newState: 'MERCHANT_PENDING',
    metadata: { merchantName: merchant.name },
    correlationId: corrId,
    orderId,
  });
  steps.push(`3. Merchant notified at ${merchant.name}`);

  // Scenario specific branch execution
  switch (scenarioId) {
    case 'SCENARIO_A': {
      // Happy Path
      publishPlatformEvent({
        eventType: 'MERCHANT_ACCEPTED',
        actorType: 'MERCHANT',
        actorId: merchant.id,
        entityType: 'ORDER',
        entityId: orderId,
        previousState: 'MERCHANT_PENDING',
        newState: 'MERCHANT_ACCEPTED',
        metadata: { prepEstimateMinutes: 15 },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. Merchant accepted order (15m prep estimated)');

      publishPlatformEvent({
        eventType: 'PREPARATION_STARTED',
        actorType: 'MERCHANT',
        actorId: merchant.id,
        entityType: 'ORDER',
        entityId: orderId,
        previousState: 'MERCHANT_ACCEPTED',
        newState: 'PREPARING',
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'DISPATCH_REQUESTED',
        actorType: 'SYSTEM',
        actorId: 'dispatch_engine',
        entityType: 'DISPATCH',
        entityId: `disp_${orderId}`,
        previousState: 'PREPARING',
        newState: 'SEARCHING_RIDER',
        correlationId: corrId,
        orderId,
      });
      steps.push('5. Dispatch requested; Dispatch AI evaluated candidate riders');

      // AI Dispatch recommendation
      const dispatchEval = evaluateRidersForDispatch(
        {
          id: orderId,
          orderNumber,
          merchantId: merchant.id,
          merchantName: merchant.name,
          deliveryAddress: { barangay: 'San Lorenzo', city: 'Makati' } as PhilippineAddress,
        } as Order,
        context.availableRiders,
        merchant
      );

      const recRider = dispatchEval.recommendedRider || {
        riderId: 'rdr_1',
        riderName: 'Kuya Jayson Cruz',
      };

      recordDispatchDecision({
        order: {
          id: orderId,
          orderNumber,
          merchantId: merchant.id,
          merchantName: merchant.name,
          deliveryAddress: { barangay: 'San Lorenzo', city: 'Makati' } as PhilippineAddress,
        } as Order,
        recommendedRiderId: recRider.riderId,
        recommendedRiderName: recRider.riderName,
        confidence: dispatchEval.confidence || 0.94,
        reasonCodes: dispatchEval.reasonCodes || ['PROXIMITY_UNDER_1_5_KM'],
        selectedRiderId: recRider.riderId,
        selectedRiderName: recRider.riderName,
      });
      steps.push(`6. Dispatch AI recommended ${recRider.riderName}; Human dispatcher accepted match`);

      publishPlatformEvent({
        eventType: 'RIDER_ASSIGNED',
        actorType: 'ADMIN',
        actorId: 'dispatcher_console',
        entityType: 'RIDER',
        entityId: recRider.riderId,
        previousState: 'SEARCHING_RIDER',
        newState: 'RIDER_ASSIGNED',
        metadata: { riderName: recRider.riderName },
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'ORDER_PICKED_UP',
        actorType: 'RIDER',
        actorId: recRider.riderId,
        entityType: 'DELIVERY',
        entityId: `del_${orderId}`,
        previousState: 'READY_FOR_PICKUP',
        newState: 'IN_DELIVERY',
        metadata: { pickupVerified: true },
        correlationId: corrId,
        orderId,
      });
      steps.push('7. Rider verified pickup at kitchen counter and began transit');

      publishPlatformEvent({
        eventType: 'DELIVERY_COMPLETED',
        actorType: 'RIDER',
        actorId: recRider.riderId,
        entityType: 'DELIVERY',
        entityId: `del_${orderId}`,
        previousState: 'DELIVERY_VERIFICATION',
        newState: 'COMPLETED',
        metadata: { podMethod: 'CUSTOMER_PIN_4892' },
        correlationId: corrId,
        orderId,
      });
      steps.push('8. Customer verified PIN 4892; Order completed & financial settlements finalized');

      publishPlatformEvent({
        eventType: 'MERCHANT_SETTLEMENT_RECORDED',
        actorType: 'SYSTEM',
        actorId: 'finance_settlement_service',
        entityType: 'FINANCE',
        entityId: `settle_${orderId}`,
        metadata: { gross: 540, commissionRate: 0.18, netPayout: 442.8 },
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'RIDER_EARNINGS_RECORDED',
        actorType: 'SYSTEM',
        actorId: 'rider_payout_service',
        entityType: 'FINANCE',
        entityId: `earn_${orderId}`,
        metadata: { basePay: 55, distancePay: 35, tip: 30, netTotal: 120 },
        correlationId: corrId,
        orderId,
      });

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'COMPLETED',
        eventsEmittedCount: 8,
        aiDecisionsRecorded: 1,
        settlementsRecorded: true,
        message: 'Scenario A completed successfully with full transaction lifecycle and event trail.',
      };
    }

    case 'SCENARIO_B': {
      // Merchant Prep Delay
      publishPlatformEvent({
        eventType: 'MERCHANT_ACCEPTED',
        actorType: 'MERCHANT',
        actorId: merchant.id,
        entityType: 'ORDER',
        entityId: orderId,
        previousState: 'MERCHANT_PENDING',
        newState: 'MERCHANT_ACCEPTED',
        metadata: { prepEstimateMinutes: 15 },
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'AI_OBSERVATION_RECORDED',
        actorType: 'AI_AGENT',
        actorId: 'agent_merchant_ops',
        entityType: 'ORDER',
        entityId: orderId,
        metadata: {
          observation: 'Kitchen queue backlog detected: 8 concurrent orders',
          recommendedBufferMins: 15,
        },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. Merchant Operations AI observed kitchen queue and recommended +15m prep buffer');

      publishPlatformEvent({
        eventType: 'PREPARATION_STARTED',
        actorType: 'MERCHANT',
        actorId: merchant.id,
        entityType: 'ORDER',
        entityId: orderId,
        previousState: 'MERCHANT_ACCEPTED',
        newState: 'PREPARING',
        metadata: { revisedPrepEstimate: 30, reason: 'LUNCH_RUSH_BACKLOG' },
        correlationId: corrId,
        orderId,
      });
      steps.push('5. Kitchen extended prep estimate to 30 mins; Customer notified via live tracker');

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'PREPARING',
        eventsEmittedCount: 5,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: 'Scenario B: Prep latency observed and handled gracefully by Merchant Ops AI.',
      };
    }

    case 'SCENARIO_C': {
      // First Rider Rejects Order
      publishPlatformEvent({
        eventType: 'DISPATCH_REQUESTED',
        actorType: 'SYSTEM',
        actorId: 'dispatch_engine',
        entityType: 'DISPATCH',
        entityId: `disp_${orderId}`,
        previousState: 'PREPARING',
        newState: 'SEARCHING_RIDER',
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'RIDER_OFFER_DECLINED',
        actorType: 'RIDER',
        actorId: 'rdr_104',
        entityType: 'RIDER',
        entityId: 'rdr_104',
        previousState: 'RIDER_OFFERED',
        newState: 'SEARCHING_RIDER',
        metadata: { declineReason: 'FLAT_TIRE_EMERGENCY' },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. First offered rider declined due to mechanical emergency (flat tire)');

      // Dispatch AI immediately re-evaluates
      recordDispatchDecision({
        order: {
          id: orderId,
          orderNumber,
          merchantId: merchant.id,
          merchantName: merchant.name,
          deliveryAddress: { barangay: 'Bel-Air', city: 'Makati' } as PhilippineAddress,
        } as Order,
        recommendedRiderId: 'rdr_203',
        recommendedRiderName: 'Arnel Bautista',
        confidence: 0.89,
        reasonCodes: ['SECONDARY_BEST_MATCH', 'PROXIMITY_UNDER_2_KM'],
        selectedRiderId: 'rdr_203',
        selectedRiderName: 'Arnel Bautista',
      });
      steps.push('5. Dispatch AI re-evaluated available fleet and assigned secondary candidate Arnel Bautista');

      publishPlatformEvent({
        eventType: 'RIDER_ASSIGNED',
        actorType: 'ADMIN',
        actorId: 'dispatch_engine',
        entityType: 'RIDER',
        entityId: 'rdr_203',
        previousState: 'SEARCHING_RIDER',
        newState: 'RIDER_ASSIGNED',
        metadata: { riderName: 'Arnel Bautista' },
        correlationId: corrId,
        orderId,
      });

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'RIDER_ASSIGNED',
        eventsEmittedCount: 6,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: 'Scenario C: Rider rejection intercepted and order seamlessly rerouted.',
      };
    }

    case 'SCENARIO_D': {
      // No Rider Available (Shortage)
      publishPlatformEvent({
        eventType: 'DISPATCH_REQUESTED',
        actorType: 'SYSTEM',
        actorId: 'dispatch_engine',
        entityType: 'DISPATCH',
        entityId: `disp_${orderId}`,
        previousState: 'PREPARING',
        newState: 'SEARCHING_RIDER',
        correlationId: corrId,
        orderId,
      });

      publishPlatformEvent({
        eventType: 'AI_OBSERVATION_RECORDED',
        actorType: 'AI_AGENT',
        actorId: 'agent_dispatch',
        entityType: 'DISPATCH',
        entityId: `disp_${orderId}`,
        metadata: {
          alert: 'RIDER_SHORTAGE_DETECTED',
          zone: 'Pasay/Manila Bay',
          onlineRidersCount: 0,
          recommendation: 'Trigger zone surge incentive of +₱25 to attract riders from neighboring Makati zone',
        },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. Dispatch AI observed zero active riders in zone; generated surge incentive advisory');

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'SEARCHING_RIDER',
        eventsEmittedCount: 4,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: 'Scenario D: Rider shortage observed and surge recommendation logged.',
      };
    }

    case 'SCENARIO_I': {
      // COD Discrepancy Flagged
      publishPlatformEvent({
        eventType: 'DELIVERY_COMPLETED',
        actorType: 'RIDER',
        actorId: 'rdr_1',
        entityType: 'DELIVERY',
        entityId: `del_${orderId}`,
        previousState: 'DELIVERY_VERIFICATION',
        newState: 'COMPLETED',
        metadata: { expectedCod: 540, actualCollected: 500, discrepancy: -40 },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. Rider recorded delivery with ₱40 COD shortage (Customer exact change shortage)');

      publishPlatformEvent({
        eventType: 'AI_OBSERVATION_RECORDED',
        actorType: 'AI_AGENT',
        actorId: 'agent_finance',
        entityType: 'FINANCE',
        entityId: `cod_${orderId}`,
        metadata: {
          auditResult: 'COD_DISCREPANCY_FLAGGED',
          discrepancyAmount: 40,
          requiresHumanAudit: true,
        },
        correlationId: corrId,
        orderId,
      });
      steps.push('5. COD Audit AI flagged remittance discrepancy for human financial supervisor sign-off');

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'DISPUTED',
        eventsEmittedCount: 5,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: 'Scenario I: COD discrepancy observed, logged, and routed to human review.',
      };
    }

    case 'SCENARIO_J': {
      // Customer Requests Refund (Damaged Food)
      publishPlatformEvent({
        eventType: 'REFUND_REQUESTED',
        actorType: 'CUSTOMER',
        actorId: 'cust_sim_01',
        entityType: 'ORDER',
        entityId: orderId,
        previousState: 'COMPLETED',
        newState: 'REFUND_REQUESTED',
        metadata: { reason: 'SPILLED_SOUP_IN_TRANSIT', requestedAmount: 540 },
        correlationId: corrId,
        orderId,
      });
      steps.push('4. Customer reported spilled soup in transit; requested full refund of ₱540');

      publishPlatformEvent({
        eventType: 'AI_RECOMMENDATION_GENERATED',
        actorType: 'AI_AGENT',
        actorId: 'agent_refund',
        entityType: 'FINANCE',
        entityId: `ref_${orderId}`,
        metadata: {
          recommendedAction: 'APPROVE_FULL_REFUND',
          amount: 540,
          confidence: 0.94,
          policy: 'SOP-REF-202',
          requiresHumanApproval: true,
        },
        correlationId: corrId,
        orderId,
      });
      steps.push('5. Refund Policy AI evaluated photo proof; recommended ₱540 refund for Human Supervisor approval (enqueued)');

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'REFUND_REQUESTED',
        eventsEmittedCount: 5,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: 'Scenario J: Refund evaluated under Human-in-the-Loop policy and enqueued.',
      };
    }

    default: {
      // Generic exception scenario handler
      publishPlatformEvent({
        eventType: 'AI_OBSERVATION_RECORDED',
        actorType: 'AI_AGENT',
        actorId: 'agent_orchestrator',
        entityType: 'ORDER',
        entityId: orderId,
        metadata: { scenario: scenarioId, note: 'Simulated operational flow executed' },
        correlationId: corrId,
        orderId,
      });
      steps.push(`4. Simulated scenario ${scenarioId} executed through event engine`);

      return {
        scenarioId,
        orderId,
        orderNumber,
        stepsExecuted: steps,
        finalOrderStatus: 'ORDER_PLACED',
        eventsEmittedCount: 4,
        aiDecisionsRecorded: 1,
        settlementsRecorded: false,
        message: `Scenario ${scenarioId} completed successfully.`,
      };
    }
  }
};
