import type { Request, Response } from 'express';
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

export async function handleInviteTeamMember(req: Request, res: Response): Promise<void> {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !anonKey) {
    res.status(500).json({ error: 'Server missing Supabase URL or anon key (SUPABASE_URL / VITE_SUPABASE_URL)' });
    return;
  }

  const authHeader = req.headers.authorization;
  const token =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: 'Missing Authorization bearer token' });
    return;
  }

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
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
    res.status(403).json({ error: 'Only Super Admins can invite team members' });
    return;
  }

  const { fullName, email, portalRole } = req.body as {
    fullName?: string;
    email?: string;
    portalRole?: string;
  };

  if (!fullName?.trim() || !email?.trim() || !portalRole) {
    res.status(400).json({ error: 'fullName, email, and portalRole are required' });
    return;
  }

  const em = email.trim().toLowerCase();
  if (portalRole !== 'agent' && portalRole !== 'admin') {
    res.status(400).json({ error: 'portalRole must be "agent" or "admin"' });
    return;
  }

  const permissions = portalPermissions(portalRole);
  /** Admin = elevated portal role with the generated permission list (not SUPERADMIN, which bypasses checks). */
  const access_role = portalRole === 'admin' ? 'MANAGER' : 'AGENT';
  const legacy_role = portalRole === 'admin' ? 'ADMIN' : 'AGENT';

  if (!serviceKey) {
    const { error: upErr } = await userClient.from('profiles').upsert(
      {
        email: em,
        full_name: fullName.trim(),
        access_role,
        legacy_role,
        permissions,
      },
      { onConflict: 'email' }
    );
    if (upErr) {
      res.status(400).json({ error: upErr.message });
      return;
    }
    res.json({
      ok: true,
      invited: false,
      userId: null,
      fallback: true,
      message:
        'Profile created. Please trigger the official Auth Invite link from the Supabase Authentication Dashboard.',
    });
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let userId: string | null = null;
  let invited = false;

  const { data: inv, error: invErr } = await admin.auth.admin.inviteUserByEmail(em, {
    data: { full_name: fullName.trim() },
  });

  if (invErr) {
    const msg = invErr.message || '';
    if (/already|registered|exists/i.test(msg)) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (listErr) {
        res.status(400).json({ error: invErr.message });
        return;
      }
      const users = list?.users ?? [];
      const found = users.find((u) => u.email?.toLowerCase() === em);
      userId = found?.id ?? null;
      if (!userId) {
        res.status(400).json({ error: invErr.message });
        return;
      }
    } else {
      res.status(400).json({ error: invErr.message });
      return;
    }
  } else {
    userId = inv.user?.id ?? null;
    invited = true;
  }

  if (!userId) {
    res.status(500).json({ error: 'Could not resolve auth user id' });
    return;
  }

  const { error: upErr } = await admin.from('profiles').upsert(
    {
      user_id: userId,
      email: em,
      full_name: fullName.trim(),
      access_role,
      legacy_role,
      permissions,
    },
    { onConflict: 'email' }
  );

  if (upErr) {
    res.status(400).json({ error: upErr.message });
    return;
  }

  res.json({ ok: true, invited, userId });
}
