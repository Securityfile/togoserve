import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { DemoControlCenter } from './components/common/DemoControlCenter';
import { AIAssistantModal } from './components/common/AIAssistantModal';
import { CustomerApp } from './components/customer/CustomerApp';
import { MerchantPortal } from './components/merchant/MerchantPortal';
import { RiderApp } from './components/rider/RiderApp';
import { AdminPortal } from './components/admin/AdminPortal';

const MainContent: React.FC = () => {
  const { role } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      <Header />

      <div className="flex-1">
        {role === 'customer' && <CustomerApp />}
        {role === 'merchant' && <MerchantPortal />}
        {role === 'rider' && <RiderApp />}
        {role === 'admin' && <AdminPortal />}
      </div>

      {/* Global Overlays */}
      <DemoControlCenter />
      <AIAssistantModal />

      {/* Modern Philippine Brand Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-extrabold flex items-center justify-center text-sm">
              T
            </div>
            <div>
              <p className="text-white font-bold">
                TOGO<span className="text-emerald-400">SERVE</span> Philippines
              </p>
              <p className="text-[11px] text-slate-500">
                Multi-Vendor Commerce & On-Demand Delivery Platform • Metro Manila, PH
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>Supported: GCash • Maya • QRPh • COD</span>
            <span>•</span>
            <span>BSP Regulated Payment Standards (Simulated)</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Demo Sandbox Environment</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
