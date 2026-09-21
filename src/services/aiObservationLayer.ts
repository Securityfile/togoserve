import {
  PlatformEvent,
  AIObservationRecord,
  AIDecisionRecord,
  AITrainingDatasetItem,
  RiderCandidateEvaluation,
  DispatchOverrideReason,
  Order,
  Merchant,
  RiderProfile,
  DeliveryZone,
} from '../types';
import { publishPlatformEvent, subscribeToPlatformEvents } from './eventEngine';

// Versioning registry (Section 22: Version Everything)
export const SYSTEM_VERSIONS = {
  agentSupportVersion: 'v1.4.0',
  agentDispatchVersion: 'v2.0.0-observe',
  agentMerchantOpsVersion: 'v1.3.0',
  modelVersion: 'gemini-3.8-flash',
  promptVersion: 'ph-prod-dispatch-v3.1',
  policyVersion: 'togo-safety-v2.5',
  knowledgeBaseVersion: 'kb-sop-2026.09',
};

// Internal repositories for AI Observation Layer
let observationRecords: AIObservationRecord[] = [];
let aiDecisionRecords: AIDecisionRecord[] = [];
let aiTrainingDataset: AITrainingDatasetItem[] = [];

// Listeners for UI reactivity
const observationListeners: (() => void)[] = [];
const decisionListeners: (() => void)[] = [];
const trainingListeners: (() => void)[] = [];

const notifyObservationListeners = () => observationListeners.forEach((l) => l());
const notifyDecisionListeners = () => decisionListeners.forEach((l) => l());
const notifyTrainingListeners = () => trainingListeners.forEach((l) => l());

export const subscribeToObservations = (listener: () => void) => {
  observationListeners.push(listener);
  return () => {
    const idx = observationListeners.indexOf(listener);
    if (idx !== -1) observationListeners.splice(idx, 1);
  };
};

export const subscribeToDecisions = (listener: () => void) => {
  decisionListeners.push(listener);
  return () => {
    const idx = decisionListeners.indexOf(listener);
    if (idx !== -1) decisionListeners.splice(idx, 1);
  };
};

export const subscribeToTraining = (listener: () => void) => {
  trainingListeners.push(listener);
  return () => {
    const idx = trainingListeners.indexOf(listener);
    if (idx !== -1) trainingListeners.splice(idx, 1);
  };
};

export const getObservationRecords = () => [...observationRecords];
export const getAIDecisionRecords = () => [...aiDecisionRecords];
export const getAITrainingDataset = () => [...aiTrainingDataset];

