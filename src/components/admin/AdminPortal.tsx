import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, SupportTicket } from '../../types';
import { AICommandCenter } from './AICommandCenter';
import {
  ShieldCheck,
  TrendingUp,
  Bike,
  Store,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Play,
  RotateCcw,
  Zap,
  Bot,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    orders,
    fastForwardOrder,
    deliveryZones,
    updateZoneSurge,
    supportTickets,
    resolveSupportTicket,
    codRecords,
    reconcileCod,
    auditLogs,
    setIsAIOpen,
    setAITab,
    aiApprovalQueue,
    aiAgents,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ai' | 'ops' | 'orders' | 'zones' | 'cod' | 'support' | 'audit'>('ai');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  const pendingApprovalsCount = aiApprovalQueue.filter((a) => a.status === 'PENDING').length;

  // Platform Metrics
  const activeOrders = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalGmv = orders.reduce((sum, o) => sum + o.total, 0);
  const platformRevenue = Math.round(totalGmv * 0.15 + orders.length * 15);
  const totalCodPending = codRecords
    .filter((c) => c.status === 'pending_remittance')
    .reduce((sum, c) => sum + c.amount, 0);

  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.merchantName.toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      {/* Admin Top Bar */}
      <div className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight">
                  TOGO SERVE Command Center
                </h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Metro Manila Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Super-Admin Control • Dispatch, Pricing, COD Ledger, Audit Logs
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setAITab('operations');
                setIsAIOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Ops AI Copilot</span>
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 sm:gap-2 border-t border-slate-800 overflow-x-auto text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-2 transition shrink-0 ${
              activeTab === 'ai'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Bot className="w-4 h-4 text-emerald-400" />
            <span>AI Agent Command Center</span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
              {aiAgents.length} Agents
            </span>
            {pendingApprovalsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('ops')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition shrink-0 ${
              activeTab === 'ops'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Operations Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'orders'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Orders Dispatch ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('zones')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'zones'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-emerald-400" />
            <span>Zones & Surge Pricing</span>
          </button>

          <button
            onClick={() => setActiveTab('cod')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'cod'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>COD Reconciliation Ledger</span>
            {totalCodPending > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                ₱{totalCodPending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('support')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'support'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
            <span>Support & Disputes ({supportTickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'audit'
                ? 'border-emerald-500 text-white'
                : 'border-transparent hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Main Admin Content */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* TAB 0: AI AGENT OPERATING SYSTEM COMMAND CENTER */}
        {activeTab === 'ai' && <AICommandCenter />}

        {/* TAB 1: OPERATIONS DASHBOARD */}
        {activeTab === 'ops' && (
          <div className="space-y-6">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Active Orders</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{activeOrders.length}</div>
                <p className="text-[11px] text-slate-500">Currently dispatched</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Gross GMV</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₱{totalGmv.toLocaleString()}</div>
                <p className="text-[11px] text-emerald-600 font-semibold">↑ 14.2% week-on-week</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Platform Revenue</span>
                <div className="text-2xl font-black text-slate-900 mt-1">₱{platformRevenue.toLocaleString()}</div>
                <p className="text-[11px] text-slate-500">15% commission + service fee</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Average Delivery SLA</span>
                <div className="text-2xl font-black text-slate-900 mt-1">26.4 mins</div>
                <p className="text-[11px] text-emerald-600 font-semibold">Under target 35 mins</p>
              </div>
            </div>

            {/* Quick Simulation Bar */}
            <div className="bg-slate-900 text-white rounded-3xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Operational Control
                </span>
                <h4 className="font-bold text-sm">
                  Active Dispatch Simulator: Metro Manila Coverage
                </h4>
                <p className="text-xs text-slate-300">
                  Fast-forward lifecycle of active customer orders through merchant cooking, rider pickup, and PIN completion.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {activeOrders.length > 0 && (
                  <button
                    onClick={() => fastForwardOrder(activeOrders[0].id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Fast-Forward {activeOrders[0].orderNumber}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metro Manila Active Zones Overview */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-extrabold text-slate-900">
                Delivery Zones Status
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {deliveryZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{zone.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          zone.status === 'surge'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {zone.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Active Riders:</span>
                      <span className="font-bold text-slate-800">{zone.activeRiders}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Active Orders:</span>
                      <span className="font-bold text-slate-800">{zone.activeOrders}</span>
                    </div>

                    <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                      <span>Surge Multiplier:</span>
                      <span className="font-mono font-bold text-emerald-700">{zone.surgeMultiplier}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ORDERS DISPATCH TABLE */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Global Order Dispatch Manager
                </h3>
                <p className="text-xs text-slate-500">
                  Real-time status, customer verification codes, and manual dispatch controls.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer, store..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Order #</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Merchant</th>
                    <th className="p-3">Total (₱)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">PIN / Pickup Code</th>
                    <th className="p-3">Rider</th>
                    <th className="p-3 text-right">Simulation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{ord.orderNumber}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{ord.customerName}</p>
                        <p className="text-[11px] text-slate-400">{ord.customerPhone}</p>
                      </td>
                      <td className="p-3 font-medium">{ord.merchantName}</td>
                      <td className="p-3 font-bold text-slate-900">
                        ₱{ord.total}
                        <span className="block text-[10px] text-slate-400 font-mono uppercase">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-slate-100 text-slate-800">
                          {ord.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <div>PIN: <strong>{ord.deliveryPin}</strong></div>
                        <div className="text-slate-400">Pickup: {ord.pickupCode}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-800">{ord.riderName || 'Unassigned'}</td>
                      <td className="p-3 text-right">
                        {ord.status !== 'completed' && ord.status !== 'cancelled' ? (
                          <button
                            onClick={() => fastForwardOrder(ord.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                          >
                            Advance Stage →
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ZONES & SURGE PRICING */}
        {activeTab === 'zones' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Philippine Geo-Zones & Dynamic Surge Engine
              </h3>
              <p className="text-xs text-slate-500">
                Adjust surge pricing multipliers based on tropical storms, heavy traffic (EDSA/C5), or peak dinner hours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliveryZones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{zone.name}</h4>
                      <p className="text-slate-500 text-[11px]">Base Fare: ₱{zone.baseFee}</p>
                    </div>
                    <span className="font-mono text-base font-black text-emerald-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                      {zone.surgeMultiplier}x Surge
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <span className="text-slate-600 font-semibold">Set Multiplier:</span>
                    {[1.0, 1.2, 1.4, 1.6].map((mult) => (
                      <button
                        key={mult}
                        onClick={() => updateZoneSurge(zone.id, mult)}
                        className={`px-3 py-1 rounded-lg font-bold transition ${
                          zone.surgeMultiplier === mult
                            ? 'bg-slate-900 text-white'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {mult}x
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: COD RECONCILIATION LEDGER */}
        {activeTab === 'cod' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cash on Delivery (COD) Collections & Hub Remittance
                </h3>
                <p className="text-xs text-slate-500">
                  Reconcile cash collected by delivery riders upon customer doorstep handoff.
                </p>
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-900">
                Pending Hub Remittance: ₱{totalCodPending}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Record ID</th>
                    <th className="p-3">Order Ref</th>
                    <th className="p-3">Rider Name</th>
                    <th className="p-3">Collected Amount</th>
                    <th className="p-3">Date Collected</th>
                    <th className="p-3">Remittance Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {codRecords.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{rec.id}</td>
                      <td className="p-3 font-mono text-emerald-700">{rec.orderNumber || rec.orderId}</td>
                      <td className="p-3 font-semibold text-slate-800">{rec.riderName}</td>
                      <td className="p-3 font-bold text-slate-900">₱{rec.amount}</td>
                      <td className="p-3 text-slate-400">{rec.collectedAt}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            rec.status === 'reconciled'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {rec.status !== 'reconciled' ? (
                          <button
                            onClick={() => {
                              reconcileCod(rec.id);
                              alert(`COD Record ${rec.id} successfully reconciled and cleared!`);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-[11px] font-semibold"
                          >
                            Mark Reconciled
                          </button>
                        ) : (
                          <span className="text-slate-400">Cleared ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SUPPORT & DISPUTES */}
        {activeTab === 'support' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Customer & Merchant Support Escalations
              </h3>
              <p className="text-xs text-slate-500">
                Manage live complaints, missing item claims, and delivery delays.
              </p>
            </div>

            <div className="space-y-3">
              {supportTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{t.id}</span>
                      <span className="font-mono text-emerald-700 font-semibold">{t.orderId}</span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                          t.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'high'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </div>

                    <p className="font-bold text-slate-800">
                      {t.category} • <span className="text-slate-500 font-normal">{t.customerName}</span>
                    </p>

                    <p className="text-slate-600 text-[11px] max-w-xl">
                      "{t.description}"
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {t.status !== 'resolved' ? (
                      <button
                        onClick={() => {
                          resolveSupportTicket(t.id, 'Issue investigated and resolved by operations desk.');
                          alert(`Ticket ${t.id} resolved and customer notified.`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition"
                      >
                        Resolve & Close
                      </button>
                    ) : (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg text-[11px]">
                        Resolved ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Immutable Platform Audit Logs
              </h3>
              <p className="text-xs text-slate-500">
                Chronological security and event log across Customer, Merchant, Rider, and Admin operations.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px]">{log.details || log.record}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
