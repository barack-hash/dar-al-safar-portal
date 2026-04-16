import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppAccessRole, AppSectionId, CurrentUser, UserRole } from '../types';
import { useAppContext } from './AppContext';
import { buildPermissionStrings } from '../lib/appSettings';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { normalizeAccessRole } from '../lib/profileRole';

function userFromSession(session: Session): CurrentUser {
  const u = session.user;
  const meta = u.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    u.email ||
    'User';
  const avatar = typeof meta?.avatar_url === 'string' ? meta.avatar_url : '';
  return {
    id: u.id,
    name,
    email: u.email ?? '',
    accessRole: 'AGENT',
    avatar,
    permissions: [],
    profilePermissions: undefined,
    legacyRole: undefined,
  };
}

interface UserContextType {
  currentUser: CurrentUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser>>;
  /** @deprecated Use currentUser; kept for legacy components. */
  user: CurrentUser;
  logout: () => Promise<void>;
  isAdmin: boolean;
  isAgent: boolean;
  isViewer: boolean;
  hasPermission: (section: AppSectionId | string, mode?: 'view' | 'edit') => boolean;
  effectiveAccessRole: AppAccessRole;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode; session: Session }> = ({ children, session }) => {
  const { appSettings } = useAppContext();
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(() => userFromSession(session));
  const [profileSynced, setProfileSynced] = useState(false);

  const setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser>> = useCallback((action) => {
    setCurrentUserState((prev) => {
      const next = typeof action === 'function' ? (action as (p: CurrentUser) => CurrentUser)(prev) : action;
      return next;
    });
  }, []);

  useEffect(() => {
    setCurrentUserState(userFromSession(session));
  }, [session.user.id]);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setProfileSynced(true);
      return;
    }
    const uid = session.user.id;
    const email = session.user.email ?? '';
    let cancelled = false;
    setProfileSynced(false);

    void (async () => {
      try {
        const sb = getSupabase();
        let { data, error } = await sb
          .from('profiles')
          .select('access_role, legacy_role, permissions, full_name, avatar_url')
          .eq('user_id', uid)
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

        if (cancelled) return;
        if (error || !data) {
          return;
        }

        const permsRaw = data.permissions;
        const profilePermissions =
          Array.isArray(permsRaw) &&
          permsRaw.length > 0 &&
          permsRaw.every((x: unknown) => typeof x === 'string')
            ? (permsRaw as string[])
            : undefined;

        const accessRole = normalizeAccessRole(data.access_role as string);

        setCurrentUserState((u) => ({
          ...u,
          accessRole,
          ...(typeof data.full_name === 'string' && data.full_name ? { name: data.full_name } : {}),
          ...(typeof data.avatar_url === 'string' && data.avatar_url ? { avatar: data.avatar_url } : {}),
          ...(typeof data.legacy_role === 'string' ? { legacyRole: data.legacy_role as UserRole } : {}),
          profilePermissions,
          permissions: [],
        }));
      } catch {
        /* offline / RLS */
      } finally {
        if (!cancelled) setProfileSynced(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session.user.id, session.user.email]);

  const effectiveAccessRole = useMemo((): AppAccessRole => {
    const o = appSettings.staffAccess[currentUser.id];
    if (o?.active === false) return currentUser.accessRole;
    return o?.role ?? currentUser.accessRole;
  }, [appSettings.staffAccess, currentUser.id, currentUser.accessRole]);

  const permissions = useMemo(() => {
    if (effectiveAccessRole === 'SUPERADMIN') {
      return buildPermissionStrings('SUPERADMIN', appSettings.permissionsByRole);
    }
    if (currentUser.profilePermissions?.length) {
      return currentUser.profilePermissions;
    }
    return buildPermissionStrings(effectiveAccessRole, appSettings.permissionsByRole);
  }, [effectiveAccessRole, appSettings.permissionsByRole, currentUser.profilePermissions]);

  const currentUserWithPerms = useMemo(
    () => ({ ...currentUser, permissions }),
    [currentUser, permissions]
  );

  const staffEntry = appSettings.staffAccess[currentUser.id];

  const hasPermission = useCallback(
    (section: AppSectionId | string, mode: 'view' | 'edit' = 'view') => {
      const sid = section as AppSectionId;
      if (staffEntry && staffEntry.active === false) {
        return false;
      }
      if (effectiveAccessRole === 'SUPERADMIN') {
        return true;
      }
      if (currentUser.profilePermissions?.length) {
        return currentUser.profilePermissions.includes(`${sid}:${mode}`);
      }
      const cell = appSettings.permissionsByRole[effectiveAccessRole]?.[sid];
      if (!cell) return false;
      if (mode === 'view') return cell.view;
      return cell.edit;
    },
    [appSettings.permissionsByRole, effectiveAccessRole, staffEntry, currentUser.profilePermissions]
  );

  useEffect(() => {
    const o = appSettings.staffAccess[currentUser.id];
    if (o && o.active && o.role !== currentUser.accessRole) {
      setCurrentUser((u) => ({ ...u, accessRole: o.role }));
    }
  }, [appSettings.staffAccess, currentUser.id, currentUser.accessRole, setCurrentUser]);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await getSupabase().auth.signOut();
    }
  }, []);

  const isAdmin = effectiveAccessRole === 'SUPERADMIN';
  const isAgent = effectiveAccessRole === 'AGENT';
  const isViewer = currentUser.legacyRole === 'VIEWER';

  const value = useMemo(
    () => ({
      currentUser: currentUserWithPerms,
      setCurrentUser,
      user: currentUserWithPerms,
      logout,
      isAdmin,
      isAgent,
      isViewer,
      hasPermission,
      effectiveAccessRole,
    }),
    [currentUserWithPerms, setCurrentUser, logout, isAdmin, isAgent, isViewer, hasPermission, effectiveAccessRole]
  );

  return (
    <UserContext.Provider value={value}>
      {!profileSynced ? (
        <div className="min-h-screen flex items-center justify-center bg-[var(--app-shell-bg)] p-6">
          <div className="glass-panel rounded-2xl px-10 py-8 text-center border-white/30 shadow-xl">
            <p className="text-sm font-semibold text-slate-700">Loading your workspace…</p>
            <p className="text-xs text-slate-500 mt-2">Syncing profile and permissions</p>
          </div>
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
