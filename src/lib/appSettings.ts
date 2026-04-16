import type {
  AgencyProfile,
  AppAccessRole,
  AppSectionId,
  PermissionsByRole,
  PersistedAppSettings,
  SecuritySettings,
} from '../types';

export const APP_SECTION_META: { id: AppSectionId; label: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Command center & KPIs' },
  { id: 'ticketing', label: 'Ticketing', description: 'PNRs, holds, issuance' },
  { id: 'clients', label: 'Clients', description: 'Portfolio & invoices' },
  { id: 'staff', label: 'Staff', description: 'Payroll & roster' },
  { id: 'accounting', label: 'Accounting', description: 'Ledger & treasury' },
  { id: 'cashlog', label: 'Cash log', description: 'Physical cash tracking' },
  { id: 'visa', label: 'Visa / Events', description: 'Concierge pipeline' },
  { id: 'insights', label: 'Insights', description: 'Analytics & demand' },
  { id: 'settings', label: 'Settings', description: 'Agency administration' },
];

export const APP_ACCESS_ROLES: AppAccessRole[] = ['SUPERADMIN', 'MANAGER', 'AGENT'];

export const ACCESS_ROLE_LABEL: Record<AppAccessRole, string> = {
  SUPERADMIN: 'Super Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
};

/** Sidebar / route guard order (matches primary navigation). */
export const PRIMARY_TAB_ORDER: AppSectionId[] = APP_SECTION_META.map((s) => s.id);

const sectionIds = APP_SECTION_META.map((s) => s.id);

function emptySectionMap(view: boolean, edit: boolean): Record<AppSectionId, { view: boolean; edit: boolean }> {
  return sectionIds.reduce(
    (acc, id) => {
      acc[id] = { view, edit };
      return acc;
    },
    {} as Record<AppSectionId, { view: boolean; edit: boolean }>
  );
}

export function createDefaultPermissionsByRole(): PermissionsByRole {
  const agent: Record<AppSectionId, { view: boolean; edit: boolean }> = {
    ...emptySectionMap(false, false),
    dashboard: { view: true, edit: true },
    ticketing: { view: true, edit: true },
    clients: { view: true, edit: true },
    visa: { view: true, edit: true },
    insights: { view: true, edit: false },
    staff: { view: false, edit: false },
    accounting: { view: false, edit: false },
    cashlog: { view: false, edit: false },
    settings: { view: false, edit: false },
  };

  return {
    SUPERADMIN: emptySectionMap(true, true),
    MANAGER: emptySectionMap(true, true),
    AGENT: agent,
  };
}

export function defaultAgencyProfile(): AgencyProfile {
  return {
    displayName: 'Dar Al Safar',
    legalName: 'Dar Al Safar Travel LLC',
    tradeLicense: '',
    address: '',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    phone: '',
    email: 'operations@darsafar.com',
    iataCode: '',
  };
}

export function defaultSecuritySettings(): SecuritySettings {
  return {
    sessionTimeoutMinutes: 60,
    requireMfa: false,
    logAuditTrail: true,
  };
}

export function getDefaultPersistedAppSettings(): PersistedAppSettings {
  return {
    theme: 'classic',
    agencyProfile: defaultAgencyProfile(),
    security: defaultSecuritySettings(),
    permissionsByRole: createDefaultPermissionsByRole(),
    staffAccess: {},
  };
}

function mergePermissions(
  base: PermissionsByRole,
  partial?: Partial<PermissionsByRole>
): PermissionsByRole {
  const roles: AppAccessRole[] = ['SUPERADMIN', 'MANAGER', 'AGENT'];
  const next = { ...base };
  for (const role of roles) {
    const incoming = partial?.[role];
    next[role] = { ...base[role] };
    for (const meta of APP_SECTION_META) {
      const s = meta.id;
      if (incoming?.[s] !== undefined) {
        next[role][s] = {
          view: !!incoming[s].view,
          edit: !!incoming[s].edit,
        };
      }
    }
  }
  return next;
}

/** Fills missing keys when loading older localStorage payloads. */
export function normalizePersistedAppSettings(raw: unknown): PersistedAppSettings {
  const defaults = getDefaultPersistedAppSettings();
  if (!raw || typeof raw !== 'object') return defaults;
  const r = raw as Partial<PersistedAppSettings>;
  return {
    theme: r.theme === 'modern' || r.theme === 'dark' || r.theme === 'classic' ? r.theme : defaults.theme,
    agencyProfile: { ...defaults.agencyProfile, ...(r.agencyProfile ?? {}) },
    security: { ...defaults.security, ...(r.security ?? {}) },
    permissionsByRole: mergePermissions(defaults.permissionsByRole, r.permissionsByRole),
    staffAccess: typeof r.staffAccess === 'object' && r.staffAccess ? { ...r.staffAccess } : {},
  };
}

export function buildPermissionStrings(
  accessRole: AppAccessRole,
  permissionsByRole: PermissionsByRole
): string[] {
  const out: string[] = [];
  for (const meta of APP_SECTION_META) {
    const a = permissionsByRole[accessRole]?.[meta.id];
    if (a?.view) out.push(`${meta.id}:view`);
    if (a?.edit) out.push(`${meta.id}:edit`);
  }
  return out;
}
