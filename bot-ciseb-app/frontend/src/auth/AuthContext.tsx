import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { isInstitutionalEmail } from '../../../shared/authPolicy.ts';
import { supabase, supabaseConfigured } from '../supabase/client.ts';

export interface InstitutionalUser {
  uid: string;
  email: string;
  emailVerified: true;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  initializationError: string | null;
  profileSyncError: string | null;
  accessError: string | null;
  user: InstitutionalUser | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toInstitutionalUser(user: SupabaseUser): InstitutionalUser {
  const providers = user.app_metadata.providers;
  if (typeof user.email !== 'string'
    || !isInstitutionalEmail(user.email)
    || typeof user.email_confirmed_at !== 'string'
    || (user.app_metadata.provider !== 'google'
      && !(Array.isArray(providers) && providers.includes('google')))) {
    throw new Error('A conta não atende à política de acesso institucional.');
  }
  return { uid: user.id, email: user.email.toLowerCase(), emailVerified: true };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<InstitutionalUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      return;
    }

    let active = true;
    const applyUser = (nextUser: SupabaseUser | null) => {
      if (!active) return;
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        setUser(toInstitutionalUser(nextUser));
        setAccessError(null);
      } catch {
        setUser(null);
        setAccessError('Use uma conta Google verificada de um domínio institucional autorizado.');
        window.setTimeout(() => { void client.auth.signOut(); }, 0);
      }
      setLoading(false);
    };

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user || null);
    });
    void client.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        applyUser(data.session?.user || null);
      })
      .catch(() => {
        if (active) {
          setInitializationError('Não foi possível restaurar sua sessão. Verifique a conexão e tente novamente.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;
    const client = supabase;
    let active = true;
    void Promise.resolve()
      .then(async () => {
        const { error } = await client.from('profiles').upsert({
          id: user.uid,
          email: user.email,
        }, { onConflict: 'id' });
        if (error) throw error;
        if (active) setProfileSyncError(null);
      })
      .catch(() => {
        if (active) setProfileSyncError('Não foi possível sincronizar os dados básicos da conta. O histórico pode ficar indisponível até a conexão ser restabelecida.');
      });
    return () => { active = false; };
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabase) throw Object.assign(new Error('Autenticação não configurada.'), { code: 'auth/not-configured' });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: { prompt: 'select_account' },
      },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(() => ({
    configured: supabaseConfigured,
    loading,
    initializationError,
    profileSyncError,
    accessError,
    user,
    signInWithGoogle,
    logout,
  }), [loading, initializationError, profileSyncError, accessError, user, signInWithGoogle, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return value;
}
