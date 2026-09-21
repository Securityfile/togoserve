export type ControlledOrderStatus =
  | 'CART'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_PLACED'
  | 'MERCHANT_PENDING'
  | 'MERCHANT_ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'SEARCHING_RIDER'
  | 'RIDER_OFFERED'
  | 'RIDER_ASSIGNED'
  | 'RIDER_TO_MERCHANT'
  | 'RIDER_AT_MERCHANT'
  | 'PICKUP_VERIFIED'
  | 'IN_DELIVERY'
  | 'RIDER_NEAR_CUSTOMER'
  | 'RIDER_AT_CUSTOMER'
  | 'DELIVERY_VERIFICATION'
  | 'DELIVERED'
  | 'COMPLETED';

export type ExceptionOrderStatus =
  | 'PAYMENT_FAILED'
  | 'MERCHANT_REJECTED'
  | 'CANCELLED'
  | 'RIDER_UNAVAILABLE'
  | 'DELIVERY_FAILED'
  | 'REFUND_REQUESTED'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'DISPUTED';

export type UnifiedOrderStatus = ControlledOrderStatus | ExceptionOrderStatus;

// Valid State Transitions Map to prevent unauthorized state skipping
export const VALID_ORDER_TRANSITIONS: Record<UnifiedOrderStatus, UnifiedOrderStatus[]> = {
  CART: ['PENDING_PAYMENT', 'CANCELLED'],
  PENDING_PAYMENT: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'CANCELLED'],
  PAYMENT_CONFIRMED: ['ORDER_PLACED', 'CANCELLED', 'REFUND_REQUESTED'],
  ORDER_PLACED: ['MERCHANT_PENDING', 'CANCELLED'],
  MERCHANT_PENDING: ['MERCHANT_ACCEPTED', 'MERCHANT_REJECTED', 'CANCELLED'],
  MERCHANT_ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_PICKUP', 'SEARCHING_RIDER', 'CANCELLED', 'REFUND_REQUESTED'],
  READY_FOR_PICKUP: ['SEARCHING_RIDER', 'RIDER_OFFERED', 'RIDER_ASSIGNED', 'CANCELLED'],
  SEARCHING_RIDER: ['RIDER_OFFERED', 'RIDER_ASSIGNED', 'RIDER_UNAVAILABLE', 'CANCELLED'],
  RIDER_OFFERED: ['RIDER_ASSIGNED', 'SEARCHING_RIDER', 'RIDER_UNAVAILABLE', 'CANCELLED'],
  RIDER_ASSIGNED: ['RIDER_TO_MERCHANT', 'SEARCHING_RIDER', 'CANCELLED'],
  RIDER_TO_MERCHANT: ['RIDER_AT_MERCHANT', 'SEARCHING_RIDER', 'CANCELLED'],
  RIDER_AT_MERCHANT: ['PICKUP_VERIFIED', 'CANCELLED'],
  PICKUP_VERIFIED: ['IN_DELIVERY', 'DELIVERY_FAILED', 'DISPUTED'],
  IN_DELIVERY: ['RIDER_NEAR_CUSTOMER', 'DELIVERY_FAILED', 'DISPUTED'],
  RIDER_NEAR_CUSTOMER: ['RIDER_AT_CUSTOMER', 'DELIVERY_FAILED', 'DISPUTED'],
  RIDER_AT_CUSTOMER: ['DELIVERY_VERIFICATION', 'DELIVERY_FAILED', 'DISPUTED'],
  DELIVERY_VERIFICATION: ['DELIVERED', 'DELIVERY_FAILED', 'DISPUTED'],
  DELIVERED: ['COMPLETED', 'REFUND_REQUESTED', 'DISPUTED'],
  COMPLETED: ['REFUND_REQUESTED', 'DISPUTED'],

  // Exception states transitions
  PAYMENT_FAILED: ['PENDING_PAYMENT', 'CANCELLED'],
  MERCHANT_REJECTED: ['REFUNDED', 'CANCELLED'],
  CANCELLED: ['REFUNDED', 'PARTIALLY_REFUNDED'],
  RIDER_UNAVAILABLE: ['SEARCHING_RIDER', 'CANCELLED'],
  DELIVERY_FAILED: ['REFUND_REQUESTED', 'DISPUTED', 'CANCELLED'],
  REFUND_REQUESTED: ['PARTIALLY_REFUNDED', 'REFUNDED', 'DISPUTED', 'COMPLETED'],
  PARTIALLY_REFUNDED: ['COMPLETED', 'DISPUTED'],
  REFUNDED: ['COMPLETED'],
  DISPUTED: ['COMPLETED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
};

// Platform Events
export type PlatformActorType =
  | 'CUSTOMER'
  | 'MERCHANT'
  | 'RIDER'
  | 'ADMIN'
  | 'DISPATCHER'
  | 'SUPERVISOR'
  | 'SYSTEM'
  | 'AI_AGENT';

export type PlatformEntityType =
  | 'ORDER'
  | 'CART'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'MERCHANT'
  | 'RIDER'
  | 'DISPATCH'
  | 'SUPPORT_TICKET'
  | 'FINANCE';

