import React from 'react';
import {
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
  Bot,
  Package,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Building2,
  Heart,
  Pill,
  ShoppingBasket,
  Coffee,
  Flower2,
  Dog,
  Shirt,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface PublicLandingPageProps {
  onNavigateToLogin: () => void;
}

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onNavigateToLogin }) => {
  const categories = [
    {
      name: 'Restaurants & Dining',
      icon: Coffee,
      desc: 'Traditional Filipino heritage recipes, inasal, regional cuisines & modern dining',
      badge: 'Food & Beverage',
    },
    {
      name: 'Supermarket & Groceries',
      icon: ShoppingBasket,
      desc: 'Fresh produce, wet market staples, pantry items with weight-based pricing',
      badge: 'Fresh Essentials',
    },
    {
      name: '24/7 Convenience',
      icon: Store,
      desc: 'Late-night snacks, ready-to-eat meals, quick-grab beverages & household essentials',
      badge: 'Fast Delivery',
    },
    {
      name: 'Pharmacy & Health',
      icon: Pill,
      desc: 'Over-the-counter wellness, vitamins, prescription medication upload & verification',
      badge: 'FDA Validated',
    },
    {
      name: 'Retail & Lifestyle',
      icon: Shirt,
      desc: 'Filipino urbanwear, canvas tote bags, accessories & lifestyle apparel',
      badge: 'Apparel',
    },
    {
      name: 'Dangwa Florals & Gifts',
      icon: Flower2,
      desc: 'Handcrafted fresh floral bouquets, special occasion arrangements & message cards',
      badge: 'Floristry',
    },
    {
      name: 'Pet Care & Nutrition',
      icon: Dog,
      desc: 'Veterinary nutrition, dog & cat treats, grooming accessories & supplements',
      badge: 'Pet Depot',
    },
    {
      name: 'TOGO Padala Logistics',
      icon: Truck,
      desc: 'On-demand volumetric parcel delivery, vehicle matching (Motorcycle to Van), e-POD',
      badge: 'Express Courier',
    },
  ];

  const agentHighlights = [
    {
      title: 'Customer AI Agent',
      desc: 'Intelligent Filipino dietary shopping assistant. Searches live menus, recommends budget family meal baskets, tracks order milestones, and explains delivery status.',
      icon: Bot,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Business AI Agent',
      desc: 'Autonomous inventory stock-out forecasting, dynamic pricing advisor, and menu performance analyzer for restaurant and supermarket partners.',
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Dispatch & Logistics Agent',
      desc: 'Telematics route optimizer, vehicle fleet load calculation, proximity-based rider allocation, and multi-waypoint transit modeling across Metro Manila.',
      icon: Truck,
      color: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Governance & HITL Orchestrator',
      desc: 'Human-in-the-Loop policy mesh enforcing strict guardrails. High-risk financial disbursements and price escalations require supervisor queue confirmation.',
      icon: ShieldCheck,
      color: 'from-rose-500 to-red-600',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Public Navbar */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-emerald-500/20">
              T
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  TOGO<span className="text-emerald-400">SERVE</span>
                </span>
                <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  PH
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                AI-Native Commerce & Logistics Platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Development Baseline</span>
            </div>

            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enter Platform / Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-950/40 via-slate-900 to-slate-950 pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>Multi-Agent Autonomous Operating Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
            TOGO<span className="text-emerald-400">SERVE</span>
          </h1>
          <p className="text-lg sm:text-2xl font-bold text-slate-300 max-w-3xl mx-auto">
            AI-Native Commerce, Logistics & Multi-Agent Operating Platform
          </p>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Unifying on-demand Philippine marketplace commerce, volumetric TOGO Padala parcel courier logistics, B2B procurement, and 11 specialized autonomous AI agents under strict human-in-the-loop governance.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="flex items-center gap-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white px-6 py-3.5 rounded-xl font-black text-sm shadow-xl shadow-emerald-600/30 transition hover:scale-105 active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Enter ToGoServe Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto text-left">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Commercial Verticals</p>
              <p className="text-xl font-black text-emerald-400">8 Supported</p>
              <p className="text-[11px] text-slate-500">Food to Pharmacy & Padala</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Logistics Model</p>
              <p className="text-xl font-black text-teal-400">TOGO Padala</p>
              <p className="text-[11px] text-slate-500">Volumetric Fare & e-POD</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">AI Operating Mesh</p>
              <p className="text-xl font-black text-amber-400">11 AI Agents</p>
              <p className="text-[11px] text-slate-500">Human-In-The-Loop Safety</p>
            </div>
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <p className="text-xs text-slate-400 font-medium">Operational Core</p>
              <p className="text-xl font-black text-indigo-400">23-State Engine</p>
              <p className="text-[11px] text-slate-500">ACID Transactions & SSE</p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Commercial & Service Categories */}
      <section className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            8 Integrated Commercial Verticals
          </h2>
          <p className="text-sm text-slate-400">
            Engineered specifically for Philippine commerce dynamics, addressing high-density urban fulfillment and specialized category requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.name}
                className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/50 transition space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {c.badge}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {c.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Autonomous Multi-Agent Ecosystem */}
      <section className="py-16 px-4 sm:px-6 bg-slate-950/80 border-y border-slate-800">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-semibold bg-amber-950/60 border border-amber-500/30 px-2.5 py-1 rounded-full">
              <Cpu className="w-3.5 h-3.5" />
              <span>AI-Powered Autonomous Operations</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Specialized Multi-Agent Mesh
            </h2>
            <p className="text-sm text-slate-400">
              Coordinated by our central AI Orchestrator with Human-In-The-Loop safety controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agentHighlights.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.title}
                  className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${a.color} text-white flex items-center justify-center shadow-md`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-sm text-white">{a.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{a.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>HITL Guardrails Active</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Development Status Disclosure */}
      <section className="py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        <div className="bg-amber-950/30 border border-amber-500/30 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>DEVELOPMENT / DEMO ENVIRONMENT DISCLOSURE</span>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            ToGoServe is operating under an architectural development baseline. The public marketplace, multi-category catalogs, Padala parcel volumetrics, state machine, and AI multi-agent orchestration are active in this demonstration release.
          </p>
          <ul className="text-xs text-amber-300/80 space-y-1 list-disc list-inside">
            <li>Authentication for this release uses fixed development credentials (testpage2026 / testpage2026).</li>
            <li>External BSP-regulated escrow settlement operates under a sandbox protocol.</li>
            <li>Logistics fleets utilize simulated telematics and internal dispatch models.</li>
          </ul>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 px-4 sm:px-6 text-center border-t border-slate-800 bg-slate-950">
        <div className="max-w-xl mx-auto space-y-4">
          <h2 className="text-2xl font-black text-white">Ready to explore ToGoServe?</h2>
          <p className="text-xs text-slate-400">
            Access the multi-vendor commerce storefront, merchant portal, rider telematics, and AI command center.
          </p>
          <button
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 transition hover:scale-105"
          >
            <Lock className="w-4 h-4" />
            <span>Sign In with Development Credentials</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-4 text-center border-t border-slate-800 text-xs text-slate-500">
        <p>© 2026 ToGoServe Philippines. AI-Native Commerce, Logistics & Multi-Agent Operating Platform.</p>
      </footer>
    </div>
  );
};
