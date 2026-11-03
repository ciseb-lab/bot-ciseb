import { getConfig } from './config.ts';

type SupabaseAdminClient = import('@supabase/supabase-js').SupabaseClient;

let clientInitialization: Promise<SupabaseAdminClient> | undefined;

export async function getSupabaseAdminClient(): Promise<SupabaseAdminClient> {
  const config = getConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVER_CREDENTIALS_MISSING');
  }
  if (!clientInitialization) {
    clientInitialization = import('@supabase/supabase-js')
      .then(({ createClient }) => createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      }));
  }
  try {
    return await clientInitialization;
  } catch (error) {
    clientInitialization = undefined;
    throw error;
  }
}

export function resetSupabaseAdminClientForTests(): void {
  clientInitialization = undefined;
}
