import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomerHome } from './CustomerHome';
import { MerchantStorefront } from './MerchantStorefront';
import { CartDrawer } from './CartDrawer';
import { CheckoutModal } from './CheckoutModal';
import { LiveTrackingView } from './LiveTrackingView';
import { PackageDelivery } from './PackageDelivery';
import { CustomerAccount } from './CustomerAccount';
import { AddressSelectorModal } from './AddressSelectorModal';
import { Order } from '../../types';
import {
  ShoppingBag,
  Store,
  Clock,
  User,
  Package,
  Home,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

export const CustomerApp: React.FC = () => {
  const {
    cart,
    selectedAddress,
    setSelectedAddress,
    orders,
    createSupportTicket,
  } = useApp();

  const [currentTab, setCurrentTab] = useState<'home' | 'storefront' | 'padala' | 'tracking' | 'account'>('home');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('m1');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState<string | undefined>();

  // Find if there is any active order to show quick tracking badge
  const activeOrder = orders.find(
    (o) =>
      o.status !== 'completed' &&
      o.status !== 'cancelled' &&
      o.status !== 'refunded'
  );

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartAmount = cart.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSelectMerchant = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    setCurrentTab('storefront');
  };

  const handleOrderPlaced = (order: Order) => {
    setTrackingOrderId(order.id);
    setCurrentTab('tracking');
  };

  const handleOpenSupport = (orderNumber: string) => {
    createSupportTicket({
      orderId: orderNumber,
      customerName: 'Maria Santos',
      category: 'Late Delivery',
      priority: 'medium',
      status: 'investigating',
      assignedAgent: 'Support Desk 1',
      description: `Customer requested help regarding order ${orderNumber}.`,
    });
    alert(`Support ticket created for order ${orderNumber}! Operations desk notified.`);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* Sub-navigation bar */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2 py-2">
            <button
              onClick={() => setCurrentTab('home')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'home'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => setCurrentTab('padala')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'padala'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>TOGO Padala</span>
            </button>

            {activeOrder && (
              <button
                onClick={() => {
                  setTrackingOrderId(activeOrder.id);
                  setCurrentTab('tracking');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition relative ${
                  currentTab === 'tracking'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-100/70 text-emerald-900 hover:bg-emerald-200/80'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Clock className="w-3.5 h-3.5" />
                <span>Live Track ({activeOrder.orderNumber})</span>
              </button>
            )}

            <button
              onClick={() => setCurrentTab('account')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                currentTab === 'account'
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Account & Orders</span>
            </button>
          </div>

          {/* Quick Cart Trigger */}
          {totalCartCount > 0 && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs transition"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>₱{totalCartAmount}</span>
              <span className="bg-emerald-700 px-1.5 py-0.2 rounded-md font-mono text-[11px]">
                {totalCartCount}
              </span>
            </button>
          )}
        </div>
      </nav>

      {/* Main View Switcher */}
      <main>
        {currentTab === 'home' && (
          <CustomerHome
            onSelectMerchant={handleSelectMerchant}
            onOpenAddressSelector={() => setIsAddressModalOpen(true)}
            onSelectServiceTab={(tab) => {
              if (tab === 'padala') setCurrentTab('padala');
            }}
          />
        )}

        {currentTab === 'storefront' && (
          <MerchantStorefront
            merchantId={selectedMerchantId}
            onBack={() => setCurrentTab('home')}
            onOpenCart={() => setIsCartOpen(true)}
          />
        )}

        {currentTab === 'padala' && (
          <PackageDelivery
            onOrderCreated={(order) => {
              setTrackingOrderId(order.id);
              setCurrentTab('tracking');
            }}
          />
        )}

        {currentTab === 'tracking' && (
          <LiveTrackingView
            orderId={trackingOrderId}
            onBackToHome={() => setCurrentTab('home')}
            onOpenSupport={handleOpenSupport}
          />
        )}

        {currentTab === 'account' && (
          <CustomerAccount
            onTrackOrder={(id) => {
              setTrackingOrderId(id);
              setCurrentTab('tracking');
            }}
            onOpenAddressSelector={() => setIsAddressModalOpen(true)}
          />
        )}
      </main>

      {/* Persistent Floating Cart Action Button on Mobile/Desktop if items exist and cart is closed */}
      {totalCartCount > 0 && !isCartOpen && currentTab !== 'tracking' && (
        <div className="fixed bottom-6 right-6 z-30 animate-in fade-in">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 font-bold text-sm transition hover:scale-105"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartCount}
              </span>
            </div>
            <span>View Basket • ₱{totalCartAmount}</span>
          </button>
        </div>
      )}

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onProceedCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onOpenAddressSelector={() => setIsAddressModalOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      <AddressSelectorModal
        isOpen={isAddressModalOpen}
        currentAddress={selectedAddress}
        onSelectAddress={(addr) => setSelectedAddress(addr)}
        onClose={() => setIsAddressModalOpen(false)}
      />
    </div>
  );
};
