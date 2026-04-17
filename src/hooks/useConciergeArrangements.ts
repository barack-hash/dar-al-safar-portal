import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './useLocalStorage';
import { EventBooking, EventCategory, EventStatus } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  arrangementFromRow,
  arrangementToInsert,
  type ConciergeArrangementRow,
} from '../lib/supabaseMaps';

function migrateLegacyEventStatus(status: string): EventStatus {
  const map: Record<string, EventStatus> = {
    PLANNING: 'PLANNING',
    AWAITING_PAYMENT: 'AWAITING_PAYMENT',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  };
  return map[status] ?? 'PLANNING';
}

function migrateLegacyEventCategory(category: string): EventCategory {
  const map: Record<string, EventCategory> = {
    HOTEL: 'HOTEL',
    TOUR: 'TOUR',
    TRANSFER: 'TRANSFER',
    FLIGHT: 'FLIGHT',
    VIP_ACCESS: 'VIP_ACCESS',
  };
  return map[category] ?? 'TOUR';
}

function normalizeEvent(e: EventBooking): EventBooking {
  return {
    ...e,
    status: migrateLegacyEventStatus(e.status as string),
    category: migrateLegacyEventCategory(e.category as string),
  };
}

const DEFAULT_EVENTS: EventBooking[] = [
  {
    id: 'e1',
    clientId: '1',
    title: 'Lalibela Private Tour',
    category: 'TOUR',
    startDate: '2026-04-15',
    endDate: '2026-04-16',
    status: 'CONFIRMED',
  },
  {
    id: 'e2',
    clientId: '2',
    title: 'Four Seasons Paris',
    category: 'HOTEL',
    startDate: '2026-04-10',
    endDate: '2026-04-14',
    status: 'PLANNING',
  },
];

export function useConciergeArrangements() {
  const supabaseMode = isSupabaseConfigured();
  const [eventsLocal, setEventsLocal] = useLocalStorage<EventBooking[]>('darsafar_events', DEFAULT_EVENTS);
  const [eventsRemote, setEventsRemote] = useState<EventBooking[]>([]);
  const eventsRaw = supabaseMode ? eventsRemote : eventsLocal;
  const events = useMemo(() => eventsRaw.map(normalizeEvent), [eventsRaw]);

  const eventsLocalRef = useRef(eventsLocal);
  eventsLocalRef.current = eventsLocal;

  const persistLocalMirror = useCallback(
    (list: EventBooking[]) => {
      setEventsLocal(list);
    },
    [setEventsLocal]
  );

  useEffect(() => {
    if (!supabaseMode) return;
    let cancelled = false;

    const load = () => {
      void (async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (!cancelled) {
            setEventsRemote(eventsLocalRef.current.map(normalizeEvent));
            toast.message('Working offline', {
              description: 'Showing saved arrangements from this browser.',
            });
          }
          return;
        }
        try {
          const sb = getSupabase();
          const { data, error } = await sb
            .from('concierge_arrangements')
            .select('*')
            .returns<ConciergeArrangementRow[]>();
          if (cancelled) return;
          if (error) throw error;
          const list = (data ?? []).map((r) => normalizeEvent(arrangementFromRow(r as ConciergeArrangementRow)));
          setEventsRemote(list);
          persistLocalMirror(list);
        } catch (e) {
          console.error(e);
          if (!cancelled) {
            setEventsRemote(eventsLocalRef.current.map(normalizeEvent));
            toast.error('Could not load arrangements', {
              description:
                e instanceof Error
                  ? e.message
                  : 'Using saved copy from this browser if available.',
            });
          }
        }
      })();
    };

    load();

    const onOnline = () => load();
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener('online', onOnline);
    };
  }, [supabaseMode, persistLocalMirror]);

  const addEvent = useCallback(
    async (event: Omit<EventBooking, 'id'>) => {
      const newEvent: EventBooking = {
        ...event,
        id: Math.random().toString(36).substring(2, 11),
      };
      const normalized = normalizeEvent(newEvent);

      if (!supabaseMode) {
        setEventsLocal((prev) => [...prev, normalized]);
        return normalized;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setEventsLocal((prev) => [...prev, normalized]);
        setEventsRemote((prev) => [...prev, normalized]);
        toast.message('Saved offline', { description: 'Will sync when you are back online.' });
        return normalized;
      }

      try {
        const sb = getSupabase();
        const { error } = await sb.from('concierge_arrangements').insert(arrangementToInsert(normalized));
        if (error) throw error;
        setEventsRemote((prev) => {
          const next = [...prev, normalized];
          persistLocalMirror(next);
          return next;
        });
      } catch (e) {
        console.error(e);
        setEventsLocal((prev) => [...prev, normalized]);
        setEventsRemote((prev) => [...prev, normalized]);
        toast.error('Could not save arrangement to server', {
          description: e instanceof Error ? e.message : 'Kept a local copy in this browser.',
        });
      }
      return normalized;
    },
    [supabaseMode, setEventsLocal, persistLocalMirror]
  );

  const updateEventStatus = useCallback(
    async (id: string, status: EventStatus) => {
      const applyLocal = (list: EventBooking[]) =>
        list.map((e) => (e.id === id ? normalizeEvent({ ...e, status }) : e));

      if (!supabaseMode) {
        setEventsLocal((prev) => applyLocal(prev));
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setEventsLocal((prev) => applyLocal(prev));
        setEventsRemote((prev) => applyLocal(prev));
        toast.message('Updated offline', { description: 'Sync when connection returns.' });
        return;
      }

      try {
        const sb = getSupabase();
        const { error } = await sb
          .from('concierge_arrangements')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        setEventsRemote((prev) => {
          const next = applyLocal(prev);
          persistLocalMirror(next);
          return next;
        });
      } catch (e) {
        console.error(e);
        setEventsLocal((prev) => applyLocal(prev));
        setEventsRemote((prev) => applyLocal(prev));
        toast.error('Could not update status', {
          description: e instanceof Error ? e.message : 'Updated local copy only.',
        });
      }
    },
    [supabaseMode, setEventsLocal, persistLocalMirror]
  );

  return {
    events,
    addEvent,
    updateEventStatus,
  };
}
