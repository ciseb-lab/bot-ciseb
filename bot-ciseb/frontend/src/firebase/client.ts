import { initializeApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider, getToken } from 'firebase/app-check';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(config).every(value => typeof value === 'string' && value.length > 0);
const app = firebaseConfigured ? (getApps()[0] || initializeApp(config)) : null;

export const auth = app ? getAuth(app) : null;
export const firestore = app ? getFirestore(app) : null;

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (auth) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  if (firestore) connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
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
