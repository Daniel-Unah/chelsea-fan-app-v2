import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

import { getSupabaseClient } from '@/lib/supabase/client';

type AuthContextValue = {
  session: Session | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isLoading: true,
  isLoggedIn: false,
  isConfigured: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = getSupabaseClient() !== null;

  useEffect(() => {
    const client = getSupabaseClient();

    if (!client) {
      return;
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading: isConfigured ? isLoading : false,
        isLoggedIn: session !== null,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
