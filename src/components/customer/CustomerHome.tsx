import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MerchantCategory, Merchant } from '../../types';
import {
  Search,
  MapPin,
  Star,
  Clock,
  Bike,
  Crown,
  ChevronRight,
  Utensils,
  ShoppingCart,
  Zap,
  Pill,
  ShoppingBag,
  Flower2,
  Cat,
  Package,
  Heart,
  Tag,
  Sparkles,
} from 'lucide-react';

interface CustomerHomeProps {
  onSelectMerchant: (merchantId: string) => void;
  onOpenAddressSelector: () => void;
  onSelectServiceTab: (tab: string) => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onSelectMerchant,
  onOpenAddressSelector,
  onSelectServiceTab,
}) => {
  const {
    merchants,
    products,
    selectedAddress,
    isTogoServePlusMember,
    setIsTogoServePlusMember,
    savedFavorites,
    toggleFavorite,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [filterQuickDelivery, setFilterQuickDelivery] = useState(false);
  const [filterFreeDelivery, setFilterFreeDelivery] = useState(false);
  const [filterHighRated, setFilterHighRated] = useState(false);

  const serviceCategories = [
    { id: 'food', name: 'Restaurants', icon: <Utensils className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50' },
    { id: 'groceries', name: 'Groceries', icon: <ShoppingCart className="w-5 h-5 text-emerald-600" />, bg: 'bg-emerald-50' },
    { id: 'convenience', name: 'Convenience', icon: <Zap className="w-5 h-5 text-amber-600" />, bg: 'bg-amber-50' },
    { id: 'pharmacy', name: 'Pharmacy', icon: <Pill className="w-5 h-5 text-rose-600" />, bg: 'bg-rose-50' },
    { id: 'padala', name: 'TOGO Padala', icon: <Package className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50' },
    { id: 'retail', name: 'Retail', icon: <ShoppingBag className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50' },
    { id: 'flowers', name: 'Flowers', icon: <Flower2 className="w-5 h-5 text-pink-600" />, bg: 'bg-pink-50' },
    { id: 'pets', name: 'Pet Care', icon: <Cat className="w-5 h-5 text-amber-700" />, bg: 'bg-amber-50' },
  ];

  const filteredMerchants = merchants.filter((m) => {
    const matchesCategory =
      activeCategory === 'all' ||
      m.category.toLowerCase() === activeCategory.toLowerCase();

    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.cuisine || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesQuick = !filterQuickDelivery || m.deliveryTimeMax <= 30;
    const matchesFree = !filterFreeDelivery || m.deliveryFee === 0 || m.isTogoServePlus;
    const matchesRating = !filterHighRated || m.rating >= 4.8;

    return matchesCategory && matchesSearch && matchesQuick && matchesFree && matchesRating;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Search & Location Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Address Selector Trigger */}
        <div
          onClick={onOpenAddressSelector}
          className="w-full md:w-auto flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer text-xs shrink-0 transition"
        >
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 block leading-none">
              Deliver To
            </span>
            <span className="font-bold text-slate-800 truncate max-w-[170px] block">
              {selectedAddress.barangay}, {selectedAddress.city}
            </span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </div>

        {/* Global Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search adobo, sinigang, milk tea, supermarket goods, medicine..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Promotional Banners Carousel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Banner 1: Filipino Flavors */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-600 to-orange-700 text-white p-5 flex flex-col justify-between h-40 shadow-sm">
          <div className="relative z-10">
            <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full uppercase tracking-wider">
              PINOY FIESTA
            </span>
            <h3 className="text-lg font-black mt-1 leading-tight">
              20% OFF Filipino Cuisine
            </h3>
            <p className="text-xs text-amber-100 mt-1">Use voucher code: PINOY50</p>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold underline cursor-pointer">Order Inasal & Pata</span>
            <span className="text-2xl">🍗</span>
          </div>
        </div>

        {/* Banner 2: TOGO SERVE+ */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-teal-900 text-white p-5 flex flex-col justify-between h-40 shadow-sm">
          <div className="relative z-10">
            <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
              <Crown className="w-3 h-3" />
              TOGO SERVE+
            </span>
            <h3 className="text-lg font-black mt-1 leading-tight">
              Unlimited ₱0 Delivery
            </h3>
            <p className="text-xs text-emerald-100 mt-1">
              {isTogoServePlusMember ? 'Active on your account!' : 'Only ₱149 / month'}
            </p>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <button
              onClick={() => setIsTogoServePlusMember(!isTogoServePlusMember)}
              className="bg-white text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-xl shadow-xs hover:bg-emerald-50 transition"
            >
              {isTogoServePlusMember ? 'Manage Membership' : 'Try Free Trial'}
            </button>
            <span className="text-2xl">✨</span>
          </div>
        </div>

        {/* Banner 3: TOGO Padala */}
        <div
          onClick={() => onSelectServiceTab('padala')}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 flex flex-col justify-between h-40 shadow-sm cursor-pointer group"
        >
          <div className="relative z-10">
            <span className="text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              PADALA EXPRESS
            </span>
            <h3 className="text-lg font-black mt-1 leading-tight group-hover:text-emerald-400 transition">
              Same-Day On-Demand Courier
            </h3>
            <p className="text-xs text-slate-300 mt-1">Send parcels anywhere in Metro Manila from ₱60</p>
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span>Book Padala</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
            <span className="text-2xl">🏍️</span>
          </div>
        </div>
      </div>

      {/* Services Grid (8 Services) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Explore Services
          </h3>
          <span className="text-xs text-slate-400">Available in Taguig, Makati, Manila</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {serviceCategories.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (cat.id === 'padala') {
                    onSelectServiceTab('padala');
                  } else {
                    setActiveCategory(activeCategory === cat.id ? 'all' : cat.id);
                  }
                }}
                className={`p-3 rounded-2xl flex flex-col items-center text-center cursor-pointer transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 ${
                    isSelected ? 'bg-white/20' : cat.bg
                  }`}
                >
                  {cat.icon}
                </div>
                <span className="text-xs font-bold leading-tight line-clamp-1">
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
        <span className="font-bold text-slate-600 mr-1">Quick Filters:</span>

        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          All Stores ({merchants.length})
        </button>

        <button
          onClick={() => setFilterQuickDelivery(!filterQuickDelivery)}
          className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
            filterQuickDelivery
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          ⏱️ Under 30 mins
        </button>

        <button
          onClick={() => setFilterFreeDelivery(!filterFreeDelivery)}
          className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
            filterFreeDelivery
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          🛵 Free / Plus Delivery
        </button>

        <button
          onClick={() => setFilterHighRated(!filterHighRated)}
          className={`px-3 py-1.5 rounded-xl font-semibold border transition ${
            filterHighRated
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          ⭐ 4.8+ Top Rated
        </button>
      </div>

      {/* Merchants Catalog Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Popular Merchants Near You
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredMerchants.length} partner stores
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMerchants.map((merchant) => {
            const isFav = savedFavorites.includes(merchant.id);
            return (
              <div
                key={merchant.id}
                onClick={() => onSelectMerchant(merchant.id)}
                className="bg-white border border-slate-200 hover:border-emerald-400 rounded-2xl overflow-hidden shadow-2xs hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between"
              >
                {/* Cover Banner */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={merchant.coverImage}
                    alt={merchant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                  {/* Rating Tag */}
                  <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                    <span>{merchant.rating}</span>
                    <span className="text-slate-400 text-[10px]">({merchant.reviewCount})</span>
                  </div>

                  {/* Delivery Time Tag */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-xs font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    <span>{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</span>
                  </div>

                  {/* Favorite Toggle Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(merchant.id);
                    }}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-1.5 rounded-full text-slate-600 transition shadow-xs"
                  >
                    <Heart
                      className={`w-4 h-4 ${isFav ? 'fill-rose-500 text-rose-500' : ''}`}
                    />
                  </button>

                  {/* TOGO SERVE+ Badge */}
                  {merchant.isTogoServePlus && (
                    <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                      <Crown className="w-3 h-3" />
                      PLUS
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <img
                        src={merchant.logo}
                        alt="Logo"
                        className="w-6 h-6 rounded-lg object-cover border border-slate-200"
                      />
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition truncate">
                        {merchant.name}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                      {merchant.cuisine} • {merchant.address}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Bike className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {isTogoServePlusMember ? (
                          <strong className="text-emerald-700">₱0 Delivery</strong>
                        ) : (
                          `₱${merchant.deliveryFee} Delivery`
                        )}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      Min ₱{merchant.minOrder}
                    </span>
                  </div>

                  {merchant.promotions.length > 0 && (
                    <div className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-lg">
                      <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                      <span className="truncate">{merchant.promotions[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Filipino Dishes Spotlight */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
          Trending Filipino Favorites
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {products.slice(0, 4).map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectMerchant(item.merchantId)}
              className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition group shadow-2xs"
            >
              <div className="w-full h-28 rounded-xl overflow-hidden bg-slate-100 mb-2">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
              <div>
                <h5 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-emerald-700">
                  {item.name}
                </h5>
                <p className="text-[11px] text-slate-400 line-clamp-1">{item.category}</p>
              </div>
              <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 text-xs font-bold">
                <span className="text-slate-900">₱{item.price}</span>
                <span className="text-emerald-600 text-[11px]">View Menu →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
