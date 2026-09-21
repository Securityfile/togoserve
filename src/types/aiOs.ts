export type AutonomyLevel = 0 | 1 | 2 | 3 | 4 | 5;

export type AgentDepartment =
  | 'Orchestration'
  | 'Customer'
  | 'Commerce'
  | 'Operations'
  | 'Business & Finance';

export type AgentStatus =
  | 'TRAINING'
  | 'TESTING'
  | 'ACTIVE'
  | 'PAUSED'
  | 'RESTRICTED'
  | 'DISABLED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AgentPermissions {
  read: string[];
  execute: string[];
  restricted: string[];
}

export interface AIAgent {
  id: string;
  name: string;
  department: AgentDepartment;
  purpose: string;
  status: AgentStatus;
  autonomyLevel: AutonomyLevel;
  permissions: AgentPermissions;
  allowedTools: string[];
  restrictedActions: string[];
  currentTasks: number;
  completedTasks: number;
  successRate: number; // percentage, e.g. 98.4
  humanOverrides: number;
  escalations: number;
  errors: number;
  lastActivity: string;
  version: string;
}

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'MODIFIED'
  | 'ESCALATED';

export interface AIApprovalItem {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  reason: string;
  confidence: number; // 0.00 - 1.00
  riskLevel: RiskLevel;
  affectedRecord: string;
  timeRequested: string;
  status: ApprovalStatus;
  humanReviewer?: string;
  overrideReason?: string;
  outcome?: string;
  payload: Record<string, any>;
}

export type EvaluationTag =
  | 'GOOD_DECISION'
  | 'BAD_DECISION'
  | 'NEEDS_REVIEW'
  | 'POLICY_CHANGE'
  | 'EXCEPTION';

export interface AITrainingEvaluationItem {
  id: string;
  agentId: string;
  agentName: string;
  inputContext: string;
  aiRecommendation: string;
  humanDecision: 'APPROVED' | 'REJECTED' | 'MODIFIED' | 'OVERRIDDEN';
  overrideReason?: string;
  finalAction: string;
  operationalOutcome: string;
  customerSatisfactionScore?: number;
  deliveryDurationMin?: number;
  costImpact?: number;
  evaluationTag: EvaluationTag;
  timestamp: string;
}

export interface AIAgentActivityLog {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  action: string;
  whatDid: string;
  whyDid: string;
  informationUsed: string;
  authorizingPolicy: string;
  humanApproved: boolean | 'NOT_REQUIRED';
  outcome: string;
  risk: RiskLevel;
}

export interface AIKnowledgeDoc {
  id: string;
  title: string;
  category:
    | 'Policies'
    | 'Merchant SOP'
    | 'Rider SOP'
    | 'Support SOP'
    | 'Refund Rules'
    | 'Pricing Rules'
    | 'Safety Rules'
    | 'Finance Rules';
  version: string;
  lastUpdated: string;
  summary: string;
  applicableAgents: string[];
  content: string;
}

export interface AIPolicyRule {
  id: string;
  ruleName: string;
  category: string;
  condition: string;
  enforcement: 'BLOCK' | 'REQUIRE_HUMAN_APPROVAL' | 'LOG_AND_PERMIT' | 'WARN';
  riskLevel: RiskLevel;
  description: string;
}

export interface AISafetyControls {
  masterAutomationPaused: boolean; // Master "PAUSE ALL AI AUTOMATION"
  maxRefundAmountAuto: number; // ₱0.00 (all refunds require human approval at Level 1/2)
  maxPriceAdjustmentPercent: number; // 0% (Pricing AI recommend only)
  maxCodDiscrepancyAutoResolve: number; // ₱0.00
  confidenceThresholdStandard: number; // 0.95
  confidenceThresholdClarify: number; // 0.65
  confidenceThresholdEscalate: number; // 0.40
  rateLimitPerMinute: number;
  allowedAutonomyMax: AutonomyLevel; // capped at 3 or 4 in current dev mode, Level 5 forbidden
}

export interface AgentDataContract {
  agent: string;
  action: string;
  order_id?: string;
  confidence: number;
  reason_codes: string[];
  requires_human_approval: boolean;
  payload?: Record<string, any>;
  explanation: string;
}

export interface SuggestedBasketItem {
  productId: string;
  merchantId: string;
  merchantName: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  rationale: string;
}

export interface ShoppingPlan {
  intent: string;
  budgetCap?: number;
  estimatedTotal: number;
  servings?: number;
  items: SuggestedBasketItem[];
  confidence: number;
  notes: string;
}
