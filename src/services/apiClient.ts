/**
 * TOGO SERVE Production API Client
 * Manages JWT authorization tokens, idempotency keys, and REST API communication.
 */

const AUTH_TOKEN_KEY = 'togoserve_auth_token';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    }
  }

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return this.token;
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  }

  private getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  async post<T>(url: string, body: any, idempotencyKey?: string): Promise<T> {
    const customHeaders: Record<string, string> = {};
    if (idempotencyKey) {
      customHeaders['Idempotency-Key'] = idempotencyKey;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(customHeaders),
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  async patch<T>(url: string, body: any): Promise<T> {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Request failed with status ${res.status}`);
    }
    return res.json();
  }

  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================
  async login(email: string, password: string): Promise<{ token: string; user: UserSession }> {
    const data = await this.post<{ token: string; user: UserSession }>('/api/auth/login', { email, password });
    this.setToken(data.token);
    return data;
  }

  async register(params: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role?: string;
  }): Promise<{ token: string; user: UserSession }> {
    const data = await this.post<{ token: string; user: UserSession }>('/api/auth/register', params);
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ user: UserSession }> {
    return this.get<{ user: UserSession }>('/api/auth/me');
  }

  logout(): void {
    this.setToken(null);
  }

  async requestPasswordReset(email: string): Promise<{ message: string; notice: string }> {
    return this.post<{ message: string; notice: string }>('/api/auth/reset-password-request', { email });
  }

  async updateProfile(updates: { fullName?: string; phone?: string }): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/auth/profile', updates);
  }

  // ==========================================
  // COMMERCE METHODS
  // ==========================================
  async createOrder(params: {
    merchantId: string;
    items: any[];
    paymentMethod: string;
    deliveryAddress: any;
    notes?: string;
    tip?: number;
    discount?: number;
  }): Promise<any> {
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    return this.post('/api/orders', params, idempotencyKey);
  }

  async updateOrderStatus(orderId: string, newStatus: string, riderId?: string): Promise<any> {
    return this.patch(`/api/orders/${orderId}/status`, { newStatus, riderId });
  }

  async verifyPod(orderId: string, pinCode: string, photoUrl?: string, recipientName?: string): Promise<any> {
    return this.post('/api/deliveries/verify-pod', { orderId, pinCode, photoUrl, recipientName });
  }

  // ==========================================
  // REAL-TIME EVENT STREAM LISTENER (SSE)
  // ==========================================
  subscribeRealtime(onEvent: (event: any) => void): () => void {
    if (typeof window === 'undefined') return () => {};

    const token = this.getToken();
    const url = `/api/realtime/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.error('[SSE] Failed to parse event data:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('[SSE] EventSource encountered error or disconnected:', err);
    };

    return () => {
      eventSource.close();
    };
  }
}

export const apiClient = new ApiClient();