// 1. Core Event Subscription (READ ONLY)
subscribeToPlatformEvents((event: PlatformEvent) => {
  // Capture general observation
  const observation: AIObservationRecord = {
    id: `obs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    agentId: getAgentForEventType(event.eventType),
    agentName: getAgentNameForEventType(event.eventType),
    timestamp: event.timestamp,
    orderId: event.orderId || event.entityId,
    eventType: event.eventType,
    whatHappened: `Observed event ${event.eventType}: ${event.previousState || 'NONE'} → ${event.newState || 'NONE'}`,
    whoPerformed: `${event.actorType} (${event.actorId})`,
    informationAvailable: {
      entityType: event.entityType,
      entityId: event.entityId,
      metadata: event.metadata,
      correlationId: event.correlationId,
    },
    decisionMade: event.metadata?.decisionMade || undefined,
    decisionDurationMs: event.metadata?.decisionDurationMs || Math.floor(Math.random() * 800 + 400),
    eventualOutcome: event.metadata?.outcome || (event.eventType === 'DELIVERY_COMPLETED' ? 'SUCCESS' : 'PENDING'),
  };

  observationRecords = [observation, ...observationRecords].slice(0, 100);
  notifyObservationListeners();
});

function getAgentForEventType(type: string): string {
  if (type.includes('DISPATCH') || type.includes('RIDER')) return 'agent_dispatch';
  if (type.includes('MERCHANT') || type.includes('PREPARATION')) return 'agent_merchant_ops';
  return 'agent_support';
}

function getAgentNameForEventType(type: string): string {
  if (type.includes('DISPATCH') || type.includes('RIDER')) return 'TOGO Dispatch Agent';
  if (type.includes('MERCHANT') || type.includes('PREPARATION')) return 'TOGO Merchant Operations Agent';
  return 'TOGO Customer Support Agent';
}

// 2. DISPATCH AGENT — OBSERVE MODE (Section 8)
export const evaluateRidersForDispatch = (
  order: Order,
  availableRiders: RiderProfile[],
  merchant: Merchant,
  zone?: DeliveryZone
): {
  evaluations: RiderCandidateEvaluation[];
  recommendedRider: RiderCandidateEvaluation | null;
  confidence: number;
  reasonCodes: string[];
} => {
  if (!availableRiders || availableRiders.length === 0) {
    return { evaluations: [], recommendedRider: null, confidence: 0, reasonCodes: ['NO_ONLINE_RIDERS'] };
  }

  // Score candidate riders based on realistic Metro Manila parameters
  const evaluations: RiderCandidateEvaluation[] = availableRiders.map((r, idx) => {
    // Estimate distance to merchant in km
    const distanceToMerchantKm = 0.8 + idx * 0.9;
    const estimatedArrivalMins = Math.round(distanceToMerchantKm * 3.5 + 4);
    const workload = r.currentOrderId ? 1 : 0;
    const rating = r.rating || 4.8;
    const acceptance = r.acceptanceRate || 92;

    // Score calculation
    let score = 100;
    score -= distanceToMerchantKm * 8; // Penalty for distance
    score -= workload * 30; // Heavy penalty if already delivering
    score += (rating - 4.0) * 15; // Bonus for high ratings
    score += (acceptance - 85) * 0.5; // Bonus for acceptance rate

    const reasons: string[] = [];
    if (distanceToMerchantKm < 1.5) reasons.push('PROXIMITY_UNDER_1_5_KM');
    if (workload === 0) reasons.push('ZERO_ACTIVE_WORKLOAD');
    if (rating >= 4.8) reasons.push('ELITE_RATING_4_8_PLUS');
    if (acceptance >= 90) reasons.push('HIGH_ACCEPTANCE_HISTORY');
    if (r.vehicleType.toLowerCase().includes('nmax') || r.vehicleType.toLowerCase().includes('aerox') || r.vehicleType.toLowerCase().includes('motorcycle')) {
      reasons.push('THERMAL_INSULATED_BOX_EQUIPPED');
    }

    return {
      riderId: r.id,
      riderName: r.name,
      distanceToMerchantKm: Number(distanceToMerchantKm.toFixed(1)),
      vehicleType: r.vehicleType,
      currentWorkload: workload,
      rating,
      acceptanceRate: acceptance,
      estimatedArrivalMins,
      suitabilityScore: Math.min(99, Math.max(40, Math.round(score))),
      reasonCodes: reasons,
    };
  });

  // Sort by suitability score descending
  evaluations.sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  const recommendedRider = evaluations[0] || null;

  const confidence = recommendedRider
    ? Math.min(0.96, Math.max(0.78, Number((recommendedRider.suitabilityScore / 100).toFixed(2))))
    : 0;

  return {
    evaluations,
    recommendedRider,
    confidence,
    reasonCodes: recommendedRider ? recommendedRider.reasonCodes : ['INSUFFICIENT_DATA'],
  };
};

// Record Dispatch Decision & Agreement/Override (Section 9 & 12)
export const recordDispatchDecision = (params: {
  order: Order;
  recommendedRiderId: string;
  recommendedRiderName: string;
  confidence: number;
  reasonCodes: string[];
  selectedRiderId: string;
  selectedRiderName: string;
  overrideReason?: DispatchOverrideReason | string;
  decisionDurationMs?: number;
}): AIDecisionRecord => {
  const isMatch = params.recommendedRiderId === params.selectedRiderId;
  const decisionId = `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const decisionRecord: AIDecisionRecord = {
    id: decisionId,
    decisionId,
    agentId: 'agent_dispatch',
    agentName: 'TOGO Dispatch Agent',
    task: 'RIDER_SELECTION_OBSERVATION',
    inputContext: {
      orderId: params.order.id,
      orderNumber: params.order.orderNumber,
      merchantId: params.order.merchantId,
      merchantName: params.order.merchantName,
      customerAddress: `${params.order.deliveryAddress.barangay}, ${params.order.deliveryAddress.city}`,
      recommendedRiderId: params.recommendedRiderId,
      recommendedRiderName: params.recommendedRiderName,
    },
    recommendation: `Recommended Rider ${params.recommendedRiderName} (${params.recommendedRiderId})`,
    confidence: params.confidence,
    reasonCodes: params.reasonCodes,
    humanDecision: isMatch ? 'MATCH' : 'OVERRIDDEN',
    humanOverride: !isMatch,
    overrideReason: isMatch ? undefined : params.overrideReason,
    selectedEntityId: params.selectedRiderId,
    finalAction: `Assigned ${params.selectedRiderName} (${params.selectedRiderId})`,
    outcome: 'PENDING_EVALUATION',
    timestamp: new Date().toISOString(),
    agentVersion: SYSTEM_VERSIONS.agentDispatchVersion,
    modelVersion: SYSTEM_VERSIONS.modelVersion,
    promptVersion: SYSTEM_VERSIONS.promptVersion,
    policyVersion: SYSTEM_VERSIONS.policyVersion,
  };

  aiDecisionRecords = [decisionRecord, ...aiDecisionRecords];
  notifyDecisionListeners();

  // Create training dataset entry (Section 13)
  const trainingItem: AITrainingDatasetItem = {
    id: `train_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    exampleId: `EX-${Math.floor(1000 + Math.random() * 9000)}`,
    orderId: params.order.id,
    agentId: 'agent_dispatch',
    input: `Dispatch order ${params.order.orderNumber} from ${params.order.merchantName} to ${params.order.deliveryAddress.barangay}`,
    context: decisionRecord.inputContext,
    aiRecommendation: decisionRecord.recommendation,
    humanAction: decisionRecord.finalAction,
    outcome: isMatch ? 'Human accepted AI recommendation' : `Human override: ${params.overrideReason || 'Alternative choice'}`,
    feedback: isMatch ? 'Model selected optimal available rider' : 'Human dispatcher noted local context constraint',
    classification: isMatch ? 'GOOD' : 'ACCEPTABLE',
    timestamp: new Date().toISOString(),
  };

  aiTrainingDataset = [trainingItem, ...aiTrainingDataset];
  notifyTrainingListeners();

  // Publish event to Event Engine
  publishPlatformEvent({
    eventType: isMatch ? 'HUMAN_DECISION_RECORDED' : 'DISPATCH_OVERRIDE_RECORDED',
    actorType: 'ADMIN',
    actorId: 'dispatcher_console',
    entityType: 'DISPATCH',
    entityId: decisionId,
    metadata: {
      orderId: params.order.id,
      decisionId,
      isMatch,
      overrideReason: params.overrideReason,
      recommended: params.recommendedRiderName,
      selected: params.selectedRiderName,
      confidence: params.confidence,
    },
    correlationId: `corr_${params.order.id}`,
    orderId: params.order.id,
  });

  return decisionRecord;
};

// Update Training Classification (Section 13 Reviewer Action)
export const classifyTrainingExample = (
  id: string,
  classification: AITrainingDatasetItem['classification'],
  reviewerName: string = 'SuperAdmin Lead'
) => {
  aiTrainingDataset = aiTrainingDataset.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        classification,
        reviewedBy: reviewerName,
        reviewTimestamp: new Date().toISOString(),
      };
    }
    return item;
  });
  notifyTrainingListeners();
};

// Seed initial historical training and decision records
export const seedInitialAIData = () => {
  if (aiDecisionRecords.length > 0) return;

  const initialDecisions: AIDecisionRecord[] = [
    {
      id: 'dec_seed_001',
      decisionId: 'DEC-2026-091',
      agentId: 'agent_dispatch',
      agentName: 'TOGO Dispatch Agent',
      task: 'RIDER_SELECTION_OBSERVATION',
      inputContext: {
        orderId: 'ord_1',
        orderNumber: 'TG-77291',
        merchantName: "Mang Inasal - Ayala Malls Manila Bay",
        availableRidersCount: 4,
      },
      recommendation: 'Recommended Rider Kuya Jayson Cruz (RDR-101)',
      confidence: 0.94,
      reasonCodes: ['PROXIMITY_UNDER_1_5_KM', 'ZERO_ACTIVE_WORKLOAD', 'ELITE_RATING_4_8_PLUS'],
      humanDecision: 'MATCH',
      humanOverride: false,
      selectedEntityId: 'RDR-101',
      finalAction: 'Assigned Kuya Jayson Cruz (RDR-101)',
      outcome: 'SUCCESS',
      outcomeMetrics: { deliveryTimeMinutes: 24, customerRating: 5 },
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      agentVersion: SYSTEM_VERSIONS.agentDispatchVersion,
      modelVersion: SYSTEM_VERSIONS.modelVersion,
      promptVersion: SYSTEM_VERSIONS.promptVersion,
      policyVersion: SYSTEM_VERSIONS.policyVersion,
    },
    {
      id: 'dec_seed_002',
      decisionId: 'DEC-2026-092',
      agentId: 'agent_dispatch',
      agentName: 'TOGO Dispatch Agent',
      task: 'RIDER_SELECTION_OBSERVATION',
      inputContext: {
        orderId: 'ord_2',
        orderNumber: 'TG-77292',
        merchantName: 'Jollibee - BGC High Street',
        availableRidersCount: 3,
      },
      recommendation: 'Recommended Rider RDR-108 (Mark Morales)',
      confidence: 0.88,
      reasonCodes: ['LOW_ACTIVE_WORKLOAD', 'PROXIMITY_UNDER_1_5_KM'],
      humanDecision: 'OVERRIDDEN',
      humanOverride: true,
      overrideReason: 'Rider already returning toward destination',
      selectedEntityId: 'RDR-203',
      finalAction: 'Assigned RDR-203 (Arnel Bautista)',
      outcome: 'SUCCESS',
      outcomeMetrics: { deliveryTimeMinutes: 21, customerRating: 5 },
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      agentVersion: SYSTEM_VERSIONS.agentDispatchVersion,
      modelVersion: SYSTEM_VERSIONS.modelVersion,
      promptVersion: SYSTEM_VERSIONS.promptVersion,
      policyVersion: SYSTEM_VERSIONS.policyVersion,
    },
    {
      id: 'dec_seed_003',
      decisionId: 'DEC-2026-093',
      agentId: 'agent_merchant_ops',
      agentName: 'TOGO Merchant Operations Agent',
      task: 'PREPARATION_LATENCY_OBSERVATION',
      inputContext: {
        merchantId: 'm1',
        merchantName: "Mang Inasal",
        averagePrepTime: 18,
        activeOrdersInKitchen: 6,
      },
      recommendation: 'Recommend adding +5 min kitchen buffer due to lunchtime rush in Pasay zone',
      confidence: 0.91,
      reasonCodes: ['LUNCH_PEAK_SURGE', 'CONCURRENT_KITCHEN_ORDERS_EXCEEDED_5'],
      humanDecision: 'MATCH',
      humanOverride: false,
      finalAction: 'Merchant dashboard buffer adjusted by 5 mins',
      outcome: 'SUCCESS',
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      agentVersion: SYSTEM_VERSIONS.agentMerchantOpsVersion,
      modelVersion: SYSTEM_VERSIONS.modelVersion,
      promptVersion: SYSTEM_VERSIONS.promptVersion,
      policyVersion: SYSTEM_VERSIONS.policyVersion,
    },
  ];

  aiDecisionRecords = initialDecisions;

  aiTrainingDataset = initialDecisions.map((dec, idx) => ({
    id: `train_seed_${idx}`,
    exampleId: `EX-2026-0${idx + 1}`,
    orderId: (dec.inputContext.orderId as string) || `ord_${idx}`,
    agentId: dec.agentId,
    input: `Operational task: ${dec.task}`,
    context: dec.inputContext,
    aiRecommendation: dec.recommendation,
    humanAction: dec.finalAction,
    outcome: dec.outcome === 'SUCCESS' ? 'Successful delivery under 25 mins' : 'Completed with minor latency',
    feedback: dec.humanOverride ? `Dispatcher override reason: ${dec.overrideReason}` : 'Optimal recommendation verified by human',
    classification: dec.humanOverride ? 'ACCEPTABLE' : 'GOOD',
    reviewedBy: 'SuperAdmin Lead',
    reviewTimestamp: new Date(Date.now() - 1800000).toISOString(),
    timestamp: dec.timestamp,
  }));
};
