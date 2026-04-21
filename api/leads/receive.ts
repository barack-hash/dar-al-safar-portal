import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

type LeadBody = {
  name?: unknown;
  phone?: unknown;
  service?: unknown;
  website?: unknown;
};

type LeadInput = {
  method: string;
  contentType: string | undefined;
  body: unknown;
};

type LeadResult = {
  status: number;
  body: Record<string, unknown>;
};

function normalizedText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function makeClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `lead_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function defaultExpiryDateISO(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 10);
  return d.toISOString().slice(0, 10);
}

async function runLeadReceive(input: LeadInput): Promise<LeadResult> {
  if (input.method !== 'POST') {
    return { status: 405, body: { error: 'Method not allowed' } };
  }

  if (!input.contentType?.toLowerCase().includes('application/json')) {
    return { status: 415, body: { error: 'Content-Type must be application/json' } };
  }

  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceKey) {
    return {
      status: 500,
      body: { error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
    };
  }

  const payload = (input.body ?? {}) as LeadBody;
  const name = normalizedText(payload.name, 120);
  const phone = normalizedText(payload.phone, 40);
  const service = normalizedText(payload.service, 160);
  const website = normalizedText(payload.website, 120);

  if (website) {
    return { status: 400, body: { error: 'Request rejected' } };
  }

  const errors: string[] = [];
  if (!name) errors.push('name is required');
  if (!phone) errors.push('phone is required');
  if (!service) errors.push('service is required');
  if (errors.length > 0) {
    return { status: 400, body: { error: 'Invalid payload', details: errors } };
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const notes = `High Priority: Requested Booking — Service: ${service}`;
  const clientInsert = {
    id: makeClientId(),
    name,
    contact: phone,
    source: 'Website Lead',
    notes,
    email: `lead+${Date.now()}@website-lead.local`,
    passport_id: 'N/A',
    nationality: 'Unknown',
    expiry_date: defaultExpiryDateISO(),
  };

  const { data, error } = await sb
    .from('clients')
    .insert(clientInsert)
    .select('id, name, contact, source, notes')
    .single();

  if (error) {
    console.error('[api/leads/receive] insert failed:', error.message);
    return { status: 500, body: { error: 'Could not save lead' } };
  }

  return {
    status: 201,
    body: {
      ok: true,
      lead: data,
    },
  };
}

function headerString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function applyCors(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  applyCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const { status, body } = await runLeadReceive({
    method: req.method ?? 'GET',
    contentType: headerString(req.headers['content-type']),
    body: req.body,
  });

  res.status(status).json(body);
}
