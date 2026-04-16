import { useMemo, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { VisaApplication, EventBooking, VisaStatus, EventStatus, VisaDocumentStatus } from '../types';

export function useConcierge() {
  const [visas, setVisas] = useLocalStorage<VisaApplication[]>('darsafar_visas', [
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
        { id: 'd3', name: 'Hotel Booking', status: 'MISSING' }
      ]
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
        { id: 'd5', name: 'Photo', status: 'MISSING' }
      ]
    }
  ]);
  const [events, setEvents] = useLocalStorage<EventBooking[]>('darsafar_events', [
    {
      id: 'e1',
      clientId: '1',
      title: 'Lalibela Private Tour',
      category: 'TOUR',
      startDate: '2026-04-15',
      endDate: '2026-04-16',
      status: 'CONFIRMED'
    },
    {
      id: 'e2',
      clientId: '2',
      title: 'Four Seasons Paris',
      category: 'HOTEL',
      startDate: '2026-04-10',
      endDate: '2026-04-14',
      status: 'PLANNING'
    }
  ]);

  const addVisa = useCallback((visa: Omit<VisaApplication, 'id'>) => {
    const newVisa: VisaApplication = {
      ...visa,
      id: Math.random().toString(36).substring(2, 11),
    };
    setVisas(prev => [...prev, newVisa]);
    return newVisa;
  }, [setVisas]);

  const updateVisaStatus = useCallback((id: string, status: VisaStatus) => {
    setVisas(prev => prev.map(v => v.id === id ? { ...v, status } : v));
  }, [setVisas]);

  const updateVisaDocument = useCallback((visaId: string, docId: string, status: VisaDocumentStatus, verifiedAt?: string, verifiedBy?: string) => {
    setVisas(prev => prev.map(v => {
      if (v.id === visaId) {
        return {
          ...v,
          documents: v.documents.map(d => d.id === docId ? { ...d, status, verifiedAt, verifiedBy } : d)
        };
      }
      return v;
    }));
  }, [setVisas]);

  const updateVisa = useCallback((id: string, updates: Partial<VisaApplication>) => {
    setVisas(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  }, [setVisas]);

  const addEvent = useCallback((event: Omit<EventBooking, 'id'>) => {
    const newEvent: EventBooking = {
      ...event,
      id: Math.random().toString(36).substring(2, 11),
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, [setEvents]);

  const updateEventStatus = useCallback((id: string, status: EventStatus) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  }, [setEvents]);

  const urgentVisas = useMemo(() => {
    return visas.filter(v => v.status === 'COLLECTING_DOCS' || v.status === 'PROCESSING');
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
    urgentVisas
  };
}
