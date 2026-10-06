import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  path: string;
  onRedirectToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  path,
  onRedirectToLogin,
}) => {
  const { isAuthenticated, setIntendedPath } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIntendedPath(path);
      onRedirectToLogin();
    }
  }, [isAuthenticated, path, setIntendedPath, onRedirectToLogin]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
