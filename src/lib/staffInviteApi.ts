import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import type { PortalInviteRole } from './portalPermissions';

export async function inviteTeamMemberViaApi(params: {
  fullName: string;
  email: string;
  portalRole: PortalInviteRole;
}): Promise<{ ok: true; invited: boolean; userId: string | null; message?: string }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const {
    data: { session },
  } = await getSupabase().auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in');
  }

  const res = await fetch('/api/staff/invite-team-member', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  });

  const json = (await res.json()) as {
    ok?: boolean;
    error?: string;
    fallback?: boolean;
    invited?: boolean;
    userId?: string | null;
    message?: string;
  };

  if (!res.ok) {
    throw new Error(json.error || `Request failed (${res.status})`);
  }

  return {
    ok: true,
    invited: Boolean(json.invited),
    userId: json.userId ?? null,
    message: json.message,
  };
}
