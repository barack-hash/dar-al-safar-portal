import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { AppAccessRole, AppSectionId, CurrentUser, UserRole } from '../types';
import { useAppContext } from './AppContext';
import { useAuth } from './AuthContext';
import { buildPermissionStrings, ACCESS_ROLE_LABEL } from '../lib/appSettings';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { formatDbAccessRole } from '../lib/formatDbRole';

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
  /** Label for UI: derived from DB `access_role` when present, else from effective role. */
  roleLabel: string;
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
  const { profile, profileLoading } = useAuth();
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(() => userFromSession(session));

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
    const base = userFromSession(session);
    if (profile) {
      setCurrentUserState({
        ...base,
        accessRole: profile.accessRole,
        name: profile.fullName || base.name,
        avatar: profile.avatarUrl || base.avatar,
        profilePermissions: profile.profilePermissions,
        legacyRole: profile.legacyRole,
        permissions: [],
      });
    } else {
      setCurrentUserState(base);
    }
  }, [session.user.id, session.user.email, profile]);

  const effectiveAccessRole = useMemo((): AppAccessRole => {
    const o = appSettings.staffAccess[currentUser.id];
    if (o?.active === false) return currentUser.accessRole;
    return o?.role ?? currentUser.accessRole;
  }, [appSettings.staffAccess, currentUser.id, currentUser.accessRole]);

  const roleLabel = useMemo(() => {
    if (profile?.rawAccessRole) {
      return formatDbAccessRole(profile.rawAccessRole);
    }
    return ACCESS_ROLE_LABEL[effectiveAccessRole];
  }, [profile?.rawAccessRole, effectiveAccessRole]);

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
        const key = `${sid}:${mode}`;
        if (currentUser.profilePermissions.includes(key)) return true;
        if (mode === 'view' && currentUser.profilePermissions.includes(`${sid}:edit`)) return true;
        return false;
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
      roleLabel,
      logout,
      isAdmin,
      isAgent,
      isViewer,
      hasPermission,
      effectiveAccessRole,
    }),
    [
      currentUserWithPerms,
      setCurrentUser,
      roleLabel,
      logout,
      isAdmin,
      isAgent,
      isViewer,
      hasPermission,
      effectiveAccessRole,
    ]
  );

  const gateLoading = isSupabaseConfigured() && profileLoading;

  return (
    <UserContext.Provider value={value}>
      {gateLoading ? (
        <div className="min-h-screen flex items-center justify-center bg-[var(--app-shell-bg)] p-6">
          <div className="glass-panel rounded-2xl px-10 py-8 text-center border-white/30 shadow-xl">
            <p className="text-sm font-semibold text-slate-700">Loading your workspace…</p>
            <p className="text-xs text-slate-500 mt-2">Syncing profile and permissions from Supabase</p>
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
