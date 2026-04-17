import { useState, useCallback } from 'react';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logSupabaseDataError } from '../lib/supabaseErrors';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 5 * 1024 * 1024;

export type ProfileUpdates = {
  fullName?: string;
  avatarUrl?: string;
};

function extFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

export async function uploadAvatarFile(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_BYTES) {
    throw new Error('Image must be 5 MB or smaller.');
  }

  const sb = getSupabase();
  const ext = extFromMime(file.type);
  const path = `${userId}/avatar.${ext}`;

  const { error: upErr } = await sb.storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type || `image/${ext}`,
  });
  if (upErr) {
    logSupabaseDataError('storage.avatars.upload', upErr);
    throw upErr;
  }

  const { data } = sb.storage.from('avatars').getPublicUrl(path);
  const base = data.publicUrl;
  return `${base}${base.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

export async function updateProfileInDb(updates: ProfileUpdates): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured');
  }
  const sb = getSupabase();
  const { data: userData, error: userErr } = await sb.auth.getUser();
  if (userErr || !userData.user) {
    throw new Error('Not signed in');
  }

  const patch: Record<string, string> = {};
  if (updates.fullName !== undefined) patch.full_name = updates.fullName;
  if (updates.avatarUrl !== undefined) patch.avatar_url = updates.avatarUrl;
  if (Object.keys(patch).length === 0) return;

  patch.updated_at = new Date().toISOString();

  const uid = userData.user.id;
  const email = userData.user.email ?? '';

  let { error, data } = await sb.from('profiles').update(patch).eq('user_id', uid).select('user_id');
  if (error) {
    logSupabaseDataError('profiles.update (self)', error);
    throw error;
  }
  if ((!data || data.length === 0) && email) {
    const second = await sb.from('profiles').update(patch).eq('email', email).select('user_id');
    if (second.error) {
      logSupabaseDataError('profiles.update (self, email)', second.error);
      throw second.error;
    }
  }
}

export function useProfileEditor() {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadAvatar = useCallback(async (file: File, userId: string) => {
    setUploading(true);
    try {
      return await uploadAvatarFile(file, userId);
    } finally {
      setUploading(false);
    }
  }, []);

  const updateProfile = useCallback(async (updates: ProfileUpdates) => {
    setSaving(true);
    try {
      await updateProfileInDb(updates);
    } finally {
      setSaving(false);
    }
  }, []);

  return { uploadAvatar, updateProfile, uploading, saving };
}
