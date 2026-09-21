import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod, Order } from '../../types';
import {
  X,
  ShieldAlert,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  Smartphone,
  CheckCircle2,
  Lock,
  MapPin,
  Clock,
  Bike,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const {
    cart,
    selectedAddress,
    deliveryType,
    deliveryTip,
    voucher,
    isTogoServePlusMember,
    merchants,
    customerWalletBalance,
    createOrder,
  } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('gcash');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const merchant = merchants[0]; // primary merchant
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const voucherDiscount = voucher ? voucher.discount : 0;
  const isFreeDelivery = isTogoServePlusMember && subtotal >= 300;
  const deliveryFee = deliveryType === 'pickup' ? 0 : isFreeDelivery ? 0 : merchant.deliveryFee;
  const serviceFee = 15;
  const smallOrderFee = subtotal < merchant.minOrder ? 30 : 0;
  const tipAmount = deliveryType === 'pickup' ? 0 : deliveryTip;
  const total = Math.max(0, subtotal - voucherDiscount + deliveryFee + serviceFee + smallOrderFee + tipAmount);

  const handlePlaceOrder = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newOrder = createOrder({
        merchantId: merchant.id,
        items: cart,
        paymentMethod,
        notes: customerNotes,
        deliveryAddress: selectedAddress,
      });
      setIsProcessing(false);
      onClose();
      onOrderPlaced(newOrder);
    }, 900);
  };

  const paymentOptions: {
    id: PaymentMethod;
    name: string;
    description: string;
    icon: React.ReactNode;
    badge?: string;
  }[] = [
    {
      id: 'gcash',
      name: 'GCash',
      description: 'Instant e-wallet payment via mobile number (Simulated)',
      icon: <Smartphone className="w-5 h-5 text-blue-600" />,
      badge: 'Popular PH',
    },
    {
      id: 'maya',
      name: 'Maya (PayMaya)',
      description: 'Digital bank & wallet checkout (Simulated)',
      icon: <Smartphone className="w-5 h-5 text-emerald-600" />,
    },
    {
      id: 'qrph',
      name: 'QRPh Standard',
      description: 'Scan & pay with any Philippine bank app (Simulated)',
      icon: <QrCode className="w-5 h-5 text-slate-800" />,
      badge: 'BSP Standard',
    },
    {
      id: 'wallet',
      name: 'TOGO SERVE Wallet',
      description: `In-app credit balance (Available: ₱${customerWalletBalance})`,
      icon: <Wallet className="w-5 h-5 text-amber-600" />,
    },
    {
      id: 'card',
      name: 'Credit / Debit Card',
      description: 'Visa, Mastercard, JCB (Simulated)',
      icon: <CreditCard className="w-5 h-5 text-indigo-600" />,
    },
    {
      id: 'cod',
      name: 'Cash on Delivery (COD)',
      description: 'Pay cash directly to rider upon delivery verification',
      icon: <Banknote className="w-5 h-5 text-teal-600" />,
      badge: 'Zero prepay',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Secure Checkout</h3>
              <p className="text-[11px] text-slate-400">Philippine Multi-Vendor Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demo Warning Notice */}
        <div className="bg-amber-50 border-b border-amber-200 p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">DEMO PAYMENT MODE — </span>
            <span>
              No real money will be processed. All GCash, Maya, cards, and COD are simulated for evaluation.
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Destination Details */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Delivery Address</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                Verified Area
              </span>
            </div>
            <div>
              <p className="font-semibold text-slate-900">
                {selectedAddress.building || selectedAddress.street}
              </p>
              <p className="text-[11px] text-slate-500">
                {selectedAddress.unitNumber ? `${selectedAddress.unitNumber}, ` : ''}{selectedAddress.street}, Brgy. {selectedAddress.barangay}, {selectedAddress.city}
              </p>
              {selectedAddress.instructions && (
                <p className="mt-1 text-[11px] text-slate-600 bg-white border border-slate-200 p-1.5 rounded">
                  <strong>Instructions: </strong> {selectedAddress.instructions}
                </p>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Philippine Payment Method
            </h4>

            <div className="space-y-2">
              {paymentOptions.map((opt) => {
                const isSelected = paymentMethod === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                        {opt.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{opt.name}</span>
                          {opt.badge && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">{opt.description}</p>
                      </div>
                    </div>

                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Note to Rider / Store (Optional)
            </label>
            <input
              type="text"
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="e.g. Call upon reaching lobby, gate code is 1234..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Order Summary Confirmation */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Items ({cart.length})</span>
              <span>₱{subtotal}</span>
            </div>
            {voucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Voucher</span>
                <span>-₱{voucherDiscount}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Delivery & Service Fee</span>
              <span>₱{deliveryFee + serviceFee + smallOrderFee}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Rider Tip</span>
                <span>₱{tipAmount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
              <span>Total Payment</span>
              <span className="text-emerald-700">₱{total}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="p-4 bg-white border-t border-slate-200">
          <button
            onClick={handlePlaceOrder}
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-between transition disabled:opacity-50"
          >
            <span>{isProcessing ? 'Processing simulated payment...' : `Place Order (₱${total})`}</span>
            <span className="text-[11px] bg-emerald-700 px-2 py-0.5 rounded font-mono uppercase">
              {paymentMethod}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
