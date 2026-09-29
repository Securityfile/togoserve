import React, { useEffect, useState } from 'react';
import { apiClient } from '../../services/apiClient';
import { useApp } from '../../context/AppContext';
import { Bell, CheckCircle2, PackageCheck, AlertCircle } from 'lucide-react';

interface ToastNotice {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'delivery' | 'inventory';
}

export const RealtimeListener: React.FC = () => {
  const { updateOrderStatus } = useApp();
  const [toasts, setToasts] = useState<ToastNotice[]>([]);

  useEffect(() => {
    const unsubscribe = apiClient.subscribeRealtime((event) => {
      console.log('[Realtime SSE received]', event);

      if (event.type === 'ORDER_CREATED') {
        const payload = event.payload;
        addToast({
          id: `toast-${Date.now()}`,
          title: 'New Order Received',
          message: `Order #${payload.orderNumber || payload.orderId} (₱${payload.totalAmount}) placed.`,
          type: 'order',
        });
      } else if (event.type === 'ORDER_STATUS_CHANGED') {
        const payload = event.payload;
        addToast({
          id: `toast-${Date.now()}`,
          title: 'Order Status Transition',
          message: `Order #${payload.orderNumber} is now: ${payload.newStatus}`,
          type: 'delivery',
        });

        if (payload.orderId && payload.newStatus) {
          updateOrderStatus(payload.orderId, payload.newStatus);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [updateOrderStatus]);

  const addToast = (toast: ToastNotice) => {
    setToasts((prev) => [toast, ...prev.slice(0, 3)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 6000);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto bg-slate-950 text-white p-3.5 rounded-xl shadow-xl border border-slate-800 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            {t.type === 'order' && <Bell className="w-4 h-4 text-emerald-400" />}
            {t.type === 'delivery' && <PackageCheck className="w-4 h-4 text-emerald-400" />}
            {t.type === 'inventory' && <AlertCircle className="w-4 h-4 text-amber-400" />}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold leading-tight">{t.title}</p>
            <p className="text-[11px] text-slate-300 mt-0.5">{t.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
