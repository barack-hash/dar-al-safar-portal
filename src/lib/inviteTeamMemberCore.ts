import { createClient } from '@supabase/supabase-js';

function isSuperAdminRole(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const r = String(raw).trim().toUpperCase().replace(/\s+/g, '_');
  return r === 'SUPERADMIN' || r === 'SUPER_ADMIN';
}

function portalPermissions(portalRole: string): string[] {
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

export type InviteTeamMemberCoreInput = {
  method: string;
  authorization: string | undefined;
  body: unknown;
};

export type InviteTeamMemberCoreResult = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Shared invite logic for Vercel serverless (and any other runtime).
 * Uses `process.env.SUPABASE_SERVICE_ROLE_KEY` when set; otherwise profile-only fallback.
 */
export async function runInviteTeamMember(input: InviteTeamMemberCoreInput): Promise<InviteTeamMemberCoreResult> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (input.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  if (!url || !anonKey) {
    return {
      status: 500,
      body: { error: 'Server missing Supabase URL or anon key (SUPABASE_URL / VITE_SUPABASE_URL)' },
    };
  }

  const token =
    typeof input.authorization === 'string' && input.authorization.startsWith('Bearer ')
      ? input.authorization.slice(7)
      : null;
  if (!token) {
    return { status: 401, body: { error: 'Missing Authorization bearer token' } };
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) {
    return { status: 401, body: { error: 'Invalid or expired session' } };
  }

  let role: string | undefined;
  const { data: prof } = await userClient
    .from('profiles')
    .select('access_role')
    .eq('user_id', userData.user.id)
    .maybeSingle();
  role = prof?.access_role as string | undefined;
  if (!role && userData.user.email) {
    const { data: p2 } = await userClient
      .from('profiles')
      .select('access_role')
      .eq('email', userData.user.email)
      .maybeSingle();
    role = p2?.access_role as string | undefined;
  }
  if (!isSuperAdminRole(role)) {
    return { status: 403, body: { error: 'Only Super Admins can invite team members' } };
  }

  const parsed = input.body as {
    fullName?: string;
    email?: string;
    portalRole?: string;
  };

  if (!parsed?.fullName?.trim() || !parsed?.email?.trim() || !parsed?.portalRole) {
    return { status: 400, body: { error: 'fullName, email, and portalRole are required' } };
  }

  const em = parsed.email.trim().toLowerCase();
  if (parsed.portalRole !== 'agent' && parsed.portalRole !== 'admin') {
    return { status: 400, body: { error: 'portalRole must be "agent" or "admin"' } };
  }

  const permissions = portalPermissions(parsed.portalRole);
  const access_role = parsed.portalRole === 'admin' ? 'MANAGER' : 'AGENT';
  const legacy_role = parsed.portalRole === 'admin' ? 'ADMIN' : 'AGENT';
  const fullName = parsed.fullName.trim();

  if (!serviceKey) {
    const { error: upErr } = await userClient.from('profiles').upsert(
      {
        email: em,
        full_name: fullName,
        access_role,
        legacy_role,
        permissions,
      },
      { onConflict: 'email' }
    );
    if (upErr) {
      return { status: 400, body: { error: upErr.message } };
    }
    return {
      status: 200,
      body: {
        ok: true,
        invited: false,
        userId: null,
        fallback: true,
        message:
          'Profile created. Please trigger the official Auth Invite link from the Supabase Authentication Dashboard.',
      },
    };
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | null = null;
  let invited = false;

  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(em, {
    data: { full_name: fullName },
  });

  if (invErr) {
    const msg = invErr.message || '';
    if (/already|registered|exists/i.test(msg)) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) {
        return { status: 400, body: { error: invErr.message } };
      }
      const users = list?.users ?? [];
      const found = users.find((u) => u.email?.toLowerCase() === em);
      userId = found?.id ?? null;
      if (!userId) {
        return { status: 400, body: { error: invErr.message } };
      }
    } else {
      return { status: 400, body: { error: invErr.message } };
    }
  } else {
    userId = inv.user?.id ?? null;
    invited = true;
  }

  if (!userId) {
    return { status: 500, body: { error: 'Could not resolve auth user id' } };
  }

  const { error: upErr } = await admin.from('profiles').upsert(
    {
      user_id: userId,
      email: em,
      full_name: fullName,
      access_role,
      legacy_role,
      permissions,
    },
    { onConflict: 'email' }
  );

  if (upErr) {
    return { status: 400, body: { error: upErr.message } };
  }

  return { status: 200, body: { ok: true, invited, userId } };
}
