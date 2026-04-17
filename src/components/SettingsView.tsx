import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Users,
  Shield,
  Building2,
  Lock,
  Palette,
  Check,
  Eye,
  Pencil,
  Sparkles,
  Camera,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../contexts/AppContext';
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import type { AppAccessRole, AppSectionId, AppTheme, SectionAccess } from '../types';
import { ACCESS_ROLE_LABEL, APP_ACCESS_ROLES, APP_SECTION_META } from '../lib/appSettings';
import { GlassSelect } from './ui/GlassSelect';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { useProfileEditor } from '../hooks/useProfileEditor';

type SettingsTab = 'users' | 'permissions' | 'agency' | 'security' | 'appearance';

const THEME_CARDS: { id: AppTheme; title: string; subtitle: string }[] = [
  { id: 'classic', title: 'Classic', subtitle: 'Heritage DASA palette' },
  { id: 'modern', title: 'Modern', subtitle: 'Crisp emerald & slate' },
  { id: 'dark', title: 'Dark', subtitle: 'Low-light operations' },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative h-7 w-12 rounded-full transition-colors ${
        checked ? 'bg-active-green' : 'bg-slate-200'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function profileInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  return (parts[0]?.charAt(0) || '?').toUpperCase();
}

export const SettingsView: React.FC = () => {
  const { employees, appSettings, setAppSettings } = useAppContext();
  const { hasPermission, currentUser, roleLabel } = useUser();
  const { session, refreshProfile, profileLoading } = useAuth();
  const { uploadAvatar, updateProfile, uploading, saving } = useProfileEditor();
  const [tab, setTab] = useState<SettingsTab>('users');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const revokePreviewIfBlob = useCallback((url: string | null) => {
    if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
  }, []);

  useEffect(() => {
    if (!isEditingProfile) return;
    setDraftName(currentUser.name);
    setPendingFile(null);
    setAvatarPreview((prev) => {
      revokePreviewIfBlob(prev);
      return currentUser.avatar || null;
    });
  }, [isEditingProfile, currentUser.name, currentUser.avatar, revokePreviewIfBlob]);

  const canEditSettings = hasPermission('settings', 'edit');

  const setStaffAccess = (employeeId: string, patch: Partial<{ role: AppAccessRole; active: boolean }>) => {
    setAppSettings((prev) => {
      const prevEntry = prev.staffAccess[employeeId] ?? { role: 'MANAGER' as AppAccessRole, active: true };
      return {
        ...prev,
        staffAccess: {
          ...prev.staffAccess,
          [employeeId]: {
            role: patch.role ?? prevEntry.role,
            active: patch.active ?? prevEntry.active,
          },
        },
      };
    });
  };

  const setSectionAccess = (role: AppAccessRole, section: AppSectionId, mode: keyof SectionAccess, value: boolean) => {
    if (role === 'SUPERADMIN') return;
    setAppSettings((prev) => ({
      ...prev,
      permissionsByRole: {
        ...prev.permissionsByRole,
        [role]: {
          ...prev.permissionsByRole[role],
          [section]: {
            ...prev.permissionsByRole[role][section],
            [mode]: value,
            ...(mode === 'view' && !value ? { edit: false } : {}),
          },
        },
      },
    }));
  };

  const tabs: { id: SettingsTab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'permissions', label: 'Permissions', icon: Shield },
    { id: 'agency', label: 'Agency Profile', icon: Building2 },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const profileEmail = session?.user?.email ?? currentUser.email ?? '—';
  const profileBusy = uploading || saving || profileLoading;
  const displayAvatarSrc = isEditingProfile ? avatarPreview || undefined : currentUser.avatar || undefined;

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setPendingFile(f);
    setAvatarPreview((prev) => {
      revokePreviewIfBlob(prev);
      return URL.createObjectURL(f);
    });
  };

  const cancelProfileEdit = () => {
    revokePreviewIfBlob(avatarPreview);
    setAvatarPreview(null);
    setPendingFile(null);
    setIsEditingProfile(false);
  };

  const saveProfile = async () => {
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured', { description: 'Profile sync requires a connected project.' });
      return;
    }
    const uid = session?.user?.id;
    if (!uid) {
      toast.error('Not signed in');
      return;
    }
    const trimmed = draftName.trim();
    if (!trimmed) {
      toast.error('Name cannot be empty');
      return;
    }
    const nameChanged = trimmed !== currentUser.name.trim();
    try {
      let avatarUrl: string | undefined;
      if (pendingFile) {
        avatarUrl = await uploadAvatar(pendingFile, uid);
      }
      if (!nameChanged && !avatarUrl) {
        toast.message('No changes to save');
        return;
      }
      await updateProfile({
        ...(nameChanged ? { fullName: trimmed } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      });
      await refreshProfile();
      toast.success('Profile updated');
      revokePreviewIfBlob(avatarPreview);
      setAvatarPreview(null);
      setPendingFile(null);
      setIsEditingProfile(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save profile';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <section className="glass-panel rounded-[2rem] border border-white/25 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">My profile</p>
            <p className="text-xs text-slate-500 font-medium max-w-md">
              {isEditingProfile
                ? 'Update your display name and photo. Avatar images are stored in Supabase Storage.'
                : 'Synced from your account and Supabase profile.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isEditingProfile ? (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                disabled={!isSupabaseConfigured() || profileLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Pencil size={16} />
                Edit profile
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={cancelProfileEdit}
                  disabled={profileBusy}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={profileBusy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                >
                  {profileBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {!isSupabaseConfigured() && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3 mb-6 font-medium">
            Connect Supabase in your environment to edit and sync your profile.
          </p>
        )}

        <div className="flex flex-col md:flex-row gap-8 md:gap-10">
          <div className="flex flex-col items-center md:items-start gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
            <button
              type="button"
              disabled={!isEditingProfile || profileBusy}
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white shadow-lg transition-all ${
                isEditingProfile && !profileBusy
                  ? 'cursor-pointer hover:ring-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2'
                  : 'cursor-default opacity-95'
              }`}
              aria-label={isEditingProfile ? 'Change profile photo' : 'Profile photo'}
            >
              {displayAvatarSrc ? (
                <img src={displayAvatarSrc} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-emerald-900 text-white text-2xl font-black">
                  {profileInitials(isEditingProfile ? draftName || currentUser.name : currentUser.name)}
                </div>
              )}
              {isEditingProfile && (
                <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center pointer-events-none">
                  <Camera className="text-white drop-shadow-md" size={28} />
                </div>
              )}
            </button>
            {isEditingProfile && (
              <p className="text-[10px] text-slate-500 font-medium text-center md:text-left max-w-[200px]">
                Tap to choose a new photo (JPEG, PNG, WebP, or GIF · max 5 MB)
              </p>
            )}
          </div>

          <dl className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Name</dt>
              <dd className="text-sm font-bold text-slate-900">
                {isEditingProfile ? (
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    disabled={profileBusy}
                    className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500/25 disabled:opacity-50"
                  />
                ) : (
                  currentUser.name
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Email</dt>
              <dd className="text-sm font-bold text-slate-900 break-all">{profileEmail}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Role</dt>
              <dd className="text-sm font-bold text-slate-900">{roleLabel}</dd>
            </div>
          </dl>
        </div>
      </section>

      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-200/80 pb-8">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-active-green mb-2">Administration</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Control Center</h1>
          <p className="text-slate-500 mt-2 font-medium max-w-xl">
            Agency identity, access policy, and operational security — persisted locally for this workstation.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/10">
          <Sparkles className="text-active-gold shrink-0" size={18} />
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Signed in</p>
            <p className="text-sm font-bold truncate max-w-[200px]">{currentUser.name}</p>
            <p className="text-[10px] text-emerald-300 font-semibold">{roleLabel}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/60 w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                active
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} className={active ? 'text-active-green' : 'opacity-60'} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'users' && (
        <section className="rounded-3xl glass-panel border-white/25 shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-900">Directory & access</h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Map HR records to platform roles. Inactive users cannot authenticate to operational views.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50/90 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-8 py-4">Team member</th>
                  <th className="px-4 py-4">Job function</th>
                  <th className="px-4 py-4">Platform role</th>
                  <th className="px-8 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const access = appSettings.staffAccess[emp.id] ?? {
                    role: 'MANAGER' as AppAccessRole,
                    active: true,
                  };
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-bold text-slate-900">{emp.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">ID · {emp.id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-4 py-5 text-slate-600 font-medium">{emp.role}</td>
                      <td className="px-4 py-5">
                        <GlassSelect<AppAccessRole>
                          disabled={!canEditSettings}
                          className="max-w-[220px]"
                          value={access.role}
                          onChange={(role) => setStaffAccess(emp.id, { role })}
                          options={APP_ACCESS_ROLES.map((r) => ({ value: r, label: ACCESS_ROLE_LABEL[r] }))}
                        />
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-3">
                          <span className="text-xs font-bold text-slate-500">
                            {access.active ? 'Active' : 'Disabled'}
                          </span>
                          <Toggle
                            disabled={!canEditSettings}
                            checked={access.active}
                            onChange={(v) => setStaffAccess(emp.id, { active: v })}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {employees.length === 0 && (
              <div className="px-8 py-16 text-center text-slate-500 text-sm font-medium">
                No staff records yet. Add employees from the Staff workspace.
              </div>
            )}
          </div>
        </section>
      )}

      {tab === 'permissions' && (
        <section className="rounded-3xl glass-panel border-white/25 shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100">
            <h2 className="text-lg font-black text-slate-900">Permissions matrix</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
              Super Admin always retains full access. Tune Manager and other role scopes — view gates navigation; edit gates
              mutating actions inside a module.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="text-left px-6 py-4 font-black uppercase tracking-widest">Section</th>
                  {APP_ACCESS_ROLES.map((role) => (
                    <th key={role} colSpan={2} className="px-4 py-4 text-center font-black uppercase tracking-widest border-l border-white/10">
                      {ACCESS_ROLE_LABEL[role]}
                    </th>
                  ))}
                </tr>
                <tr className="bg-slate-800 text-white/80">
                  <th className="px-6 py-2" />
                  {APP_ACCESS_ROLES.map((role) => (
                    <React.Fragment key={role}>
                      <th className="border-l border-white/10 px-2 py-2 text-center font-bold">
                        <Eye className="inline mr-1" size={12} />
                        View
                      </th>
                      <th className="px-2 py-2 text-center font-bold">
                        <Pencil className="inline mr-1" size={12} />
                        Edit
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {APP_SECTION_META.map((meta) => (
                  <tr key={meta.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{meta.label}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{meta.description}</p>
                    </td>
                    {APP_ACCESS_ROLES.map((role) => {
                      const cell = appSettings.permissionsByRole[role][meta.id];
                      const locked = role === 'SUPERADMIN' || !canEditSettings;
                      return (
                        <React.Fragment key={`${role}-${meta.id}`}>
                          <td className="border-l border-slate-100 px-2 py-3 text-center">
                            {role === 'SUPERADMIN' ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-active-green">
                                <Check size={16} />
                              </span>
                            ) : (
                              <Toggle
                                disabled={locked}
                                checked={cell.view}
                                onChange={(v) => setSectionAccess(role, meta.id, 'view', v)}
                              />
                            )}
                          </td>
                          <td className="px-2 py-3 text-center">
                            {role === 'SUPERADMIN' ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-active-green">
                                <Check size={16} />
                              </span>
                            ) : (
                              <Toggle
                                disabled={locked || !cell.view}
                                checked={cell.edit}
                                onChange={(v) => setSectionAccess(role, meta.id, 'edit', v)}
                              />
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'agency' && (
        <section className="rounded-3xl glass-panel border-white/25 shadow-lg p-8 space-y-6">
          <h2 className="text-lg font-black text-slate-900">Agency profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(
              [
                ['displayName', 'Brand name'],
                ['legalName', 'Legal entity'],
                ['tradeLicense', 'Trade license'],
                ['iataCode', 'IATA / ARC'],
                ['address', 'Address'],
                ['city', 'City'],
                ['country', 'Country'],
                ['phone', 'Phone'],
                ['email', 'Operations email'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="block space-y-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                <input
                  disabled={!canEditSettings}
                  value={appSettings.agencyProfile[key]}
                  onChange={(e) =>
                    setAppSettings((p) => ({
                      ...p,
                      agencyProfile: { ...p.agencyProfile, [key]: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-active-green/20 disabled:opacity-50"
                />
              </label>
            ))}
          </div>
        </section>
      )}

      {tab === 'security' && (
        <section className="rounded-3xl glass-panel border-white/25 shadow-lg p-8 space-y-8">
          <h2 className="text-lg font-black text-slate-900">Security posture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <label className="block space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Session idle timeout (minutes)
              </span>
              <input
                type="number"
                min={5}
                disabled={!canEditSettings}
                value={appSettings.security.sessionTimeoutMinutes}
                onChange={(e) =>
                  setAppSettings((p) => ({
                    ...p,
                    security: {
                      ...p.security,
                      sessionTimeoutMinutes: Math.max(5, Number(e.target.value) || 60),
                    },
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
              />
            </label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Require MFA at sign-in</p>
                  <p className="text-xs text-slate-500 mt-1">Placeholder — wire to your IdP.</p>
                </div>
                <Toggle
                  disabled={!canEditSettings}
                  checked={appSettings.security.requireMfa}
                  onChange={(v) =>
                    setAppSettings((p) => ({
                      ...p,
                      security: { ...p.security, requireMfa: v },
                    }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-sm font-bold text-slate-900">Audit trail</p>
                  <p className="text-xs text-slate-500 mt-1">Log sensitive actions (local demo flag).</p>
                </div>
                <Toggle
                  disabled={!canEditSettings}
                  checked={appSettings.security.logAuditTrail}
                  onChange={(v) =>
                    setAppSettings((p) => ({
                      ...p,
                      security: { ...p.security, logAuditTrail: v },
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 text-sm text-amber-900 font-medium">
            ExchangeRate and other API keys belong in environment configuration — never in this panel. Rotate keys from
            your deployment secrets store.
          </div>
        </section>
      )}

      {tab === 'appearance' && (
        <section className="rounded-3xl glass-panel border-white/25 shadow-lg p-8 space-y-6">
          <h2 className="text-lg font-black text-slate-900">Theme</h2>
          <p className="text-sm text-slate-500 font-medium">
            Updates global design tokens for sidebar accent, brand green, and shell background.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {THEME_CARDS.map((card) => {
              const active = appSettings.theme === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  disabled={!canEditSettings}
                  onClick={() => setAppSettings((p) => ({ ...p, theme: card.id }))}
                  className={`text-left rounded-2xl border-2 p-6 transition-all ${
                    active
                      ? 'border-active-green bg-emerald-50/40 shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  } disabled:opacity-50`}
                >
                  <p className="text-base font-black text-slate-900">{card.title}</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium">{card.subtitle}</p>
                  {active && (
                    <p className="text-[10px] font-black text-active-green uppercase tracking-widest mt-4">Active</p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
