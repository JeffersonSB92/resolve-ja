'use client';

import { Session } from '@supabase/supabase-js';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getMe } from '@/features/auth/api';
import {
  AuthContextValue,
  MeResponse,
  SignInInput,
  SignUpInput,
} from '@/features/auth/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

const supabase = getSupabaseBrowserClient();

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadMe = useCallback(async (token: string): Promise<MeResponse | null> => {
    try {
      const meData = await getMe(token);
      setMe(meData);
      return meData;
    } catch {
      setMe(null);
      return null;
    }
  }, []);

  const applySession = useCallback(
    async (nextSession: Session | null): Promise<void> => {
      setSession(nextSession);

      const token = nextSession?.access_token ?? null;
      setAccessToken(token);

      if (!token) {
        setMe(null);
        return;
      }

      await loadMe(token);
    },
    [loadMe],
  );

  useEffect(() => {
    let mounted = true;

    const boot = async () => {
      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      await applySession(data.session ?? null);
      setIsLoading(false);
    };

    void boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signIn = useCallback(
    async ({ email, password }: SignInInput): Promise<void> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        throw new Error('E-mail ou senha inválidos.');
      }

      if (!data.session?.access_token) {
        throw new Error('Não foi possível iniciar a sessão.');
      }

      await applySession(data.session);
    },
    [applySession],
  );

  const signUp = useCallback(
    async ({ fullName, email, password }: SignUpInput): Promise<void> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Não foi possível criar sua conta.');
      }

      if (!data.session?.access_token) {
        throw new Error('Conta criada. Confirme seu e-mail antes de entrar.');
      }

      await applySession(data.session);
    },
    [applySession],
  );

  const signOut = useCallback(async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error('Não foi possível encerrar a sessão.');
    }

    await applySession(null);
  }, [applySession]);

  const refreshMe = useCallback(async (): Promise<MeResponse | null> => {
    if (!accessToken) {
      setMe(null);
      return null;
    }

    return loadMe(accessToken);
  }, [accessToken, loadMe]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      accessToken,
      me,
      isLoading,
      isAuthenticated: Boolean(session && accessToken),
      signIn,
      signUp,
      signOut,
      refreshMe,
    }),
    [accessToken, isLoading, me, refreshMe, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
