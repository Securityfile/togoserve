import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Merchant, Product, OrderItem } from '../../types';
import { ProductCustomizerModal } from './ProductCustomizerModal';
import {
  Star,
  Clock,
  Bike,
  MapPin,
  Tag,
  Search,
  Plus,
  Heart,
  Share2,
  Info,
  Crown,
} from 'lucide-react';

interface MerchantStorefrontProps {
  merchantId: string;
  onBack: () => void;
  onOpenCart: () => void;
}

export const MerchantStorefront: React.FC<MerchantStorefrontProps> = ({
  merchantId,
  onBack,
  onOpenCart,
}) => {
  const {
    merchants,
    products,
    addToCart,
    cart,
    savedFavorites,
    toggleFavorite,
    isTogoServePlusMember,
  } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const merchant = merchants.find((m) => m.id === merchantId) || merchants[0];
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  const categories = [
    'All',
    ...Array.from(new Set(merchantProducts.map((p) => p.category))),
  ];

  const filteredProducts = merchantProducts.filter((p) => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isFav = savedFavorites.includes(merchant.id);
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Navigation & Action Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition"
        >
          ← Back to Merchants
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(merchant.id)}
            className={`p-2 rounded-xl border transition ${
              isFav
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
          </button>

          {totalCartCount > 0 && (
            <button
              onClick={onOpenCart}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <span>View Basket</span>
              <span className="bg-emerald-700 px-1.5 py-0.2 rounded-md font-mono">
                {totalCartCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Cover & Info */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {/* Banner Cover */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-800">
          <img
            src={merchant.coverImage}
            alt={merchant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

          {/* Logo badge */}
          <div className="absolute bottom-4 left-6 flex items-end gap-3.5">
            <img
              src={merchant.logo}
              alt="Logo"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-md bg-white"
            />
            <div className="text-white">
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {merchant.category}
                </span>
                {merchant.isTogoServePlus && (
                  <span className="text-[11px] bg-amber-400 text-slate-950 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    TOGO SERVE+
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                {merchant.name}
              </h1>
              <p className="text-xs text-slate-300 font-medium">
                {merchant.cuisine} • {merchant.address}, {merchant.city}
              </p>
            </div>
          </div>
        </div>

        {/* Store Metrics Bar */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1 font-bold text-slate-900">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span>{merchant.rating}</span>
              <span className="text-slate-400 font-normal">({merchant.reviewCount}+ reviews)</span>
            </div>

            <div className="flex items-center gap-1 text-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} mins</span>
            </div>

            <div className="flex items-center gap-1 text-slate-700">
              <Bike className="w-4 h-4 text-slate-400" />
              <span>
                {isTogoServePlusMember ? (
                  <strong className="text-emerald-700">₱0 Delivery (Member)</strong>
                ) : (
                  `₱${merchant.deliveryFee} Delivery`
                )}
              </span>
            </div>

            <div className="text-slate-500">
              Min. order <strong>₱{merchant.minOrder}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-emerald-700">Open Now</span>
            <span className="text-slate-400">({merchant.openingHours})</span>
          </div>
        </div>

        {/* Active Store Promos */}
        {merchant.promotions.length > 0 && (
          <div className="px-5 py-3 bg-amber-50/60 border-t border-amber-100/80 flex items-center gap-2 overflow-x-auto text-xs text-amber-900">
            <Tag className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="font-bold text-[11px] uppercase tracking-wide shrink-0">
              Deals:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {merchant.promotions.map((promo, i) => (
                <span
                  key={i}
                  className="bg-white border border-amber-200 px-2.5 py-0.5 rounded-full font-medium text-[11px] whitespace-nowrap shadow-2xs"
                >
                  {promo}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Catalog Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search inside menu */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search this menu..."
            className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-3.5 flex gap-3 cursor-pointer shadow-2xs hover:shadow-md transition group"
          >
            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  {product.isPopular && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold uppercase">
                      Popular
                    </span>
                  )}
                  <span className="text-[11px] text-slate-400">{product.category}</span>
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition line-clamp-2 mt-0.5">
                  {product.name}
                </h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                  ₱{product.price}
                </span>
                <span className="w-7 h-7 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white flex items-center justify-center transition">
                  <Plus className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Product Image */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Product Customizer Modal */}
      <ProductCustomizerModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(item) => {
          addToCart(item);
        }}
      />
    </div>
  );
};
