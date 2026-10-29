import { getFirestoreDatabase } from '../firebase/client.ts';

export async function ensureUserProfile(uid: string, email: string): Promise<void> {
  const [firestore, firestoreSdk] = await Promise.all([
    getFirestoreDatabase(),
    import('firebase/firestore/lite'),
  ]);
  if (!firestore) throw new Error('O Firestore não está configurado neste ambiente.');
  const profileRef = firestoreSdk.doc(firestore, 'users', uid);

  await firestoreSdk.runTransaction(firestore, async transaction => {
    const snapshot = await transaction.get(profileRef);
    const existing = snapshot.data();
    transaction.set(profileRef, {
      uid,
      email: email.trim(),
      createdAt: existing?.createdAt || firestoreSdk.serverTimestamp(),
      updatedAt: firestoreSdk.serverTimestamp(),
    });
  });
}
