import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, UserSession } from '../services/apiClient';

export interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (params: { email: string; pass: string; fullName: string; phone: string; role?: string }) => Promise<void>;
  logout: () => void;
  switchTestPersona: (email: string, pass: string) => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'login' | 'register' | 'forgot';
  setAuthModalMode: (mode: 'login' | 'register' | 'forgot') => void;
  updateProfile: (fullName: string, phone: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Real seed credentials created in SQLite database for authorized testing
export const TEST_PERSONAS = [
  {
    role: 'customer',
    label: 'Customer (Maria Santos)',
    email: 'customer@togoserve.com',
    pass: 'Customer123!',
    tag: 'Buyer / Consumer',
  },
  {
    role: 'merchant',
    label: 'Merchant (Chef Eduardo)',
    email: 'merchant@kusinafilipina.ph',
    pass: 'Merchant123!',
    tag: 'Restaurant Partner',
  },
  {
    role: 'business_owner',
    label: 'Business Owner (Carmelo Ramos)',
    email: 'owner@metrofresh.ph',
    pass: 'Owner123!',
    tag: 'Supermarket Owner',
  },
  {
    role: 'rider',
    label: 'Rider (Danilo Santos)',
    email: 'rider@togoserve.com',
    pass: 'Rider123!',
    tag: 'Active Courier',
  },
  {
    role: 'admin',
    label: 'Platform Admin',
    email: 'admin@togoserve.com',
    pass: 'AdminPass2026!',
    tag: 'Full Governance',
  },
  {
    role: 'platform_operator',
    label: 'Dispatch Operator',
    email: 'operator@togoserve.com',
    pass: 'Operator2026!',
    tag: 'Metro Operations',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(apiClient.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | 'forgot'>('login');

  useEffect(() => {
    async function loadUser() {
      const storedToken = apiClient.getToken();
      if (!storedToken) {
        // Automatically sign in as default customer for smooth initial load
        try {
          const res = await apiClient.login('customer@togoserve.com', 'Customer123!');
          setUser(res.user);
          setToken(res.token);
        } catch (err) {
          console.warn('[AuthContext] Automatic bootstrap session skipped:', err);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const { user: profile } = await apiClient.getMe();
        setUser(profile);
        setToken(storedToken);
      } catch (err) {
        console.warn('[AuthContext] Stored token invalid, logging out:', err);
        apiClient.logout();
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.login(email, pass);
      setUser(res.user);
      setToken(res.token);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (params: {
    email: string;
    pass: string;
    fullName: string;
    phone: string;
    role?: string;
  }) => {
    setIsLoading(true);
    try {
      const res = await apiClient.register({
        email: params.email,
        password: params.pass,
        fullName: params.fullName,
        phone: params.phone,
        role: params.role || 'customer',
      });
      setUser(res.user);
      setToken(res.token);
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    apiClient.logout();
    setUser(null);
    setToken(null);
  };

  const switchTestPersona = async (email: string, pass: string) => {
    await login(email, pass);
  };

  const updateProfile = async (fullName: string, phone: string) => {
    await apiClient.updateProfile({ fullName, phone });
    if (user) {
      setUser({ ...user, fullName, phone });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        switchTestPersona,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
