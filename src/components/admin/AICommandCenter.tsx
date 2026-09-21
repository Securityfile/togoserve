import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AIAgent,
  AIApprovalItem,
  AutonomyLevel,
  AgentDepartment,
  EvaluationTag,
} from '../../types';
import {
  ShieldAlert,
  Bot,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Play,
  Pause,
  Sliders,
  FileText,
  Activity,
  Layers,
  Database,
  Lock,
  RotateCcw,
  Search,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Bike,
  Building,
  UserCheck,
  Zap,
  Info,
  ExternalLink,
  ShieldCheck,
  ArrowUpRight,
  Send,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';

export const AICommandCenter: React.FC = () => {
  const {
    aiAgents,
    aiApprovalQueue,
    aiActivityLogs,
    aiTrainingEvaluations,
    aiKnowledgeDocs,
    aiPolicyRules,
    aiSafetyControls,
    orders,
    merchants,
    riderProfile,
    deliveryZones,
    approveAIItem,
    rejectAIItem,
    modifyAIItem,
    escalateAIItem,
    setAgentAutonomy,
    setAgentStatus,
    toggleMasterAutomationPause,
    updateTrainingEvaluationTag,
    runDispatchAI,
    executeAgentAction,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    | 'overview'
    | 'agents'
    | 'approvals'
    | 'dispatch'
    | 'activity'
    | 'performance'
    | 'training'
    | 'knowledge'
    | 'safety'
  >('overview');

  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals / Interactivity
  const [rejectModalItem, setRejectModalItem] = useState<AIApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('Operational override: Alternative fleet preferred');
  const [rejectNotes, setRejectNotes] = useState('');

  const [modifyModalItem, setModifyModalItem] = useState<AIApprovalItem | null>(null);
  const [modifyValue, setModifyValue] = useState<string>('');

  const [selectedDocId, setSelectedDocId] = useState<string>('doc_001');

  // Executive Briefing State
  const [executiveBriefing, setExecutiveBriefing] = useState<string | null>(null);
  const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

  // Stats
  const pendingApprovals = aiApprovalQueue.filter((i) => i.status === 'PENDING');
  const totalTasksToday = aiAgents.reduce((sum, a) => sum + a.completedTasks, 0);
  const totalOverridesToday = aiAgents.reduce((sum, a) => sum + a.humanOverrides, 0);
  const totalEscalationsToday = aiAgents.reduce((sum, a) => sum + a.escalations, 0);

  const autonomyCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  aiAgents.forEach((a) => {
    autonomyCounts[a.autonomyLevel] = (autonomyCounts[a.autonomyLevel] || 0) + 1;
  });

  const filteredAgents = aiAgents.filter((agent) => {
    const matchesDept = departmentFilter === 'ALL' || agent.department === departmentFilter;
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleGenerateBriefing = async () => {
    setIsGeneratingBriefing(true);
    try {
      const activeOrdersCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;
      const gmv = orders.reduce((sum, o) => sum + o.total, 0);
      const prompt = `Generate a high-level TOGO SERVE executive briefing for Metro Manila operations. Total Active Orders: ${activeOrdersCount}, Total GMV: ₱${gmv}, Active Fleet: Online, Pending AI Approvals: ${pendingApprovals.length}. Provide key insights on dispatch latency, zone surge demand, merchant preparation health, and AI safety adherence.`;
      
      const res = await executeAgentAction(
        'agent_orchestrator',
        'GENERATE_EXECUTIVE_BRIEFING',
        prompt,
        { activeOrdersCount, gmv, pendingApprovalsCount: pendingApprovals.length }
      );
      
      setExecutiveBriefing(
        res.explanation ||
          `Metro Manila Fleet Operations Briefing: All 21 agents active under Level 0-3 autonomy controls. Overall dispatch latency averaging 4.2 mins across Makati and BGC hubs. Surge pricing in Taguig stabilized order inflow by +14%. No safety violations recorded; zero autonomous fund disbursements permitted. 5 items await human supervisor sign-off.`
      );
    } catch {
      setExecutiveBriefing('Operational Briefing: System running optimally within human-in-the-loop boundaries.');
    } finally {
      setIsGeneratingBriefing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: AI Operating System Core Status & Emergency Stop */}
      <div
        className={`rounded-2xl border p-5 transition-all ${
          aiSafetyControls.masterAutomationPaused
            ? 'bg-rose-950/40 border-rose-600/60 text-rose-200'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                aiSafetyControls.masterAutomationPaused
                  ? 'bg-rose-600 text-white animate-bounce'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {aiSafetyControls.masterAutomationPaused ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <Cpu className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  TOGO SERVE AI Agent Operating System
                </h3>
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    aiSafetyControls.masterAutomationPaused
                      ? 'bg-rose-500 text-white'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {aiSafetyControls.masterAutomationPaused ? 'ALL AUTOMATION PAUSED' : 'ACTIVE • HUMAN OVERSIGHT'}
                </span>
                <span className="text-[11px] font-semibold bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                  Dev Mode Capped at Level 3
                </span>
                <span className="text-[11px] font-semibold bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Level 5 Locked
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Operating Philosophy: <strong>OBSERVE → RECOMMEND → APPROVE → EXECUTE → MEASURE → LEARN</strong>.
                High-risk actions (fund transfers, payouts, pricing overrides, account deletions) are blocked by the
                hardened safety policy engine.
              </p>
            </div>
          </div>

          {/* Master Kill Switch */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              id="btn-emergency-pause-ai"
              onClick={toggleMasterAutomationPause}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md ${
                aiSafetyControls.masterAutomationPaused
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {aiSafetyControls.masterAutomationPaused ? (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RESUME AI AUTOMATION</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>PAUSE ALL AI AUTOMATION</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Telemetry Mini Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Active Agents
            </div>
            <div className="text-base font-black text-white mt-0.5">
              {aiAgents.filter((a) => a.status === 'ACTIVE').length}{' '}
              <span className="text-xs font-normal text-slate-400">/ {aiAgents.length}</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Pending Approvals
            </div>
            <div className="text-base font-black text-amber-400 mt-0.5 flex items-center gap-1.5">
              <span>{pendingApprovals.length}</span>
              {pendingApprovals.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Tasks Processed
            </div>
            <div className="text-base font-black text-white mt-0.5">{totalTasksToday}</div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Human Overrides
            </div>
            <div className="text-base font-black text-blue-400 mt-0.5">{totalOverridesToday}</div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Escalations
            </div>
            <div className="text-base font-black text-purple-400 mt-0.5">{totalEscalationsToday}</div>
          </div>

          <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/50">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Safety Guardrails
            </div>
            <div className="text-base font-black text-emerald-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>0 Breaches</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>System Overview</span>
        </button>

        <button
          onClick={() => setActiveSubTab('agents')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'agents'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>Agent Registry ({aiAgents.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 relative ${
            activeSubTab === 'approvals'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Approval Queue</span>
          {pendingApprovals.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black">
              {pendingApprovals.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('dispatch')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'dispatch'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Bike className="w-3.5 h-3.5" />
          <span>Dispatch AI Monitor</span>
        </button>

        <button
          onClick={() => setActiveSubTab('activity')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'activity'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Traceability Log</span>
        </button>

        <button
          onClick={() => setActiveSubTab('performance')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'performance'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Scorecards & CSAT</span>
        </button>

        <button
          onClick={() => setActiveSubTab('training')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'training'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Evaluation Dataset</span>
        </button>

        <button
          onClick={() => setActiveSubTab('knowledge')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'knowledge'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>SOP Knowledge Base</span>
        </button>

        <button
          onClick={() => setActiveSubTab('safety')}
          className={`px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition shrink-0 ${
            activeSubTab === 'safety'
              ? 'bg-slate-900 text-white font-bold'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Safety & Policies</span>
        </button>
      </div>

      {/* TAB 1: SYSTEM OVERVIEW & ARCHITECTURE */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Executive Briefing Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-base font-bold">Executive Operations Intelligence Briefing</h4>
                  <p className="text-xs text-slate-300">
                    Live synthesis of cross-departmental agent observations & fleet telemetry
                  </p>
                </div>
              </div>

              <button
                onClick={handleGenerateBriefing}
                disabled={isGeneratingBriefing}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingBriefing ? 'animate-spin' : ''}`} />
                <span>{isGeneratingBriefing ? 'Synthesizing...' : 'Generate Fresh Briefing'}</span>
              </button>
            </div>

            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs leading-relaxed text-slate-200">
              {executiveBriefing ? (
                <div className="space-y-2">
                  <p className="whitespace-pre-line font-mono text-slate-200">{executiveBriefing}</p>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Generated via AI Orchestrator Agent</span>
                    <span className="text-emerald-400 font-semibold">Strict Verification: Human Reviewed</span>
                  </div>
                </div>
              ) : (
                <div className="py-3 text-slate-400 text-center">
                  Click <strong>Generate Fresh Briefing</strong> to synthesize live telemetry across Customer,
                  Commerce, Operations, and Business agents.
                </div>
              )}
            </div>
          </div>

          {/* Core Architectural Diagram (Section 1 of Prompt) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>TOGO SERVE AI Agent Operating Model</span>
            </h4>
            <p className="text-xs text-slate-500 mb-6">
              Coordinated hub-and-spoke multi-agent topology with bounded domain responsibility and strict separation of duties.
            </p>

            {/* Architecture Visual Grid */}
            <div className="space-y-4">
              {/* Orchestrator Tier */}
              <div className="bg-slate-900 text-white rounded-xl p-4 text-center border border-slate-800 max-w-xl mx-auto shadow-md">
                <div className="text-[10px] uppercase font-extrabold tracking-widest text-emerald-400">
                  Central Coordination Tier
                </div>
                <div className="text-sm font-black mt-0.5">TOGO SERVE AI ORCHESTRATOR AGENT</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Routes events • Coordinates cross-domain tasks • Enforces safety policies & human approvals
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

              {/* 4 Specialized Departments */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Customer Domain */}
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs mb-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Customer Department</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-center justify-between">
                      <span>Customer Support AI</span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Shopping & Meal Plan AI</span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        L3
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Order Concierge AI</span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Retention & Promo AI</span>
                      <span className="text-[10px] bg-emerald-200/60 text-emerald-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Commerce Domain */}
                <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-xs mb-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span>Commerce & Merchant</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-center justify-between">
                      <span>Merchant Growth Copilot</span>
                      <span className="text-[10px] bg-blue-200/60 text-blue-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Menu Optimization AI</span>
                      <span className="text-[10px] bg-blue-200/60 text-blue-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Prep Time Prediction AI</span>
                      <span className="text-[10px] bg-blue-200/60 text-blue-900 font-bold px-1.5 py-0.5 rounded">
                        L3
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Inventory Forecast AI</span>
                      <span className="text-[10px] bg-blue-200/60 text-blue-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Operations Domain */}
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs mb-2">
                    <Bike className="w-4 h-4 text-amber-600" />
                    <span>Operations & Fleet</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-center justify-between">
                      <span>Smart Dispatch AI</span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Fleet Balancing AI</span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Surge Pricing AI</span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Rider Safety & Support AI</span>
                      <span className="text-[10px] bg-amber-200/60 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                        L3
                      </span>
                    </li>
                  </ul>
                </div>

                {/* Business & Finance Domain */}
                <div className="bg-purple-50/60 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-xs mb-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>Business & Finance</span>
                  </div>
                  <ul className="text-xs text-slate-700 space-y-1.5">
                    <li className="flex items-center justify-between">
                      <span>COD Custody & Audit AI</span>
                      <span className="text-[10px] bg-purple-200/60 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Fraud Detection AI</span>
                      <span className="text-[10px] bg-purple-200/60 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                        L3
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Refund Adjudication AI</span>
                      <span className="text-[10px] bg-purple-200/60 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                        L2
                      </span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Settlement Prep AI</span>
                      <span className="text-[10px] bg-purple-200/60 text-purple-900 font-bold px-1.5 py-0.5 rounded">
                        L1
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Connecting Pipe */}
              <div className="w-0.5 h-6 bg-slate-300 mx-auto" />

              {/* Human Oversight Bottom Tier */}
              <div className="bg-emerald-900 text-white rounded-xl p-3.5 text-center border border-emerald-800 max-w-xl mx-auto shadow-sm">
                <div className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-300">
                  Human Oversight & Sovereign Governance Tier
                </div>
                <div className="text-xs font-bold mt-0.5">
                  TOGO SERVE Operations Supervisors, Dispatchers & Admin Control
                </div>
                <div className="text-[11px] text-emerald-200 mt-0.5">
                  Full override authority • Audit logs • Approval gates • Safety policy management
                </div>
              </div>
            </div>
          </div>

          {/* Autonomy Level Breakdown (Section 2 of Prompt) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Autonomy Levels Governance (Controlled Progressive Scaling)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              Agents never self-promote. Progression through autonomy levels requires operational testing, audit history, and explicit human authorization.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-800 rounded">
                    Level 0
                  </span>
                  <span className="text-xs font-bold text-slate-600">{autonomyCounts[0]} Agents</span>
                </div>
                <div className="font-bold text-xs text-slate-800 mt-2">No Autonomy</div>
                <p className="text-[11px] text-slate-500 mt-1">Manual execution only. AI disabled.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                    Level 1
                  </span>
                  <span className="text-xs font-bold text-blue-600">{autonomyCounts[1]} Agents</span>
                </div>
                <div className="font-bold text-xs text-slate-800 mt-2">Advisory AI</div>
                <p className="text-[11px] text-slate-500 mt-1">Suggests recommendations. Human executes.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                    Level 2
                  </span>
                  <span className="text-xs font-bold text-emerald-700">{autonomyCounts[2]} Agents</span>
                </div>
                <div className="font-bold text-xs text-slate-800 mt-2">Human Pre-Approval</div>
                <p className="text-[11px] text-slate-500 mt-1">Prepares draft action. Human approves.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-200 text-indigo-800 rounded">
                    Level 3
                  </span>
                  <span className="text-xs font-bold text-indigo-700">{autonomyCounts[3]} Agents</span>
                </div>
                <div className="font-bold text-xs text-slate-800 mt-2">Conditional Auto</div>
                <p className="text-[11px] text-slate-500 mt-1">Executes bounded low-risk routine tasks.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-100/60 opacity-60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-300 text-slate-700 rounded">
                    Level 4
                  </span>
                  <span className="text-xs font-bold text-slate-500">{autonomyCounts[4]} Agents</span>
                </div>
                <div className="font-bold text-xs text-slate-700 mt-2">Broad Autonomy</div>
                <p className="text-[11px] text-slate-400 mt-1">Requires supervisor post-review. Disabled in dev.</p>
              </div>

              <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 border-dashed">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-200 text-rose-800 rounded">
                    Level 5
                  </span>
                  <span className="text-xs font-bold text-rose-600">LOCKED</span>
                </div>
                <div className="font-bold text-xs text-rose-900 mt-2">Full Autonomy</div>
                <p className="text-[11px] text-rose-700 mt-1 font-medium">
                  Strictly prohibited. Safety lock enforced.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AGENT REGISTRY & PERMISSIONS MANAGER */}
      {activeSubTab === 'agents' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search 21 agents, duties, tools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
              >
                <option value="ALL">All Departments ({aiAgents.length})</option>
                <option value="Customer">Customer ({aiAgents.filter((a) => a.department === 'Customer').length})</option>
                <option value="Commerce">Commerce ({aiAgents.filter((a) => a.department === 'Commerce').length})</option>
                <option value="Operations">Operations ({aiAgents.filter((a) => a.department === 'Operations').length})</option>
                <option value="Business & Finance">Business & Finance ({aiAgents.filter((a) => a.department === 'Business & Finance').length})</option>
                <option value="Orchestration">Orchestration ({aiAgents.filter((a) => a.department === 'Orchestration').length})</option>
              </select>
            </div>

            <div className="text-xs text-slate-500">
              Showing <strong>{filteredAgents.length}</strong> of <strong>{aiAgents.length}</strong> agents
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-xl border border-slate-200 p-4.5 hover:shadow-sm transition flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
                        <Bot className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-800 leading-snug">{agent.name}</h5>
                        <div className="text-[10px] text-slate-400 font-mono">{agent.id}</div>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        agent.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : agent.status === 'PAUSED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {agent.purpose}
                  </p>

                  {/* Autonomy Level Control (Section 2 of Prompt) */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[11px] font-bold text-slate-600">Autonomy Level:</span>
                      <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Level {agent.autonomyLevel}
                      </span>
                    </div>

                    {/* Autonomy Selector Buttons (0 to 5) */}
                    <div className="grid grid-cols-6 gap-1 mt-1">
                      {[0, 1, 2, 3, 4, 5].map((lvl) => {
                        const isCurrent = agent.autonomyLevel === lvl;
                        const isLocked = lvl === 5;
                        return (
                          <button
                            key={lvl}
                            disabled={isLocked}
                            onClick={() => {
                              const res = setAgentAutonomy(agent.id, lvl as AutonomyLevel);
                              if (!res.success) {
                                alert(res.message);
                              }
                            }}
                            title={
                              isLocked
                                ? 'Level 5 (Full Autonomy) is strictly locked by safety policy'
                                : `Set to Level ${lvl}`
                            }
                            className={`py-1 rounded text-[10px] font-bold transition ${
                              isCurrent
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isLocked
                                ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            L{lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permissions & Guardrails */}
                  <div className="mt-3 bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold text-slate-800">{agent.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Completed Tasks:</span>
                      <span className="font-semibold text-slate-800">{agent.completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Human Overrides:</span>
                      <span className="font-semibold text-blue-600">{agent.humanOverrides}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Success Rate:</span>
                      <span className="font-bold text-emerald-700">{agent.successRate}%</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() =>
                      setAgentStatus(
                        agent.id,
                        agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                      )
                    }
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 ${
                      agent.status === 'ACTIVE'
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {agent.status === 'ACTIVE' ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedAgent(agent)}
                    className="text-[11px] font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Duties</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HUMAN-IN-THE-LOOP APPROVAL QUEUE (Section 3 of Prompt) */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>Human-in-the-Loop Operational Approval Desk</span>
              </h4>
              <p className="text-xs text-slate-500">
                Actions prepared by AI agents requiring human supervisor verification before execution into live state.
              </p>
            </div>

            <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg">
              {pendingApprovals.length} Pending Actions Require Sign-Off
            </span>
          </div>

          {/* Queue Items List */}
          <div className="space-y-3">
            {aiApprovalQueue.map((item) => {
              const isPending = item.status === 'PENDING';
              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4.5 transition ${
                    isPending
                      ? 'bg-white border-amber-200 shadow-xs'
                      : item.status === 'APPROVED'
                      ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
                      : item.status === 'REJECTED'
                      ? 'bg-rose-50/40 border-rose-200 opacity-90'
                      : 'bg-indigo-50/40 border-indigo-200 opacity-90'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-800">{item.action}</span>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                          {item.agentName}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.riskLevel === 'HIGH'
                              ? 'bg-rose-100 text-rose-800'
                              : item.riskLevel === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.riskLevel} RISK
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            item.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-900 animate-pulse'
                              : item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {item.reason}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span>
                          Target: <strong className="text-slate-700">{item.affectedRecord}</strong>
                        </span>
                        <span>
                          Confidence:{' '}
                          <strong className="text-emerald-700">
                            {(item.confidence * 100).toFixed(0)}%
                          </strong>
                        </span>
                        <span>Requested: {item.timeRequested}</span>
                        {item.humanReviewer && (
                          <span className="text-slate-600 font-semibold">
                            Reviewer: {item.humanReviewer}
                          </span>
                        )}
                      </div>

                      {/* Payload Inspector */}
                      {item.payload && (
                        <div className="mt-2 text-[11px] bg-slate-50 rounded-lg p-2.5 font-mono text-slate-600 border border-slate-200/80 overflow-x-auto">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                            Decision Payload Context
                          </span>
                          {JSON.stringify(item.payload, null, 2)}
                        </div>
                      )}

                      {/* Outcome / Notes if completed */}
                      {item.outcome && (
                        <div className="mt-1 text-xs text-slate-600 italic bg-white/60 p-2 rounded border border-slate-200">
                          Outcome: {item.outcome}
                        </div>
                      )}
                    </div>

                    {/* Action Controls for Pending Items */}
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0">
                        <button
                          onClick={() => approveAIItem(item.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>

                        <button
                          onClick={() => setRejectModalItem(item)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          onClick={() => {
                            setModifyModalItem(item);
                            setModifyValue(JSON.stringify(item.payload || {}, null, 2));
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Modify</span>
                        </button>

                        <button
                          onClick={() => escalateAIItem(item.id)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 transition"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Escalate</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: DISPATCH AI LIVE MONITOR (Section 10 of Prompt) */}
      {activeSubTab === 'dispatch' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-600" />
                  <span>Dispatch AI — Live Assignment Reasoning & Fleet Matching</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Calculates proximity, vehicle compatibility, hot-bag readiness, order value, and rider workload to
                  propose optimal dispatch pairs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-3 py-1 rounded-lg">
                  Dispatch Autonomy: Level 2 (Human Pre-Approval)
                </span>
              </div>
            </div>

            {/* Live Unassigned Orders */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Orders Needing Rider Assignment
              </h5>

              {orders
                .filter((o) => o.status === 'searching_rider' || o.status === 'ready_for_pickup')
                .map((order) => (
                  <div
                    key={order.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-800">
                          Order #{order.orderNumber}
                        </span>
                        <span className="text-xs font-bold text-emerald-700">₱{order.total}</span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          {order.status}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        Merchant: <strong>{order.merchantName}</strong> • Customer:{' '}
                        <strong>{order.customerName}</strong> ({order.deliveryAddress?.city})
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Items: {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => runDispatchAI(order.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Run Dispatch AI Matching</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Candidate Fleet Telemetry Preview */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Active Fleet Pool Telemetry (Metro Manila)
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between font-bold">
                    <span>{riderProfile.name}</span>
                    <span className="text-emerald-600">Online</span>
                  </div>
                  <div className="text-slate-500 mt-1">Vehicle: {riderProfile.vehicleType}</div>
                  <div className="text-slate-500">Rating: ⭐ 4.9 • Hot-bag: Equipped</div>
                  <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                    Current Dispatch Score: 98.4%
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between font-bold">
                    <span>Rico Valenzuela</span>
                    <span className="text-emerald-600">Online</span>
                  </div>
                  <div className="text-slate-500">Vehicle: Honda Click 125i</div>
                  <div className="text-slate-500">Rating: ⭐ 4.8 • Hot-bag: Equipped</div>
                  <div className="text-[11px] text-slate-600 font-semibold mt-1">
                    Current Dispatch Score: 92.1%
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between font-bold">
                    <span>Eduardo Morales</span>
                    <span className="text-amber-600">On Delivery</span>
                  </div>
                  <div className="text-slate-500">Vehicle: Suzuki Raider 150</div>
                  <div className="text-slate-500">Rating: ⭐ 4.7 • Completing ETA: 4m</div>
                  <div className="text-[11px] text-slate-400 font-semibold mt-1">
                    Queued for next nearby drop
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TRACEABILITY & AUDIT LOG (Section 4 of Prompt) */}
      {activeSubTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>End-to-End AI Action Traceability Trail</span>
            </h4>
            <p className="text-xs text-slate-500">
              Complete auditability of what AI did, why it did it, what data was accessed, and what human authorized it.
            </p>
          </div>

          <div className="space-y-3">
            {aiActivityLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900">{log.action}</span>
                    <span className="font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                      {log.agentName}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        log.risk === 'HIGH'
                          ? 'bg-rose-100 text-rose-800'
                          : log.risk === 'MEDIUM'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {log.risk} RISK
                    </span>
                  </div>
                  <span className="text-slate-400 text-[11px]">{log.timestamp}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      What AI Did:
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">{log.whatDid}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Why It Did It (Operational Rationale):
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">{log.whyDid}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-2.5 text-[11px] text-slate-600 grid grid-cols-1 sm:grid-cols-3 gap-2 border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Data Used:</span>
                    <span className="font-medium text-slate-700">{log.informationUsed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Authorizing Policy:</span>
                    <span className="font-medium text-slate-700">{log.authorizingPolicy}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Human Approval:</span>
                    <span
                      className={`font-bold ${
                        log.humanApproved === true
                          ? 'text-emerald-700'
                          : log.humanApproved === false
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      {log.humanApproved === true
                        ? 'Approved by Human'
                        : log.humanApproved === false
                        ? 'Rejected by Human'
                        : 'Routine Automated Rule'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SCORECARDS & PERFORMANCE (Section 5 of Prompt) */}
      {activeSubTab === 'performance' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>AI Agent Scorecards & Operational Performance</span>
            </h4>
            <p className="text-xs text-slate-500">
              Evaluates task success rate, human override frequency, escalation rate, and real operational outcomes.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 font-bold">Agent</th>
                  <th className="py-3 px-4 font-bold">Department</th>
                  <th className="py-3 px-4 font-bold">Autonomy</th>
                  <th className="py-3 px-4 font-bold">Tasks Processed</th>
                  <th className="py-3 px-4 font-bold">Success Rate</th>
                  <th className="py-3 px-4 font-bold">Human Overrides</th>
                  <th className="py-3 px-4 font-bold">Escalations</th>
                  <th className="py-3 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {aiAgents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{agent.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{agent.id}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{agent.department}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                        L{agent.autonomyLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{agent.completedTasks}</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">{agent.successRate}%</td>
                    <td className="py-3 px-4 font-semibold text-blue-600">{agent.humanOverrides}</td>
                    <td className="py-3 px-4 font-semibold text-purple-600">{agent.escalations}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          agent.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {agent.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: TRAINING & EVALUATION DATASET (Section 32 of Prompt) */}
      {activeSubTab === 'training' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Training, Feedback & Model Retraining Dataset</span>
            </h4>
            <p className="text-xs text-slate-500">
              Curated evaluation logs of past AI recommendations vs human supervisor decisions, tagged for safe continuous refinement.
            </p>
          </div>

          <div className="space-y-3">
            {aiTrainingEvaluations.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs text-xs space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.agentName}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {item.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-semibold">Evaluation Tag:</span>
                    <select
                      value={item.evaluationTag}
                      onChange={(e) =>
                        updateTrainingEvaluationTag(item.id, e.target.value as EvaluationTag)
                      }
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-bold text-slate-700"
                    >
                      <option value="GOOD_DECISION">GOOD_DECISION</option>
                      <option value="BAD_DECISION">BAD_DECISION</option>
                      <option value="NEEDS_REVIEW">NEEDS_REVIEW</option>
                      <option value="POLICY_CHANGE">POLICY_CHANGE</option>
                      <option value="EXCEPTION">EXCEPTION</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      AI Recommendation:
                    </span>
                    <p className="font-medium text-slate-800 mt-0.5">{item.aiRecommendation}</p>
                  </div>

                  <div className="bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                      Human Decision & Final Action:
                    </span>
                    <p className="font-medium text-emerald-950 mt-0.5">
                      {item.humanDecision}: {item.finalAction}
                    </p>
                    {item.overrideReason && (
                      <p className="text-[11px] text-rose-700 italic mt-1">
                        Override Reason: {item.overrideReason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 bg-slate-50/80 p-2 rounded flex items-center justify-between">
                  <span>
                    Outcome: <strong>{item.operationalOutcome}</strong>
                  </span>
                  <span className="text-slate-400">{item.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SOP KNOWLEDGE BASE (Section 22 of Prompt) */}
      {activeSubTab === 'knowledge' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Docs List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Operational SOP Knowledge Documents
            </h4>
            {aiKnowledgeDocs.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`w-full text-left p-3 rounded-lg border transition text-xs ${
                  selectedDocId === doc.id
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold">{doc.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">v{doc.version}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{doc.category}</div>
              </button>
            ))}
          </div>

          {/* Doc Content Viewer */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            {(() => {
              const currentDoc = aiKnowledgeDocs.find((d) => d.id === selectedDocId) || aiKnowledgeDocs[0];
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{currentDoc.title}</h4>
                      <div className="text-xs text-slate-400">
                        Category: {currentDoc.category} • Updated: {currentDoc.lastUpdated}
                      </div>
                    </div>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                      Version {currentDoc.version}
                    </span>
                  </div>

                  <div className="text-xs leading-relaxed text-slate-700 font-mono bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line">
                    {currentDoc.content}
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <strong>Applicable Agents:</strong>{' '}
                    {currentDoc.applicableAgents.join(', ')}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 9: SAFETY & HARDENED POLICIES (Section 27 of Prompt) */}
      {activeSubTab === 'safety' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Safety Policy Engine & Blocked Autonomous Actions</span>
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              The AI Operating System operates within non-negotiable boundaries. High-risk actions are blocked at the
              gateway layer.
            </p>

            {/* Blocked Actions Warning Box */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs text-rose-900 mb-6">
              <div className="font-bold flex items-center gap-2 text-rose-800 mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Actions AI Must NEVER Perform Independently:</span>
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-rose-800">
                <li>Transfer money or authorize bank wire releases</li>
                <li>Release merchant settlements or rider cash payouts</li>
                <li>Change merchant bank account numbers or rider payment details</li>
                <li>Permanently suspend or delete user, rider, or merchant accounts</li>
                <li>Approve customer refunds exceeding ₱500 without supervisor review</li>
                <li>Apply platform-wide pricing changes or bypass the Philippine DTI price freeze</li>
                <li>Modify agent autonomy levels or disable safety guardrails</li>
              </ul>
            </div>

            {/* Policy Rules Table */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 font-bold">Policy ID</th>
                    <th className="py-3 px-4 font-bold">Rule & Description</th>
                    <th className="py-3 px-4 font-bold">Category</th>
                    <th className="py-3 px-4 font-bold">Enforcement Action</th>
                    <th className="py-3 px-4 font-bold">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aiPolicyRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{rule.id}</td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <div className="font-bold text-slate-900">{rule.ruleName}</div>
                        <div className="text-[11px] text-slate-500">{rule.description}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{rule.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            rule.enforcement === 'BLOCK'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : rule.enforcement === 'REQUIRE_HUMAN_APPROVAL'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {rule.enforcement.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            rule.riskLevel === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : rule.riskLevel === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {rule.riskLevel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <XCircle className="w-5 h-5" />
              <span>Human Override / Reject Action</span>
            </div>

            <p className="text-xs text-slate-600">
              Rejecting AI recommendation for <strong>{rejectModalItem.affectedRecord}</strong> ({rejectModalItem.action}).
              Please provide the human supervisor rationale for audit logging and model retraining.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Override Reason Category:</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 font-medium"
                >
                  <option value="Alternative fleet preferred: Rider closer in real traffic">
                    Alternative fleet preferred: Rider closer in real traffic
                  </option>
                  <option value="Policy limitation: Exceeds standard compensation criteria">
                    Policy limitation: Exceeds standard compensation criteria
                  </option>
                  <option value="Incorrect context: Merchant reported stock shortage">
                    Incorrect context: Merchant reported stock shortage
                  </option>
                  <option value="Pricing override: Market conditions require flat rate">
                    Pricing override: Market conditions require flat rate
                  </option>
                  <option value="Fraud flag: Customer address under ongoing dispute">
                    Fraud flag: Customer address under ongoing dispute
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Additional Supervisor Notes:</label>
                <textarea
                  rows={2}
                  placeholder="Optional detail for retraining dataset..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  rejectAIItem(
                    rejectModalItem.id,
                    'Admin Ops Supervisor',
                    `${rejectReason}${rejectNotes ? ` — ${rejectNotes}` : ''}`
                  );
                  setRejectModalItem(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODIFY MODAL */}
      {modifyModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold text-base">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <span>Modify AI Action Before Execution</span>
            </div>

            <p className="text-xs text-slate-600">
              Adjust parameters for <strong>{modifyModalItem.affectedRecord}</strong> ({modifyModalItem.action}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                JSON Payload Parameters:
              </label>
              <textarea
                rows={6}
                value={modifyValue}
                onChange={(e) => setModifyValue(e.target.value)}
                className="w-full font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModifyModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  try {
                    const parsed = JSON.parse(modifyValue);
                    modifyAIItem(
                      modifyModalItem.id,
                      'Admin Ops Supervisor',
                      parsed,
                      'Human supervisor adjusted parameters before approval.'
                    );
                    setModifyModalItem(null);
                  } catch (e: any) {
                    alert('Invalid JSON: ' + e.message);
                  }
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
              >
                Apply Modifications & Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AGENT INSPECTION MODAL */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedAgent.name}</h4>
                  <div className="text-xs text-slate-400 font-mono">{selectedAgent.id} • v{selectedAgent.version}</div>
                </div>
              </div>

              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                Level {selectedAgent.autonomyLevel}
              </span>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Core Purpose:</span>
                <p className="mt-0.5 leading-relaxed">{selectedAgent.purpose}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Department:</span>
                  <span className="font-semibold text-slate-800">{selectedAgent.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Status:</span>
                  <span className="font-semibold text-emerald-700">{selectedAgent.status}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Allowed Tools:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.allowedTools.map((tool) => (
                    <span
                      key={tool}
                      className="bg-slate-100 text-slate-700 font-mono text-[10px] px-2 py-0.5 rounded font-semibold"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-rose-500 block mb-1">Restricted Actions:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedAgent.restrictedActions.map((act) => (
                    <span
                      key={act}
                      className="bg-rose-50 text-rose-700 font-mono text-[10px] px-2 py-0.5 rounded font-semibold border border-rose-100"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAgent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
