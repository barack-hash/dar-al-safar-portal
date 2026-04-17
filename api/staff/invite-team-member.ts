import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runInviteTeamMember } from '../../src/lib/inviteTeamMemberCore';

function headerString(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).end();
    return;
  }

  const authorization = headerString(req.headers.authorization);
  const { status, body } = await runInviteTeamMember({
    method: req.method ?? 'GET',
    authorization,
    body: req.body,
  });

  res.status(status).json(body);
}
