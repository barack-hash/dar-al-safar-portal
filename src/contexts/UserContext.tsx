import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import type { AppAccessRole, AppSectionId, CurrentUser, User, UserRole } from '../types';
import { useAppContext } from './AppContext';
import { buildPermissionStrings } from '../lib/appSettings';

const CURRENT_USER_STORAGE = 'dasa_current_user_v2';

function mapLegacyRoleToAccess(role: UserRole): AppAccessRole {
  if (role === 'ADMIN') return 'SUPERADMIN';
  if (role === 'AGENT') return 'AGENT';
  return 'AGENT';
}

function readStoredCurrentUser(): CurrentUser | null {
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentUser;
    if (!parsed?.id || !parsed.accessRole) return null;
    return parsed;
  } catch {
    return null;
  }
}

function defaultSuperAdmin(): CurrentUser {
  return {
    id: 'default-sa',
    name: 'DASA Administrator',
    email: 'admin@darsafar.com',
    accessRole: 'SUPERADMIN',
    avatar: 'https://picsum.photos/seed/dasa-admin/100/100',
    permissions: [],
  };
}

interface UserContextType {
  /** Logged-in principal (access control). */
  currentUser: CurrentUser;
  setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser>>;
  /** @deprecated Use currentUser; kept for legacy components. */
  user: CurrentUser;
  login: (user: User) => void;
  logout: () => void;
  isAdmin: boolean;
  isAgent: boolean;
  isViewer: boolean;
  hasPermission: (section: AppSectionId | string, mode?: 'view' | 'edit') => boolean;
  /** Role after applying staff-directory overrides from settings. */
  effectiveAccessRole: AppAccessRole;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { appSettings } = useAppContext();
  const [currentUser, setCurrentUserState] = useState<CurrentUser>(() => readStoredCurrentUser() ?? defaultSuperAdmin());

  const setCurrentUser: React.Dispatch<React.SetStateAction<CurrentUser>> = useCallback((action) => {
    setCurrentUserState((prev) => {
      const next = typeof action === 'function' ? (action as (p: CurrentUser) => CurrentUser)(prev) : action;
      try {
        window.localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(next));
      } catch {
        /* ignore quota */
      }
      return next;
    });
  }, []);

  const effectiveAccessRole = useMemo((): AppAccessRole => {
    const o = appSettings.staffAccess[currentUser.id];
    if (o?.active === false) return currentUser.accessRole;
    return o?.role ?? currentUser.accessRole;
  }, [appSettings.staffAccess, currentUser.id, currentUser.accessRole]);

  const permissions = useMemo(() => {
    if (effectiveAccessRole === 'SUPERADMIN') {
      return buildPermissionStrings('SUPERADMIN', appSettings.permissionsByRole);
    }
    return buildPermissionStrings(effectiveAccessRole, appSettings.permissionsByRole);
  }, [effectiveAccessRole, appSettings.permissionsByRole]);

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
      const cell = appSettings.permissionsByRole[effectiveAccessRole]?.[sid];
      if (!cell) return false;
      if (mode === 'view') return cell.view;
      return cell.edit;
    },
    [appSettings.permissionsByRole, effectiveAccessRole, staffEntry]
  );

  useEffect(() => {
    const o = appSettings.staffAccess[currentUser.id];
    if (o && o.active && o.role !== currentUser.accessRole) {
      setCurrentUser((u) => ({ ...u, accessRole: o.role }));
    }
  }, [appSettings.staffAccess, currentUser.id, currentUser.accessRole, setCurrentUser]);

  const login = useCallback(
    (userData: User) => {
      const accessRole = mapLegacyRoleToAccess(userData.role);
      const next: CurrentUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        accessRole,
        avatar: userData.avatar,
        permissions: [],
        legacyRole: userData.role,
      };
      setCurrentUser(next);
    },
    [setCurrentUser]
  );

  const logout = useCallback(() => {
    const next = defaultSuperAdmin();
    setCurrentUser(next);
  }, [setCurrentUser]);

  const isAdmin = effectiveAccessRole === 'SUPERADMIN';
  const isAgent = effectiveAccessRole === 'AGENT';
  const isViewer = currentUser.legacyRole === 'VIEWER';

  const value = useMemo(
    () => ({
      currentUser: currentUserWithPerms,
      setCurrentUser,
      user: currentUserWithPerms,
      login,
      logout,
      isAdmin,
      isAgent,
      isViewer,
      hasPermission,
      effectiveAccessRole,
    }),
    [currentUserWithPerms, setCurrentUser, login, logout, isAdmin, isAgent, isViewer, hasPermission, effectiveAccessRole]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
