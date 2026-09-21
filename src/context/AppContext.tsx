import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserRole,
  PhilippineAddress,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Merchant,
  Product,
  RiderProfile,
  DeliveryOffer,
  DeliveryZone,
  SupportTicket,
  AuditLog,
  CODReconciliationRecord,
  AIAgent,
  AIApprovalItem,
  AIAgentActivityLog,
  AITrainingEvaluationItem,
  AIKnowledgeDoc,
  AIPolicyRule,
  AISafetyControls,
  AutonomyLevel,
  AgentStatus,
  EvaluationTag,
  ShoppingPlan,
  AgentDataContract,
  PlatformEvent,
  AIObservationRecord,
  AIDecisionRecord,
  AITrainingDatasetItem,
  SimulationScenarioId,
  RiderCandidateEvaluation,
  DispatchOverrideReason,
} from '../types';
import {
  publishPlatformEvent,
  getAllPlatformEvents,
  subscribeToPlatformEvents,
  seedInitialEvents,
  getEventsForOrder,
  buildChronologicalOrderTimeline,
} from '../services/eventEngine';
import {
  getObservationRecords,
  getAIDecisionRecords,
  getAITrainingDataset,
  subscribeToObservations,
  subscribeToDecisions,
  subscribeToTraining,
  seedInitialAIData,
  evaluateRidersForDispatch,
  recordDispatchDecision,
  classifyTrainingExample,
} from '../services/aiObservationLayer';
import {
  SIMULATION_SCENARIOS,
  SimulationResult,
  runSimulationScenario,
} from '../services/simulationEngine';
import {
  INITIAL_ADDRESS,
  MOCK_MERCHANTS,
  MOCK_PRODUCTS,
  MOCK_ORDERS,
  MOCK_RIDER,
  MOCK_DELIVERY_ZONES,
  MOCK_SUPPORT_TICKETS,
  MOCK_COD_RECORDS,
  MOCK_AUDIT_LOGS,
} from '../data/mockData';
import {
  INITIAL_AI_AGENTS,
  INITIAL_APPROVAL_QUEUE,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_TRAINING_EVALUATION,
  INITIAL_KNOWLEDGE_DOCS,
  INITIAL_POLICY_RULES,
  INITIAL_SAFETY_CONTROLS,
} from '../data/aiOsData';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  
  // Customer State
  selectedAddress: PhilippineAddress;
  setSelectedAddress: (addr: PhilippineAddress) => void;
  cart: OrderItem[];
  addToCart: (item: OrderItem) => void;
  updateCartItemQty: (index: number, delta: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  voucher: { code: string; discount: number } | null;
  applyVoucher: (code: string) => { success: boolean; message: string };
  removeVoucher: () => void;
  deliveryTip: number;
  setDeliveryTip: (tip: number) => void;
  deliveryType: 'delivery' | 'pickup';
  setDeliveryType: (t: 'delivery' | 'pickup') => void;
  customerWalletBalance: number;
  setCustomerWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  isTogoServePlusMember: boolean;
  setIsTogoServePlusMember: React.Dispatch<React.SetStateAction<boolean>>;
  toggleTogoServePlus: () => void;
  savedFavorites: string[];
  toggleFavorite: (merchantId: string) => void;
  reorderPreviousOrder: (order: Order) => void;

  // Global Orders
  orders: Order[];
  createOrder: (orderParams: {
    merchantId: string;
    items: OrderItem[];
    paymentMethod: PaymentMethod;
    notes?: string;
    deliveryAddress: PhilippineAddress;
  }) => Order;
  updateOrderStatus: (orderId: string, newStatus: OrderStatus, note?: string) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  refundOrder: (orderId: string, amount: number, reason: string) => void;
  rateOrder: (orderId: string, mRating: number, rRating: number, comment: string) => void;

  // Merchant Portal
  activeMerchantId: string;
  setActiveMerchantId: (id: string) => void;
  merchants: Merchant[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  updateProductStock: (productId: string, stock: number) => void;
  toggleProductAvailability: (productId: string) => void;
  updateMerchantSettings: (merchantId: string, updates: Partial<Merchant>) => void;

  // Rider App
  riderProfile: RiderProfile;
  toggleRiderOnline: () => void;
  activeDeliveryOffer: DeliveryOffer | null;
  acceptDeliveryOffer: (orderId?: string) => void;
  declineDeliveryOffer: () => void;
  verifyPickup: (orderId: string, code: string) => boolean;
  verifyDelivery: (orderId: string, pin: string) => boolean;
  stepRiderLocation: (orderId: string) => void;
  requestPayout: (amount: number) => boolean;
  remitCod: (id: string) => void;

  // Operations & Admin
  deliveryZones: DeliveryZone[];
  updateDeliveryZone: (zoneId: string, updates: Partial<DeliveryZone>) => void;
  updateZoneSurge: (zoneId: string, surgeMultiplier: number) => void;
  supportTickets: SupportTicket[];
  createSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => void;
  resolveSupportTicket: (ticketId: string, resolution: string, refundAmount?: number) => void;
  codRecords: CODReconciliationRecord[];
  remitCOD: (id: string) => void;
  reconcileCod: (id: string) => void;
  auditLogs: AuditLog[];
  logAuditEvent: (action: string, record: string, prev?: string, next?: string) => void;
  resetAllDemoData: () => void;

  // Modals & Controllers
  isDemoControlOpen: boolean;
  setIsDemoControlOpen: (open: boolean) => void;
  isAIOpen: boolean;
  setIsAIOpen: (open: boolean) => void;
  aiTab: 'customer' | 'merchant' | 'operations';
  setAITab: (tab: 'customer' | 'merchant' | 'operations') => void;

  // Quick Simulation Shortcuts
  fastForwardOrder: (orderId: string) => void;
  generateDemoOrder: (name?: string, method?: PaymentMethod) => Order;

  // AI Agent Operating System
  aiAgents: AIAgent[];
  aiApprovalQueue: AIApprovalItem[];
  aiActivityLogs: AIAgentActivityLog[];
  aiTrainingEvaluations: AITrainingEvaluationItem[];
  aiKnowledgeDocs: AIKnowledgeDoc[];
  aiPolicyRules: AIPolicyRule[];
  aiSafetyControls: AISafetyControls;
  activeAIPlan: ShoppingPlan | null;
  setActiveAIPlan: (plan: ShoppingPlan | null) => void;

  approveAIItem: (id: string, reviewer?: string, notes?: string) => void;
  rejectAIItem: (id: string, reviewer?: string, reason?: string) => void;
  modifyAIItem: (id: string, reviewer?: string, modifiedPayload?: any, notes?: string) => void;
  escalateAIItem: (id: string, reviewer?: string, notes?: string) => void;
  setAgentAutonomy: (agentId: string, level: AutonomyLevel) => { success: boolean; message: string };
  setAgentStatus: (agentId: string, status: AgentStatus) => void;
  toggleMasterAutomationPause: () => void;
  updateTrainingEvaluationTag: (evalId: string, tag: EvaluationTag) => void;
  generateShoppingPlan: (intent: string, budget?: number) => Promise<ShoppingPlan | null>;
  applyShoppingPlanToCart: (plan: ShoppingPlan) => void;
  runDispatchAI: (orderId: string) => Promise<void>;
  executeAgentAction: (agentId: string, action: string, prompt?: string, payload?: any) => Promise<AgentDataContract>;

  // Event Engine & AI Observation Layer
  platformEvents: PlatformEvent[];
  aiObservations: AIObservationRecord[];
  aiDecisions: AIDecisionRecord[];
  aiTrainingDataset: AITrainingDatasetItem[];
  classifyTrainingItem: (id: string, classification: 'GOOD' | 'BAD' | 'ACCEPTABLE' | 'NEEDS_REVIEW' | 'EDGE_CASE', reviewer?: string) => void;
  runSimulation: (scenarioId: SimulationScenarioId) => Promise<SimulationResult>;
  recordDispatchOverride: (params: {
    order: Order;
    recommendedRiderId: string;
    recommendedRiderName: string;
    selectedRiderId: string;
    selectedRiderName: string;
    overrideReason?: DispatchOverrideReason | string;
    confidence?: number;
    reasonCodes?: string[];
  }) => AIDecisionRecord;
  evaluateRiders: (order: Order) => {
    evaluations: RiderCandidateEvaluation[];
    recommendedRider: RiderCandidateEvaluation | null;
    confidence: number;
    reasonCodes: string[];
  };
  getOrderEvents: (orderId: string) => PlatformEvent[];
  getOrderChronologicalTimeline: (orderId: string) => any[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('customer');
  const [selectedAddress, setSelectedAddress] = useState<PhilippineAddress>(INITIAL_ADDRESS);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [voucher, setVoucher] = useState<{ code: string; discount: number } | null>(null);
  const [deliveryTip, setDeliveryTip] = useState<number>(30);
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [customerWalletBalance, setCustomerWalletBalance] = useState<number>(2500);
  const [isTogoServePlusMember, setIsTogoServePlusMember] = useState<boolean>(true);
  const [savedFavorites, setSavedFavorites] = useState<string[]>(['m1', 'm2']);

  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [activeMerchantId, setActiveMerchantId] = useState<string>('m1');
  const [merchants, setMerchants] = useState<Merchant[]>(MOCK_MERCHANTS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [riderProfile, setRiderProfile] = useState<RiderProfile>(MOCK_RIDER);
  const [activeDeliveryOffer, setActiveDeliveryOffer] = useState<DeliveryOffer | null>(null);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>(MOCK_DELIVERY_ZONES);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(MOCK_SUPPORT_TICKETS);
  const [codRecords, setCodRecords] = useState<CODReconciliationRecord[]>(MOCK_COD_RECORDS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);

  // Event Engine & AI Observation Layer State
  const [platformEvents, setPlatformEvents] = useState<PlatformEvent[]>([]);
  const [aiObservations, setAiObservations] = useState<AIObservationRecord[]>([]);
  const [aiDecisions, setAiDecisions] = useState<AIDecisionRecord[]>([]);
  const [aiTrainingDataset, setAiTrainingDataset] = useState<AITrainingDatasetItem[]>([]);

  // AI Agent Operating System State
  const [aiAgents, setAiAgents] = useState<AIAgent[]>(INITIAL_AI_AGENTS);
  const [aiApprovalQueue, setAiApprovalQueue] = useState<AIApprovalItem[]>(INITIAL_APPROVAL_QUEUE);
  const [aiActivityLogs, setAiActivityLogs] = useState<AIAgentActivityLog[]>(INITIAL_ACTIVITY_LOGS);
  const [aiTrainingEvaluations, setAiTrainingEvaluations] = useState<AITrainingEvaluationItem[]>(INITIAL_TRAINING_EVALUATION);
  const [aiKnowledgeDocs, setAiKnowledgeDocs] = useState<AIKnowledgeDoc[]>(INITIAL_KNOWLEDGE_DOCS);
  const [aiPolicyRules, setAiPolicyRules] = useState<AIPolicyRule[]>(INITIAL_POLICY_RULES);
  const [aiSafetyControls, setAiSafetyControls] = useState<AISafetyControls>(INITIAL_SAFETY_CONTROLS);
  const [activeAIPlan, setActiveAIPlan] = useState<ShoppingPlan | null>(null);

  const [isDemoControlOpen, setIsDemoControlOpen] = useState<boolean>(false);
  const [isAIOpen, setIsAIOpen] = useState<boolean>(false);
  const [aiTab, setAITab] = useState<'customer' | 'merchant' | 'operations'>('customer');

  // Seed and subscribe to Event Engine & AI Observation Layer
  useEffect(() => {
    seedInitialEvents(orders);
    seedInitialAIData();
    setPlatformEvents(getAllPlatformEvents());
    setAiObservations(getObservationRecords());
    setAiDecisions(getAIDecisionRecords());
    setAiTrainingDataset(getAITrainingDataset());

    const unsubEvents = subscribeToPlatformEvents(() => {
      setPlatformEvents([...getAllPlatformEvents()]);
    });
    const unsubObs = subscribeToObservations(() => {
      setAiObservations([...getObservationRecords()]);
    });
    const unsubDec = subscribeToDecisions(() => {
      setAiDecisions([...getAIDecisionRecords()]);
    });
    const unsubTrain = subscribeToTraining(() => {
      setAiTrainingDataset([...getAITrainingDataset()]);
    });

    return () => {
      unsubEvents();
      unsubObs();
      unsubDec();
      unsubTrain();
    };
  }, []);

  // Check for orders in 'searching_rider' state to present offer to rider
  useEffect(() => {
    if (riderProfile.isOnline && !riderProfile.currentOrderId && !activeDeliveryOffer) {
      const readyOrder = orders.find((o) => o.status === 'searching_rider' || o.status === 'ready_for_pickup');
      if (readyOrder) {
        setActiveDeliveryOffer({
          orderId: readyOrder.id,
          merchantName: readyOrder.merchantName,
          merchantAddress: readyOrder.merchantAddress,
          customerArea: readyOrder.deliveryAddress.barangay + ', ' + readyOrder.deliveryAddress.city,
          pickupDistanceKm: 1.2,
          deliveryDistanceKm: 2.8,
          totalDistanceKm: 4.0,
          estimatedEarnings: 95 + readyOrder.tip,
          estimatedDurationMin: 22,
          paymentMethod: readyOrder.paymentMethod,
          expiresAt: Date.now() + 35000,
        });
      }
    }
  }, [orders, riderProfile.isOnline, riderProfile.currentOrderId, activeDeliveryOffer]);

  // Cart Functions
  const addToCart = (item: OrderItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === item.productId && JSON.stringify(i.selectedOptions) === JSON.stringify(item.selectedOptions));
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        copy[existingIdx].totalPrice += item.totalPrice;
        return copy;
      }
      return [...prev, item];
    });
  };

  const updateCartItemQty = (index: number, delta: number) => {
    setCart((prev) => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      const unitPrice = copy[index].totalPrice / copy[index].quantity;
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index].quantity = newQty;
      copy[index].totalPrice = unitPrice * newQty;
      return copy;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => setCart([]);

  const applyVoucher = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === 'TOGOPLUS' || clean === 'TOGOFREE') {
      setVoucher({ code: clean, discount: 50 });
      return { success: true, message: '₱50 Free Delivery Voucher applied!' };
    }
    if (clean === 'PINOY100') {
      setVoucher({ code: clean, discount: 100 });
      return { success: true, message: '₱100 Discount Voucher applied!' };
    }
    if (clean === 'PINOY50' || clean === 'HEALTHPH') {
      setVoucher({ code: clean, discount: 50 });
      return { success: true, message: '₱50 Discount applied!' };
    }
    return { success: false, message: 'Invalid or expired voucher code. Try PINOY50 or TOGOPLUS.' };
  };

  const removeVoucher = () => setVoucher(null);

  const toggleTogoServePlus = () => {
    setIsTogoServePlusMember((prev) => !prev);
    logAuditEvent('MEMBERSHIP_TOGGLE', 'TOGO SERVE+ Subscription', !isTogoServePlusMember ? 'Inactive' : 'Active', !isTogoServePlusMember ? 'Active' : 'Inactive');
  };

  const toggleFavorite = (merchantId: string) => {
    setSavedFavorites((prev) =>
      prev.includes(merchantId) ? prev.filter((id) => id !== merchantId) : [...prev, merchantId]
    );
  };

  const logAuditEvent = (action: string, record: string, prev?: string, next?: string) => {
    const newLog: AuditLog = {
      id: 'aud_' + Math.random().toString(36).substring(2, 8),
      user: role === 'admin' ? 'Super Admin' : role === 'merchant' ? 'Store Manager' : role === 'rider' ? 'Kuya Dan (Rider)' : 'Maria Santos',
      role: role.toUpperCase(),
      action,
      record,
      previousValue: prev,
      newValue: next,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ip: '127.0.0.1 (Local)',
    };
    setAuditLogs((l) => [newLog, ...l.slice(0, 49)]);
  };

  // Order Lifecycle Operations
  const createOrder = (params: {
    merchantId: string;
    items: OrderItem[];
    paymentMethod: PaymentMethod;
    notes?: string;
    deliveryAddress: PhilippineAddress;
  }): Order => {
    const merchant = merchants.find((m) => m.id === params.merchantId) || merchants[0];
    const subtotal = params.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const voucherDisc = voucher ? voucher.discount : 0;
    const baseDelFee = deliveryType === 'pickup' ? 0 : isTogoServePlusMember && subtotal >= 300 ? 0 : merchant.deliveryFee;
    const serviceFee = 15;
    const smallOrderFee = subtotal < merchant.minOrder ? 30 : 0;
    const tip = deliveryType === 'pickup' ? 0 : deliveryTip;
    const total = Math.max(0, subtotal - voucherDisc + baseDelFee + serviceFee + smallOrderFee + tip);

    const newOrderNum = 'TG-' + Math.floor(1000 + Math.random() * 9000);
    const pickupCode = 'PU-' + Math.floor(100 + Math.random() * 900);
    const deliveryPin = '' + Math.floor(1000 + Math.random() * 9000);

    const now = new Date();
    const newOrder: Order = {
      id: 'ord_' + Date.now(),
      orderNumber: newOrderNum,
      customerId: 'c_maria',
      customerName: 'Maria Santos',
      customerPhone: '+63 917 888 2341',
      merchantId: merchant.id,
      merchantName: merchant.name,
      merchantAddress: merchant.address + ', ' + merchant.city,
      merchantCoordinates: merchant.coordinates,
      merchantPhone: '+63 2 8821 0000',
      items: params.items,
      status: 'merchant_notified',
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentMethod === 'cod' ? 'pending_cod' : 'paid',
      deliveryAddress: params.deliveryAddress,
      deliveryType,
      subtotal,
      discount: voucherDisc,
      voucherCode: voucher?.code,
      voucherDiscount: voucherDisc,
      deliveryFee: baseDelFee,
      serviceFee,
      smallOrderFee,
      tip,
      tax: 0,
      total,
      pickupCode,
      deliveryPin,
      notes: params.notes,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      estimatedDeliveryMinutes: 30,
      timeline: [
        {
          status: 'placed',
          label: 'Order Placed',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: `Paid via ${params.paymentMethod.toUpperCase()} (Total: ₱${total})`,
        },
        {
          status: 'merchant_notified',
          label: 'Sent to Merchant',
          timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          description: `Order transmitted to ${merchant.name}`,
        },
      ],
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    setVoucher(null);

    logAuditEvent('CREATE_ORDER', `Order ${newOrderNum}`, undefined, `Status: Placed, Amount: ₱${total}`);

    // Publish platform event for AI Observation Engine
    publishPlatformEvent({
      eventType: 'ORDER_CREATED',
      actorType: 'CUSTOMER',
      actorId: newOrder.customerId,
      entityType: 'ORDER',
      entityId: newOrder.id,
      orderId: newOrder.id,
      newState: 'merchant_notified',
      metadata: {
        orderNumber: newOrder.orderNumber,
        merchantId: merchant.id,
        merchantName: merchant.name,
        itemCount: params.items.length,
        subtotal,
        total,
        paymentMethod: params.paymentMethod,
        deliveryAddress: params.deliveryAddress,
      },
    });

    // If COD, track in COD Reconciliation
    if (params.paymentMethod === 'cod') {
      const newCod: CODReconciliationRecord = {
        id: 'cod_' + Date.now(),
        orderId: newOrderNum,
        customerName: 'Maria Santos',
        riderName: 'To be assigned',
        amount: total,
        status: 'pending_remittance',
        collectedAt: 'Pending dropoff',
      };
      setCodRecords((prev) => [newCod, ...prev]);
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, newStatus: OrderStatus, note?: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const timelineLabel = newStatus
            .replace(/_/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
          const newEvent = {
            status: newStatus,
            label: timelineLabel,
            timestamp: nowStr,
            description: note || `Order transitioned to ${timelineLabel}`,
          };
          const updated: Order = {
            ...ord,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            timeline: [...ord.timeline, newEvent],
          };

          // If assigned rider or completed
          if (newStatus === 'completed' && ord.paymentMethod === 'cod') {
            setCodRecords((records) =>
              records.map((c) =>
                c.orderId === ord.orderNumber
                  ? { ...c, riderName: ord.riderName || 'Kuya Dan', status: 'pending_remittance', collectedAt: nowStr }
                  : c
              )
            );
          }

          return updated;
        }
        return ord;
      })
    );

    logAuditEvent('UPDATE_ORDER_STATUS', `Order ${orderId}`, undefined, `New Status: ${newStatus}`);

    // Map order status to platform events
    const eventTypeMap: Record<string, any> = {
      placed: 'ORDER_CREATED',
      merchant_accepted: 'ORDER_CONFIRMED',
      preparing: 'PREPARATION_STARTED',
      ready_for_pickup: 'ORDER_READY_FOR_PICKUP',
      searching_rider: 'SEARCHING_RIDER',
      rider_assigned: 'RIDER_ASSIGNED',
      rider_at_merchant: 'RIDER_AT_MERCHANT',
      on_the_way: 'ORDER_PICKED_UP',
      delivered: 'DELIVERY_COMPLETED',
      completed: 'DELIVERY_COMPLETED',
      cancelled: 'ORDER_CANCELLED',
      refunded: 'ORDER_REFUNDED',
    };
    const mappedType = eventTypeMap[newStatus];
    if (mappedType) {
      publishPlatformEvent({
        eventType: mappedType,
        actorType: role === 'merchant' ? 'MERCHANT' : role === 'rider' ? 'RIDER' : role === 'admin' ? 'DISPATCHER' : 'SYSTEM',
        actorId: role === 'merchant' ? 'merch_system' : role === 'rider' ? 'rider_system' : 'admin_supervisor',
        entityType: 'ORDER',
        entityId: orderId,
        orderId,
        newState: newStatus,
        metadata: { status: newStatus, note },
      });
    }
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    updateOrderStatus(orderId, 'cancelled', reason || 'Order cancelled by user or platform');
    logAuditEvent('CANCEL_ORDER', `Order ${orderId}`, undefined, `Cancelled. Reason: ${reason || 'Unspecified'}`);
  };

  const refundOrder = (orderId: string, amount: number, reason: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          return {
            ...ord,
            status: 'refunded',
            paymentStatus: 'refunded',
            updatedAt: new Date().toISOString(),
            timeline: [
              ...ord.timeline,
              {
                status: 'refunded',
                label: 'Refund Processed',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                description: `Simulated refund of ₱${amount} processed. Reason: ${reason}`,
              },
            ],
          };
        }
        return ord;
      })
    );
    // Add refund to customer wallet
    setCustomerWalletBalance((b) => b + amount);
    logAuditEvent('PROCESS_REFUND', `Order ${orderId}`, undefined, `Refunded ₱${amount}. Reason: ${reason}`);
  };

  const rateOrder = (orderId: string, mRating: number, rRating: number, comment: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          return {
            ...ord,
            review: {
              merchantRating: mRating,
              riderRating: rRating,
              comment,
              createdAt: new Date().toISOString(),
            },
          };
        }
        return ord;
      })
    );
    logAuditEvent('SUBMIT_REVIEW', `Order ${orderId}`, undefined, `Merchant: ${mRating}★, Rider: ${rRating}★`);
  };

  // Merchant Methods
  const updateProductStock = (productId: string, stock: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock, isAvailable: stock > 0 } : p))
    );
    logAuditEvent('INVENTORY_UPDATE', `Product ${productId}`, undefined, `Stock set to ${stock}`);
  };

  const toggleProductAvailability = (productId: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: !p.isAvailable } : p))
    );
  };

  const updateMerchantSettings = (merchantId: string, updates: Partial<Merchant>) => {
    setMerchants((prev) => prev.map((m) => (m.id === merchantId ? { ...m, ...updates } : m)));
    logAuditEvent('STORE_SETTINGS_UPDATE', `Merchant ${merchantId}`, undefined, JSON.stringify(updates));
  };

  // Rider Methods
  const toggleRiderOnline = () => {
    setRiderProfile((r) => {
      const nextOnline = !r.isOnline;
      return {
        ...r,
        isOnline: nextOnline,
        status: nextOnline ? (r.currentOrderId ? 'delivering' : 'available') : 'offline',
      };
    });
    logAuditEvent('RIDER_DUTY_TOGGLE', 'Rider Kuya Dan', undefined, !riderProfile.isOnline ? 'Online' : 'Offline');
  };

  const acceptDeliveryOffer = (targetOrderId?: string) => {
    const orderId = targetOrderId || activeDeliveryOffer?.orderId || orders[0]?.id;
    if (!orderId) return;
    setActiveDeliveryOffer(null);
    setRiderProfile((r) => ({
      ...r,
      status: 'delivering',
      currentOrderId: orderId,
    }));
    // Assign rider info to order
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id === orderId || ord.orderNumber === orderId) {
          return {
            ...ord,
            riderId: riderProfile.id,
            riderName: riderProfile.name,
            riderPhone: riderProfile.phone,
            riderAvatar: riderProfile.avatar,
            riderVehicle: riderProfile.vehicleType,
            riderPlate: riderProfile.plateNumber,
            riderRating: riderProfile.rating,
            riderCoordinates: riderProfile.coordinates,
            status: 'rider_assigned',
            timeline: [
              ...ord.timeline,
              {
                status: 'rider_assigned',
                label: 'Rider Assigned',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                description: `${riderProfile.name} (${riderProfile.vehicleType}) accepted this delivery`,
              },
            ],
          };
        }
        return ord;
      })
    );
    logAuditEvent('DISPATCH_ACCEPT', `Order ${orderId}`, undefined, `Rider ${riderProfile.name} accepted`);
  };

  const declineDeliveryOffer = () => {
    setActiveDeliveryOffer(null);
    logAuditEvent('DISPATCH_DECLINE', 'Offer Declined', undefined, 'Rider declined delivery offer');
  };

  const verifyPickup = (orderId: string, code: string): boolean => {
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return false;
    if (order.pickupCode.toUpperCase() === code.trim().toUpperCase() || code.trim() === 'VERIFY') {
      updateOrderStatus(order.id, 'on_the_way', `Rider verified pickup with code ${order.pickupCode}. Order is on the way!`);
      return true;
    }
    return false;
  };

  const verifyDelivery = (orderId: string, pin: string): boolean => {
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return false;
    if (order.deliveryPin === pin.trim() || pin.trim() === '1234' || pin.trim() === 'VERIFY') {
      updateOrderStatus(order.id, 'completed', `Customer verified handoff with PIN ${order.deliveryPin}. Delivery Completed!`);

      // Update Rider earnings
      setRiderProfile((r) => {
        const fare = 95 + order.tip;
        return {
          ...r,
          currentOrderId: undefined,
          status: 'available',
          totalTrips: r.totalTrips + 1,
          walletBalance: r.walletBalance + fare,
          todayEarnings: {
            ...r.todayEarnings,
            basePay: r.todayEarnings.basePay + 60,
            distancePay: r.todayEarnings.distancePay + 35,
            tips: r.todayEarnings.tips + order.tip,
            codCollected: order.paymentMethod === 'cod' ? r.todayEarnings.codCollected + order.total : r.todayEarnings.codCollected,
            netEarnings: r.todayEarnings.netEarnings + fare,
          },
        };
      });
      return true;
    }
    return false;
  };

  // Simulate rider GPS step closer to destination
  const stepRiderLocation = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if ((ord.id === orderId || ord.orderNumber === orderId) && ord.riderCoordinates) {
          const target = ord.deliveryAddress.coordinates;
          const current = ord.riderCoordinates;
          const latDiff = (target.lat - current.lat) * 0.35;
          const lngDiff = (target.lng - current.lng) * 0.35;
          const newCoords = {
            lat: current.lat + latDiff,
            lng: current.lng + lngDiff,
          };
          const remainingMins = Math.max(1, (ord.estimatedDeliveryMinutes || 8) - 2);

          let newStatus = ord.status;
          if (remainingMins <= 2 && ord.status === 'on_the_way') {
            newStatus = 'rider_arrived';
          }

          return {
            ...ord,
            status: newStatus,
            riderCoordinates: newCoords,
            estimatedDeliveryMinutes: remainingMins,
          };
        }
        return ord;
      })
    );
  };

  const requestPayout = (amount: number): boolean => {
    if (amount <= riderProfile.walletBalance && amount >= 200) {
      setRiderProfile((r) => ({
        ...r,
        walletBalance: r.walletBalance - amount,
      }));
      logAuditEvent('RIDER_PAYOUT_REQUEST', 'Rider Wallet', `Balance: ₱${riderProfile.walletBalance}`, `Withdrew ₱${amount} to GCash`);
      return true;
    }
    return false;
  };

  // Operations & Admin
  const updateDeliveryZone = (zoneId: string, updates: Partial<DeliveryZone>) => {
    setDeliveryZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, ...updates } : z)));
    logAuditEvent('ZONE_SETTINGS_UPDATE', `Zone ${zoneId}`, undefined, JSON.stringify(updates));
  };

  const createSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt'>) => {
    const newTicket: SupportTicket = {
      ...ticket,
      id: 'TCK-' + Math.floor(1000 + Math.random() * 9000),
      createdAt: 'Just now',
    };
    setSupportTickets((prev) => [newTicket, ...prev]);
    logAuditEvent('CREATE_SUPPORT_TICKET', `Ticket ${newTicket.id}`, undefined, `${ticket.category} - ${ticket.priority}`);
  };

  const resolveSupportTicket = (ticketId: string, resolution: string, refundAmount?: number) => {
    setSupportTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: 'resolved', resolution, refundAmount } : t))
    );
    if (refundAmount && refundAmount > 0) {
      setCustomerWalletBalance((b) => b + refundAmount);
    }
    logAuditEvent('RESOLVE_SUPPORT_TICKET', `Ticket ${ticketId}`, 'Open', `Resolved: ${resolution}`);
  };

  const remitCOD = (id: string) => {
    setCodRecords((prev) =>
      prev.map((c) =>
        c.id === id || c.orderId === id
          ? { ...c, status: 'reconciled', remittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
          : c
      )
    );
    logAuditEvent('COD_REMITTANCE_CONFIRM', `Record ${id}`, 'Pending', 'Reconciled via QRPh');
  };

  const resetAllDemoData = () => {
    setOrders(MOCK_ORDERS);
    setProducts(MOCK_PRODUCTS);
    setMerchants(MOCK_MERCHANTS);
    setRiderProfile(MOCK_RIDER);
    setCart([]);
    setVoucher(null);
    setSupportTickets(MOCK_SUPPORT_TICKETS);
    setCodRecords(MOCK_COD_RECORDS);
    setAuditLogs(MOCK_AUDIT_LOGS);
    setSelectedAddress(INITIAL_ADDRESS);
    setIsTogoServePlusMember(true);
    setActiveDeliveryOffer(null);
    logAuditEvent('SYSTEM_RESET', 'Entire Workspace', undefined, 'Restored initial Philippine demo state');
  };

  // Quick Simulation Shortcut: Fast-forwards an order through its next logical stage
  const fastForwardOrder = (orderId: string) => {
    const order = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!order) return;

    if (order.status === 'placed' || order.status === 'merchant_notified') {
      updateOrderStatus(order.id, 'merchant_accepted', 'Kusina Filipina accepted order & started preparation');
    } else if (order.status === 'merchant_accepted') {
      updateOrderStatus(order.id, 'preparing', 'Kitchen is currently cooking the food');
    } else if (order.status === 'preparing') {
      updateOrderStatus(order.id, 'ready_for_pickup', 'Food is packed and ready on the pickup shelf');
    } else if (order.status === 'ready_for_pickup' || order.status === 'searching_rider') {
      acceptDeliveryOffer(order.id);
    } else if (order.status === 'rider_assigned' || order.status === 'rider_going_merchant') {
      updateOrderStatus(order.id, 'rider_at_merchant', 'Kuya Dan arrived at store counter');
    } else if (order.status === 'rider_at_merchant') {
      verifyPickup(order.id, order.pickupCode);
    } else if (order.status === 'order_picked_up' || order.status === 'on_the_way') {
      updateOrderStatus(order.id, 'rider_arrived', 'Rider arrived at One Serendra lobby. Waiting for customer PIN');
    } else if (order.status === 'rider_arrived') {
      verifyDelivery(order.id, order.deliveryPin);
    }
  };

  const generateDemoOrder = (name = 'Maria Santos', method: PaymentMethod = 'gcash'): Order => {
    const sampleItems: OrderItem[] = [
      {
        id: 'gen_' + Date.now(),
        productId: 'p1',
        name: 'Chicken Inasal Solo with Garlic Rice',
        price: 199,
        quantity: 2,
        selectedOptions: {
          'Rice Choice': 'Regular Garlic Rice',
          'Beverage Pairing': "Cold Sago't Gulaman (+₱45)",
        },
        specialInstructions: 'Extra calamansi and soy sauce packets please!',
        totalPrice: 488,
      },
      {
        id: 'gen_2_' + Date.now(),
        productId: 'p4',
        name: 'Halo-Halo Supreme Special',
        price: 150,
        quantity: 1,
        totalPrice: 150,
      },
    ];

    return createOrder({
      merchantId: 'm1',
      items: sampleItems,
      paymentMethod: method,
      notes: 'Demo test order generated from Control Center',
      deliveryAddress: INITIAL_ADDRESS,
    });
  };

  const updateZoneSurge = (zoneId: string, surgeMultiplier: number) => {
    updateDeliveryZone(zoneId, { surgeMultiplier });
  };

  const reconcileCod = (id: string) => {
    remitCOD(id);
  };

  const reorderPreviousOrder = (order: Order) => {
    order.items.forEach((item) => {
      addToCart(item);
    });
  };

  // AI Operating System Handlers
  const approveAIItem = (id: string, reviewer = 'Admin Operations Manager', notes = '') => {
    const item = aiApprovalQueue.find((q) => q.id === id);
    if (!item) return;

    // Execute relevant action in platform state
    if (item.agentId === 'agent_dispatch' && item.payload?.orderNumber) {
      const targetOrder = orders.find(
        (o) => o.orderNumber === item.payload.orderNumber || o.id === item.payload.orderId
      );
      if (targetOrder) {
        updateOrderStatus(
          targetOrder.id,
          'rider_assigned',
          `Assigned to ${item.payload.riderName} via AI Dispatch (Approved by ${reviewer})`
        );
        setOrders((prev) =>
          prev.map((o) =>
            o.id === targetOrder.id
              ? {
                  ...o,
                  riderId: item.payload.riderId || 'r1',
                  riderName: item.payload.riderName || 'Danilo Santos',
                  riderVehicle: item.payload.vehicle || 'Yamaha NMAX 155',
                  riderPhone: '+63 917 555 0108',
                  riderRating: 4.9,
                  riderPlate: 'NCR 4821 XY',
                }
              : o
          )
        );
      }
    } else if (item.agentId === 'agent_refund' && item.payload?.refundAmount) {
      setCustomerWalletBalance((b) => b + item.payload.refundAmount);
      logAuditEvent('EXECUTE_REFUND', item.affectedRecord, 'PENDING_REVIEW', `REFUNDED_₱${item.payload.refundAmount}`);
    } else if (item.agentId === 'agent_pricing' && item.payload?.zoneId) {
      updateZoneSurge(item.payload.zoneId, item.payload.proposedSurge || 1.25);
    } else if (item.agentId === 'agent_promotion' && item.payload?.voucherCode) {
      logAuditEvent('ACTIVATE_PROMOTION', item.payload.voucherCode, 'INACTIVE', 'ACTIVE_CAMPAIGN');
    } else if (item.agentId === 'agent_cod' && item.payload?.riderId) {
      logAuditEvent('COD_RECONCILIATION_NOTED', `Rider ${item.payload.riderName}`, 'PENDING', 'DESK_FOLLOW_UP');
    }

    // Update approval queue state
    setAiApprovalQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'APPROVED',
              humanReviewer: reviewer,
              outcome: notes || 'Approved and executed successfully into live platform state.',
            }
          : q
      )
    );

    // Update agent stats
    setAiAgents((prev) =>
      prev.map((a) =>
        a.id === item.agentId
          ? {
              ...a,
              completedTasks: a.completedTasks + 1,
              lastActivity: 'Just now',
            }
          : a
      )
    );

    // Record activity log
    const newActLog: AIAgentActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentId: item.agentId,
      agentName: item.agentName,
      action: item.action,
      whatDid: `Human supervisor ${reviewer} approved recommendation for ${item.affectedRecord}.`,
      whyDid: item.reason,
      informationUsed: `Confidence: ${(item.confidence * 100).toFixed(0)}%, Risk: ${item.riskLevel}`,
      authorizingPolicy: 'POL-HUMAN-APPROVAL-01: Explicit supervisor authorization',
      humanApproved: true,
      outcome: notes || 'Executed into platform state.',
      risk: item.riskLevel,
    };
    setAiActivityLogs((prev) => [newActLog, ...prev]);

    // Record training evaluation
    const newEval: AITrainingEvaluationItem = {
      id: `eval_${Date.now()}`,
      agentId: item.agentId,
      agentName: item.agentName,
      inputContext: `${item.action} on ${item.affectedRecord}`,
      aiRecommendation: item.reason,
      humanDecision: 'APPROVED',
      finalAction: `Executed ${item.action}`,
      operationalOutcome: 'Successfully aligned with operational policies and positive customer/rider experience.',
      evaluationTag: 'GOOD_DECISION',
      timestamp: new Date().toLocaleString(),
    };
    setAiTrainingEvaluations((prev) => [newEval, ...prev]);

    // Emit event to Event Engine
    publishPlatformEvent({
      eventType: 'HUMAN_DECISION_RECORDED',
      actorType: 'DISPATCHER',
      actorId: reviewer,
      entityType: 'ORDER',
      entityId: item.payload?.orderId || item.id,
      orderId: item.payload?.orderId,
      metadata: {
        approvalItemId: item.id,
        agentId: item.agentId,
        agentName: item.agentName,
        action: item.action,
        decision: 'APPROVED',
        affectedRecord: item.affectedRecord,
        notes,
      },
    });
  };

  const rejectAIItem = (id: string, reviewer = 'Admin Operations Manager', reason = 'Operational override') => {
    const item = aiApprovalQueue.find((q) => q.id === id);
    if (!item) return;

    setAiApprovalQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'REJECTED',
              humanReviewer: reviewer,
              overrideReason: reason,
              outcome: `Rejected by ${reviewer}: ${reason}`,
            }
          : q
      )
    );

    setAiAgents((prev) =>
      prev.map((a) =>
        a.id === item.agentId
          ? {
              ...a,
              humanOverrides: a.humanOverrides + 1,
              lastActivity: 'Just now',
            }
          : a
      )
    );

    const newActLog: AIAgentActivityLog = {
      id: `act_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      agentId: item.agentId,
      agentName: item.agentName,
      action: item.action,
      whatDid: `Human supervisor rejected AI recommendation for ${item.affectedRecord}.`,
      whyDid: reason,
      informationUsed: `Supervisor override criteria.`,
      authorizingPolicy: 'POL-HUMAN-OVERRIDE: Supervisor prerogative',
      humanApproved: false,
      outcome: `Action rejected: ${reason}`,
      risk: item.riskLevel,
    };
    setAiActivityLogs((prev) => [newActLog, ...prev]);

    const newEval: AITrainingEvaluationItem = {
      id: `eval_${Date.now()}`,
      agentId: item.agentId,
      agentName: item.agentName,
      inputContext: `${item.action} on ${item.affectedRecord}`,
      aiRecommendation: item.reason,
      humanDecision: 'REJECTED',
      overrideReason: reason,
      finalAction: `Discarded recommendation. Manual operational handling.`,
      operationalOutcome: 'Prevented sub-optimal action. Retained for model retraining.',
      evaluationTag: 'BAD_DECISION',
      timestamp: new Date().toLocaleString(),
    };
    setAiTrainingEvaluations((prev) => [newEval, ...prev]);

    // Emit override event to Event Engine
    publishPlatformEvent({
      eventType: 'HUMAN_OVERRIDE_RECORDED',
      actorType: 'DISPATCHER',
      actorId: reviewer,
      entityType: 'ORDER',
      entityId: item.payload?.orderId || item.id,
      orderId: item.payload?.orderId,
      metadata: {
        approvalItemId: item.id,
        agentId: item.agentId,
        agentName: item.agentName,
        action: item.action,
        decision: 'REJECTED',
        affectedRecord: item.affectedRecord,
        overrideReason: reason,
      },
    });
  };

  const modifyAIItem = (id: string, reviewer = 'Admin Operations Manager', modifiedPayload: any = {}, notes = '') => {
    const item = aiApprovalQueue.find((q) => q.id === id);
    if (!item) return;

    setAiApprovalQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'MODIFIED',
              humanReviewer: reviewer,
              payload: { ...q.payload, ...modifiedPayload },
              outcome: notes || 'Modified by human supervisor before execution.',
            }
          : q
      )
    );

    setAiAgents((prev) =>
      prev.map((a) =>
        a.id === item.agentId
          ? {
              ...a,
              humanOverrides: a.humanOverrides + 1,
              lastActivity: 'Just now',
            }
          : a
      )
    );

    const newEval: AITrainingEvaluationItem = {
      id: `eval_${Date.now()}`,
      agentId: item.agentId,
      agentName: item.agentName,
      inputContext: `${item.action} on ${item.affectedRecord}`,
      aiRecommendation: item.reason,
      humanDecision: 'MODIFIED',
      overrideReason: notes || 'Supervisor adjusted parameters',
      finalAction: `Executed with modified parameters`,
      operationalOutcome: 'Balanced operational compromise.',
      evaluationTag: 'NEEDS_REVIEW',
      timestamp: new Date().toLocaleString(),
    };
    setAiTrainingEvaluations((prev) => [newEval, ...prev]);

    // Emit override event to Event Engine
    publishPlatformEvent({
      eventType: 'HUMAN_OVERRIDE_RECORDED',
      actorType: 'DISPATCHER',
      actorId: reviewer,
      entityType: 'ORDER',
      entityId: item.payload?.orderId || item.id,
      orderId: item.payload?.orderId,
      metadata: {
        approvalItemId: item.id,
        agentId: item.agentId,
        agentName: item.agentName,
        action: item.action,
        decision: 'MODIFIED',
        affectedRecord: item.affectedRecord,
        modifiedPayload,
        notes,
      },
    });
  };

  const escalateAIItem = (id: string, reviewer = 'Admin Operations Manager', notes = '') => {
    const item = aiApprovalQueue.find((q) => q.id === id);
    if (!item) return;

    setAiApprovalQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              status: 'ESCALATED',
              humanReviewer: reviewer,
              outcome: notes || 'Escalated to Executive Committee & Legal Risk Desk.',
            }
          : q
      )
    );

    setAiAgents((prev) =>
      prev.map((a) =>
        a.id === item.agentId
          ? {
              ...a,
              escalations: a.escalations + 1,
              lastActivity: 'Just now',
            }
          : a
      )
    );

    // Emit event to Event Engine
    publishPlatformEvent({
      eventType: 'HUMAN_DECISION_RECORDED',
      actorType: 'DISPATCHER',
      actorId: reviewer,
      entityType: 'ORDER',
      entityId: item.payload?.orderId || item.id,
      orderId: item.payload?.orderId,
      metadata: {
        approvalItemId: item.id,
        agentId: item.agentId,
        agentName: item.agentName,
        action: item.action,
        decision: 'ESCALATED',
        affectedRecord: item.affectedRecord,
        notes,
      },
    });
  };

  const setAgentAutonomy = (agentId: string, level: AutonomyLevel) => {
    if (level === 5) {
      return {
        success: false,
        message: 'Level 5 (High Autonomy) is strictly reserved and locked by production safety policy.',
      };
    }

    setAiAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, autonomyLevel: level } : a)));
    logAuditEvent('UPDATE_AGENT_AUTONOMY', `Agent ${agentId}`, `Level`, `Level ${level}`);
    return { success: true, message: `Updated ${agentId} autonomy to Level ${level}.` };
  };

  const setAgentStatus = (agentId: string, status: AgentStatus) => {
    setAiAgents((prev) => prev.map((a) => (a.id === agentId ? { ...a, status } : a)));
    logAuditEvent('UPDATE_AGENT_STATUS', `Agent ${agentId}`, '', status);
  };

  const toggleMasterAutomationPause = () => {
    setAiSafetyControls((prev) => {
      const nextState = !prev.masterAutomationPaused;
      logAuditEvent(
        'EMERGENCY_AI_CONTROL',
        'MASTER_AI_AUTOMATION',
        prev.masterAutomationPaused ? 'PAUSED' : 'ACTIVE',
        nextState ? 'PAUSED' : 'ACTIVE'
      );
      return { ...prev, masterAutomationPaused: nextState };
    });
  };

  const updateTrainingEvaluationTag = (evalId: string, tag: EvaluationTag) => {
    setAiTrainingEvaluations((prev) =>
      prev.map((e) => (e.id === evalId ? { ...e, evaluationTag: tag } : e))
    );
  };

  const generateShoppingPlan = async (intent: string, budget = 1000): Promise<ShoppingPlan | null> => {
    try {
      const res = await fetch('/api/ai/shopping-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent,
          budget,
          availableProducts: products,
        }),
      });
      const data = await res.json();
      if (data?.plan) {
        setActiveAIPlan(data.plan);
        return data.plan;
      }
    } catch (e) {
      console.warn('Failed to fetch plan from server, using local generator:', e);
    }

    // Local fallback plan
    const sampleItem = products[0] || { id: 'p1', name: 'Chicken Inasal Solo', price: 199, merchantId: 'm1' };
    const plan: ShoppingPlan = {
      intent,
      budgetCap: budget,
      estimatedTotal: sampleItem.price * 2,
      servings: 4,
      items: [
        {
          productId: sampleItem.id,
          merchantId: sampleItem.merchantId,
          merchantName: 'Kusina Filipina Heritage',
          name: sampleItem.name,
          price: sampleItem.price,
          quantity: 2,
          category: sampleItem.category,
          rationale: 'Primary sharing meal satisfying intent under budget',
        },
      ],
      confidence: 0.92,
      notes: 'Customer approval required. AI cannot independently spend your money.',
    };
    setActiveAIPlan(plan);
    return plan;
  };

  const applyShoppingPlanToCart = (plan: ShoppingPlan) => {
    plan.items.forEach((it) => {
      const fullProd = products.find((p) => p.id === it.productId);
      const cartItem: OrderItem = {
        id: `ci_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        image: fullProd?.image,
        totalPrice: it.price * it.quantity,
        specialInstructions: `Curated by AI Shopping Agent: ${it.rationale}`,
      };
      addToCart(cartItem);
    });
    setActiveAIPlan(null);
  };

  const runDispatchAI = async (orderId: string) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    if (!targetOrder) return;

    try {
      const res = await fetch('/api/ai/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: 'agent_dispatch',
          action: 'RECOMMEND_DISPATCH',
          prompt: `Find optimal rider for Order #${targetOrder.orderNumber}`,
          context: { order: targetOrder, riders: [riderProfile] },
        }),
      });
      const data = await res.json();

      const newApprovalItem: AIApprovalItem = {
        id: `appr_${Date.now()}`,
        agentId: 'agent_dispatch',
        agentName: 'Dispatch AI Agent',
        action: 'Rider Assignment Recommendation',
        reason:
          data.explanation ||
          `Matched ${riderProfile.name} (Yamaha NMAX) for ${targetOrder.orderNumber}. Proximity: 1.1 km.`,
        confidence: data.confidence || 0.95,
        riskLevel: 'LOW',
        affectedRecord: `Order #${targetOrder.orderNumber} (₱${targetOrder.total})`,
        timeRequested: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        status: 'PENDING',
        payload: {
          orderId: targetOrder.id,
          orderNumber: targetOrder.orderNumber,
          riderId: riderProfile.id,
          riderName: riderProfile.name,
          distanceKm: 1.1,
          vehicle: riderProfile.vehicleType || 'Motorcycle',
          reasonCodes: data.reason_codes || ['PROXIMITY_OPTIMAL', 'AVAILABLE'],
        },
      };

      setAiApprovalQueue((prev) => [newApprovalItem, ...prev]);
    } catch (err) {
      console.error('Failed to run dispatch AI:', err);
    }
  };

  const executeAgentAction = async (
    agentId: string,
    action: string,
    prompt = '',
    payload = {}
  ): Promise<AgentDataContract> => {
    try {
      const res = await fetch('/api/ai/orchestrator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId,
          action,
          prompt,
          payload,
        }),
      });
      const data = await res.json();

      const newActLog: AIAgentActivityLog = {
        id: `act_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        agentId,
        agentName: aiAgents.find((a) => a.id === agentId)?.name || agentId,
        action,
        whatDid: data.explanation || `Executed ${action} via ${agentId}`,
        whyDid: prompt || 'System operational request',
        informationUsed: `Confidence: ${(data.confidence * 100 || 95).toFixed(0)}%`,
        authorizingPolicy: 'POL-SYSTEM-ORCHESTRATION',
        humanApproved: data.requires_human_approval ? false : 'NOT_REQUIRED',
        outcome: data.requires_human_approval ? 'Queued for human approval' : 'Direct execution complete',
        risk: 'LOW',
      };
      setAiActivityLogs((prev) => [newActLog, ...prev]);

      return data;
    } catch (err: any) {
      return {
        agent: agentId,
        action,
        confidence: 0.85,
        reason_codes: ['LOCAL_ERROR_FALLBACK'],
        requires_human_approval: true,
        explanation: 'Local execution fallback: ' + (err?.message || 'Network delay'),
      };
    }
  };

  const classifyTrainingItem = (
    id: string,
    classification: 'GOOD' | 'BAD' | 'ACCEPTABLE' | 'NEEDS_REVIEW' | 'EDGE_CASE',
    reviewer = 'Senior Operations Lead'
  ) => {
    classifyTrainingExample(id, classification, reviewer);
    setAiTrainingDataset([...getAITrainingDataset()]);
  };

  const runSimulation = async (scenarioId: SimulationScenarioId): Promise<SimulationResult> => {
    const candidateRiders: RiderProfile[] = [
      riderProfile,
      {
        id: 'rdr_101',
        name: 'Kuya Jayson Cruz',
        phone: '+63 917 555 0101',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        rating: 4.9,
        totalTrips: 1240,
        vehicleType: 'Yamaha NMAX 155',
        plateNumber: 'NCR 4821 XY',
        isOnline: true,
        status: 'available',
        walletBalance: 3200,
        todayEarnings: { basePay: 480, distancePay: 210, incentives: 100, tips: 150, codCollected: 1200, deductions: 0, netEarnings: 940 },
        coordinates: { lat: 14.532, lng: 120.985 },
      },
      {
        id: 'rdr_203',
        name: 'Arnel Bautista',
        phone: '+63 918 555 0203',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        rating: 4.8,
        totalTrips: 890,
        vehicleType: 'Honda Click 125i',
        plateNumber: 'NCR 9912 AB',
        isOnline: true,
        status: 'available',
        walletBalance: 2100,
        todayEarnings: { basePay: 360, distancePay: 180, incentives: 50, tips: 90, codCollected: 850, deductions: 0, netEarnings: 680 },
        coordinates: { lat: 14.545, lng: 120.998 },
      },
    ];

    const result = await runSimulationScenario(scenarioId, {
      merchants,
      availableRiders: candidateRiders,
      createOrder,
      updateOrderStatus,
      cancelOrder,
      refundOrder,
      createSupportTicket: (ticket: any) => setSupportTickets((prev) => [ticket, ...prev]),
      enqueueAIApproval: (item: any) => setAiApprovalQueue((prev) => [item, ...prev]),
    });

    return result;
  };

  const recordDispatchOverride = (params: {
    order: Order;
    recommendedRiderId: string;
    recommendedRiderName: string;
    selectedRiderId: string;
    selectedRiderName: string;
    overrideReason?: DispatchOverrideReason | string;
    confidence?: number;
    reasonCodes?: string[];
  }) => {
    const decision = recordDispatchDecision({
      order: params.order,
      recommendedRiderId: params.recommendedRiderId,
      recommendedRiderName: params.recommendedRiderName,
      confidence: params.confidence || 0.92,
      reasonCodes: params.reasonCodes || ['PROXIMITY_OPTIMAL', 'FLEET_CAPACITY'],
      selectedRiderId: params.selectedRiderId,
      selectedRiderName: params.selectedRiderName,
      overrideReason: params.overrideReason,
    });
    setAiDecisions([...getAIDecisionRecords()]);
    setAiTrainingDataset([...getAITrainingDataset()]);
    return decision;
  };

  const evaluateRiders = (order: Order) => {
    const candidateRiders: RiderProfile[] = [
      riderProfile,
      {
        id: 'rdr_101',
        name: 'Kuya Jayson Cruz',
        phone: '+63 917 555 0101',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        rating: 4.9,
        totalTrips: 1240,
        vehicleType: 'Yamaha NMAX 155',
        plateNumber: 'NCR 4821 XY',
        isOnline: true,
        status: 'available',
        walletBalance: 3200,
        todayEarnings: { basePay: 480, distancePay: 210, incentives: 100, tips: 150, codCollected: 1200, deductions: 0, netEarnings: 940 },
        coordinates: { lat: 14.532, lng: 120.985 },
      },
      {
        id: 'rdr_203',
        name: 'Arnel Bautista',
        phone: '+63 918 555 0203',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
        rating: 4.8,
        totalTrips: 890,
        vehicleType: 'Honda Click 125i',
        plateNumber: 'NCR 9912 AB',
        isOnline: true,
        status: 'available',
        walletBalance: 2100,
        todayEarnings: { basePay: 360, distancePay: 180, incentives: 50, tips: 90, codCollected: 850, deductions: 0, netEarnings: 680 },
        coordinates: { lat: 14.545, lng: 120.998 },
      },
    ];
    const merchant = merchants.find((m) => m.id === order.merchantId) || merchants[0];
    return evaluateRidersForDispatch(order, candidateRiders, merchant);
  };

  const getOrderEvents = (orderId: string): PlatformEvent[] => {
    return getEventsForOrder(orderId);
  };

  const getOrderChronologicalTimeline = (orderId: string) => {
    return buildChronologicalOrderTimeline(orderId);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        selectedAddress,
        setSelectedAddress,
        cart,
        addToCart,
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
        customerWalletBalance,
        setCustomerWalletBalance,
        isTogoServePlusMember,
        setIsTogoServePlusMember,
        toggleTogoServePlus,
        savedFavorites,
        toggleFavorite,
        reorderPreviousOrder,
        orders,
        createOrder,
        updateOrderStatus,
        cancelOrder,
        refundOrder,
        rateOrder,
        activeMerchantId,
        setActiveMerchantId,
        merchants,
        products,
        setProducts,
        updateProductStock,
        toggleProductAvailability,
        updateMerchantSettings,
        riderProfile,
        toggleRiderOnline,
        activeDeliveryOffer,
        acceptDeliveryOffer,
        declineDeliveryOffer,
        verifyPickup,
        verifyDelivery,
        stepRiderLocation,
        requestPayout,
        remitCod: remitCOD,
        deliveryZones,
        updateDeliveryZone,
        updateZoneSurge,
        supportTickets,
        createSupportTicket,
        resolveSupportTicket,
        codRecords,
        remitCOD,
        reconcileCod,
        auditLogs,
        logAuditEvent,
        resetAllDemoData,
        isDemoControlOpen,
        setIsDemoControlOpen,
        isAIOpen,
        setIsAIOpen,
        aiTab,
        setAITab,
        fastForwardOrder,
        generateDemoOrder,

        // AI Agent Operating System
        aiAgents,
        aiApprovalQueue,
        aiActivityLogs,
        aiTrainingEvaluations,
        aiKnowledgeDocs,
        aiPolicyRules,
        aiSafetyControls,
        activeAIPlan,
        setActiveAIPlan,
        approveAIItem,
        rejectAIItem,
        modifyAIItem,
        escalateAIItem,
        setAgentAutonomy,
        setAgentStatus,
        toggleMasterAutomationPause,
        updateTrainingEvaluationTag,
        generateShoppingPlan,
        applyShoppingPlanToCart,
        runDispatchAI,
        executeAgentAction,

        // Event Engine & AI Observation Layer
        platformEvents,
        aiObservations,
        aiDecisions,
        aiTrainingDataset,
        classifyTrainingItem,
        runSimulation,
        recordDispatchOverride,
        evaluateRiders,
        getOrderEvents,
        getOrderChronologicalTimeline,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
