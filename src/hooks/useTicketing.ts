import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './useLocalStorage';
import { BookingRecord, TicketStatus } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { bookingFromRow, bookingToInsert, type TicketingBookingRow } from '../lib/supabaseMaps';

function migrateTicketStatus(s: string): TicketStatus {
  const map: Record<string, TicketStatus> = {
    ON_HOLD: 'ON_HOLD',
    TICKETED: 'TICKETED',
    VOIDED: 'VOIDED',
    CANCELLED: 'CANCELLED',
    DRAFT: 'ON_HOLD',
    REFUNDED: 'VOIDED',
  };
  return map[s] ?? 'ON_HOLD';
}

function normalizeBooking(b: BookingRecord): BookingRecord {
  const itinerary = Array.isArray(b.itinerary) ? b.itinerary : [];
  const first = itinerary[0];
  const last = itinerary[itinerary.length - 1] ?? first;
  const itinerarySummary =
    b.itinerarySummary?.trim() ||
    (first && last ? `${first.departure.airportCode} -> ${last.arrival.airportCode}` : '—');
  const departureDate =
    b.departureDate ||
    (first?.departure?.at ? String(first.departure.at).split('T')[0] : new Date().toISOString().split('T')[0]);
  const arrivalDate =
    b.arrivalDate ||
    (last?.arrival?.at ? String(last.arrival.at).split('T')[0] : departureDate);
  return {
    ...b,
    status: migrateTicketStatus(b.status as string),
    airlineCode: (b.airlineCode || 'ET').trim() || 'ET',
    itinerarySummary,
    departureDate,
    arrivalDate,
    itinerary,
  };
}

const DEFAULT_BOOKINGS: BookingRecord[] = [
  normalizeBooking({
    id: '1',
    pnr: 'ETX78Q',
    clientId: '1',
    airlineCode: 'ET',
    itinerarySummary: 'ADD -> CDG',
    departureDate: '2026-04-10',
    arrivalDate: '2026-04-10',
    status: 'ON_HOLD',
    ticketingTimeLimit: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    itinerary: [
      {
        id: 'seg-1',
        flightNumber: 'ET704',
        airline: 'Ethiopian Airlines',
        departure: { airportCode: 'ADD', at: '2026-04-10T10:00:00Z' },
        arrival: { airportCode: 'CDG', at: '2026-04-10T18:00:00Z' },
        cabinClass: 'Cloud Nine/Business',
      },
    ],
    pricing: {
      netFare: 1200,
      taxes: 350,
      markup: 150,
      grossTotal: 1700,
      currency: 'USD',
    },
  }),
  normalizeBooking({
    id: '2',
    pnr: 'SV992P',
    clientId: '2',
    airlineCode: 'SV',
    ticketNumber: 'SV-1234567890',
    itinerarySummary: 'JED -> ADD',
    departureDate: '2026-05-15',
    arrivalDate: '2026-05-15',
    status: 'TICKETED',
    ticketingTimeLimit: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    itinerary: [
      {
        id: 'seg-2',
        flightNumber: 'SV452',
        airline: 'Saudia',
        departure: { airportCode: 'JED', at: '2026-05-15T08:00:00Z' },
        arrival: { airportCode: 'ADD', at: '2026-05-15T11:00:00Z' },
        cabinClass: 'Economy',
      },
    ],
    pricing: {
      netFare: 450,
      taxes: 120,
      markup: 50,
      grossTotal: 620,
      currency: 'USD',
    },
  }),
];

