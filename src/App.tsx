import React from 'react';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './auth/AuthProvider';
import { Router } from './navigation/Router';

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router />
      </AppProvider>
    </AuthProvider>
  );
}
