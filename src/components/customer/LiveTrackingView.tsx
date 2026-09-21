import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  MapPin,
  Bike,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  AlertTriangle,
  ChevronRight,
  Store,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface LiveTrackingViewProps {
  orderId?: string;
  onBackToHome: () => void;
  onOpenSupport: (orderNumber: string) => void;
}

export const LiveTrackingView: React.FC<LiveTrackingViewProps> = ({
  orderId,
  onBackToHome,
  onOpenSupport,
}) => {
  const { orders, stepRiderLocation, verifyDelivery } = useApp();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<string[]>([
    'Kuya Dan: Hello po Maam Maria! On the way na po ako from BGC High Street.',
    'Maria: Salamat Kuya! Please buzz the lobby guard upon arrival.',
  ]);
  const [chatInput, setChatInput] = useState('');

  // Find targeted order or fallback to the latest active order
  const order =
    orders.find((o) => o.id === orderId || o.orderNumber === orderId) ||
    orders.find((o) => o.status !== 'completed' && o.status !== 'cancelled') ||
    orders[0];

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center space-y-3">
        <h3 className="font-bold text-base text-slate-800">No active delivery found</h3>
        <button
          onClick={onBackToHome}
          className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
        >
          Return to Marketplace
        </button>
      </div>
    );
  }

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((m) => [...m, `Maria: ${chatInput}`]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((m) => [...m, 'Kuya Dan: Noted po Maam, malapit na po ako!']);
    }, 1200);
  };

  const isDelivered = order.status === 'completed' || order.status === 'delivered';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
              {order.orderNumber}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-700 capitalize">
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            {isDelivered ? 'Order Delivered!' : `Arriving in ~${order.estimatedDeliveryMinutes} mins`}
          </h2>
        </div>

        <button
          onClick={onBackToHome}
          className="text-xs text-slate-600 hover:text-slate-900 font-semibold bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
        >
          ← Back to Shop
        </button>
      </div>

      {/* Main Grid: Map Simulation + Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Map Simulation Canvas */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative w-full h-80 sm:h-96 rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-lg flex flex-col justify-between p-4">
            {/* Map Grid Background Visual */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#6ee7b7" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* Simulated Route Line */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <svg className="w-full h-full p-8" viewBox="0 0 400 300">
                {/* Route path */}
                <path
                  d="M 60 220 Q 150 120 220 180 T 340 70"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                  className="animate-pulse"
                />

                {/* Merchant Marker */}
                <g transform="translate(60, 220)">
                  <circle r="14" fill="#065f46" stroke="#10b981" strokeWidth="2" />
                  <text x="-4" y="4" fill="#fff" fontSize="11" fontWeight="bold">M</text>
                </g>

                {/* Customer Marker */}
                <g transform="translate(340, 70)">
                  <circle r="14" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
                  <text x="-4" y="4" fill="#fff" fontSize="11" fontWeight="bold">C</text>
                </g>

                {/* Moving Rider Motorcycle Marker */}
                <g
                  transform={`translate(${
                    order.status === 'completed'
                      ? 340
                      : order.status === 'rider_arrived'
                      ? 320
                      : 200
                  }, ${
                    order.status === 'completed'
                      ? 70
                      : order.status === 'rider_arrived'
                      ? 85
                      : 165
                  })`}
                  className="transition-transform duration-700"
                >
                  <circle r="18" fill="#10b981" className="animate-ping opacity-30" />
                  <circle r="12" fill="#047857" stroke="#ffffff" strokeWidth="2" />
                  <text x="-5" y="4" fill="#ffffff" fontSize="10" fontWeight="bold">🏍️</text>
                </g>
              </svg>
            </div>

            {/* Top Map Badges */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="bg-slate-900/80 backdrop-blur-md border border-slate-700 text-emerald-400 text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live GPS Simulation • Metro Manila Hub
              </span>

              <button
                onClick={() => stepRiderLocation(order.id)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-md transition flex items-center gap-1"
              >
                <Navigation className="w-3.5 h-3.5 animate-spin" />
                <span>Move GPS Step</span>
              </button>
            </div>

            {/* Bottom Map Status Card */}
            <div className="relative z-10 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 text-xs text-white flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Destination</p>
                <p className="font-semibold text-slate-100 truncate max-w-[220px]">
                  {order.deliveryAddress.building || order.deliveryAddress.street}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[11px] text-slate-400 font-medium">Estimated Arrival</p>
                <p className="font-bold text-emerald-400 text-sm">
                  {order.status === 'completed' ? 'Delivered' : `${order.estimatedDeliveryMinutes} mins`}
                </p>
              </div>
            </div>
          </div>

          {/* Delivery PIN Verification Box */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  Customer Delivery PIN
                </span>
                <div className="font-black text-2xl tracking-widest text-slate-900 font-mono">
                  {order.deliveryPin}
                </div>
                <p className="text-[11px] text-slate-600">
                  Provide this 4-digit code to Kuya Dan upon arrival to verify delivery.
                </p>
              </div>
            </div>

            {order.status === 'rider_arrived' && (
              <button
                onClick={() => verifyDelivery(order.id, order.deliveryPin)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
              >
                Verify Delivery
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Rider Details, Chat & Timeline */}
        <div className="lg:col-span-5 space-y-4">
          {/* Rider Profile Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Assigned Delivery Rider</span>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                Verified Rider
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={order.riderAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'}
                alt="Rider"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200"
              />
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900">
                  {order.riderName || 'Danilo "Kuya Dan" Reyes'}
                </h4>
                <p className="text-xs text-slate-500">
                  {order.riderVehicle || 'Yamaha NMAX 155'} • <span className="font-mono">{order.riderPlate || 'NCR 4821 XY'}</span>
                </p>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold mt-0.5">
                  <span>⭐ 4.95 (1,842 trips)</span>
                </div>
              </div>
            </div>

            {/* Rider Communication Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setChatOpen(!chatOpen)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Masked Chat</span>
              </button>

              <button
                onClick={() => alert(`Calling rider via masked virtual PBX: ${order.riderPhone || '+63 917 555 3821'}`)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white transition"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Rider</span>
              </button>
            </div>

            {/* In-app Chat Box Drawer */}
            {chatOpen && (
              <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-[11px] ${
                        msg.startsWith('Maria')
                          ? 'bg-emerald-600 text-white ml-6'
                          : 'bg-white border border-slate-200 text-slate-800 mr-6'
                      }`}
                    >
                      {msg}
                    </div>
                  ))}
                </div>
                <div className="flex gap-1.5 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    placeholder="Message Kuya Dan..."
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs"
                  />
                  <button
                    onClick={handleSendChat}
                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg font-semibold text-xs"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Milestones */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800">Order Progress Timeline</h4>

            <div className="space-y-3">
              {order.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[10px]">
                    ✓
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{event.label}</span>
                      <span className="text-[10px] text-slate-400">{event.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Help & Support Trigger */}
          <button
            onClick={() => onOpenSupport(order.orderNumber)}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs text-slate-700 font-medium transition"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Report problem or missing item</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
