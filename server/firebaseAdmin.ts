import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const projectId = process.env.FIREBASE_PROJECT_ID
  || process.env.GOOGLE_CLOUD_PROJECT
  || process.env.GCLOUD_PROJECT;

export const firebaseAdminApp = projectId
  ? (() => {
      try {
        return getApps()[0] || initializeApp({ credential: applicationDefault(), projectId });
      } catch (err) {
        console.warn('Firebase Admin default credentials not available:', err);
        return null;
      }
    })()
  : null;

export const adminAuth = firebaseAdminApp ? getAuth(firebaseAdminApp) : null;
export const adminAppCheck = firebaseAdminApp ? getAppCheck(firebaseAdminApp) : null;
export const adminFirestore = firebaseAdminApp ? getFirestore(firebaseAdminApp) : null;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(firebaseAdminApp && adminAuth && adminAppCheck && adminFirestore);
}
