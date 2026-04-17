import { getSupabase } from './supabaseClient';

const BUCKET = 'client-documents';

export type ClientDocumentType = 'passport' | 'national-id' | 'birth-certificate';

export function validateE164(value: string): boolean {
  if (!value.trim()) return true;
  return /^\+[1-9]\d{1,14}$/.test(value.trim());
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadClientDocument(params: {
  clientId: string;
  docType: ClientDocumentType;
  file: File;
}): Promise<string> {
  const { clientId, docType, file } = params;
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const objectPath = `${clientId}/${docType}/${crypto.randomUUID()}.${safeFilename(extension || 'bin')}`;
  const sb = getSupabase();
  const { error } = await sb.storage.from(BUCKET).upload(objectPath, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return objectPath;
}

export async function getSignedClientDocumentUrl(path: string, expiresIn = 120): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Could not generate a signed document URL');
  }
  return data.signedUrl;
}
