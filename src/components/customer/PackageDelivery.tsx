import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PhilippineAddress, Order } from '../../types';
import {
  PadalaVehicleType,
  PadalaDeliveryType,
  PadalaHandlingTag,
  PadalaWaypoint,
} from '../../types/padalaEngine';
import {
  VEHICLE_CONFIGS,
  INSURANCE_TIERS,
  calculateVolumetricWeight,
  recommendVehicle,
  calculatePadalaFare,
  generateDeliveryPin,
  generatePickupCode,
} from '../../services/padalaEngine';
import {
  Package,
  Bike,
  Car,
  Truck,
  ShieldCheck,
  Banknote,
  Clock,
  Sparkles,
  Info,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  AlertCircle,
  Camera,
  KeyRound,
  PenTool,
} from 'lucide-react';

interface PackageDeliveryProps {
  onOrderCreated: (order: Order) => void;
}

export const PackageDelivery: React.FC<PackageDeliveryProps> = ({ onOrderCreated }) => {
  const { selectedAddress, createOrder } = useApp();

  // Contact Info
  const [senderName, setSenderName] = useState('Maria Santos');
  const [senderPhone, setSenderPhone] = useState('+63 917 888 2341');
  const [recipientName, setRecipientName] = useState('Juan Dela Cruz');
  const [recipientPhone, setRecipientPhone] = useState('+63 918 777 4321');
  const [dropoffAddress, setDropoffAddress] = useState('Unit 8B, One Serendra, 11th Ave, BGC, Taguig');
  const [dropoffLandmark, setDropoffLandmark] = useState('Across Market! Market!');

  // Multi-stop state
  const [hasSecondStop, setHasSecondStop] = useState(false);
  const [stop2Recipient, setStop2Recipient] = useState('Ana Reyes');
  const [stop2Phone, setStop2Phone] = useState('+63 920 333 1122');
  const [stop2Address, setStop2Address] = useState('28th Floor PBCom Tower, Ayala Ave, Makati');

  // Logistics parameters
  const [deliveryType, setDeliveryType] = useState<PadalaDeliveryType>('express');
  const [vehicleType, setVehicleType] = useState<PadalaVehicleType>('motorcycle');
  const [scheduledSlot, setScheduledSlot] = useState('Today, 2:00 PM - 4:00 PM');

  // Parcel details & dimensions
  const [itemCategory, setItemCategory] = useState('Documents & Files');
  const [itemDescription, setItemDescription] = useState('Signed legal contract documents in waterproof pouch');
  const [weightKg, setWeightKg] = useState<number>(2.5);
  const [lengthCm, setLengthCm] = useState<number>(35);
  const [widthCm, setWidthCm] = useState<number>(25);
  const [heightCm, setHeightCm] = useState<number>(10);

  // Protection & Handling
  const [declaredValuePhp, setDeclaredValuePhp] = useState<number>(1500);
  const [insuranceTierId, setInsuranceTierId] = useState<string>('standard');
  const [handlingTags, setHandlingTags] = useState<PadalaHandlingTag[]>(['document']);
  
  // COD
  const [requiresCOD, setRequiresCOD] = useState(false);
  const [codAmount, setCodAmount] = useState<number>(500);

  // Electronic Proof of Delivery
  const [requireSignature, setRequireSignature] = useState(true);
  const [requirePhoto, setRequirePhoto] = useState(true);
  const [requirePin, setRequirePin] = useState(true);

  // Calculate volumetrics
  const volumetricWeightKg = useMemo(() => {
    return calculateVolumetricWeight(lengthCm, widthCm, heightCm);
  }, [lengthCm, widthCm, heightCm]);

  const chargeableWeightKg = Math.max(weightKg, volumetricWeightKg);

  // AI Vehicle Recommendation
  const recommendation = useMemo(() => {
    return recommendVehicle(weightKg, lengthCm, widthCm, heightCm);
  }, [weightKg, lengthCm, widthCm, heightCm]);

  // Pricing calculation
  const distanceKm = hasSecondStop ? 8.4 : 4.8;
  const fareBreakdown = useMemo(() => {
    return calculatePadalaFare({
      vehicleType,
      deliveryType,
      distanceKm,
      dimensions: {
        weightKg,
        lengthCm,
        widthCm,
        heightCm,
        volumetricWeightKg,
      },
      insuranceTierId,
      numberOfStops: hasSecondStop ? 2 : 1,
      requiresCod: requiresCOD,
      codAmount,
    });
  }, [
    vehicleType,
    deliveryType,
    distanceKm,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    volumetricWeightKg,
    insuranceTierId,
    hasSecondStop,
    requiresCOD,
    codAmount,
  ]);

  const toggleHandlingTag = (tag: PadalaHandlingTag) => {
    setHandlingTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleBookNow = () => {
    const deliveryPin = generateDeliveryPin();
    const pickupCode = generatePickupCode();

    const deliveryAddr: PhilippineAddress = {
      ...selectedAddress,
      street: dropoffAddress,
      landmark: dropoffLandmark,
      instructions: `Recipient: ${recipientName} (${recipientPhone}). ${itemCategory}: ${itemDescription}. e-POD PIN: ${deliveryPin}`,
    };

    const notesSummary = [
      `PADALA LOGISTICS: ${vehicleType.toUpperCase()} • ${deliveryType.toUpperCase()}`,
      `Parcel: ${weightKg}kg (Vol: ${volumetricWeightKg}kg, Dim: ${lengthCm}x${widthCm}x${heightCm}cm)`,
      `Protection: ₱${declaredValuePhp} declared value`,
      `Handling: ${handlingTags.join(', ') || 'Standard'}`,
      requiresCOD ? `COD Collection: ₱${codAmount}` : 'No COD',
    ].join(' | ');

    const newOrder = createOrder({
      merchantId: 'm3', // Logistics courier proxy
      items: [
        {
          id: 'padala_' + Date.now(),
          productId: 'p_padala_logistics',
          name: `TOGO Padala (${vehicleType.toUpperCase()} - ${deliveryType.toUpperCase()})`,
          price: fareBreakdown.totalFare,
          quantity: 1,
          totalPrice: fareBreakdown.totalFare,
          specialInstructions: notesSummary,
        },
      ],
      paymentMethod: requiresCOD ? 'cod' : 'gcash',
      notes: notesSummary,
      deliveryAddress: deliveryAddr,
    });

    onOrderCreated(newOrder);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
              TOGO Padala Logistics
            </span>
            <span>·</span>
            <span>Point-to-Point & Multi-Stop Dispatch</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Door-to-Door On-Demand Courier
          </h2>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
          <Clock className="w-4 h-4 text-emerald-600" />
          <span>Average Metro Manila Dispatch: <strong>8-15 mins</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Route, Dimensions, Vehicle & Protection (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 1. ROUTING & STOPS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1. Pickup & Waypoints
              </h3>
              <span className="text-xs text-slate-400">
                {hasSecondStop ? '2 Drops (Multi-Stop)' : '1 Drop (Direct)'}
              </span>
            </div>

            {/* Pickup Node */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  A
                </div>
                <span>Sender Pickup Point</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Sender Name"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="Sender Phone"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  📍 {selectedAddress.street}, {selectedAddress.barangay}, {selectedAddress.city}
                </div>
              </div>
            </div>

            {/* Dropoff 1 Node */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    B
                  </div>
                  <span>Recipient Drop-off (Waypoint 1)</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Recipient Name"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="Recipient Phone"
                    className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <input
                  type="text"
                  value={dropoffAddress}
                  onChange={(e) => setDropoffAddress(e.target.value)}
                  placeholder="Dropoff Complete Address"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={dropoffLandmark}
                  onChange={(e) => setDropoffLandmark(e.target.value)}
                  placeholder="Landmark / Security Guard instructions"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Optional Dropoff 2 Node */}
            {hasSecondStop && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold">
                      C
                    </div>
                    <span>Recipient Drop-off (Waypoint 2)</span>
                  </div>
                  <button
                    onClick={() => setHasSecondStop(false)}
                    className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Stop</span>
                  </button>
                </div>
                <div className="bg-purple-50/50 border border-purple-200 rounded-xl p-3 text-xs space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={stop2Recipient}
                      onChange={(e) => setStop2Recipient(e.target.value)}
                      placeholder="Stop 2 Recipient"
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      value={stop2Phone}
                      onChange={(e) => setStop2Phone(e.target.value)}
                      placeholder="Stop 2 Phone"
                      className="bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                    />
                  </div>
                  <input
                    type="text"
                    value={stop2Address}
                    onChange={(e) => setStop2Address(e.target.value)}
                    placeholder="Stop 2 Full Address"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-900"
                  />
                </div>
              </div>
            )}

            {!hasSecondStop && (
              <button
                type="button"
                onClick={() => setHasSecondStop(true)}
                className="w-full py-2 border border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Second Waypoint (+₱40 Stop Fee)</span>
              </button>
            )}
          </div>

          {/* 2. VEHICLE SELECTION & CAPACITY */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                2. Select Transport Vehicle
              </h3>
              {recommendation && (
                <button
                  type="button"
                  onClick={() => setVehicleType(recommendation.vehicle.id)}
                  className="text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Auto-Select: {recommendation.vehicle.label}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {VEHICLE_CONFIGS.map((v) => {
                const isSelected = vehicleType === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setVehicleType(v.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{v.label}</span>
                        <span className="text-[11px] font-black text-blue-700">₱{v.baseFare}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        <div>Max: <strong>{v.maxWeightKg} kg</strong></div>
                        <div>Dim: {v.maxDimensionsCm.length}x{v.maxDimensionsCm.width}x{v.maxDimensionsCm.height}cm</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 line-clamp-1 border-t border-slate-100 pt-1">
                      {v.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. PARCEL DIMENSIONS & VOLUMETRICS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                3. Parcel Dimensions & Weight
              </h3>
              <div className="text-xs text-slate-500">
                Volumetric Formula: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">(L×W×H)/3500</code>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Actual Weight (kg):
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Length (cm):
                </label>
                <input
                  type="number"
                  min="1"
                  value={lengthCm}
                  onChange={(e) => setLengthCm(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Width (cm):
                </label>
                <input
                  type="number"
                  min="1"
                  value={widthCm}
                  onChange={(e) => setWidthCm(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Height (cm):
                </label>
                <input
                  type="number"
                  min="1"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-700">
              <div>
                <span className="text-slate-500">Volumetric Weight: </span>
                <strong className="text-slate-900">{volumetricWeightKg} kg</strong>
              </div>
              <div>
                <span className="text-slate-500">Chargeable Weight: </span>
                <strong className="text-blue-700">{chargeableWeightKg} kg</strong>
              </div>
              <div>
                <span className="text-[11px] text-slate-400">
                  {volumetricWeightKg > weightKg ? '(Volumetric applies)' : '(Actual applies)'}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold text-slate-700 block">
                Item Description:
              </label>
              <input
                type="text"
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="What are you sending? (e.g. Legal documents, birthday cake, spare parts)"
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Service Level, Cargo Shield, e-POD & Fare (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 4. DISPATCH SPEED */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              4. Delivery SLA Speed
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[
                { id: 'express', label: 'Express (1 hr)', badge: '+₱30 Priority' },
                { id: 'same_day', label: 'Same-Day (4 hrs)', badge: 'Standard' },
                { id: 'scheduled', label: 'Scheduled', badge: 'Reserved' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDeliveryType(opt.id as PadalaDeliveryType)}
                  className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                    deliveryType === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{opt.badge}</div>
                </button>
              ))}
            </div>

            {deliveryType === 'scheduled' && (
              <div className="pt-2 text-xs">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Scheduled Pickup Window:
                </label>
                <select
                  value={scheduledSlot}
                  onChange={(e) => setScheduledSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option>Today, 2:00 PM - 4:00 PM</option>
                  <option>Today, 5:00 PM - 7:00 PM</option>
                  <option>Tomorrow, 9:00 AM - 11:00 AM</option>
                  <option>Tomorrow, 2:00 PM - 4:00 PM</option>
                </select>
              </div>
            )}
          </div>

          {/* 5. CARGO PROTECTION & SPECIAL HANDLING */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              5. Protection & Handling
            </h3>

            {/* Declared Value */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-bold text-slate-700">Declared Value (PHP):</span>
                <span className="text-[11px] text-slate-400">For coverage verification</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">₱</span>
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={declaredValuePhp}
                  onChange={(e) => setDeclaredValuePhp(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Insurance Tier Selector */}
            <div className="space-y-1.5 text-xs">
              {INSURANCE_TIERS.map((tier) => (
                <label
                  key={tier.id}
                  onClick={() => setInsuranceTierId(tier.id)}
                  className={`flex items-center justify-between p-2 rounded-xl border cursor-pointer transition ${
                    insuranceTierId === tier.id
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-medium'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="padala_insurance"
                      checked={insuranceTierId === tier.id}
                      onChange={() => setInsuranceTierId(tier.id)}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="font-bold text-xs">{tier.label}</div>
                      <div className="text-[10px] text-slate-500">{tier.description}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700">
                    {tier.feePhp === 0 ? 'FREE' : `+₱${tier.feePhp}`}
                  </span>
                </label>
              ))}
            </div>

            {/* Special Handling Checkboxes */}
            <div className="pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Special Handling Tags:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'fragile', label: 'Fragile / Glass' },
                  { id: 'keep_upright', label: 'Keep Upright ⬆️' },
                  { id: 'document', label: 'Legal Document' },
                  { id: 'perishable', label: 'Perishable Food' },
                  { id: 'cold_insulated', label: 'Cold-Insulated' },
                ].map((tag) => {
                  const isChecked = handlingTags.includes(tag.id as PadalaHandlingTag);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleHandlingTag(tag.id as PadalaHandlingTag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        isChecked
                          ? 'border-blue-600 bg-blue-600 text-white font-bold'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. ELECTRONIC PROOF OF DELIVERY (e-POD) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              6. Electronic Proof of Delivery (e-POD)
            </h3>
            <p className="text-[11px] text-slate-500">
              Select verification security requirements for recipient handover:
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePin}
                  onChange={(e) => setRequirePin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>4-Digit Handover PIN Verification</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePhoto}
                  onChange={(e) => setRequirePhoto(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                  <span>Doorstep / Package Photo Capture</span>
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireSignature}
                  onChange={(e) => setRequireSignature(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1.5 font-medium text-slate-800">
                  <PenTool className="w-3.5 h-3.5 text-blue-600" />
                  <span>Recipient Digital Signature on Glass</span>
                </span>
              </label>
            </div>
          </div>

          {/* 7. CASH ON DELIVERY (COD) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-2xs text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash on Delivery (COD Collection)</span>
              </span>
              <input
                type="checkbox"
                checked={requiresCOD}
                onChange={(e) => setRequiresCOD(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {requiresCOD && (
              <div className="pt-1 space-y-1">
                <label className="text-[11px] text-slate-500 block">
                  Amount to collect from recipient (₱):
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={codAmount}
                  onChange={(e) => setCodAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800"
                />
                <span className="text-[10px] text-slate-400 block">
                  COD Handling Fee: 2% (min ₱20)
                </span>
              </div>
            )}
          </div>

          {/* 8. TRANSPARENT FARE BREAKDOWN & BOOK BUTTON */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Fare Calculation ({distanceKm} km)
            </h4>

            <div className="space-y-1.5 text-xs border-b border-slate-800 pb-3">
              <div className="flex justify-between text-slate-300">
                <span>Base Fare ({fareBreakdown.baseFare > 0 ? vehicleType : 'Standard'}):</span>
                <span>₱{fareBreakdown.baseFare}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Distance Fee ({distanceKm} km):</span>
                <span>₱{fareBreakdown.distanceFare}</span>
              </div>
              {fareBreakdown.weightSurcharge > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Weight Surcharge (Heavy cargo):</span>
                  <span>+₱{fareBreakdown.weightSurcharge}</span>
                </div>
              )}
              {fareBreakdown.insuranceFee > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Cargo Protection Fee:</span>
                  <span>+₱{fareBreakdown.insuranceFee}</span>
                </div>
              )}
              {fareBreakdown.multiStopSurcharge > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Multi-Stop Surcharge:</span>
                  <span>+₱{fareBreakdown.multiStopSurcharge}</span>
                </div>
              )}
              {fareBreakdown.codFee > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>COD Remittance Fee:</span>
                  <span>+₱{fareBreakdown.codFee}</span>
                </div>
              )}
              {fareBreakdown.rushSurcharge > 0 && (
                <div className="flex justify-between text-slate-300">
                  <span>Priority Rush / Scheduled Surcharge:</span>
                  <span>+₱{fareBreakdown.rushSurcharge}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-base font-black">
              <span>Total Delivery Fare:</span>
              <span className="text-emerald-400 text-lg">₱{fareBreakdown.totalFare}</span>
            </div>

            <button
              onClick={handleBookNow}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Confirm & Dispatch Courier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
