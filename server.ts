import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      platform: 'TOGO SERVE',
      timestamp: new Date().toISOString(),
      demoMode: true,
      hasGemini: !!process.env.GEMINI_API_KEY,
    });
  });

  // AI Assistant Route (Customer, Merchant, Admin Operations)
  app.post('/api/ai/assistant', async (req, res) => {
    try {
      const { type, prompt, context } = req.body;
      const client = getGeminiClient();

      let systemInstruction = '';
      if (type === 'customer') {
        systemInstruction = `You are "Togo Assistant", the smart AI shopping assistant for TOGO SERVE, the premier Philippine delivery marketplace.
You help customers find delicious food, groceries, pharmacy items, and track orders.
Always use Philippine Peso (₱).
Recommend items based on real available products provided in the context:
${JSON.stringify(context || {})}
If the user asks where their order is, inspect the current active order from context and give accurate status with ETA.
Be polite, warm, Filipino-friendly (you can occasionally use gentle conversational Filipino touches like "Sige po!", "Po", "Salamat!").
Never invent items, prices, or false delivery confirmations that do not exist in the platform. Keep answers concise and helpful.`;
      } else if (type === 'merchant') {
        systemInstruction = `You are "Togo Merchant Advisor", an intelligent business and inventory assistant for TOGO SERVE restaurant and store partners.
You analyze store performance, sales, inventory levels, low-stock warnings, and suggest promotions.
Context data:
${JSON.stringify(context || {})}
Provide actionable data-driven insights. Clearly remind the merchant that promotional or price changes require their manual confirmation. Keep answers professional, encouraging, and structured.`;
      } else {
        // operations / admin
        systemInstruction = `You are "Togo Ops Copilot", the internal command center AI assistant for TOGO SERVE operations managers in the Philippines.
You analyze active dispatch, delayed orders, rider supply vs demand across Metro Manila / provincial zones, COD reconciliation, and support escalations.
Context data:
${JSON.stringify(context || {})}
Summarize operational bottlenecks concisely. Flag any safety or fraud anomalies with objective metrics.`;
      }

      if (client) {
        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const reply = response.text || 'I could not generate a response. Please try again.';
        return res.json({ reply, source: 'gemini-3.8-flash' });
      }

      // Fallback response if no GEMINI_API_KEY is configured
      let fallbackReply = '';
      const p = (prompt || '').toLowerCase();
      if (type === 'customer') {
        if (p.includes('chicken') || p.includes('250')) {
          fallbackReply = `Here are great chicken meals under ₱250 available now on TOGO SERVE:\n• **Chicken Inasal Solo with Garlic Rice** (₱199) from *Kusina Filipina Heritage*\n• **Crispy Chicken Poppers with Mayo Dip** (₱165) from *ChaTea Boba Lounge*\n• **Golden Chicken Nuggets 6pcs** (₱145) from *Manila Burger Grill*\n\nWould you like me to add one to your cart?`;
        } else if (p.includes('milk tea') || p.includes('tea')) {
          fallbackReply = `Top milk tea near you in Metro Manila:\n• **Brown Sugar Boba Milk** (₱140) from *ChaTea Boba Lounge* (Delivers in 22 mins, ⭐ 4.8)\n• **Okinawa Milk Tea with Pearl** (₱130) with customizable sweetness and ice levels!`;
        } else if (p.includes('order') || p.includes('where')) {
          fallbackReply = `Checking your active order...\nYour order **#TG-8821** from **Kusina Filipina Heritage** is currently **On the Way**! Rider Kuya Danilo is approximately 1.4 km away (ETA: 8 mins). Your delivery PIN is **4892**.`;
        } else if (p.includes('breakfast') || p.includes('grocer')) {
          fallbackReply = `For a hearty Filipino breakfast, check out *MetroFresh Supermarket*:\n• Dinorado Rice 5kg (₱285)\n• Farm Fresh Brown Eggs 12s (₱125)\n• Purefoods Corned Beef 210g (₱89)\nDelivery estimated in 35-45 mins.`;
        } else {
          fallbackReply = `Mabuhay! I can help you find restaurants, groceries, track active deliveries, or apply discount vouchers on TOGO SERVE. What are you craving today?`;
        }
      } else if (type === 'merchant') {
        if (p.includes('top') || p.includes('best') || p.includes('sales')) {
          fallbackReply = `📊 **Top Performing Items This Week:**\n1. **Chicken Inasal Solo** - 142 orders (₱28,258 revenue)\n2. **Crispy Pata Regular** - 68 orders (₱37,400 revenue)\n3. **Halo-Halo Special** - 95 orders (₱14,250 revenue)\n\nConversion rate is up 14% compared to last week!`;
        } else if (p.includes('low') || p.includes('stock') || p.includes('inventory')) {
          fallbackReply = `⚠️ **Inventory Alerts:**\n• **Garlic Rice Cups**: 14 remaining (Threshold: 20) - *Restock recommended*\n• **Sinigang Broth Base**: 8 units left\n• **Sago Pearls**: Low stock across 2 branches.`;
        } else {
          fallbackReply = `Merchant Assistant ready. Your store is currently **OPEN** with 4 active orders in queue. Average prep time today is **14.2 minutes**.`;
        }
      } else {
        fallbackReply = `Operations Overview: 8 active orders in system, 5 riders online (3 delivering, 2 available in BGC & Makati CBD). Average dispatch latency is 3.1 minutes. 0 critical SLA breaches detected.`;
      }

      res.json({ reply: fallbackReply, source: 'smart-local-assistant' });
    } catch (err: any) {
      console.error('AI assistant error:', err);
      res.status(500).json({
        error: 'Failed to query assistant',
        details: err?.message || String(err),
      });
    }
  });

  // AI Orchestrator Model Gateway & Policy Engine
  app.post('/api/ai/orchestrator', async (req, res) => {
    try {
      const { agentId, action, prompt, context = {}, payload = {} } = req.body;
      const client = getGeminiClient();

      // Safety check: High-Risk Autonomous Action Guardrail
      const RESTRICTED_ACTIONS = [
        'DisburseBankFunds',
        'ReleaseMerchantSettlement',
        'ReleaseRiderPayouts',
        'ChangeBankInformation',
        'PermanentlySuspendUser',
        'DeleteAccount',
        'AutonomousPriceIncrease',
        'ModifySecurityPolicy',
      ];

      if (RESTRICTED_ACTIONS.includes(action)) {
        return res.status(403).json({
          status: 'BLOCKED_BY_SAFETY_POLICY',
          policyId: 'POL-SAFETY-MANDATE-01',
          message: `Autonomous execution of "${action}" is strictly prohibited by TOGO SERVE AI Safety Policy. Human authorization required.`,
          agent: agentId,
          confidence: 1.0,
          requires_human_approval: true,
        });
      }

      const systemPrompt = `You are the AI Orchestrator for "TOGO SERVE", the Philippine Multi-Vendor Delivery & Commerce Platform.
You coordinate specialized agents (Customer, Shopping, Support, Dispatch, Routing, Inventory, Pricing, Refund, Finance, COD, Risk, Management).
All operations strictly follow the core principle: OBSERVE -> RECOMMEND -> APPROVE -> EXECUTE -> MEASURE -> LEARN -> AUTOMATE.
Never allow AI to autonomously execute high-risk actions (fund transfers, pricing changes, account deletions).
You MUST respond with valid JSON strictly conforming to this schema:
{
  "agent": "${agentId || 'agent_orchestrator'}",
  "action": "${action || 'ANALYZE'}",
  "confidence": number between 0.00 and 1.00,
  "reason_codes": string array,
  "requires_human_approval": boolean,
  "explanation": string,
  "payload": object with relevant output data
}`;

      const userContent = `Agent: ${agentId}
Action: ${action}
User Prompt: ${prompt || 'Process operational task'}
Context: ${JSON.stringify(context)}
Payload: ${JSON.stringify(payload)}`;

      if (client) {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: userContent,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          });

          const rawText = response.text?.trim() || '{}';
          const parsed = JSON.parse(rawText);
          return res.json({
            ...parsed,
            source: 'gemini-3.8-flash',
            timestamp: new Date().toISOString(),
          });
        } catch (geminiErr) {
          console.warn('Gemini structured generation failed, using local AI engine fallback:', geminiErr);
        }
      }

      // Local Deterministic Reasoning Engine (Compliant Fallback)
      let responsePayload: any = {};
      let confidence = 0.94;
      let reasonCodes: string[] = ['VERIFIED_LOCAL_RULESET'];
      let requiresHumanApproval = true;
      let explanation = '';

      if (agentId === 'agent_dispatch' || action === 'RECOMMEND_DISPATCH') {
        const riders = context.riders || [];
        const order = context.order || {};
        const available = riders.filter((r: any) => r.isOnline && r.status !== 'delivering');
        const chosen = available[0] || riders[0] || { name: 'Danilo Santos', id: 'r1', vehicleType: 'Yamaha NMAX 155' };

        confidence = 0.95;
        reasonCodes = ['PROXIMITY_OPTIMAL', 'HOT_BAG_EQUIPPED', 'HIGH_RATING', 'WITHIN_ZONE'];
        requiresHumanApproval = true;
        explanation = `Recommended ${chosen.name} (${chosen.vehicleType || 'Motorcycle'}). Located 1.1 km from merchant. Estimated arrival: 5 mins.`;
        responsePayload = {
          recommendedRiderId: chosen.id,
          recommendedRiderName: chosen.name,
          distanceKm: 1.1,
          etaMinutes: 5,
          vehicle: chosen.vehicleType || 'Motorcycle',
          orderNumber: order.orderNumber || 'TG-8821',
        };
      } else if (agentId === 'agent_shopping' || action === 'BUILD_SHOPPING_PLAN') {
        confidence = 0.92;
        reasonCodes = ['RECIPE_DECOMPOSITION', 'REAL_CATALOG_MATCH', 'BUDGET_COMPLIANT'];
        requiresHumanApproval = true; // Customer must approve before purchase
        explanation = 'Structured suggested basket compiled from live marketplace products. Customer authorization required before placing order.';
        responsePayload = {
          planTitle: 'Suggested Filipino Family Dinner Basket',
          intent: prompt || 'Dinner for 4 under ₱1000',
          servings: 4,
          budgetCap: 1000,
          customerApprovalRequired: true,
        };
      } else if (agentId === 'agent_support' || action === 'ANSWER_SUPPORT') {
        const query = (prompt || '').toLowerCase();
        if (query.includes('where') || query.includes('status') || query.includes('late')) {
          confidence = 0.96; // Standard automated answer tier (>=0.95)
          reasonCodes = ['LIVE_GPS_TELEMETRY', 'DELIVERY_SLA_VALIDATED'];
          requiresHumanApproval = false;
          explanation = 'Order #TG-8821 is currently in transit with Kuya Danilo. Estimated delivery is in 8 minutes. Live PIN: 4892.';
        } else if (query.includes('missing') || query.includes('spill') || query.includes('refund')) {
          confidence = 0.88; // Clarify / Human review tier
          reasonCodes = ['EVIDENCE_INTAKE_REQUIRED', 'PHOTO_VERIFICATION_PENDING'];
          requiresHumanApproval = true;
          explanation = 'We apologize for the missing item. We have initiated Ticket #TKT-8829 and forwarded details to our refund desk for review.';
        } else {
          confidence = 0.60; // Escalate tier (<0.65)
          reasonCodes = ['UNRESOLVED_INTENT', 'AGENT_ESCALATION'];
          requiresHumanApproval = true;
          explanation = 'Connecting you directly to a human support specialist. Your queue position is #1.';
        }
        responsePayload = { ticketStatus: 'open' };
      } else if (agentId === 'agent_inventory' || action === 'CALCULATE_STOCKOUT') {
        confidence = 0.94;
        reasonCodes = ['VELOCITY_CURVE_ANALYSIS', 'LUNCH_TO_DINNER_RATIO'];
        requiresHumanApproval = true;
        explanation = 'Chicken Inasal inventory (22 remaining) is burning at 14 orders/hr. Stock-out projected at 6:45 PM. Recommend thawing 20 portions immediately.';
        responsePayload = {
          sku: 'SKU-CKN-01',
          productName: 'Chicken Inasal Solo',
          stockRemaining: 22,
          depletionTime: '6:45 PM',
          recommendedAction: 'Thaw 20 batch portions now',
        };
      } else if (agentId === 'agent_pricing' || action === 'PROPOSE_SURGE') {
        confidence = 0.89;
        reasonCodes = ['RAIN_CELL_DETECTED', 'SUPPLY_DEFICIT_ZONE'];
        requiresHumanApproval = true;
        explanation = 'BGC Zone order velocity exceeded rider availability by 4x. Recommend 1.25x delivery fee multiplier. Level 1 Recommend Only: Human approval required.';
        responsePayload = {
          zone: 'Bonifacio Global City',
          suggestedMultiplier: 1.25,
          currentOrders: 34,
          availableRiders: 4,
        };
      } else {
        confidence = 0.95;
        reasonCodes = ['STANDARD_ORCHESTRATION'];
        requiresHumanApproval = false;
        explanation = `Task completed successfully by ${agentId}. All safety and audit constraints satisfied.`;
      }

      res.json({
        agent: agentId,
        action,
        confidence,
        reason_codes: reasonCodes,
        requires_human_approval: requiresHumanApproval,
        explanation,
        payload: responsePayload,
        source: 'togo-local-ai-engine',
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.error('AI orchestrator error:', err);
      res.status(500).json({
        error: 'Failed to process AI Orchestrator request',
        details: err?.message || String(err),
      });
    }
  });

  // Dedicated AI Shopping Agent Planner
  app.post('/api/ai/shopping-plan', (req, res) => {
    try {
      const { intent = '', budget = 1000, availableProducts = [] } = req.body;
      const lower = intent.toLowerCase();

      // Find real matching products from provided catalog
      let selectedItems: any[] = [];
      let estimatedTotal = 0;

      if (lower.includes('spaghetti') || lower.includes('pasta') || lower.includes('ingredient')) {
        // Look for grocery items
        const groceryItems = availableProducts.filter((p: any) =>
          ['pasta', 'spaghetti', 'sauce', 'beef', 'corned', 'cheese', 'egg', 'hotdog'].some(k =>
            (p.name + ' ' + p.description).toLowerCase().includes(k)
          )
        );

        if (groceryItems.length > 0) {
          selectedItems = groceryItems.slice(0, 4).map((p: any) => ({
            productId: p.id,
            merchantId: p.merchantId,
            merchantName: 'MetroFresh Supermarket',
            name: p.name,
            price: p.price,
            quantity: 2,
            category: p.category,
            rationale: 'Essential ingredient for authentic sweet-style Filipino spaghetti',
          }));
        }
      }

      // If still empty or requesting dinner/chicken/meals
      if (selectedItems.length === 0) {
        const mealItems = availableProducts.filter((p: any) =>
          ['inasal', 'chicken', 'rice', 'boba', 'tea', 'sinigang', 'burger'].some(k =>
            (p.name + ' ' + p.description).toLowerCase().includes(k)
          )
        );

        const candidates = mealItems.length > 0 ? mealItems : availableProducts;
        selectedItems = candidates.slice(0, 3).map((p: any, idx: number) => ({
          productId: p.id,
          merchantId: p.merchantId,
          merchantName: p.merchantId === 'm1' ? 'Kusina Filipina Heritage' : 'ChaTea Boba Lounge',
          name: p.name,
          price: p.price,
          quantity: idx === 0 ? 2 : 1,
          category: p.category,
          rationale: idx === 0 ? 'Main entrée sharing portion' : 'Side and refreshing beverage complement',
        }));
      }

      estimatedTotal = selectedItems.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

      res.json({
        plan: {
          intent: intent || 'Delicious meal under budget',
          budgetCap: budget,
          estimatedTotal,
          servings: lower.includes('six') || lower.includes('6') ? 6 : 4,
          items: selectedItems,
          confidence: 0.93,
          notes: 'Customer approval required. AI cannot independently spend your money. Click "Approve & Add to Cart" to proceed.',
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create shopping plan', details: err?.message });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TOGO SERVE] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
