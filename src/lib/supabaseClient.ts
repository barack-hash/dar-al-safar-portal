import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export function isSupabaseConfigured(): boolean {
  return Boolean(url && anonKey);
}

let client: SupabaseClient | null = null;

/** Browser Supabase client (anon key). All data access should go through this. */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured (set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY)');
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
}

let sessionBootstrap: Promise<void> | null = null;

/**
 * Ensures a session exists so RLS policies for the `authenticated` role apply.
 * Uses anonymous sign-in when no session is present (enable in Supabase: Authentication → Providers → Anonymous).
 * Replace with email/password or SSO when you move off Quick Login.
 */
export function ensureSupabaseSession(): Promise<void> {
  if (!isSupabaseConfigured()) return Promise.resolve();
  if (!sessionBootstrap) {
    sessionBootstrap = (async () => {
      const sb = getSupabase();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (session) return;
      const { error } = await sb.auth.signInAnonymously();
      if (error) {
        console.warn(
          '[Supabase] No session and anonymous sign-in failed. Enable Anonymous Sign-In or sign in with a real user. Data requests may be denied by RLS.',
          error.message
        );
      }
    })();
  }
  return sessionBootstrap;
}
