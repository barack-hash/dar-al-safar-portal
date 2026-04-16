/** Human-readable label from `profiles.access_role` (e.g. SUPER_ADMIN → "Super Admin"). */
export function formatDbAccessRole(raw: string): string {
  return raw
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
