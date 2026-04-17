export type PortalInviteRole = 'agent' | 'admin';

/**
 * Permissions stored on `profiles.permissions` for portal access.
 * Uses `visa:*` (app section id) instead of `visas:*` so `hasPermission` matches.
 */
export function buildPortalPermissions(portalRole: PortalInviteRole): string[] {
  if (portalRole === 'agent') {
    return ['dashboard:view', 'clients:view', 'clients:edit', 'visa:view', 'visa:edit'];
  }
  return [
    'dashboard:view',
    'clients:view',
    'clients:edit',
    'clients:delete',
    'visa:view',
    'visa:edit',
    'staff:view',
  ];
}
