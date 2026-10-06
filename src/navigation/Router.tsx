import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { PublicLandingPage } from '../components/public/PublicLandingPage';
import { LoginPage } from '../components/auth/LoginPage';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { Header } from '../components/common/Header';
import { AIAssistantModal } from '../components/common/AIAssistantModal';
import { RealtimeListener } from '../components/common/RealtimeListener';
import { CustomerApp } from '../components/customer/CustomerApp';
import { MerchantPortal } from '../components/merchant/MerchantPortal';
import { RiderApp } from '../components/rider/RiderApp';
import { AdminPortal } from '../components/admin/AdminPortal';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface RouterContextType {
  currentPath: string;
  navigate: (path: string) => void;
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
};

function normalizePath(rawPath: string): string {
  // Handle empty or trailing slashes (except root)
  if (!rawPath || rawPath === '') return '/';
  // Strip trailing slash if longer than 1 character
  const clean = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
  return clean.toLowerCase();
}

export const Router: React.FC = () => {
  const { isAuthenticated, logout, intendedPath, clearIntendedPath } = useAuth();
  const { role, setRole } = useApp();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return normalizePath(window.location.pathname);
    }
    return '/';
  });

  const navigate = (newPath: string) => {
    const normalized = normalizePath(newPath);
    if (typeof window !== 'undefined') {
      if (window.location.pathname !== normalized) {
        window.history.pushState({}, '', normalized);
      }
    }
    setCurrentPath(normalized);
  };

  // Listen to browser Back/Forward popstate events
  useEffect(() => {
    const handlePopState = () => {
      const path = normalizePath(window.location.pathname);
      setCurrentPath(path);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Synchronize path with AppContext role when navigating between internal dashboards
  useEffect(() => {
    if (currentPath === '/customer' && role !== 'customer') {
      setRole('customer');
    } else if ((currentPath === '/merchant' || currentPath.startsWith('/merchant/')) && role !== 'merchant') {
      setRole('merchant');
    } else if (currentPath === '/rider' && role !== 'rider') {
      setRole('rider');
    } else if ((currentPath === '/admin' || currentPath === '/ai-command-center' || currentPath === '/control-tower') && role !== 'admin') {
      setRole('admin');
    }
  }, [currentPath, role, setRole]);

  // When role changes via Header switcher, update URL path
  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    navigate(`/${newRole}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLoginSuccess = () => {
    const target = intendedPath || '/customer';
    clearIntendedPath();
    navigate(target);
  };

  // ROUTE DISPATCH LOGIC
  // 1. Public Landing Page: "/"
  if (currentPath === '/') {
    return (
      <RouterContext.Provider value={{ currentPath, navigate }}>
        <PublicLandingPage onNavigateToLogin={() => navigate('/login')} />
      </RouterContext.Provider>
    );
  }

  // 2. Login Page: "/login"
  if (currentPath === '/login') {
    // If already authenticated, redirect to customer dashboard or intended path
    if (isAuthenticated) {
      const target = intendedPath || '/customer';
      clearIntendedPath();
      navigate(target);
      return null;
    }

    return (
      <RouterContext.Provider value={{ currentPath, navigate }}>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigateHome={() => navigate('/')}
        />
      </RouterContext.Provider>
    );
  }

  // 3. Protected Internal Routes (requires authentication)
  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      <ProtectedRoute path={currentPath} onRedirectToLogin={() => navigate('/login')}>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
          <Header onLogout={handleLogout} onSelectRole={handleRoleChange} />

          <main className="flex-1">
            {role === 'customer' && <CustomerApp />}
            {role === 'merchant' && <MerchantPortal />}
            {role === 'rider' && <RiderApp />}
            {role === 'admin' && <AdminPortal />}
          </main>

          {/* Global Overlays & Modals */}
          <AIAssistantModal />
          <RealtimeListener />

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
                    AI-Native Commerce & On-Demand Logistics • Metro Manila, PH
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px]">
                <button
                  onClick={handleLogout}
                  className="text-rose-400 hover:text-rose-300 font-semibold underline"
                >
                  Logout of Session
                </button>
                <span>•</span>
                <span>Development Demo Mode</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Active Session: testpage2026</span>
              </div>
            </div>
          </footer>
        </div>
      </ProtectedRoute>
    </RouterContext.Provider>
  );
};
