import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseFake } from './supabaseFake';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isE2E = import.meta.env.VITE_E2E === '1';

const realClient = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// The fake implements just enough of SupabaseClient for the app's use cases.
// Casting here keeps the rest of the codebase using SupabaseClient types.
export const supabase: SupabaseClient = isE2E ? (supabaseFake as unknown as SupabaseClient) : realClient;

export const isSupabaseConfigured = (): boolean =>
  Boolean(url && anonKey && !url.includes('placeholder') && !anonKey.includes('placeholder'));