export function useTicketing() {
  const supabaseMode = isSupabaseConfigured();
  const [bookingsLocal, setBookingsLocal] = useLocalStorage<BookingRecord[]>('darsafar_bookings', DEFAULT_BOOKINGS);
  const [bookingsRemote, setBookingsRemote] = useState<BookingRecord[]>([]);
  const bookingsRaw = supabaseMode ? bookingsRemote : bookingsLocal;
  const bookings = useMemo(() => bookingsRaw.map(normalizeBooking), [bookingsRaw]);

  const bookingsLocalRef = useRef(bookingsLocal);
  bookingsLocalRef.current = bookingsLocal;

  const persistLocalMirror = useCallback(
    (list: BookingRecord[]) => {
      setBookingsLocal(list);
    },
    [setBookingsLocal]
  );

  useEffect(() => {
    if (!supabaseMode) return;
    let cancelled = false;

    const load = () => {
      void (async () => {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          if (!cancelled) {
            setBookingsRemote(bookingsLocalRef.current.map(normalizeBooking));
            toast.message('Working offline', { description: 'Showing saved PNRs from this browser.' });
          }
          return;
        }
        try {
          const sb = getSupabase();
          const { data, error } = await sb
            .from('ticketing_bookings')
            .select('*')
            .returns<TicketingBookingRow[]>();
          if (cancelled) return;
          if (error) throw error;
          const list = (data ?? []).map((r) => normalizeBooking(bookingFromRow(r as TicketingBookingRow)));
          setBookingsRemote(list);
          persistLocalMirror(list);
        } catch (e) {
          console.error(e);
          if (!cancelled) {
            setBookingsRemote(bookingsLocalRef.current.map(normalizeBooking));
            toast.error('Could not load ticketing bookings', {
              description: e instanceof Error ? e.message : 'Using local copy if available.',
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

  const createBooking = useCallback(
    async (booking: Omit<BookingRecord, 'id'>) => {
      const newBooking = normalizeBooking({
        ...booking,
        id: Math.random().toString(36).substring(2, 11),
      });

      if (!supabaseMode) {
        setBookingsLocal((prev) => [...prev, newBooking]);
        return newBooking;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setBookingsLocal((prev) => [...prev, newBooking]);
        setBookingsRemote((prev) => [...prev, newBooking]);
        toast.message('Saved offline', { description: 'PNR will sync when you are back online.' });
        return newBooking;
      }

      try {
        const sb = getSupabase();
        const { error } = await sb.from('ticketing_bookings').insert(bookingToInsert(newBooking));
        if (error) throw error;
        setBookingsRemote((prev) => {
          const next = [...prev, newBooking];
          persistLocalMirror(next);
          return next;
        });
      } catch (e) {
        console.error(e);
        setBookingsLocal((prev) => [...prev, newBooking]);
        setBookingsRemote((prev) => [...prev, newBooking]);
        toast.error('Could not save PNR to server', {
          description: e instanceof Error ? e.message : 'Kept a local copy.',
        });
      }
      return newBooking;
    },
    [supabaseMode, setBookingsLocal, persistLocalMirror]
  );

  const issueTicket = useCallback(
    async (id: string, payload: { ticketNumber: string }) => {
      const ticketNumber = payload.ticketNumber.trim();
      if (!ticketNumber) {
        toast.error('Ticket number is required');
        throw new Error('Ticket number is required');
      }

      const issuedAt = new Date().toISOString();
      const apply = (list: BookingRecord[]) =>
        list.map((b) =>
          b.id === id
            ? normalizeBooking({
                ...b,
                status: 'TICKETED',
                ticketNumber,
                issuedAt,
              })
            : b
        );

      if (!supabaseMode) {
        setBookingsLocal(apply);
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setBookingsLocal(apply);
        setBookingsRemote(apply);
        toast.message('Ticket saved offline', { description: 'Sync when online.' });
        return;
      }

      try {
        const sb = getSupabase();
        const { error } = await sb
          .from('ticketing_bookings')
          .update({
            status: 'TICKETED',
            ticket_number: ticketNumber,
            issued_at: issuedAt,
            updated_at: issuedAt,
          })
          .eq('id', id);
        if (error) throw error;
        setBookingsRemote((prev) => {
          const next = apply(prev);
          persistLocalMirror(next);
          return next;
        });
      } catch (e) {
        console.error(e);
        setBookingsLocal(apply);
        setBookingsRemote(apply);
        toast.error('Could not update ticket on server', {
          description: e instanceof Error ? e.message : 'Updated local copy only.',
        });
      }
    },
    [supabaseMode, setBookingsLocal, persistLocalMirror]
  );

  const cancelBooking = useCallback(
    async (id: string) => {
      const apply = (list: BookingRecord[]) =>
        list.map((b) => (b.id === id ? normalizeBooking({ ...b, status: 'CANCELLED' }) : b));

      if (!supabaseMode) {
        setBookingsLocal(apply);
        return;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setBookingsLocal(apply);
        setBookingsRemote(apply);
        return;
      }

      try {
        const sb = getSupabase();
        const { error } = await sb
          .from('ticketing_bookings')
          .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        setBookingsRemote((prev) => {
          const next = apply(prev);
          persistLocalMirror(next);
          return next;
        });
      } catch (e) {
        console.error(e);
        setBookingsLocal(apply);
        setBookingsRemote(apply);
        toast.error('Could not cancel on server', {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    },
    [supabaseMode, setBookingsLocal, persistLocalMirror]
  );

  const expiringHolds = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return bookings.filter(
      (b) =>
        b.status === 'ON_HOLD' &&
        new Date(b.ticketingTimeLimit) > now &&
        new Date(b.ticketingTimeLimit) <= tomorrow
    );
  }, [bookings]);

  const ticketingStats = useMemo(() => {
    const activeHolds = bookings.filter((b) => b.status === 'ON_HOLD').length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const ticketsIssuedThisMonth = bookings.filter((b) => {
      if (b.status !== 'TICKETED') return false;
      const issued = b.issuedAt ? new Date(b.issuedAt) : null;
      if (!issued || Number.isNaN(issued.getTime())) return false;
      return issued.getMonth() === currentMonth && issued.getFullYear() === currentYear;
    }).length;

    const expectedMarkup = bookings
      .filter((b) => b.status === 'TICKETED' || b.status === 'ON_HOLD')
      .reduce((sum, b) => sum + b.pricing.markup, 0);

    return {
      activeHolds,
      ticketsIssuedThisMonth,
      expectedMarkup,
    };
  }, [bookings]);

  return {
    bookings,
    createBooking,
    issueTicket,
    cancelBooking,
    expiringHolds,
    ticketingStats,
  };
}
