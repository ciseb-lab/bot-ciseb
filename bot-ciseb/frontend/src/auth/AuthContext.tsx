import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, firebaseConfigured } from '../firebase/client.ts';
import { isInstitutionalEmail } from '../../../shared/authPolicy.ts';

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  initializationError: string | null;
  profileSyncError: string | null;
  accessError: string | null;
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function authPolicyError(code: string): Error & { code: string } {
  return Object.assign(new Error('A conta não atende à política de acesso institucional.'), { code });
}

async function getGoogleInstitutionalUser(user: User): Promise<boolean> {
  if (!user.emailVerified || !isInstitutionalEmail(user.email || '')) return false;
  const token = await user.getIdTokenResult();
  const firebaseClaims = token.claims.firebase;
  return typeof firebaseClaims === 'object'
    && firebaseClaims !== null
    && 'sign_in_provider' in firebaseClaims
    && firebaseClaims.sign_in_provider === 'google.com';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initializationError, setInitializationError] = useState<string | null>(null);
  const [profileSyncError, setProfileSyncError] = useState<string | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);

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
      try {
        await getRedirectResult(firebaseAuth);
      } catch {
        if (active) setAccessError('Não foi possível concluir o retorno do login Google. Tente entrar novamente.');
      }
      if (!active) return;
      unsubscribe = onAuthStateChanged(firebaseAuth, async nextUser => {
        if (!active) return;
        let isAuthorized = false;
        try {
          isAuthorized = nextUser ? await getGoogleInstitutionalUser(nextUser) : false;
        } catch {
          if (active) {
            setAccessError('Não foi possível validar sua sessão. Verifique a conexão e tente entrar novamente.');
            setUser(null);
            setLoading(false);
          }
          return;
        }
        if (nextUser && !isAuthorized) {
          const errorMessage = !isInstitutionalEmail(nextUser.email || '')
            ? 'Use uma conta Google dos domínios @escola.seduc.pa.gov.br ou @seduc.pa.gov.br.'
            : 'Entre usando o provedor Google com seu e-mail institucional verificado.';
          try {
            await signOut(firebaseAuth);
          } catch {
            if (active) setInitializationError('Não foi possível encerrar uma sessão não autorizada. Recarregue o aplicativo ou procure o suporte.');
          }
          if (active) {
            setAccessError(errorMessage);
            setUser(null);
            setLoading(false);
          }
          return;
        }

        setAccessError(null);
        setUser(nextUser);
        setLoading(false);
        if (nextUser?.email) {
          const userEmail = nextUser.email;
          void import('../data/userProfileStore.ts')
            .then(({ ensureUserProfile }) => ensureUserProfile(nextUser.uid, userEmail))
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

  const signInWithGoogle = useCallback(async () => {
    if (!auth) throw authPolicyError('auth/not-configured');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    auth.languageCode = 'pt-BR';

    if (window.matchMedia('(max-width: 640px)').matches) {
      await signInWithRedirect(auth, provider);
      return;
    }

    const credential = await signInWithPopup(auth, provider);
    if (!(await getGoogleInstitutionalUser(credential.user))) {
      try {
        await signOut(auth);
      } catch {
        throw authPolicyError('auth/session-cleanup-failed');
      }
      if (!isInstitutionalEmail(credential.user.email || '')) {
        throw authPolicyError('auth/domain-not-authorized');
      }
      throw authPolicyError('auth/google-email-not-verified');
    }
  }, []);

  const logout = useCallback(async () => {
    if (auth) await signOut(auth);
  }, []);

  const value = useMemo(() => ({
    configured: firebaseConfigured,
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
