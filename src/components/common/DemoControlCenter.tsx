import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Play,
  RotateCcw,
  Zap,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Navigation,
  KeyRound,
  FileCheck,
} from 'lucide-react';

export const DemoControlCenter: React.FC = () => {
  const {
    isDemoControlOpen,
    setIsDemoControlOpen,
    role,
    setRole,
    orders,
    fastForwardOrder,
    generateDemoOrder,
    stepRiderLocation,
    verifyPickup,
    verifyDelivery,
    resetAllDemoData,
    createSupportTicket,
    riderProfile,
    toggleRiderOnline,
  } = useApp();

  const [notification, setNotification] = useState<string | null>(null);

  if (!isDemoControlOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Find the primary active demo order
  const activeOrder = orders.find(
    (o) =>
      o.status !== 'completed' &&
      o.status !== 'cancelled' &&
      o.status !== 'refunded'
  ) || orders[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-[92vh] max-h-[750px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-white text-sm">
              TG
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Demo Control Center</h3>
              <p className="text-[11px] text-emerald-400">Simulation & Testing Suite</p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoControlOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Active Order Spotlight */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Active Test Order</span>
              <span className="text-[11px] font-mono font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {activeOrder ? activeOrder.orderNumber : 'None'}
              </span>
            </div>
            {activeOrder ? (
              <div>
                <p className="text-xs text-slate-600 font-medium">
                  {activeOrder.customerName} → <span className="text-slate-900 font-semibold">{activeOrder.merchantName}</span>
                </p>
                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded capitalize">
                    {activeOrder.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pickup Code: <strong className="text-slate-800">{activeOrder.pickupCode}</strong></span>
                  <span>Delivery PIN: <strong className="text-slate-800">{activeOrder.deliveryPin}</strong></span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No pending orders. Generate one below!</p>
            )}
          </div>

          {/* Quick Simulation Steps */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              End-to-End Workflow Controls
            </h4>

            <button
              onClick={() => {
                if (activeOrder) {
                  fastForwardOrder(activeOrder.id);
                  showToast(`Advanced ${activeOrder.orderNumber} to next stage!`);
                } else {
                  const ord = generateDemoOrder('Maria Santos', 'gcash');
                  showToast(`Created order ${ord.orderNumber}!`);
                }
              }}
              className="w-full flex items-center justify-between bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs py-2.5 px-3.5 rounded-xl shadow-xs transition"
            >
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 fill-white" />
                <span>Advance Order to Next Stage</span>
              </div>
              <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded">Fast-Forward</span>
            </button>

            <button
              onClick={() => {
                const ord = generateDemoOrder('Maria Santos', 'gcash');
                showToast(`Generated Order ${ord.orderNumber} (₱682 via GCash)`);
              }}
              className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Generate Maria Santos Order (Kusina Filipina)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">GCash</span>
            </button>

            <button
              onClick={() => {
                const ord = generateDemoOrder('Juan Dela Cruz', 'cod');
                showToast(`Generated COD Order ${ord.orderNumber} (Cash on Delivery)`);
              }}
              className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 transition"
            >
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Generate COD Order (ChaTea Milk Tea)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">COD</span>
            </button>

            {/* GPS Mover */}
            {activeOrder && (activeOrder.status === 'on_the_way' || activeOrder.status === 'order_picked_up') && (
              <button
                onClick={() => {
                  stepRiderLocation(activeOrder.id);
                  showToast('Simulated rider GPS move closer to customer!');
                }}
                className="w-full flex items-center justify-between bg-blue-50 hover:bg-blue-100 text-blue-800 font-medium text-xs py-2.5 px-3.5 rounded-xl border border-blue-200 transition"
              >
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-600 animate-pulse" />
                  <span>Step Rider GPS Towards Customer</span>
                </div>
                <span className="text-[10px] bg-blue-200/70 px-2 py-0.5 rounded">Move GPS</span>
              </button>
            )}

            {/* Complete with PIN */}
            {activeOrder && activeOrder.status === 'rider_arrived' && (
              <button
                onClick={() => {
                  verifyDelivery(activeOrder.id, activeOrder.deliveryPin);
                  showToast(`Verified delivery with customer PIN ${activeOrder.deliveryPin}!`);
                }}
                className="w-full flex items-center justify-between bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium text-xs py-2.5 px-3.5 rounded-xl border border-emerald-300 transition"
              >
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  <span>Verify Delivery PIN ({activeOrder.deliveryPin})</span>
                </div>
                <span className="text-[10px] bg-emerald-200 px-2 py-0.5 rounded">Complete</span>
              </button>
            )}
          </div>

          {/* Quick Environment Jump */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Switch Environment View
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setRole('customer');
                  setIsDemoControlOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                  role === 'customer'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-600" />
                <span>Customer App</span>
              </button>

              <button
                onClick={() => {
                  setRole('merchant');
                  setIsDemoControlOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                  role === 'merchant'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Store className="w-4 h-4 text-emerald-600" />
                <span>Merchant Portal</span>
              </button>

              <button
                onClick={() => {
                  setRole('rider');
                  setIsDemoControlOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                  role === 'rider'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Bike className="w-4 h-4 text-emerald-600" />
                <span>Rider App</span>
              </button>

              <button
                onClick={() => {
                  setRole('admin');
                  setIsDemoControlOpen(false);
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition ${
                  role === 'admin'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Admin Ops</span>
              </button>
            </div>
          </div>

          {/* Operational Anomaly Triggers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Simulate Exceptions & Anomaly
            </h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  createSupportTicket({
                    orderId: activeOrder ? activeOrder.orderNumber : 'TG-8821',
                    customerName: activeOrder ? activeOrder.customerName : 'Maria Santos',
                    category: 'Late Delivery',
                    priority: 'high',
                    status: 'investigating',
                    assignedAgent: 'Operations Desk',
                    description: 'Simulated exception: Heavy rain along C5 road causing 15 min delay.',
                  });
                  showToast('Generated simulated support ticket in Admin Support center!');
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs py-2 rounded-xl font-medium transition"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Trigger Ticket</span>
              </button>

              <button
                onClick={() => {
                  toggleRiderOnline();
                  showToast(`Toggled Rider Kuya Dan to ${!riderProfile.isOnline ? 'Online' : 'Offline'}`);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs py-2 rounded-xl font-medium transition"
              >
                <Bike className="w-3.5 h-3.5 text-slate-600" />
                <span>Toggle Rider Duty</span>
              </button>
            </div>
          </div>

          {/* Reset Workspace */}
          <div className="pt-2 border-t border-slate-200">
            <button
              onClick={() => {
                resetAllDemoData();
                showToast('Reset all demo state to fresh Philippine seed data.');
              }}
              className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs py-2.5 rounded-xl transition"
            >
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reset Entire Workspace Demo Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
