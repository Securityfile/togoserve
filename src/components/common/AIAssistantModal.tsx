import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Sparkles,
  Send,
  Bot,
  ShoppingBag,
  Store,
  ShieldCheck,
  Loader2,
  ThumbsUp,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AIAssistantModal: React.FC = () => {
  const {
    isAIOpen,
    setIsAIOpen,
    aiTab,
    setAITab,
    products,
    merchants,
    orders,
    deliveryZones,
    supportTickets,
    codRecords,
    activeAIPlan,
    generateShoppingPlan,
    applyShoppingPlanToCart,
    setActiveAIPlan,
  } = useApp();

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<{ [tab: string]: ChatMessage[] }>({
    customer: [
      {
        id: 'msg_c1',
        sender: 'assistant',
        text: 'Mabuhay! I am your TOGO SERVE AI Assistant. Ask me to find dishes, check groceries, or track your active order!',
        timestamp: 'Just now',
      },
    ],
    merchant: [
      {
        id: 'msg_m1',
        sender: 'assistant',
        text: 'Hello Partner! I am your Store Advisor. I analyze real-time sales, inventory levels, and customer ratings for your branch.',
        timestamp: 'Just now',
      },
    ],
    operations: [
      {
        id: 'msg_o1',
        sender: 'assistant',
        text: 'Ops Copilot active. Monitoring active dispatch across Metro Manila zones, delayed SLA alerts, and COD remittances.',
        timestamp: 'Just now',
      },
    ],
  });

  if (!isAIOpen) return null;

  const currentMessages = messages[aiTab] || [];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt;
    if (!query.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => ({
      ...prev,
      [aiTab]: [...(prev[aiTab] || []), userMsg],
    }));

    setInputPrompt('');
    setLoading(true);

    try {
      // Check if this is a shopping/meal planning intent
      const isShoppingPlanIntent =
        aiTab === 'customer' &&
        (query.toLowerCase().includes('plan') ||
          query.toLowerCase().includes('dinner') ||
          query.toLowerCase().includes('budget') ||
          query.toLowerCase().includes('meal'));

      if (isShoppingPlanIntent) {
        await generateShoppingPlan(query, 1000);
      }

      // Build context according to current mode
      let context: any = {};
      if (aiTab === 'customer') {
        const activeOrder = orders.find(
          (o) => o.status !== 'completed' && o.status !== 'cancelled'
        );
        context = {
          availableMerchants: merchants.map((m) => ({
            name: m.name,
            category: m.category,
            rating: m.rating,
            deliveryFee: m.deliveryFee,
          })),
          sampleProducts: products.map((p) => ({
            name: p.name,
            price: p.price,
            category: p.category,
            isAvailable: p.isAvailable,
          })),
          activeOrder: activeOrder
            ? {
                orderNumber: activeOrder.orderNumber,
                status: activeOrder.status,
                merchant: activeOrder.merchantName,
                eta: activeOrder.estimatedDeliveryMinutes,
                rider: activeOrder.riderName,
                pin: activeOrder.deliveryPin,
              }
            : null,
        };
      } else if (aiTab === 'merchant') {
        context = {
          storeName: 'Kusina Filipina Heritage',
          inventory: products.slice(0, 5).map((p) => ({
            name: p.name,
            stock: p.stock,
            lowStockThreshold: p.lowStockThreshold,
            price: p.price,
          })),
          activeOrdersCount: orders.filter(
            (o) => o.merchantId === 'm1' && o.status !== 'completed'
          ).length,
          completedOrdersCount: orders.filter(
            (o) => o.merchantId === 'm1' && o.status === 'completed'
          ).length,
        };
      } else {
        context = {
          totalActiveOrders: orders.filter((o) => o.status !== 'completed').length,
          zones: deliveryZones.map((z) => ({
            name: z.name,
            riders: z.activeRiders,
            orders: z.activeOrders,
            status: z.status,
          })),
          openSupportTickets: supportTickets.filter((t) => t.status !== 'resolved')
            .length,
          pendingCODTotal: codRecords
            .filter((c) => c.status === 'pending_remittance')
            .reduce((sum, c) => sum + c.amount, 0),
        };
      }

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: aiTab,
          prompt: query,
          context,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Sorry, I could not complete that request.';

      const botMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => ({
        ...prev,
        [aiTab]: [...(prev[aiTab] || []), botMsg],
      }));
    } catch (err) {
      console.error(err);
      const fallbackMsg: ChatMessage = {
        id: 'bot_' + Date.now(),
        sender: 'assistant',
        text: 'Connection timed out. Based on local data: Chicken Inasal Solo (₱199) and Crispy Pata (₱550) are available at Kusina Filipina with delivery in 25-35 minutes.',
        timestamp: 'Just now',
      };
      setMessages((prev) => ({
        ...prev,
        [aiTab]: [...(prev[aiTab] || []), fallbackMsg],
      }));
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = {
    customer: [
      'Plan family dinner for 4 under ₱1,000',
      'Find chicken meals below ₱250',
      'Where is my order?',
      'Recommend breakfast groceries',
    ],
    merchant: [
      'Show my top selling products',
      'Which items are low in stock?',
      'Suggest a weekend promo for slow items',
    ],
    operations: [
      'Orders delayed > 20 mins',
      'Which zones have rider shortages?',
      'Summarize today COD collections',
    ],
  };

  const handleApplyPlan = () => {
    if (activeAIPlan) {
      applyShoppingPlanToCart(activeAIPlan);
      const confirmMsg: ChatMessage = {
        id: 'bot_cart_' + Date.now(),
        sender: 'assistant',
        text: `Sige po! Added ${activeAIPlan.items.length} items from your AI Shopping Plan to your cart (Total: ₱${activeAIPlan.estimatedTotal}). You can review and checkout whenever you are ready!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => ({
        ...prev,
        customer: [...(prev.customer || []), confirmMsg],
      }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-[85vh] max-h-[680px] rounded-2xl shadow-2xl flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm">TOGO AI Intelligence</h3>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono font-medium">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-[11px] text-emerald-100">Grounded in real Philippine marketplace data</p>
            </div>
          </div>
          <button
            onClick={() => setIsAIOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setAITab('customer')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
              aiTab === 'customer'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer Copilot</span>
          </button>

          <button
            onClick={() => setAITab('merchant')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
              aiTab === 'merchant'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Merchant Advisor</span>
          </button>

          <button
            onClick={() => setAITab('operations')}
            className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 transition ${
              aiTab === 'operations'
                ? 'border-b-2 border-emerald-600 text-emerald-700 bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ops & Dispatch</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {currentMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                  AI
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {msg.text}
                <div
                  className={`mt-1 text-[10px] text-right ${
                    msg.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-3 rounded-2xl w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>Analyzing TOGO SERVE Philippine data...</span>
            </div>
          )}

          {/* Interactive AI Shopping Plan Card */}
          {aiTab === 'customer' && activeAIPlan && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-300 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-emerald-950">AI Curated Meal & Shopping Plan</h5>
                    <p className="text-[10px] text-emerald-700">Intent: &quot;{activeAIPlan.intent}&quot;</p>
                  </div>
                </div>

                <span className="text-[10px] font-bold bg-emerald-200/60 text-emerald-900 px-2 py-0.5 rounded-full">
                  Level 3 Autonomy
                </span>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeAIPlan.items.map((it, idx) => (
                  <div
                    key={idx}
                    className="bg-white/90 border border-emerald-100 rounded-xl p-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-800">
                        {it.quantity}x {it.name}
                      </div>
                      <div className="text-[10px] text-slate-500">{it.merchantName} • {it.rationale}</div>
                    </div>
                    <div className="font-bold text-emerald-800 text-right shrink-0 ml-2">
                      ₱{it.price * it.quantity}
                    </div>
                  </div>
                ))}
              </div>

              {/* Budget Comparison & Approval Notice */}
              <div className="bg-white/80 rounded-xl p-2.5 border border-emerald-100 text-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Total:</span>
                  <span className="font-black text-sm text-emerald-800">₱{activeAIPlan.estimatedTotal}</span>
                  {activeAIPlan.budgetCap && (
                    <span className="text-[10px] text-slate-500 ml-1.5">
                      (Cap: ₱{activeAIPlan.budgetCap})
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-emerald-700 max-w-[200px] text-right font-medium">
                  {activeAIPlan.notes}
                </div>
              </div>

              {/* Interactive Approval Action */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  onClick={() => setActiveAIPlan(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  Dismiss Plan
                </button>
                <button
                  onClick={handleApplyPlan}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Approve & Add All to Cart</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {samplePrompts[aiTab].map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-full whitespace-nowrap transition border border-slate-200/60"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={`Ask ${aiTab === 'customer' ? 'about food, groceries or delivery...' : aiTab === 'merchant' ? 'about stock, sales or promos...' : 'about dispatch, delayed orders or COD...'}`}
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputPrompt.trim() || loading}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
