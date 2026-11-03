import { supabase } from '../supabase/client.ts';

export async function ensureUserProfile(uid: string, email: string): Promise<void> {
  if (!supabase) throw new Error('O Supabase não está configurado neste ambiente.');
  const { error } = await supabase.from('profiles').upsert({
    id: uid,
    email: email.trim(),
  }, { onConflict: 'id' });
  if (error) throw error;
}
