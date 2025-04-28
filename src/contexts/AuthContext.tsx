
import { createContext, useContext, ReactNode } from 'react';
import { useAuthSession, AuthSessionHook } from '@/hooks/useAuthSession';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthSessionHook | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const authSession = useAuthSession();
  const navigate = useNavigate();

  // Run this effect on authentication state changes
  const { isAuthenticated, isAdmin, profile } = authSession;
  
  // This hook already handles all the auth state management we need
  // The navigation is now separate from the hook to avoid circular dependencies
  
  return (
    <AuthContext.Provider value={authSession}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
