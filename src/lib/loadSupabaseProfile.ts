import type { User as AuthUser } from '@supabase/supabase-js';
import type { AppAccessRole, UserRole } from '../types';
import { getSupabase } from './supabaseClient';
import { normalizeAccessRole } from './profileRole';

export type LoadedSupabaseProfile = {
  accessRole: AppAccessRole;
  /** Explicit permission strings from `profiles.permissions` (e.g. `cashlog:view`). */
  profilePermissions: string[] | undefined;
  fullName?: string;
  avatarUrl?: string;
  legacyRole?: UserRole;
  /** Raw `profiles.access_role` value from the database. */
  rawAccessRole: string | null;
};

export async function loadSupabaseProfileForUser(user: AuthUser): Promise<LoadedSupabaseProfile | null> {
  const sb = getSupabase();
  const email = user.email ?? '';
  let { data, error } = await sb
    .from('profiles')
    .select('access_role, legacy_role, permissions, full_name, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data && email) {
    const second = await sb
      .from('profiles')
      .select('access_role, legacy_role, permissions, full_name, avatar_url')
      .eq('email', email)
      .maybeSingle();
    data = second.data;
    error = second.error;
  }

  if (error || !data) return null;

  const permsRaw = data.permissions;
  const profilePermissions =
    Array.isArray(permsRaw) &&
    permsRaw.length > 0 &&
    permsRaw.every((x: unknown) => typeof x === 'string')
      ? (permsRaw as string[])
      : undefined;

  const accessRole = normalizeAccessRole(data.access_role as string);

  return {
    accessRole,
    profilePermissions,
    ...(typeof data.full_name === 'string' && data.full_name ? { fullName: data.full_name } : {}),
    ...(typeof data.avatar_url === 'string' && data.avatar_url ? { avatarUrl: data.avatar_url } : {}),
    ...(typeof data.legacy_role === 'string' ? { legacyRole: data.legacy_role as UserRole } : {}),
    rawAccessRole: typeof data.access_role === 'string' ? data.access_role : null,
  };
}
