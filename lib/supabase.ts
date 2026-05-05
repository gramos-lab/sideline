import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';

let _admin: SupabaseClient | null = null;
let _public: SupabaseClient | null = null;

export function adminClient(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      'Supabase env not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.',
    );
  }
  if (!_admin) {
    _admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _admin;
}

export function publicClient(): SupabaseClient {
  if (!url || !anon) {
    throw new Error('Supabase public env not configured.');
  }
  if (!_public) {
    _public = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _public;
}
