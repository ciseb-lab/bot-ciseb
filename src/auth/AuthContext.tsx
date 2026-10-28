import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase/client.ts';
import { isInstitutionalEmail } from '../config/authPolicy.ts';
import { ensureUserProfile } from '../data/userProfileStore.ts';

interface AuthContextValue {
  configured: boolean;
  registrationEnabled: boolean;
  loading: boolean;
  initializationError: string | null;
  profileSyncError: string | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  refreshVerification: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authPolicyError(code: string): Error & { code: string } {
  return Object.assign(new Error('A solicitação não atende à política de acesso institucional.'), { code });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);

  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }

    let active = true;
    let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        await setPersistence(firebaseAuth, browserLocalPersistence);
      } catch {
        if (active) setInitializationError('Não foi possível habilitar a persistência segura da sessão neste navegador.');
      }
      if (!active) return;
      unsubscribe = onAuthStateChanged(firebaseAuth, async nextUser => {
        if (!active) return;
        if (nextUser && !isInstitutionalEmail(nextUser.email || '')) {
          await signOut(firebaseAuth);
          if (active) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        setUser(nextUser);
        setLoading(false);
        if (nextUser?.emailVerified && nextUser.email) {
          void ensureUserProfile(nextUser.uid, nextUser.email)
            .then(() => { if (active) setProfileSyncError(null); })
            .catch(() => {
              if (active) setProfileSyncError('Não foi possível sincronizar os dados básicos da conta. O histórico pode ficar indisponível até a conexão ser restabelecida.');
            });
        } else {
          setProfileSyncError(null);
        }
      });
    })();

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!auth) throw authPolicyError('auth/not-configured');
    const normalizedEmail = email.trim().toLowerCase();
    if (!isInstitutionalEmail(normalizedEmail)) throw authPolicyError('auth/domain-not-authorized');
    await signInWithEmailAndPassword(auth, normalizedEmail, password);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    if (!auth) throw authPolicyError('auth/not-configured');
    if (import.meta.env.VITE_ALLOW_INSTITUTIONAL_SIGNUP !== 'true') {
      throw new Error('O cadastro institucional está temporariamente desabilitado.');
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (!isInstitutionalEmail(normalizedEmail)) throw authPolicyError('auth/domain-not-authorized');
    const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    auth.languageCode = 'pt-BR';
    await sendEmailVerification(credential.user);
  }, []);

  const sendVerification = useCallback(async () => {
    if (!auth?.currentUser) throw new Error('Entre novamente para solicitar a verificação.');
    if (!isInstitutionalEmail(auth.currentUser.email || '')) throw new Error('O e-mail não pertence ao domínio institucional autorizado.');
    auth.languageCode = 'pt-BR';
    await sendEmailVerification(auth.currentUser);
  }, []);

  const refreshVerification = useCallback(async () => {
    if (!auth?.currentUser) throw new Error('Entre novamente para confirmar sua sessão.');
    await reload(auth.currentUser);
    setUser(auth.currentUser);
    if (auth.currentUser.emailVerified) {
      await auth.currentUser.getIdToken(true);
      if (auth.currentUser.email) {
        try {
          await ensureUserProfile(auth.currentUser.uid, auth.currentUser.email);
          setProfileSyncError(null);
        } catch {
          setProfileSyncError('Não foi possível sincronizar os dados básicos da conta. O histórico pode ficar indisponível até a conexão ser restabelecida.');
        }
      }
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!auth) throw authPolicyError('auth/not-configured');
    const normalizedEmail = email.trim().toLowerCase();
    if (!isInstitutionalEmail(normalizedEmail)) throw authPolicyError('auth/domain-not-authorized');
    auth.languageCode = 'pt-BR';
    await sendPasswordResetEmail(auth, normalizedEmail);
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo(() => ({
    configured: firebaseConfigured,
    registrationEnabled: import.meta.env.VITE_ALLOW_INSTITUTIONAL_SIGNUP === 'true',
    loading,
    initializationError,
    profileSyncError,
    user,
    signIn,
    register,
    sendVerification,
    refreshVerification,
    resetPassword,
    logout,
  }), [loading, user, initializationError, profileSyncError, signIn, register, sendVerification, refreshVerification, resetPassword, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth deve ser utilizado dentro de AuthProvider.');
  return value;
}
