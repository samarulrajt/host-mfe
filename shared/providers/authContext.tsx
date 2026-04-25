import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { emitAuthChanged } from '../eventBus';
import type { AuthUser } from '../contracts/auth';

type AuthContextValue = {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  currentUser: AuthUser | null;
  signOut: () => void;
  source?: 'host' | 'standalone';
  children: ReactNode;
};

export function AuthProvider({ currentUser, signOut, source = 'host', children }: AuthProviderProps) {
  useEffect(() => {
    emitAuthChanged({
      isAuthenticated: Boolean(currentUser),
      userName: currentUser?.name ?? null,
      source,
    });
  }, [currentUser, source]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}

export function useOptionalAuth() {
  return useContext(AuthContext);
}
