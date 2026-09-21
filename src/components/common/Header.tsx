import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Bot,
  Sliders,
  Sparkles,
  MapPin,
  ChevronDown,
  Crown,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    role,
    setRole,
    selectedAddress,
    cart,
    isTogoServePlusMember,
    setIsDemoControlOpen,
    setIsAIOpen,
    riderProfile,
    toggleRiderOnline,
  } = useApp();

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Mode & Philippine Brand Bar */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-semibold text-emerald-400">DEMO & SIMULATION MODE</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-300 hidden sm:inline">
            Philippine Multi-Vendor Marketplace • No real money processed
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isTogoServePlusMember && role === 'customer' && (
            <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full text-[11px] font-medium">
              <Crown className="w-3 h-3 text-amber-400" />
              TOGO SERVE+ Active
            </span>
          )}

          <button
            onClick={() => setIsDemoControlOpen(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded font-semibold text-xs transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Demo Control Center</span>
          </button>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setRole('customer')}
            className="flex items-center gap-2 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  TOGO<span className="text-emerald-600">SERVE</span>
                </span>
                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  PH
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">Delivery & Commerce</p>
            </div>
          </div>

          {/* Customer Delivery Address Chip (Visible only for customer) */}
          {role === 'customer' && (
            <div className="hidden md:flex items-center gap-2 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 px-3 py-1.5 rounded-full text-xs text-slate-700 transition max-w-[280px]">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-900">Deliver to: </span>
                <span>{selectedAddress.barangay}, {selectedAddress.city}</span>
              </div>
            </div>
          )}
        </div>

        {/* Center: Environment / Role Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
          <button
            onClick={() => setRole('customer')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              role === 'customer'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>

          <button
            onClick={() => setRole('merchant')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              role === 'merchant'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant</span>
          </button>

          <button
            onClick={() => setRole('rider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              role === 'rider'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span>Rider</span>
          </button>

          <button
            onClick={() => setRole('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
              role === 'admin'
                ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* AI Copilot Trigger */}
          <button
            onClick={() => setIsAIOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-3 py-1.5 rounded-xl font-medium text-xs shadow-sm shadow-emerald-500/20 transition"
          >
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-amber-300" />
            <span className="hidden sm:inline">AI Copilot</span>
          </button>

          {/* Role specific quick action */}
          {role === 'rider' && (
            <button
              onClick={toggleRiderOnline}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition border ${
                riderProfile.isOnline
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  riderProfile.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span>{riderProfile.isOnline ? 'Online' : 'Offline'}</span>
            </button>
          )}

          {role === 'customer' && (
            <div className="flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span>₱</span>
              <span className="ml-0.5">{totalCartItems > 0 ? `${totalCartItems} in Cart` : 'Cart Empty'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
