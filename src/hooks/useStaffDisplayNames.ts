import { useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

/**
 * Maps Supabase `profiles.user_id` to display name (`full_name` or `email`).
 */
export function useStaffDisplayNames(): {
  staffByUserId: Map<string, string>;
  loading: boolean;
} {
  const [staffByUserId, setStaffByUserId] = useState<Map<string, string>>(() => new Map());
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStaffByUserId(new Map());
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.from('profiles').select('user_id, full_name, email');
        if (error) throw error;
        if (cancelled || !data) return;
        const map = new Map<string, string>();
        for (const row of data as { user_id: string | null; full_name: string | null; email: string | null }[]) {
          if (!row.user_id) continue;
          const name = (row.full_name?.trim() || row.email || 'Staff').trim();
          map.set(row.user_id, name);
        }
        setStaffByUserId(map);
      } catch {
        if (!cancelled) setStaffByUserId(new Map());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { staffByUserId, loading };
}
