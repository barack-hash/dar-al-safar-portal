import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (import.meta.env.DEV) {
  if (!import.meta.env.VITE_SUPABASE_URL) {
    console.warn(
      '[Supabase] VITE_SUPABASE_URL is undefined — Vite only exposes env vars prefixed with VITE_. Cash log will use localStorage until this is set and the dev server is restarted.'
    );
  }
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn(
      '[Supabase] VITE_SUPABASE_ANON_KEY is undefined — client will not connect. Restart `npm run dev` after editing .env.'
    );
  }
}

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

/** In-flight or last-resolved bootstrap; cleared on failure so the next call can retry. */
let sessionBootstrap: Promise<void> | null = null;

async function bootstrapAuthSession(): Promise<void> {
  const sb = getSupabase();
  const {
    data: { session: existing },
  } = await sb.auth.getSession();
  if (existing) return;

  const { data, error } = await sb.auth.signInAnonymously();
  if (error) {
    console.error('[Supabase] signInAnonymously failed:', error.message, error);
    throw error;
  }

  const session = data.session ?? (await sb.auth.getSession()).data.session;
  if (!session) {
    console.error(
      '[Supabase] Anonymous sign-in returned no session. The next API call may hit RLS as anon and fail (403).'
    );
    throw new Error('Supabase: no session after anonymous sign-in');
  }
}

/**
 * Ensures a session exists so RLS policies for the `authenticated` role apply.
 * Uses anonymous sign-in when no session is present (enable in Supabase: Authentication → Providers → Anonymous).
 * Rejects if sign-in fails so callers can surface errors instead of silently getting empty data / RLS denials.
 */
export function ensureSupabaseSession(): Promise<void> {
  if (!isSupabaseConfigured()) return Promise.resolve();
  if (!sessionBootstrap) {
    sessionBootstrap = bootstrapAuthSession().catch((err) => {
      sessionBootstrap = null;
      throw err;
    });
  }
  return sessionBootstrap;
}
