import { AuthUser, AuthCredentials } from './authTypes';

export const DEMO_USERNAME = 'testpage2026';
export const DEMO_PASSWORD = 'testpage2026';

export const AUTH_STORAGE_KEY = 'togoserve_demo_auth_session';
export const INTENDED_ROUTE_KEY = 'togoserve_intended_route';

const memoryStore = new Map<string, string>();

function getStorageItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      const val = globalThis.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch {}
  return memoryStore.get(key) || null;
}

function setStorageItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {}
  memoryStore.set(key, value);
}

function removeStorageItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
    if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
      globalThis.localStorage.removeItem(key);
    }
  } catch {}
  memoryStore.delete(key);
}

export class AuthService {
  /**
   * Authenticate against development demo credentials.
   * NOTE: This is a DEVELOPMENT / DEMO authentication mechanism only.
   * It is NOT intended for production security.
   */
  login(credentials: AuthCredentials): { success: boolean; user?: AuthUser; error?: string } {
    const { username, password } = credentials;

    if (!username || !username.trim()) {
      return { success: false, error: 'Username is required.' };
    }

    if (!password) {
      return { success: false, error: 'Password is required.' };
    }

    if (username.trim() !== DEMO_USERNAME || password !== DEMO_PASSWORD) {
      return {
        success: false,
        error: 'Invalid credentials. Please use the development demo credentials (testpage2026 / testpage2026).',
      };
    }

    const user: AuthUser = {
      username: DEMO_USERNAME,
      displayName: 'Demo Platform Operator',
      role: 'admin',
      authenticatedAt: new Date().toISOString(),
      isDemoSession: true,
    };

    setStorageItem(AUTH_STORAGE_KEY, JSON.stringify(user));

    return { success: true, user };
  }

  logout(): void {
    removeStorageItem(AUTH_STORAGE_KEY);
    removeStorageItem(INTENDED_ROUTE_KEY);
  }

  getSession(): AuthUser | null {
    try {
      const stored = getStorageItem(AUTH_STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as AuthUser;
    } catch (err) {
      console.warn('[AuthService] Failed to read stored session:', err);
      return null;
    }
  }

  isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  getIntendedPath(): string | null {
    return getStorageItem(INTENDED_ROUTE_KEY);
  }

  setIntendedPath(path: string): void {
    if (path && path !== '/login' && path !== '/') {
      setStorageItem(INTENDED_ROUTE_KEY, path);
    }
  }

  clearIntendedPath(): void {
    removeStorageItem(INTENDED_ROUTE_KEY);
  }
}

export const authService = new AuthService();
