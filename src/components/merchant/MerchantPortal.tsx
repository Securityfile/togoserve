import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, OrderStatus } from '../../types';
import {
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';

export const MerchantPortal: React.FC = () => {
  const {
    merchants,
    products,
    setProducts,
    orders,
    updateOrderStatus,
    updateProductStock,
    setIsAIOpen,
    setAITab,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'analytics' | 'finance' | 'settings'>('orders');
  const [storeStatus, setStoreStatus] = useState<'open' | 'busy' | 'closed'>('open');
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [prepTimeFilter, setPrepTimeFilter] = useState('20');
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  // New product form state
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Mains');
  const [newProdPrice, setNewProdPrice] = useState('250');
  const [newProdStock, setNewProdStock] = useState('20');
  const [newProdDesc, setNewProdDesc] = useState('');

  const merchant = merchants[0]; // Kusina Filipina Heritage
  const merchantOrders = orders.filter((o) => o.merchantId === merchant.id);
  const merchantProducts = products.filter((p) => p.merchantId === merchant.id);

  // Filter orders by stages
  const pendingOrders = merchantOrders.filter((o) => o.status === 'placed');
  const preparingOrders = merchantOrders.filter((o) => o.status === 'merchant_accepted' || o.status === 'preparing');
  const readyOrders = merchantOrders.filter((o) => o.status === 'ready_for_pickup');
  const onTheWayOrders = merchantOrders.filter((o) => o.status === 'on_the_way' || o.status === 'order_picked_up');
  const completedOrders = merchantOrders.filter((o) => o.status === 'completed');

  // Financial calculations
  const totalSales = merchantOrders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.subtotal, 0);
  const commissionFee = Math.round(totalSales * 0.15);
  const netEarnings = totalSales - commissionFee;

  const handleCreateProduct = () => {
    if (!newProdName.trim()) return;
    const priceVal = parseFloat(newProdPrice) || 199;
    const item: Product = {
      id: 'p_new_' + Date.now(),
      merchantId: merchant.id,
      name: newProdName,
      description: newProdDesc || 'Authentic Philippine specialty prepared fresh to order.',
      price: priceVal,
      sku: 'KF-NEW-' + Date.now(),
      costPrice: Math.round(priceVal * 0.5),
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      category: newProdCategory,
      isAvailable: true,
      stock: parseInt(newProdStock) || 20,
      lowStockThreshold: 5,
      isPopular: false,
    };
    setProducts((prev: Product[]) => [item, ...prev]);
    setShowAddProductModal(false);
    setNewProdName('');
    setNewProdDesc('');
  };

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20">
      {/* Merchant Header Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={merchant.logo}
              alt="Logo"
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">{merchant.name}</h2>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">
                  BGC Branch • Active POS
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Partner ID: MER-84920 • Average Prep: 18 mins • Rating: ⭐ {merchant.rating}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Store Status Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setStoreStatus('open')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  storeStatus === 'open'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ● Open
              </button>
              <button
                onClick={() => setStoreStatus('busy')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  storeStatus === 'busy'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Busy (+15m)
              </button>
              <button
                onClick={() => setStoreStatus('closed')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                  storeStatus === 'closed'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Closed
              </button>
            </div>

            {/* AI Advisor Trigger */}
            <button
              onClick={() => {
                setAITab('merchant');
                setIsAIOpen(true);
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Sub-nav Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-2 border-t border-slate-100 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'orders'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Live Kitchen Terminal</span>
            {pendingOrders.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-mono px-1.5 py-0.2 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'menu'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Catalog & Inventory ({merchantProducts.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'analytics'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3 px-3.5 border-b-2 flex items-center gap-1.5 transition ${
              activeTab === 'finance'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Payouts & Settlement</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* TAB 1: LIVE ORDERS KITCHEN TERMINAL */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* KPI Overview Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase">New Orders</span>
                <div className="text-2xl font-black text-rose-600 mt-1">{pendingOrders.length}</div>
                <p className="text-[10px] text-slate-500">Requires acceptance</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Preparing</span>
                <div className="text-2xl font-black text-amber-600 mt-1">{preparingOrders.length}</div>
                <p className="text-[10px] text-slate-500">In kitchen</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Ready for Pickup</span>
                <div className="text-2xl font-black text-emerald-600 mt-1">{readyOrders.length}</div>
                <p className="text-[10px] text-slate-500">Awaiting Kuya Dan</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
                <span className="text-[11px] text-slate-400 font-bold uppercase">Completed Today</span>
                <div className="text-2xl font-black text-slate-800 mt-1">{completedOrders.length}</div>
                <p className="text-[10px] text-slate-500">Total ₱{totalSales}</p>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Column 1: Incoming / Placed Orders */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rose-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                      Incoming Orders ({pendingOrders.length})
                    </h3>
                  </div>
                </div>

                {pendingOrders.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No incoming pending orders.
                  </div>
                ) : (
                  pendingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border-2 border-rose-400 rounded-2xl p-4 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <span className="text-rose-600 font-bold">New Order!</span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-800">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">{order.customerPhone}</p>
                      </div>

                      <div className="border-t border-b border-slate-100 py-2 space-y-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-bold text-slate-800">₱{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <p className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-lg italic">
                          "{order.notes}"
                        </p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'merchant_accepted')}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition"
                        >
                          Accept (Prep 20m)
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="px-3 bg-slate-100 hover:bg-slate-200 text-rose-600 font-bold text-xs py-2 rounded-xl transition"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Column 2: In Kitchen / Preparing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                      In Kitchen ({preparingOrders.length})
                    </h3>
                  </div>
                </div>

                {preparingOrders.length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    Kitchen is clear.
                  </div>
                ) : (
                  preparingOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-amber-300 rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                          Cooking...
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <p className="font-bold text-slate-800">{order.customerName}</p>
                        <p className="text-[11px] text-slate-500">
                          Pickup Code: <strong className="text-emerald-700 font-mono text-xs">{order.pickupCode}</strong>
                        </p>
                      </div>

                      <div className="border-t border-b border-slate-100 py-2 space-y-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-bold text-slate-800">₱{item.totalPrice}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'ready_for_pickup')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Food Ready for Rider Pickup</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Column 3: Ready for Pickup / Out for Delivery */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                      Pickup & Dispatched ({readyOrders.length + onTheWayOrders.length})
                    </h3>
                  </div>
                </div>

                {[...readyOrders, ...onTheWayOrders].length === 0 ? (
                  <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-400">
                    No active dispatches.
                  </div>
                ) : (
                  [...readyOrders, ...onTheWayOrders].map((order) => (
                    <div
                      key={order.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded capitalize">
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Pickup Code:</span>
                          <span className="font-mono font-black text-slate-900">{order.pickupCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Assigned Rider:</span>
                          <span className="font-semibold text-slate-800">{order.riderName || 'Finding Rider...'}</span>
                        </div>
                      </div>

                      {order.status === 'ready_for_pickup' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'order_picked_up')}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 rounded-xl transition"
                        >
                          Hand Over to Rider (Simulate Pickup)
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATALOG & INVENTORY MANAGEMENT */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Dish & Product Catalog
                </h3>
                <p className="text-xs text-slate-500">
                  Update stock availability, prices, and food descriptions in real-time.
                </p>
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Item</span>
              </button>
            </div>

            {/* Products Table */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Product</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Price</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5">In-Stock Toggle</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {merchantProducts.map((p) => {
                    const isLow = p.stock <= p.lowStockThreshold;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900">{p.name}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-medium">{p.category}</td>
                        <td className="p-3.5 font-bold text-slate-900">₱{p.price}</td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateProductStock(p.id, Math.max(0, p.stock - 1))}
                              className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                            >
                              -
                            </button>
                            <span className={`font-mono font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                              {p.stock}
                            </span>
                            <button
                              onClick={() => updateProductStock(p.id, p.stock + 1)}
                              className="w-6 h-6 rounded bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                            >
                              +
                            </button>
                            {isLow && (
                              <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                                Low
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => updateProductStock(p.id, p.stock > 0 ? 0 : 25)}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                              p.stock > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {p.stock > 0 ? 'Available' : 'Out of Stock (86)'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => alert(`Editing ${p.name}`)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SALES & ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Gross Revenue (Today)</span>
                <div className="text-3xl font-black text-slate-900 mt-2">₱{totalSales}</div>
                <p className="text-xs text-emerald-600 font-semibold mt-1">↑ 18.4% vs yesterday</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Average Ticket Size</span>
                <div className="text-3xl font-black text-slate-900 mt-2">
                  ₱{merchantOrders.length > 0 ? Math.round(totalSales / merchantOrders.length) : 340}
                </div>
                <p className="text-xs text-slate-500 mt-1">Across all order types</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <span className="text-xs text-slate-400 font-bold uppercase">Store Rating Score</span>
                <div className="text-3xl font-black text-amber-500 mt-2">4.92 ★</div>
                <p className="text-xs text-slate-500 mt-1">Based on 1,248 verified customer ratings</p>
              </div>
            </div>

            {/* AI Advisor Card */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
                    Gemini AI Revenue Recommendation
                  </span>
                </div>
                <h4 className="text-base font-bold">
                  Boost your lunch peak: Create a "Crispy Pata + 4 Garlic Rice" family bundle
                </h4>
                <p className="text-xs text-slate-300 max-w-xl">
                  Historical orders between 11:30 AM and 1:30 PM in BGC Taguig show 42% higher basket conversion for office sharing bundles.
                </p>
              </div>
              <button
                onClick={() => {
                  setAITab('merchant');
                  setIsAIOpen(true);
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition shrink-0"
              >
                Ask Gemini Advisor
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUTS & SETTLEMENT */}
        {activeTab === 'finance' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Settlements & Payout Ledger
                  </h3>
                  <p className="text-xs text-slate-500">
                    Daily automatic batch transfer to designated Philippine commercial bank.
                  </p>
                </div>

                <button
                  onClick={() => alert('Simulated early settlement requested! Payout dispatched via InstaPay.')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
                >
                  Request Early InstaPay Settlement
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Gross Food Sales</span>
                  <p className="text-xl font-black text-slate-900">₱{totalSales}</p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-slate-400 font-bold uppercase">Platform Commission (15%)</span>
                  <p className="text-xl font-black text-rose-600">-₱{commissionFee}</p>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-emerald-700 font-bold uppercase">Net Merchant Payout</span>
                  <p className="text-xl font-black text-emerald-800">₱{netEarnings}</p>
                </div>
              </div>

              {/* Bank Account Info */}
              <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block">Designated Settlement Account</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">
                    Banco de Oro (BDO) • Current Account
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    Account: 0048-2910-4821 • Beneficiary: Kusina Filipina Corp.
                  </p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[11px]">
                  Verified BDO
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">Add New Dish / Product</h4>
              <button onClick={() => setShowAddProductModal(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. Sizzling Sisig with Egg"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                  >
                    <option>Chef Specials</option>
                    <option>Heritage Mains</option>
                    <option>Merienda & Snacks</option>
                    <option>Desserts & Drinks</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (₱) *</label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ingredients, taste profile, spice level..."
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Initial Daily Stock</label>
                <input
                  type="number"
                  value={newProdStock}
                  onChange={(e) => setNewProdStock(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleCreateProduct}
              className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-xs transition"
            >
              Publish Item to Menu
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
