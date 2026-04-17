import { useCallback, useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type StaffRegistryRow = {
  id: string;
  email: string;
  full_name: string | null;
  access_role: string;
  user_id: string | null;
};

export function useStaffRegistry() {
  const [registryMembers, setRegistryMembers] = useState<StaffRegistryRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refetchRegistry = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setRegistryMembers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('profiles')
        .select('id, email, full_name, access_role, user_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRegistryMembers((data ?? []) as StaffRegistryRow[]);
    } catch {
      setRegistryMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetchRegistry();
  }, [refetchRegistry]);

  return { registryMembers, refetchRegistry, loading };
}
