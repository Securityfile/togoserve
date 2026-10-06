import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser, AuthCredentials } from './authTypes';
import { authService } from './authService';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => { success: boolean; error?: string };
  logout: () => void;
  intendedPath: string | null;
  setIntendedPath: (path: string) => void;
  clearIntendedPath: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getSession());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [intendedPath, setIntendedPathState] = useState<string | null>(() => authService.getIntendedPath());

  const isAuthenticated = !!user;

  // Sync state if localStorage changes in another tab
  useEffect(() => {
    const handleStorageChange = () => {
      const activeSession = authService.getSession();
      setUser(activeSession);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (credentials: AuthCredentials) => {
    setIsLoading(true);
    const result = authService.login(credentials);
    if (result.success && result.user) {
      setUser(result.user);
    }
    setIsLoading(false);
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIntendedPathState(null);
  };

  const setIntendedPath = (path: string) => {
    authService.setIntendedPath(path);
    setIntendedPathState(path);
  };

  const clearIntendedPath = () => {
    authService.clearIntendedPath();
    setIntendedPathState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        intendedPath,
        setIntendedPath,
        clearIntendedPath,
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
