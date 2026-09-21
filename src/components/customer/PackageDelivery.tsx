import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PhilippineAddress, Order } from '../../types';
import {
  Package,
  Bike,
  Car,
  MapPin,
  ShieldCheck,
  Banknote,
  ArrowRight,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';

interface PackageDeliveryProps {
  onOrderCreated: (order: Order) => void;
}

export const PackageDelivery: React.FC<PackageDeliveryProps> = ({ onOrderCreated }) => {
  const { selectedAddress, createOrder } = useApp();

  const [senderName, setSenderName] = useState('Maria Santos');
  const [senderPhone, setSenderPhone] = useState('+63 917 888 2341');
  const [recipientName, setRecipientName] = useState('Juan Dela Cruz');
  const [recipientPhone, setRecipientPhone] = useState('+63 918 777 4321');
  const [dropoffAddress, setDropoffAddress] = useState('Unit 8B, One Serendra, 11th Ave, BGC, Taguig');
  const [itemCategory, setItemCategory] = useState('Documents & Files');
  const [itemWeight, setItemWeight] = useState('Up to 5 kg');
  const [vehicleType, setVehicleType] = useState<'motorcycle' | 'mpv'>('motorcycle');
  const [itemDescription, setItemDescription] = useState('Signed contract documents in sealed envelope');
  const [requiresCOD, setRequiresCOD] = useState(false);
  const [codAmount, setCodAmount] = useState('500');
  const [isInsured, setIsInsured] = useState(true);

  // Simulated distance and pricing calculation
  const distanceKm = 4.8;
  const baseRate = vehicleType === 'motorcycle' ? 60 : 180;
  const perKmRate = vehicleType === 'motorcycle' ? 12 : 22;
  const distanceFee = Math.round(distanceKm * perKmRate);
  const insuranceFee = isInsured ? 15 : 0;
  const codFee = requiresCOD ? 20 : 0;
  const totalFare = baseRate + distanceFee + insuranceFee + codFee;

  const handleBookNow = () => {
    const deliveryAddr: PhilippineAddress = {
      ...selectedAddress,
      street: dropoffAddress,
      unitNumber: 'Unit 8B',
      building: 'One Serendra',
      instructions: `Recipient: ${recipientName} (${recipientPhone}). ${itemCategory}: ${itemDescription}`,
    };

    const newOrder = createOrder({
      merchantId: 'm3', // Package Courier merchant proxy
      items: [
        {
          id: 'pkg_' + Date.now(),
          productId: 'p_pkg',
          name: `TOGO Padala: ${itemCategory}`,
          price: totalFare,
          quantity: 1,
          totalPrice: totalFare,
          specialInstructions: `${vehicleType.toUpperCase()} Courier • ${itemDescription}`,
        },
      ],
      paymentMethod: requiresCOD ? 'cod' : 'gcash',
      notes: `Courier Padala from ${senderName} to ${recipientName}. COD: ${requiresCOD ? `₱${codAmount}` : 'None'}`,
      deliveryAddress: deliveryAddr,
    });

    onOrderCreated(newOrder);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
              TOGO Padala Express
            </span>
            <span className="text-xs text-slate-500">Same-Day On-Demand Courier</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Door-to-Door Package Delivery
          </h2>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 w-fit">
          ⏱️ Average Rider Pickup: <strong>7-12 mins</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Route & Package Specifics */}
        <div className="lg:col-span-7 space-y-5">
          {/* Pickup & Dropoff Routing Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pickup & Drop-off Points
            </h3>

            {/* Pickup */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">
                  A
                </div>
                <span>Sender & Pickup Address</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Sender Name"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Contact Number"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  📍 {selectedAddress.street}, Brgy. {selectedAddress.barangay}, {selectedAddress.city}
                </p>
              </div>
            </div>

            {/* Drop-off */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px]">
                  B
                </div>
                <span>Recipient & Drop-off Address</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient Name"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Contact Number"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Street, Barangay, Building, Landmark..."
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500">
              Package Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Item Category</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option>Documents & Files</option>
                  <option>Food & Homemade Goods</option>
                  <option>Clothes & Merchandise</option>
                  <option>Electronics / Gadgets</option>
                  <option>Fragile / Glassware</option>
                  <option>Medical Supplies</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approx. Weight</label>
                <select
                  value={itemWeight}
                  onChange={(e) => setItemWeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  <option>Under 1 kg (Envelope)</option>
                  <option>Up to 5 kg (Shoebox size)</option>
                  <option>Up to 10 kg (Medium bag)</option>
                  <option>Up to 20 kg (Max Motorcycle)</option>
                  <option>20 - 50 kg (Requires MPV / Car)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Item Description & Handling Notes
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="e.g. Please handle with care, do not fold documents..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
              />
            </div>

            {/* COD Collection Checkbox */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresCOD}
                  onChange={(e) => setRequiresCOD(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">
                  Collect Cash from Recipient on Drop-off (Cash on Delivery)
                </span>
              </label>

              {requiresCOD && (
                <div className="pl-6 flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Amount to Collect: ₱</span>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(e.target.value)}
                    className="w-32 bg-white border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-900"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Form: Vehicle Selection & Fare Breakdown */}
        <div className="lg:col-span-5 space-y-5">
          {/* Vehicle Selector */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Courier Vehicle
            </h3>

            {/* Motorcycle */}
            <div
              onClick={() => setVehicleType('motorcycle')}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                vehicleType === 'motorcycle'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Motorcycle Courier</h4>
                  <p className="text-[11px] text-slate-500">Up to 20kg • Fits in delivery bag</p>
                </div>
              </div>
              <span className="font-bold text-slate-900">₱{60 + Math.round(distanceKm * 12)}</span>
            </div>

            {/* MPV / Car */}
            <div
              onClick={() => setVehicleType('mpv')}
              className={`p-3.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                vehicleType === 'mpv'
                  ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">MPV / 4-Wheels</h4>
                  <p className="text-[11px] text-slate-500">Up to 200kg • Boxes, cakes & catering</p>
                </div>
              </div>
              <span className="font-bold text-slate-900">₱{180 + Math.round(distanceKm * 22)}</span>
            </div>
          </div>

          {/* Fare Calculator Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-xs text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-500">
              Fare Breakdown
            </h3>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Base Booking Rate</span>
                <span className="font-semibold text-slate-900">₱{baseRate}</span>
              </div>

              <div className="flex justify-between">
                <span>Distance Fee (~{distanceKm} km)</span>
                <span className="font-semibold text-slate-900">₱{distanceFee}</span>
              </div>

              <div className="flex justify-between items-center">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInsured}
                    onChange={(e) => setIsInsured(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Goods Protection Guarantee</span>
                </label>
                <span className="font-semibold text-slate-900">₱{insuranceFee}</span>
              </div>

              {requiresCOD && (
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>COD Handling Fee</span>
                  <span>₱{codFee}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-base text-slate-900">
                <span>Total Delivery Fare</span>
                <span className="text-emerald-700">₱{totalFare}</span>
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
            >
              <span>Book Padala Courier Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
