import { useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { BookingRecord } from '../types';

export function useTicketing() {
  const [bookings, setBookings] = useLocalStorage<BookingRecord[]>('darsafar_bookings', [
    {
      id: '1',
      pnr: 'ETX78Q',
      clientId: '1',
      status: 'ON_HOLD',
      ticketingTimeLimit: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
      itinerary: [
        {
          id: 'seg-1',
          flightNumber: 'ET704',
          airline: 'Ethiopian Airlines',
          departure: { airportCode: 'ADD', at: '2026-04-10T10:00:00Z' },
          arrival: { airportCode: 'CDG', at: '2026-04-10T18:00:00Z' },
          cabinClass: 'Cloud Nine/Business'
        }
      ],
      pricing: {
        netFare: 1200,
        taxes: 350,
        markup: 150,
        grossTotal: 1700,
        currency: 'USD'
      }
    },
    {
      id: '2',
      pnr: 'SV992P',
      clientId: '2',
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
          cabinClass: 'Economy'
        }
      ],
      pricing: {
        netFare: 450,
        taxes: 120,
        markup: 50,
        grossTotal: 620,
        currency: 'USD'
      }
    }
  ]);

  const createBooking = (booking: Omit<BookingRecord, 'id'>) => {
    const newBooking: BookingRecord = {
      ...booking,
      id: Math.random().toString(36).substring(2, 11),
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  const issueTicket = (id: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'TICKETED', issuedAt: new Date().toISOString() } : b
    ));
  };

  const cancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => 
      b.id === id ? { ...b, status: 'CANCELLED' } : b
    ));
  };

  const expiringHolds = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return bookings.filter(b => 
      b.status === 'ON_HOLD' && 
      new Date(b.ticketingTimeLimit) > now && 
      new Date(b.ticketingTimeLimit) <= tomorrow
    );
  }, [bookings]);

  const ticketingStats = useMemo(() => {
    const activeHolds = bookings.filter(b => b.status === 'ON_HOLD').length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const ticketsIssuedThisMonth = bookings.filter(b => {
      if (b.status !== 'TICKETED' || !b.issuedAt) return false;
      const issuedDate = new Date(b.issuedAt);
      return issuedDate.getMonth() === currentMonth && issuedDate.getFullYear() === currentYear;
    }).length;

    const expectedMarkup = bookings
      .filter(b => b.status === 'TICKETED' || b.status === 'ON_HOLD')
      .reduce((sum, b) => sum + b.pricing.markup, 0);

    return {
      activeHolds,
      ticketsIssuedThisMonth,
      expectedMarkup
    };
  }, [bookings]);

  return {
    bookings,
    createBooking,
    issueTicket,
    cancelBooking,
    expiringHolds,
    ticketingStats
  };
}
