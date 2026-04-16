import React, { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { loadSupabaseProfileForUser, type LoadedSupabaseProfile } from '../lib/loadSupabaseProfile';

export type { LoadedSupabaseProfile as AuthProfile } from '../lib/loadSupabaseProfile';

type AuthContextValue = {
  session: Session | null;
  /** True until the first `getSession()` completes (or immediately false if Supabase is not configured). */
  loading: boolean;
  /** Row from `public.profiles` for the current auth user (`getUser()` + query). Null if missing or signed out. */
  profile: LoadedSupabaseProfile | null;
  /** True while fetching `profiles` after a session exists. */
  profileLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());
  const [profile, setProfile] = useState<LoadedSupabaseProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const loadSeq = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setSession(null);
      setProfile(null);
      setProfileLoading(false);
      setLoading(false);
      return;
    }

    const sb = getSupabase();

    const applySessionAndProfile = async (s: Session | null) => {
      const seq = ++loadSeq.current;
      setSession(s);

      if (!s?.user) {
        setProfile(null);
        setProfileLoading(false);
        setLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const { data: userData, error: userErr } = await sb.auth.getUser();
        if (seq !== loadSeq.current) return;
        if (userErr || !userData.user) {
          setProfile(null);
          return;
        }
        const row = await loadSupabaseProfileForUser(userData.user);
        if (seq !== loadSeq.current) return;
        setProfile(row);
      } finally {
        if (seq === loadSeq.current) {
          setProfileLoading(false);
          setLoading(false);
        }
      }
    };

    void sb.auth.getSession().then(({ data: { session: s } }) => {
      void applySessionAndProfile(s);
    });

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((event: AuthChangeEvent, s) => {
      if (event === 'TOKEN_REFRESHED') {
        setSession(s);
        return;
      }
      void applySessionAndProfile(s);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ session, loading, profile, profileLoading }),
    [session, loading, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
