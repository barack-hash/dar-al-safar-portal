import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Client } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

const WEBSITE_LEAD_SOURCE = 'Website Lead';
const READ_IDS_KEY = 'dasa_website_lead_read_ids';

export type WebsiteLeadPreview = {
  id: string;
  name: string;
  contact: string;
  notes: string;
};

function loadReadIdsFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === 'string');
  } catch {
    return [];
  }
}

function saveReadIdsToStorage(ids: string[]): void {
  try {
    const unique = [...new Set(ids)];
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(unique));
  } catch {
    /* quota or private mode */
  }
}

function getAudioContextConstructor(): (new (contextOptions?: AudioContextOptions) => AudioContext) | undefined {
  if (typeof globalThis === 'undefined') return undefined;
  const g = globalThis as unknown as {
    AudioContext?: new (contextOptions?: AudioContextOptions) => AudioContext;
    webkitAudioContext?: new (contextOptions?: AudioContextOptions) => AudioContext;
  };
  return g.AudioContext ?? g.webkitAudioContext;
}

/** Short sine beep (880 Hz, ~100 ms) — no audio file required. */
export function playWebsiteLeadBeep(): void {
  try {
    const Ctor = getAudioContextConstructor();
    if (!Ctor) return;

    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    osc.connect(gain);
    gain.connect(ctx.destination);

    const t0 = ctx.currentTime;
    const duration = 0.1;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.12, t0 + 0.008);
    gain.gain.linearRampToValueAtTime(0.0001, t0 + duration);

    osc.start(t0);
    osc.stop(t0 + duration);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    /* autoplay policy, suspended context, etc. */
  }
}

function isWebsiteLeadRow(source: unknown): boolean {
  return typeof source === 'string' && source === WEBSITE_LEAD_SOURCE;
}

export function useNotifications({ clients }: { clients: Client[] }) {
  const { session, loading: authLoading } = useAuth();
  const [readIds, setReadIds] = useState<string[]>(() => loadReadIdsFromStorage());

  const readSet = useMemo(() => new Set(readIds), [readIds]);

  const websiteLeads = useMemo(
    () => clients.filter((c) => c.source === WEBSITE_LEAD_SOURCE),
    [clients]
  );

  const websiteLeadPreviews = useMemo((): WebsiteLeadPreview[] => {
    return websiteLeads.slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      contact: c.contact,
      notes: c.notes,
    }));
  }, [websiteLeads]);

  const unreadCount = useMemo(
    () => websiteLeads.filter((c) => !readSet.has(c.id)).length,
    [websiteLeads, readSet]
  );

  const markWebsiteLeadsRead = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setReadIds((prev) => {
      const next = [...new Set([...prev, ...ids])];
      saveReadIdsToStorage(next);
      return next;
    });
  }, []);

  const markAllWebsiteLeadsRead = useCallback(() => {
    const ids = websiteLeads.map((c) => c.id);
    if (ids.length === 0) return;
    setReadIds((prev) => {
      const next = [...new Set([...prev, ...ids])];
      saveReadIdsToStorage(next);
      return next;
    });
  }, [websiteLeads]);

  useEffect(() => {
    if (!isSupabaseConfigured() || authLoading || !session?.user) {
      return;
    }

    const sb = getSupabase();
    const channel = sb
      .channel('website-lead-clients')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'clients',
          filter: `source=eq.${encodeURIComponent(WEBSITE_LEAD_SOURCE)}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          if (!isWebsiteLeadRow(row.source)) return;
          playWebsiteLeadBeep();
        }
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [session?.user?.id, authLoading]);

  return {
    unreadCount,
    websiteLeadPreviews,
    markWebsiteLeadsRead,
    markAllWebsiteLeadsRead,
  };
}
