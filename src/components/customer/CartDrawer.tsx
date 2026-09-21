import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Tag,
  Check,
  Bike,
  Store,
  MapPin,
  Sparkles,
  Crown,
  ChevronRight,
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedCheckout: () => void;
  onOpenAddressSelector: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onProceedCheckout,
  onOpenAddressSelector,
}) => {
  const {
    cart,
    updateCartItemQty,
    removeFromCart,
    clearCart,
    voucher,
    applyVoucher,
    removeVoucher,
    deliveryTip,
    setDeliveryTip,
    deliveryType,
    setDeliveryType,
    selectedAddress,
    isTogoServePlusMember,
    merchants,
  } = useApp();

  const [voucherInput, setVoucherInput] = useState('');
  const [voucherMsg, setVoucherMsg] = useState<{ text: string; isError: boolean } | null>(null);

  if (!isOpen) return null;

  const firstCartItem = cart[0];
  const merchant = firstCartItem
    ? merchants.find((m) => m.id === 'm1') || merchants[0]
    : merchants[0];

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const voucherDiscount = voucher ? voucher.discount : 0;
  const isFreeDelivery = isTogoServePlusMember && subtotal >= 300;
  const deliveryFee = deliveryType === 'pickup' ? 0 : isFreeDelivery ? 0 : merchant.deliveryFee;
  const serviceFee = cart.length > 0 ? 15 : 0;
  const smallOrderFee = subtotal > 0 && subtotal < merchant.minOrder ? 30 : 0;
  const tipAmount = deliveryType === 'pickup' ? 0 : deliveryTip;
  const total = Math.max(0, subtotal - voucherDiscount + deliveryFee + serviceFee + smallOrderFee + tipAmount);

  const handleApplyVoucher = () => {
    if (!voucherInput.trim()) return;
    const res = applyVoucher(voucherInput);
    setVoucherMsg({ text: res.message, isError: !res.success });
    if (res.success) setVoucherInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Your Basket</h3>
              <p className="text-[11px] text-slate-500">
                {cart.length > 0 ? `${cart.length} item type(s)` : 'Empty'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-sm text-slate-800">Your cart is empty</h4>
            <p className="text-xs text-slate-500 max-w-xs">
              Explore restaurants, groceries, and convenience stores in Metro Manila and add items to your basket.
            </p>
            <button
              onClick={onClose}
              className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
            >
              Browse Merchants
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Delivery vs Pickup Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-medium border border-slate-200">
              <button
                onClick={() => setDeliveryType('delivery')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  deliveryType === 'delivery'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Bike className="w-3.5 h-3.5" />
                <span>Delivery (25-35 min)</span>
              </button>
              <button
                onClick={() => setDeliveryType('pickup')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  deliveryType === 'pickup'
                    ? 'bg-white text-emerald-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Self-Pickup</span>
              </button>
            </div>

            {/* Delivery Address Bar */}
            {deliveryType === 'delivery' && (
              <div
                onClick={onOpenAddressSelector}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 text-xs flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="truncate">
                    <p className="font-bold text-slate-900">
                      {selectedAddress.building || selectedAddress.street}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedAddress.barangay}, {selectedAddress.city}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            )}

            {/* TOGO SERVE+ Perk Banner */}
            {isTogoServePlusMember && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-900">
                <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold">TOGO SERVE+ Member: </span>
                  <span>₱0 Delivery applied on orders above ₱300</span>
                </div>
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Order Items</span>
                <button
                  onClick={clearCart}
                  className="text-slate-400 hover:text-rose-600 text-[11px] font-medium"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2.5">
                {cart.map((item, index) => (
                  <div
                    key={item.id + index}
                    className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <h5 className="font-bold text-slate-900">{item.name}</h5>
                      <p className="text-emerald-700 font-semibold mt-0.5">
                        ₱{item.totalPrice}
                      </p>

                      {/* Display Selected Modifiers */}
                      {item.selectedOptions && Object.keys(item.selectedOptions).length > 0 && (
                        <div className="mt-1 space-y-0.5 text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-md">
                          {Object.entries(item.selectedOptions).map(([k, v]) => (
                            <div key={k}>
                              <span className="font-medium text-slate-700">{k}: </span>
                              <span>{Array.isArray(v) ? v.join(', ') : v}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <p className="mt-1 text-[11px] text-amber-700 italic">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 shrink-0">
                      <button
                        onClick={() => updateCartItemQty(index, -1)}
                        className="w-6 h-6 rounded bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        {item.quantity === 1 ? (
                          <Trash2 className="w-3 h-3 text-rose-500" />
                        ) : (
                          <Minus className="w-3 h-3" />
                        )}
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-slate-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartItemQty(index, 1)}
                        className="w-6 h-6 rounded bg-white shadow-xs flex items-center justify-center text-slate-600 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voucher Section */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
                <span>Promo Code / Voucher</span>
              </label>

              {voucher ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Code <strong>{voucher.code}</strong> applied (-₱{voucher.discount})</span>
                  </div>
                  <button
                    onClick={removeVoucher}
                    className="text-rose-600 hover:text-rose-800 text-[11px] underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherInput}
                    onChange={(e) => setVoucherInput(e.target.value)}
                    placeholder="Try PINOY50, TOGOPLUS, PINOY100"
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={handleApplyVoucher}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 rounded-xl transition"
                  >
                    Apply
                  </button>
                </div>
              )}

              {voucherMsg && (
                <p
                  className={`text-[11px] mt-1 ${
                    voucherMsg.isError ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {voucherMsg.text}
                </p>
              )}
            </div>

            {/* Tip Rider Section (Delivery only) */}
            {deliveryType === 'delivery' && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Tip your Rider</span>
                  <span className="text-slate-500 text-[11px]">100% goes to Kuya Rider</span>
                </div>
                <div className="flex gap-1.5">
                  {[0, 20, 30, 50, 100].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDeliveryTip(amt)}
                      className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        deliveryTip === amt
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {amt === 0 ? 'None' : `₱${amt}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Transparent Breakdown */}
            <div className="space-y-1.5 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₱{subtotal}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Voucher Discount ({voucher?.code})</span>
                  <span>-₱{voucherDiscount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                {deliveryFee === 0 ? (
                  <span className="font-semibold text-emerald-600">FREE</span>
                ) : (
                  <span className="font-semibold text-slate-900">₱{deliveryFee}</span>
                )}
              </div>

              <div className="flex justify-between">
                <span>Platform Service Fee</span>
                <span className="font-semibold text-slate-900">₱{serviceFee}</span>
              </div>

              {smallOrderFee > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Small Order Fee (under ₱{merchant.minOrder})</span>
                  <span>₱{smallOrderFee}</span>
                </div>
              )}

              {deliveryType === 'delivery' && deliveryTip > 0 && (
                <div className="flex justify-between">
                  <span>Rider Tip</span>
                  <span className="font-semibold text-slate-900">₱{deliveryTip}</span>
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Taxes & VAT</span>
                <span>Included</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Total Due</span>
                <span className="text-emerald-700">₱{total}</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Checkout Trigger */}
        {cart.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200">
            <button
              onClick={() => {
                onClose();
                onProceedCheckout();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-between transition"
            >
              <span>Review Payment & Checkout</span>
              <span>₱{total}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
