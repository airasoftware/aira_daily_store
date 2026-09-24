import { createClient } from '@supabase/supabase-js';

let publicClient;
let clientConfig;

export function getPublicSupabase() {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const usePublicNames = Boolean(publicUrl || publicKey);
  const url = usePublicNames ? publicUrl : process.env.SUPABASE_URL;
  const key = usePublicNames ? publicKey : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return null;
  if (!url || !key) {
    throw new Error(usePublicNames
      ? 'Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY bersama-sama.'
      : 'Isi SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY bersama-sama.');
  }
  if (!publicClient || clientConfig?.url !== url || clientConfig?.key !== key) {
    publicClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
    clientConfig = { url, key };
  }
  return publicClient;
}