export type PlatformEventType =
  | 'CUSTOMER_REGISTERED'
  | 'CART_CREATED'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_CONFIRMED'
  | 'ORDER_CREATED'
  | 'MERCHANT_NOTIFIED'
  | 'MERCHANT_ACCEPTED'
  | 'MERCHANT_REJECTED'
  | 'PREPARATION_STARTED'
  | 'ORDER_READY'
  | 'DISPATCH_REQUESTED'
  | 'RIDER_OFFER_CREATED'
  | 'RIDER_OFFER_ACCEPTED'
  | 'RIDER_OFFER_DECLINED'
  | 'RIDER_ASSIGNED'
  | 'RIDER_ARRIVED_MERCHANT'
  | 'ORDER_PICKED_UP'
  | 'DELIVERY_STARTED'
  | 'RIDER_NEAR_CUSTOMER'
  | 'RIDER_ARRIVED_CUSTOMER'
  | 'DELIVERY_VERIFIED'
  | 'DELIVERY_COMPLETED'
  | 'REVIEW_SUBMITTED'
  | 'REFUND_REQUESTED'
  | 'REFUND_COMPLETED'
  | 'SUPPORT_TICKET_CREATED'
  | 'AI_OBSERVATION_RECORDED'
  | 'AI_RECOMMENDATION_GENERATED'
  | 'HUMAN_DECISION_RECORDED'
  | 'HUMAN_OVERRIDE_RECORDED'
  | 'DISPATCH_OVERRIDE_RECORDED'
  | 'MERCHANT_SETTLEMENT_RECORDED'
  | 'RIDER_EARNINGS_RECORDED'
  | 'PLATFORM_REVENUE_RECORDED';

export interface PlatformEvent {
  eventId: string;
  eventType: PlatformEventType;
  timestamp: string;
  actorType: PlatformActorType;
  actorId: string;
  entityType: PlatformEntityType;
  entityId: string;
  previousState?: string;
  newState?: string;
  metadata: Record<string, any>;
  correlationId: string;
  orderId?: string;
}

// AI Observation Record
export interface AIObservationRecord {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  orderId: string;
  eventType: PlatformEventType;
  whatHappened: string;
  whoPerformed: string;
  informationAvailable: Record<string, any>;
  decisionMade?: string;
  decisionDurationMs: number;
  eventualOutcome?: string;
}

// Rider Candidate Evaluated by Dispatch AI
export interface RiderCandidateEvaluation {
  riderId: string;
  riderName: string;
  distanceToMerchantKm: number;
  vehicleType: string;
  currentWorkload: number;
  rating: number;
  acceptanceRate: number;
  estimatedArrivalMins: number;
  suitabilityScore: number; // 0 - 100
  reasonCodes: string[];
}

export type DispatchOverrideReason =
  | 'Rider closer to merchant'
  | 'Rider already returning toward destination'
  | 'Motorcycle capacity issue'
  | 'Rider requested break'
  | 'Customer requirement'
  | 'Zone congestion bypass'
  | 'Other';

// AI Decision Record (Section 12)
export interface AIDecisionRecord {
  id: string;
  decisionId: string;
  agentId: string;
  agentName: string;
  task: string;
  inputContext: Record<string, any>;
  recommendation: string;
  confidence: number; // 0.00 - 1.00
  reasonCodes: string[];
  humanDecision: 'MATCH' | 'OVERRIDDEN' | 'REJECTED' | 'MODIFIED' | 'ESCALATED' | 'PENDING';
  humanOverride: boolean;
  overrideReason?: DispatchOverrideReason | string;
  selectedEntityId?: string;
  finalAction: string;
  outcome?: 'SUCCESS' | 'DELAY' | 'FAILED' | 'PENDING_EVALUATION';
  outcomeMetrics?: {
    deliveryTimeMinutes?: number;
    customerRating?: number;
    costVariance?: number;
  };
  timestamp: string;
  agentVersion: string;
  modelVersion: string;
  promptVersion: string;
  policyVersion: string;
}

// AI Training & Evaluation Dataset (Section 13)
export type TrainingClassification =
  | 'GOOD'
  | 'BAD'
  | 'ACCEPTABLE'
  | 'NEEDS_REVIEW'
  | 'EXCEPTION'
  | 'EDGE_CASE';

export interface AITrainingDatasetItem {
  id: string;
  exampleId: string;
  orderId: string;
  agentId: string;
  input: string;
  context: Record<string, any>;
  aiRecommendation: string;
  humanAction: string;
  outcome: string;
  feedback: string;
  classification: TrainingClassification;
  reviewedBy?: string;
  reviewTimestamp?: string;
  timestamp: string;
}

// Financial Settlement Records
export interface MerchantSettlementRecord {
  id: string;
  settlementId: string;
  orderId: string;
  merchantId: string;
  merchantName: string;
  grossSales: number;
  commissionRate: number;
  commissionAmount: number;
  vatAmount: number;
  netPayout: number;
  status: 'PENDING' | 'SETTLED' | 'WITHHELD';
  settlementDate: string;
  createdAt: string;
}

export interface RiderEarningsRecord {
  id: string;
  earningsId: string;
  orderId: string;
  riderId: string;
  riderName: string;
  basePay: number;
  distancePay: number;
  incentives: number;
  tip: number;
  totalEarnings: number;
  status: 'PENDING' | 'CREDITED';
  tripDistanceKm: number;
  completedAt: string;
}

export interface PlatformRevenueRecord {
  id: string;
  revenueId: string;
  orderId: string;
  commissionRevenue: number;
  deliveryFeeShare: number;
  serviceFee: number;
  netPlatformProfit: number;
  timestamp: string;
}

// 10 Simulation Scenarios (Section 18)
export type SimulationScenarioId =
  | 'SCENARIO_A'
  | 'SCENARIO_B'
  | 'SCENARIO_C'
  | 'SCENARIO_D'
  | 'SCENARIO_E'
  | 'SCENARIO_F'
  | 'SCENARIO_G'
  | 'SCENARIO_H'
  | 'SCENARIO_I'
  | 'SCENARIO_J';

export interface SimulationScenario {
  id: SimulationScenarioId;
  code: string;
  title: string;
  description: string;
  expectedOutcome: string;
  stepsCount: number;
  tags: string[];
}
