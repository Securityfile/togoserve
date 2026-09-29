import { describe, it, expect, vi } from 'vitest';
import {
  SIMULATION_SCENARIOS,
  runSimulationScenario,
} from '../services/simulationEngine';
import { MOCK_MERCHANTS, MOCK_RIDER } from '../data/mockData';

describe('Operational Simulation Engine & Scenarios', () => {
  it('should define all 10 core Philippine delivery scenarios (A through J)', () => {
    expect(SIMULATION_SCENARIOS).toHaveLength(10);
    const scenarioIds = SIMULATION_SCENARIOS.map((s) => s.id);
    expect(scenarioIds).toContain('SCENARIO_A'); // Normal delivery
    expect(scenarioIds).toContain('SCENARIO_B'); // Prep delay
    expect(scenarioIds).toContain('SCENARIO_C'); // Rider rejects
    expect(scenarioIds).toContain('SCENARIO_D'); // Rider shortage
    expect(scenarioIds).toContain('SCENARIO_E'); // In-transit note change
    expect(scenarioIds).toContain('SCENARIO_F'); // Kitchen stockout
    expect(scenarioIds).toContain('SCENARIO_G'); // EDSA traffic
    expect(scenarioIds).toContain('SCENARIO_H'); // Missing item
    expect(scenarioIds).toContain('SCENARIO_I'); // COD shortage
    expect(scenarioIds).toContain('SCENARIO_J'); // Spilled food refund
  });

  it('should execute Scenario A (Happy Path) with complete lifecycle and settlements', async () => {
    const mockContext = {
      merchants: MOCK_MERCHANTS,
      availableRiders: [MOCK_RIDER],
      createOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      cancelOrder: vi.fn(),
      refundOrder: vi.fn(),
      createSupportTicket: vi.fn(),
      enqueueAIApproval: vi.fn(),
    };

    const result = await runSimulationScenario('SCENARIO_A', mockContext);

    expect(result.scenarioId).toBe('SCENARIO_A');
    expect(result.finalOrderStatus).toBe('COMPLETED');
    expect(result.settlementsRecorded).toBe(true);
    expect(result.stepsExecuted.length).toBeGreaterThanOrEqual(8);
  });

  it('should enqueue high-risk refund approval for Scenario J without bypassing human sign-off', async () => {
    const enqueueMock = vi.fn();
    const mockContext = {
      merchants: MOCK_MERCHANTS,
      availableRiders: [MOCK_RIDER],
      createOrder: vi.fn(),
      updateOrderStatus: vi.fn(),
      cancelOrder: vi.fn(),
      refundOrder: vi.fn(),
      createSupportTicket: vi.fn(),
      enqueueAIApproval: enqueueMock,
    };

    const result = await runSimulationScenario('SCENARIO_J', mockContext);

    expect(result.scenarioId).toBe('SCENARIO_J');
    expect(result.finalOrderStatus).toBe('REFUND_REQUESTED');
    expect(enqueueMock).toHaveBeenCalled();

    const enqueuedItem = enqueueMock.mock.calls[0][0];
    expect(enqueuedItem.riskLevel).toBe('HIGH');
    expect(enqueuedItem.agentId).toBe('agent_refund');
    expect(enqueuedItem.payload.amount).toBe(540);
  });
});
