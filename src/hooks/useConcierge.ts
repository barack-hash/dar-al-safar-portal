import { useMemo, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './useLocalStorage';
import { VisaApplication, EventBooking, VisaStatus, EventStatus, VisaDocumentStatus } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { visaFromRow, visaToInsert, type VisaRow } from '../lib/supabaseMaps';

const DEFAULT_VISAS: VisaApplication[] = [
  {
    id: 'v1',
    clientId: '1',
    destinationCountry: 'France',
    visaType: 'Schengen Tourist',
    status: 'PROCESSING',
    submissionDate: '2026-03-20',
    documentDeadline: '2026-03-28',
    passportRequired: true,
    pointOfEntry: 'Addis Ababa Bole International Airport',
    yellowFeverRequired: false,
    documents: [
      { id: 'd1', name: 'Passport Copy', status: 'VERIFIED', verifiedAt: '2026-03-21T10:00:00Z', verifiedBy: 'Amira Al-Farsi' },
      { id: 'd2', name: 'Bank Statement', status: 'UPLOADED' },
      { id: 'd3', name: 'Hotel Booking', status: 'MISSING' },
    ],
  },
  {
    id: 'v2',
    clientId: '2',
    destinationCountry: 'UAE',
    visaType: 'Dubai e-Visa',
    status: 'COLLECTING_DOCS',
    submissionDate: '2026-03-22',
    documentDeadline: '2026-03-26',
    passportRequired: true,
    pointOfEntry: 'Addis Ababa Bole International Airport',
    yellowFeverRequired: true,
    documents: [
      { id: 'd4', name: 'Passport Copy', status: 'MISSING' },
      { id: 'd5', name: 'Photo', status: 'MISSING' },
    ],
  },
];

export function useConcierge() {
  const supabaseMode = isSupabaseConfigured();
  const [visasLocal, setVisasLocal] = useLocalStorage<VisaApplication[]>('darsafar_visas', DEFAULT_VISAS);
  const [visasRemote, setVisasRemote] = useState<VisaApplication[]>([]);
  const visas = supabaseMode ? visasRemote : visasLocal;

  const [events, setEvents] = useLocalStorage<EventBooking[]>('darsafar_events', [
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
  ]);

  useEffect(() => {
    if (!supabaseMode) return;
    let cancelled = false;
    void (async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.from('visas').select('*').returns<VisaRow[]>();
        if (cancelled) return;
        if (error) throw error;
        setVisasRemote((data ?? []).map(visaFromRow));
      } catch (e) {
        console.error(e);
        toast.error('Could not load visas from Supabase', {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseMode]);

  const addVisa = useCallback(
    async (visa: Omit<VisaApplication, 'id'>) => {
      const newVisa: VisaApplication = {
        ...visa,
        id: Math.random().toString(36).substring(2, 11),
      };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('visas').insert(visaToInsert(newVisa));
          if (error) throw error;
          setVisasRemote((prev) => [...prev, newVisa]);
        } catch (e) {
          console.error(e);
          toast.error('Could not add visa', { description: e instanceof Error ? e.message : undefined });
          throw e;
        }
      } else {
        setVisasLocal((prev) => [...prev, newVisa]);
      }
      return newVisa;
    },
    [supabaseMode, setVisasLocal]
  );

  const updateVisaStatus = useCallback(
    async (id: string, status: VisaStatus) => {
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('visas').update({ status }).eq('id', id);
          if (error) throw error;
          setVisasRemote((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update visa', { description: e instanceof Error ? e.message : undefined });
        }
      } else {
        setVisasLocal((prev) => prev.map((v) => (v.id === id ? { ...v, status } : v)));
      }
    },
    [supabaseMode, setVisasLocal]
  );

  const updateVisaDocument = useCallback(
    async (visaId: string, docId: string, status: VisaDocumentStatus, verifiedAt?: string, verifiedBy?: string) => {
      const visa = visas.find((v) => v.id === visaId);
      if (!visa) return;
      const documents = visa.documents.map((d) =>
        d.id === docId ? { ...d, status, verifiedAt, verifiedBy } : d
      );
      const updated: VisaApplication = { ...visa, documents };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('visas').update({ documents }).eq('id', visaId);
          if (error) throw error;
          setVisasRemote((prev) => prev.map((v) => (v.id === visaId ? updated : v)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update document', { description: e instanceof Error ? e.message : undefined });
        }
      } else {
        setVisasLocal((prev) =>
          prev.map((v) => {
            if (v.id === visaId) {
              return {
                ...v,
                documents: v.documents.map((d) =>
                  d.id === docId ? { ...d, status, verifiedAt, verifiedBy } : d
                ),
              };
            }
            return v;
          })
        );
      }
    },
    [supabaseMode, visas, setVisasLocal]
  );

  const updateVisa = useCallback(
    async (id: string, updates: Partial<VisaApplication>) => {
      const v0 = visas.find((v) => v.id === id);
      if (!v0) return;
      const merged: VisaApplication = { ...v0, ...updates };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('visas').update(visaToInsert(merged)).eq('id', id);
          if (error) throw error;
          setVisasRemote((prev) => prev.map((v) => (v.id === id ? merged : v)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update visa', { description: e instanceof Error ? e.message : undefined });
        }
      } else {
        setVisasLocal((prev) => prev.map((v) => (v.id === id ? merged : v)));
      }
    },
    [supabaseMode, visas, setVisasLocal]
  );

  const addEvent = useCallback((event: Omit<EventBooking, 'id'>) => {
    const newEvent: EventBooking = {
      ...event,
      id: Math.random().toString(36).substring(2, 11),
    };
    setEvents((prev) => [...prev, newEvent]);
    return newEvent;
  }, [setEvents]);

  const updateEventStatus = useCallback(
    (id: string, status: EventStatus) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    },
    [setEvents]
  );

  const urgentVisas = useMemo(() => {
    return visas.filter((v) => v.status === 'COLLECTING_DOCS' || v.status === 'PROCESSING');
  }, [visas]);

  return {
    visas,
    events,
    addVisa,
    updateVisa,
    updateVisaStatus,
    updateVisaDocument,
    addEvent,
    updateEventStatus,
    urgentVisas,
  };
}
