import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore/lite';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(value => typeof value === 'string' && value.length > 0);
const app = firebaseConfigured ? (getApps()[0] || initializeApp(config)) : null;

export const auth = app ? getAuth(app) : null;
let firestoreInitialization: Promise<Firestore | null> | undefined;

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

export function getFirestoreDatabase(): Promise<Firestore | null> {
  if (!firestoreInitialization) {
    firestoreInitialization = (async () => {
      if (!app) return null;

      const firestoreSdk = await import('firebase/firestore/lite');
      const database = firestoreSdk.getFirestore(app);
      if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
        firestoreSdk.connectFirestoreEmulator(database, '127.0.0.1', 8080);
      }
      return database;
    })();
  }
  return firestoreInitialization;
}

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APP_CHECK_SITE_KEY;
const appCheckEnabled = import.meta.env.VITE_FIREBASE_APP_CHECK_ENABLED === 'true';
export const appCheck = app && appCheckEnabled && appCheckSiteKey
  ? initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    })
  : null;

export async function firebaseRequestHeaders(): Promise<Record<string, string>> {
  if (!auth?.currentUser) throw new Error('Sua sessão expirou. Entre novamente para continuar.');

  const idToken = await auth.currentUser.getIdToken();
  const headers: Record<string, string> = { Authorization: `Bearer ${idToken}` };

  if (appCheck) {
    const appCheckToken = await getToken(appCheck);
    headers['X-Firebase-AppCheck'] = appCheckToken.token;
  }

  return headers;
}
