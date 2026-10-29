import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAppCheck } from 'firebase-admin/app-check';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function readServiceAccount(): FirebaseServiceAccount | null {
  const rawCredentials = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) return null;

  let credentials: unknown;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON precisa conter JSON válido de service account.');
  }

  if (!credentials || typeof credentials !== 'object') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON precisa conter credenciais de service account válidas.');
  }

  const value = credentials as Record<string, unknown>;
  const projectId = value.project_id;
  const clientEmail = value.client_email;
  const privateKey = value.private_key;
  if (typeof projectId !== 'string' || !projectId
    || typeof clientEmail !== 'string' || !clientEmail
    || typeof privateKey !== 'string' || !privateKey) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não contém os campos obrigatórios.');
  }

  return {
    projectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  };
}

const serviceAccount = readServiceAccount();
const configuredProjectId = process.env.FIREBASE_PROJECT_ID
  || process.env.GOOGLE_CLOUD_PROJECT
  || process.env.GCLOUD_PROJECT;
if (serviceAccount && configuredProjectId && serviceAccount.projectId !== configuredProjectId) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON e FIREBASE_PROJECT_ID precisam apontar para o mesmo projeto.');
}
const projectId = process.env.FIREBASE_PROJECT_ID
  || process.env.GOOGLE_CLOUD_PROJECT
  || process.env.GCLOUD_PROJECT
  || serviceAccount?.projectId;

export const firebaseAdminApp = projectId
  ? (getApps()[0] || initializeApp({
      credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
      projectId,
    }))
  : null;

export const adminAuth = firebaseAdminApp ? getAuth(firebaseAdminApp) : null;
export const adminAppCheck = firebaseAdminApp ? getAppCheck(firebaseAdminApp) : null;
export const adminFirestore = firebaseAdminApp ? getFirestore(firebaseAdminApp) : null;

export function isFirebaseAdminConfigured(): boolean {
  const vercelCredentialsConfigured = process.env.VERCEL !== '1' || serviceAccount !== null;
  return Boolean(firebaseAdminApp && adminAuth && adminAppCheck && adminFirestore
    && vercelCredentialsConfigured);
}
