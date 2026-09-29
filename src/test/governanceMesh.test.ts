import { describe, it, expect } from 'vitest';
import { INITIAL_AI_AGENTS, INITIAL_SAFETY_CONTROLS } from '../data/aiOsData';

describe('AI Multi-Agent Governance & Autonomy Guardrails', () => {
  it('should initialize all primary departmental AI agents with strict boundaries', () => {
    expect(INITIAL_AI_AGENTS.length).toBeGreaterThanOrEqual(6);

    const agentIds = INITIAL_AI_AGENTS.map((a) => a.id);
    expect(agentIds).toContain('agent_orchestrator');
    expect(agentIds).toContain('agent_customer');
    expect(agentIds).toContain('agent_support');
    expect(agentIds).toContain('agent_dispatch');
    expect(agentIds).toContain('agent_merchant_ops');
  });

  it('should enforce human approval gates on financial and dispatch actions', () => {
    const shoppingAgent = INITIAL_AI_AGENTS.find((a) => a.id === 'agent_shopping');
    expect(shoppingAgent).toBeDefined();
    expect(shoppingAgent?.restrictedActions).toContain('IndependentSpendCustomerMoney');
    expect(shoppingAgent?.restrictedActions).toContain('SubmitCheckoutWithoutApproval');

    const customerAgent = INITIAL_AI_AGENTS.find((a) => a.id === 'agent_customer');
    expect(customerAgent).toBeDefined();
    expect(customerAgent?.restrictedActions).toContain('DirectCharge');

    const orchestratorAgent = INITIAL_AI_AGENTS.find((a) => a.id === 'agent_orchestrator');
    expect(orchestratorAgent).toBeDefined();
    expect(orchestratorAgent?.restrictedActions).toContain('BypassSafetyEngine');
  });

  it('should verify global safety controls and autonomy caps', () => {
    expect(INITIAL_SAFETY_CONTROLS.masterAutomationPaused).toBe(false);
    expect(INITIAL_SAFETY_CONTROLS.maxRefundAmountAuto).toBe(0); // All refunds require human approval
    expect(INITIAL_SAFETY_CONTROLS.allowedAutonomyMax).toBeLessThanOrEqual(3); // Capped at Level 3
    expect(INITIAL_SAFETY_CONTROLS.confidenceThresholdStandard).toBeGreaterThanOrEqual(0.9);
  });
});
