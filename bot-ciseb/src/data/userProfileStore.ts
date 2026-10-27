import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../firebase/client.ts';

export async function ensureUserProfile(uid: string, email: string): Promise<void> {
  if (!firestore) throw new Error('O Firestore não está configurado neste ambiente.');
  const profileRef = doc(firestore, 'users', uid);

  await runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(profileRef);
    const existing = snapshot.data();
    transaction.set(profileRef, {
      uid,
      email: email.trim(),
      createdAt: existing?.createdAt || serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
