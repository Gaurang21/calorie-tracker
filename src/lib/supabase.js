import { createClient } from '@supabase/supabase-js';
import { supabaseFake } from './supabaseFake.js';

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

export const supabase = isE2E ? supabaseFake : realClient;

export const isSupabaseConfigured = () =>
  Boolean(url && anonKey && !url.includes('placeholder') && !anonKey.includes('placeholder'));
