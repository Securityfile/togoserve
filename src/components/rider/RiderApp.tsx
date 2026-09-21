import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Order } from '../../types';
import {
  Bike,
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  KeyRound,
  DollarSign,
  Wallet,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export const RiderApp: React.FC = () => {
  const {
    riderProfile,
    toggleRiderOnline,
    activeDeliveryOffer,
    acceptDeliveryOffer,
    declineDeliveryOffer,
    orders,
    stepRiderLocation,
    verifyPickup,
    verifyDelivery,
    remitCod,
    codRecords,
  } = useApp();

  const [enteredPickupCode, setEnteredPickupCode] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pickupCodeError, setPickupCodeError] = useState<string | null>(null);

  // Find the order currently assigned to this rider
  const assignedOrder = orders.find(
    (o) =>
      (o.status === 'merchant_accepted' ||
        o.status === 'preparing' ||
        o.status === 'ready_for_pickup' ||
        o.status === 'order_picked_up' ||
        o.status === 'on_the_way' ||
        o.status === 'rider_arrived') &&
      o.riderName === riderProfile.name
  );

  const pendingCodTotal = codRecords
    .filter((c) => c.riderName === riderProfile.name && c.status === 'pending_remittance')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleVerifyPickupCode = () => {
    if (!assignedOrder) return;
    if (enteredPickupCode.trim().toUpperCase() === assignedOrder.pickupCode.toUpperCase()) {
      verifyPickup(assignedOrder.id, enteredPickupCode.trim());
      setPickupCodeError(null);
      setEnteredPickupCode('');
    } else {
      setPickupCodeError(`Invalid code. Expected ${assignedOrder.pickupCode}`);
    }
  };

  const handleVerifyDeliveryPin = () => {
    if (!assignedOrder) return;
    if (enteredPin.trim() === assignedOrder.deliveryPin) {
      verifyDelivery(assignedOrder.id, enteredPin.trim());
      setPinError(null);
      setEnteredPin('');
      alert(`Delivery successful! ₱${assignedOrder.deliveryFee} credited to your rider wallet.`);
    } else {
      setPinError(`Incorrect PIN. Expected ${assignedOrder.deliveryPin}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-20">
      {/* Rider Header Bar */}
      <div className="bg-slate-950 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={riderProfile.avatar}
              alt="Danilo"
              className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{riderProfile.name}</h2>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ⭐ {riderProfile.rating}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {riderProfile.vehicleType} • <span className="font-mono">{riderProfile.plateNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online Toggle Switch */}
            <button
              onClick={toggleRiderOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition border ${
                riderProfile.isOnline
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-900/50'
                  : 'bg-rose-950 text-rose-300 border-rose-800 hover:bg-rose-900'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  riderProfile.isOnline ? 'bg-white animate-ping' : 'bg-rose-400'
                }`}
              />
              <span>{riderProfile.isOnline ? 'ON DUTY (RECEIVING TRIPS)' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Earnings & Wallet Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Today's Earnings</span>
            <div className="text-xl font-black text-emerald-400 mt-1">₱{riderProfile.todayEarnings.netEarnings}</div>
            <p className="text-[10px] text-slate-400">{riderProfile.totalTrips} trips completed</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Acceptance Rate</span>
            <div className="text-xl font-black text-white mt-1">{riderProfile.acceptanceRate || 98}%</div>
            <p className="text-[10px] text-emerald-400">Tier 1 Bonus Eligible</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">Rider Wallet</span>
            <div className="text-xl font-black text-white mt-1">₱{riderProfile.walletBalance}</div>
            <p className="text-[10px] text-slate-400">Available to cashout</p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4">
            <span className="text-[11px] text-slate-400 font-medium">COD in Hand</span>
            <div className="text-xl font-black text-amber-400 mt-1">₱{pendingCodTotal}</div>
            {pendingCodTotal > 0 && (
              <button
                onClick={() => {
                  const rec = codRecords.find((c) => c.status === 'pending_remittance');
                  if (rec) remitCod(rec.id);
                  alert('Remitted COD collection via GCash Cliqq!');
                }}
                className="text-[10px] text-amber-300 underline font-semibold mt-0.5"
              >
                Remit to Hub
              </button>
            )}
          </div>
        </div>

        {/* INCOMING DISPATCH OFFER POPUP / CARD */}
        {activeDeliveryOffer && (
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 border-2 border-emerald-400 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-300">
                  New Delivery Offer! (Expiring soon)
                </span>
              </div>
              <span className="font-mono text-xl font-black text-emerald-400">
                ₱{activeDeliveryOffer.estimatedEarnings}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase">1. Pickup Restaurant</span>
                <p className="font-bold text-white text-sm">{activeDeliveryOffer.merchantName}</p>
                <p className="text-slate-300">{activeDeliveryOffer.merchantAddress}</p>
              </div>

              <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] font-bold uppercase">2. Drop-off Customer</span>
                <p className="font-bold text-white text-sm">{activeDeliveryOffer.customerArea}</p>
                <p className="text-slate-300">Est. Distance: {activeDeliveryOffer.totalDistanceKm} km</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => acceptDeliveryOffer(activeDeliveryOffer.orderId)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg transition"
              >
                Accept Delivery (Claim ₱{activeDeliveryOffer.estimatedEarnings})
              </button>
              <button
                onClick={declineDeliveryOffer}
                className="px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-3.5 rounded-2xl transition"
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TRIP WORKFLOW */}
        {assignedOrder ? (
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  {assignedOrder.orderNumber}
                </span>
                <h3 className="text-lg font-black text-white mt-1.5">
                  Current Trip in Progress
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                {assignedOrder.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* STAGE 1: EN ROUTE TO RESTAURANT */}
            {(assignedOrder.status === 'merchant_accepted' || assignedOrder.status === 'preparing') && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 font-bold uppercase">Step 1: Head to Store</span>
                  <p className="font-bold text-white text-sm">{assignedOrder.merchantName}</p>
                  <p className="text-slate-300">BGC High Street, Taguig City</p>
                  <p className="text-amber-400 mt-1">Status: Kitchen is currently cooking the order</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => stepRiderLocation(assignedOrder.id)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Arrived at Restaurant</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: AT RESTAURANT - VERIFY PICKUP CODE */}
            {assignedOrder.status === 'ready_for_pickup' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 font-bold uppercase">Step 2: Collect Food from Store</span>
                  <p className="font-bold text-white text-sm">{assignedOrder.merchantName}</p>
                  <p className="text-emerald-400 font-semibold">
                    ✓ Food is packed and ready! Enter the store pickup code to verify.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                  <label className="font-bold text-white block">
                    Enter Merchant Pickup Code (Hint: {assignedOrder.pickupCode})
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={enteredPickupCode}
                      onChange={(e) => setEnteredPickupCode(e.target.value)}
                      placeholder="e.g. PU-8921"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono uppercase text-white"
                    />
                    <button
                      onClick={handleVerifyPickupCode}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                    >
                      Verify Pickup
                    </button>
                  </div>
                  {pickupCodeError && (
                    <p className="text-rose-400 text-[11px] font-semibold">{pickupCodeError}</p>
                  )}
                </div>
              </div>
            )}

            {/* STAGE 3: DRIVING TO CUSTOMER */}
            {(assignedOrder.status === 'order_picked_up' || assignedOrder.status === 'on_the_way') && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 space-y-2">
                  <span className="text-slate-400 font-bold uppercase">Step 3: Deliver to Customer</span>
                  <p className="font-bold text-white text-sm">{assignedOrder.customerName}</p>
                  <p className="text-slate-300">
                    {assignedOrder.deliveryAddress.building || assignedOrder.deliveryAddress.street}, Brgy. {assignedOrder.deliveryAddress.barangay}
                  </p>
                  {assignedOrder.deliveryAddress.instructions && (
                    <p className="text-amber-300 bg-slate-950 p-2 rounded-lg italic">
                      Customer Note: "{assignedOrder.deliveryAddress.instructions}"
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => alert(`Calling customer via masked PBX: ${assignedOrder.customerPhone}`)}
                    className="p-3 bg-slate-900 hover:bg-slate-750 text-white rounded-xl border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Call Customer</span>
                  </button>

                  <button
                    onClick={() => stepRiderLocation(assignedOrder.id)}
                    className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Step GPS / Arrive at House</span>
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: AT CUSTOMER - COLLECT COD & VERIFY PIN */}
            {assignedOrder.status === 'rider_arrived' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-emerald-500/50 space-y-2">
                  <span className="text-emerald-400 font-bold uppercase">Step 4: At Customer Doorstep</span>
                  <p className="font-bold text-white text-sm">{assignedOrder.customerName}</p>
                  <p className="text-slate-300">
                    {assignedOrder.deliveryAddress.unitNumber || ''} {assignedOrder.deliveryAddress.building || assignedOrder.deliveryAddress.street}
                  </p>

                  {/* Cash on Delivery Notice if applicable */}
                  {assignedOrder.paymentMethod === 'cod' && (
                    <div className="p-3 bg-amber-950/60 border border-amber-600/50 rounded-xl space-y-1">
                      <span className="text-amber-400 font-black uppercase text-[11px] flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        CASH ON DELIVERY (COD) COLLECTION:
                      </span>
                      <p className="text-white text-base font-black">
                        Collect exact amount: ₱{assignedOrder.total}
                      </p>
                      <p className="text-[10px] text-amber-200">
                        Do not hand over goods until cash is physically counted.
                      </p>
                    </div>
                  )}
                </div>

                {/* Delivery PIN Input */}
                <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-emerald-400" />
                      <span>Ask Customer for 4-Digit Delivery PIN</span>
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      (Demo PIN: {assignedOrder.deliveryPin})
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={enteredPin}
                      onChange={(e) => setEnteredPin(e.target.value)}
                      placeholder="e.g. 4892"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-white"
                    />
                    <button
                      onClick={handleVerifyDeliveryPin}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-3 rounded-xl transition"
                    >
                      Complete Delivery
                    </button>
                  </div>
                  {pinError && (
                    <p className="text-rose-400 text-[11px] font-semibold">{pinError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Idle State Waiting for Dispatch */
          <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-3xl p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <Bike className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="font-bold text-base text-white">
              {riderProfile.isOnline ? 'Waiting for Nearby Dispatch Offers' : 'You are currently Offline'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {riderProfile.isOnline
                ? 'Your GPS is active in BGC / Taguig Zone. New orders will automatically prompt with trip earnings.'
                : 'Turn ON DUTY switch above to begin receiving delivery requests.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
