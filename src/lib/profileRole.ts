import type { AppAccessRole } from '../types';

/** Maps DB values (e.g. SUPER_ADMIN) to app `AppAccessRole`. */
export function normalizeAccessRole(raw: string | null | undefined): AppAccessRole {
  const r = String(raw ?? 'AGENT')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_');
  if (r === 'SUPERADMIN' || r === 'SUPER_ADMIN') return 'SUPERADMIN';
  if (r === 'MANAGER') return 'MANAGER';
  return 'AGENT';
}
