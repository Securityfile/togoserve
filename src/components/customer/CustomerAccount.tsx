import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  User,
  Crown,
  Wallet,
  MapPin,
  Clock,
  RotateCcw,
  Star,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface CustomerAccountProps {
  onTrackOrder: (orderId: string) => void;
  onOpenAddressSelector: () => void;
}

export const CustomerAccount: React.FC<CustomerAccountProps> = ({
  onTrackOrder,
  onOpenAddressSelector,
}) => {
  const {
    orders,
    isTogoServePlusMember,
    setIsTogoServePlusMember,
    customerWalletBalance,
    setCustomerWalletBalance,
    selectedAddress,
    reorderPreviousOrder,
  } = useApp();

  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [topupAmount, setTopupAmount] = useState('500');
  const [showTopupModal, setShowTopupModal] = useState(false);

  const handleTopup = () => {
    const val = parseFloat(topupAmount);
    if (val > 0) {
      setCustomerWalletBalance((prev: number) => prev + val);
      setShowTopupModal(false);
      alert(`Successfully simulated wallet top-up of ₱${val}!`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
            MS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Maria Santos</h2>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full uppercase">
                Gold Member
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              +63 917 888 2341 • maria.santos@gmail.com
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-emerald-600" />
              <span>{selectedAddress.barangay}, {selectedAddress.city}</span>
            </p>
          </div>
        </div>

        {/* Edit Address Button */}
        <button
          onClick={onOpenAddressSelector}
          className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition"
        >
          Manage Addresses
        </button>
      </div>

      {/* Cards Row: TOGO SERVE+ & Wallet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TOGO SERVE+ Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1 bg-white/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                <Crown className="w-3.5 h-3.5 text-slate-950" />
                TOGO SERVE+ VIP
              </span>
              <span className="text-xs font-bold bg-slate-950 text-white px-2 py-0.5 rounded-lg">
                {isTogoServePlusMember ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-950 tracking-tight pt-2">
              ₱0 Unlimited Delivery
            </h3>
            <p className="text-xs text-amber-950/80">
              Free delivery on all food & grocery orders above ₱300 + 5% cashback coins.
            </p>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <span className="text-xs font-bold">₱149 / Month</span>
            <button
              onClick={() => setIsTogoServePlusMember(!isTogoServePlusMember)}
              className="bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              {isTogoServePlusMember ? 'Cancel Membership' : 'Activate Membership'}
            </button>
          </div>
        </div>

        {/* TOGO Wallet Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>TOGO In-App Wallet</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                Simulated Balance
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs text-slate-400">Available Credits</span>
              <div className="text-3xl font-black text-slate-900 tracking-tight">
                ₱{customerWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between gap-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">Fast 1-tap checkout</span>
            <button
              onClick={() => setShowTopupModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition"
            >
              + Top-up Credits
            </button>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Order History & Tracking
            </h3>
            <p className="text-xs text-slate-500">
              View live progress, receipts, or reorder favorite Filipino meals.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {orders.length} orders
          </span>
        </div>

        <div className="space-y-3">
          {orders.map((order) => {
            const isActive =
              order.status !== 'completed' &&
              order.status !== 'cancelled' &&
              order.status !== 'refunded';

            return (
              <div
                key={order.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-semibold text-[10px] capitalize ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-800 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-400">• {order.createdAt}</span>
                  </div>

                  <h4 className="font-bold text-slate-800 text-sm">
                    {order.merchantName}
                  </h4>

                  <p className="text-slate-500 text-[11px]">
                    {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>

                  <p className="text-slate-900 font-bold">
                    ₱{order.total} • <span className="uppercase text-[10px] font-mono text-slate-500">{order.paymentMethod}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <button
                      onClick={() => onTrackOrder(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Live Track</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        reorderPreviousOrder(order);
                        alert(`Items from ${order.orderNumber} re-added to your cart!`);
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-3 py-2 rounded-xl transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reorder</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                    title="View Receipt"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Digital Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-slate-900">Official Electronic Receipt</h4>
                <p className="text-[11px] text-slate-500">TOGO SERVE Philippines Platform</p>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-slate-400 hover:text-slate-800 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-slate-900">{selectedReceiptOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Merchant:</span>
                <span className="font-semibold text-slate-900">{selectedReceiptOrder.merchantName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-mono uppercase text-slate-900">{selectedReceiptOrder.paymentMethod} (Simulated)</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery PIN:</span>
                <span className="font-mono font-bold text-emerald-700">{selectedReceiptOrder.deliveryPin}</span>
              </div>
            </div>

            <div className="border-t border-b border-slate-100 py-3 space-y-2">
              <span className="font-bold text-slate-700 block">Items Breakdown:</span>
              {selectedReceiptOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{it.quantity}x {it.name}</span>
                  <span className="font-semibold">₱{it.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₱{selectedReceiptOrder.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>₱{selectedReceiptOrder.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee</span>
                <span>₱{selectedReceiptOrder.serviceFee}</span>
              </div>
              {selectedReceiptOrder.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-₱{selectedReceiptOrder.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Total Paid</span>
                <span className="text-emerald-700">₱{selectedReceiptOrder.total}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedReceiptOrder(null)}
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-2 border-slate-100">
              <h4 className="font-bold text-slate-900">Simulate Top-Up</h4>
              <button onClick={() => setShowTopupModal(false)} className="text-slate-400">✕</button>
            </div>

            <p className="text-slate-500">
              Add simulated funds to your TOGO SERVE in-app wallet for zero-delay test orders:
            </p>

            <div className="flex gap-2">
              {['200', '500', '1000', '2000'].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setTopupAmount(amt)}
                  className={`flex-1 py-2 rounded-xl border font-bold ${
                    topupAmount === amt
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  ₱{amt}
                </button>
              ))}
            </div>

            <button
              onClick={handleTopup}
              className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl shadow-xs"
            >
              Add ₱{topupAmount} to Wallet
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
