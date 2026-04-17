import type {
  BookingRecord,
  Client,
  Currency,
  EventBooking,
  FlightSegment,
  FrequentFlyerNumber,
  Invoice,
  InvoiceItem,
  VisaApplication,
} from '../types';
import type { CashLogEntry } from '../types';

/** DB row shapes (public schema) — keep in sync with supabase/migrations. */

export interface ClientRow {
  id: string;
  name: string;
  email: string;
  passport_id: string;
  nationality: string;
  expiry_date: string | null;
  contact: string;
  source: string;
  notes: string;
  date_of_birth: string | null;
  phone_e164: string | null;
  ethiopian_national_id: string | null;
  passport_scan_url: string | null;
  national_id_scan_url: string | null;
  birth_certificate_url: string | null;
  family_group_id: string | null;
  frequent_flyer_numbers: FrequentFlyerNumber[] | null;
}

export interface InvoiceRow {
  id: string;
  client_id: string;
  client_name: string;
  passport_id: string;
  contact: string;
  date: string;
  due_date: string;
  status: string;
  items: InvoiceItem[];
  subtotal: number;
  concierge_fee: number;
  total: number;
  currency: string;
}

export interface VisaRow {
  id: string;
  client_id: string;
  destination_country: string;
  visa_type: string;
  status: string;
  submission_date: string;
  appointment_date: string | null;
  document_deadline: string;
  passport_required: boolean;
  documents: VisaApplication['documents'];
  point_of_entry: string;
  yellow_fever_required: boolean;
  intended_entry_date: string | null;
  assigned_staff_id?: string | null;
  external_tracking_id?: string | null;
  processing_center?: string | null;
  expected_approval_date?: string | null;
}

export interface CashLogRow {
  id: string;
  amount: number;
  currency: 'ETB' | 'USD';
  transaction_type: 'INCOME' | 'EXPENSE' | 'LOAN_REPAYMENT';
  account_source: string;
  counterparty_name: string | null;
  purpose: string | null;
  linked_client_id: string | null;
  recorded_by: string;
  description: string;
  quick_tags: string[] | null;
  is_formal_accounting_ready: boolean;
  due_date: string | null;
  reminder_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export function clientFromRow(r: ClientRow): Client {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    passportID: r.passport_id,
    nationality: r.nationality,
    expiryDate: r.expiry_date ?? '',
    contact: r.contact,
    source: r.source,
    notes: r.notes,
    dateOfBirth: r.date_of_birth ?? '',
    phoneE164: r.phone_e164 ?? '',
    ethiopianNationalID: r.ethiopian_national_id ?? '',
    passportScanUrl: r.passport_scan_url ?? '',
    nationalIdScanUrl: r.national_id_scan_url ?? '',
    birthCertificateUrl: r.birth_certificate_url ?? '',
    familyGroupId: r.family_group_id ?? '',
    frequentFlyerNumbers: Array.isArray(r.frequent_flyer_numbers) ? r.frequent_flyer_numbers : [],
  };
}

export function clientToInsert(c: Client): Omit<ClientRow, never> {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    passport_id: c.passportID,
    nationality: c.nationality,
    expiry_date: c.expiryDate || null,
    contact: c.contact,
    source: c.source,
    notes: c.notes,
    date_of_birth: c.dateOfBirth || null,
    phone_e164: c.phoneE164 || null,
    ethiopian_national_id: c.ethiopianNationalID || null,
    passport_scan_url: c.passportScanUrl || null,
    national_id_scan_url: c.nationalIdScanUrl || null,
    birth_certificate_url: c.birthCertificateUrl || null,
    family_group_id: c.familyGroupId || null,
    frequent_flyer_numbers: c.frequentFlyerNumbers ?? [],
  };
}

export function invoiceFromRow(r: InvoiceRow): Invoice {
  return {
    id: r.id,
    clientId: r.client_id,
    clientName: r.client_name,
    passportID: r.passport_id,
    contact: r.contact,
    date: r.date,
    dueDate: r.due_date,
    status: r.status as Invoice['status'],
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: Number(r.subtotal),
    conciergeFee: Number(r.concierge_fee),
    total: Number(r.total),
    currency: r.currency as Invoice['currency'],
  };
}

export function invoiceToInsert(inv: Invoice): InvoiceRow {
  return {
    id: inv.id,
    client_id: inv.clientId,
    client_name: inv.clientName,
    passport_id: inv.passportID,
    contact: inv.contact,
    date: inv.date,
    due_date: inv.dueDate,
    status: inv.status,
    items: inv.items,
    subtotal: inv.subtotal,
    concierge_fee: inv.conciergeFee,
    total: inv.total,
    currency: inv.currency,
  };
}

export function visaFromRow(r: VisaRow): VisaApplication {
  return {
    id: r.id,
    clientId: r.client_id,
    destinationCountry: r.destination_country,
    visaType: r.visa_type,
    status: r.status as VisaApplication['status'],
    submissionDate: r.submission_date,
    appointmentDate: r.appointment_date ?? undefined,
    documentDeadline: r.document_deadline,
    passportRequired: r.passport_required,
    documents: Array.isArray(r.documents) ? r.documents : [],
    pointOfEntry: r.point_of_entry,
    yellowFeverRequired: r.yellow_fever_required,
    intendedEntryDate: r.intended_entry_date ?? undefined,
    assignedStaffId: r.assigned_staff_id ?? undefined,
    externalTrackingId: r.external_tracking_id ?? undefined,
    processingCenter: r.processing_center ?? undefined,
    expectedApprovalDate: r.expected_approval_date ?? undefined,
  };
}

export function visaToInsert(v: VisaApplication): VisaRow {
  return {
    id: v.id,
    client_id: v.clientId,
    destination_country: v.destinationCountry,
    visa_type: v.visaType,
    status: v.status,
    submission_date: v.submissionDate,
    appointment_date: v.appointmentDate ?? null,
    document_deadline: v.documentDeadline,
    passport_required: v.passportRequired,
    documents: v.documents,
    point_of_entry: v.pointOfEntry,
    yellow_fever_required: v.yellowFeverRequired,
    intended_entry_date: v.intendedEntryDate ?? null,
    assigned_staff_id: v.assignedStaffId ?? null,
    external_tracking_id: v.externalTrackingId ?? null,
    processing_center: v.processingCenter ?? null,
    expected_approval_date: v.expectedApprovalDate ?? null,
  };
}

export interface ConciergeArrangementRow {
  id: string;
  client_id: string;
  assigned_staff_id: string | null;
  title: string;
  category: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export function arrangementFromRow(r: ConciergeArrangementRow): EventBooking {
  return {
    id: r.id,
    clientId: r.client_id,
    assignedStaffId: r.assigned_staff_id ?? undefined,
    title: r.title,
    category: r.category as EventBooking['category'],
    startDate: r.start_date,
    endDate: r.end_date,
    status: r.status as EventBooking['status'],
  };
}

/** Payload for insert/update (excludes DB-managed timestamps on insert). */
export function arrangementToInsert(e: EventBooking): Omit<ConciergeArrangementRow, 'created_at' | 'updated_at'> {
  return {
    id: e.id,
    client_id: e.clientId,
    assigned_staff_id: e.assignedStaffId ?? null,
    title: e.title,
    category: e.category,
    start_date: e.startDate,
    end_date: e.endDate,
    status: e.status,
  };
}

export interface TicketingBookingRow {
  id: string;
  client_id: string;
  assigned_staff_id: string | null;
  pnr_code: string;
  airline_code: string;
  ticket_number: string | null;
  itinerary_summary: string;
  departure_date: string;
  arrival_date: string;
  time_to_limit: string;
  status: string;
  pricing: unknown;
  itinerary: unknown;
  /** Present after migration 20260422120000_ticketing_bookings_issued_at.sql */
  issued_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

function parseTicketingPricing(raw: unknown): BookingRecord['pricing'] {
  if (!raw || typeof raw !== 'object') {
    return { netFare: 0, taxes: 0, markup: 0, grossTotal: 0, currency: 'USD' };
  }
  const o = raw as Record<string, unknown>;
  const cur = String(o.currency ?? 'USD');
  const currency = (['USD', 'SAR', 'ETB'].includes(cur) ? cur : 'USD') as Currency;
  return {
    netFare: Number(o.netFare) || 0,
    taxes: Number(o.taxes) || 0,
    markup: Number(o.markup) || 0,
    grossTotal: Number(o.grossTotal) || 0,
    currency,
  };
}

function parseTicketingItinerary(raw: unknown): FlightSegment[] {
  if (!Array.isArray(raw)) return [];
  return raw as FlightSegment[];
}

export function bookingFromRow(r: TicketingBookingRow): BookingRecord {
  const itinerary = parseTicketingItinerary(r.itinerary);
  const first = itinerary[0];
  const last = itinerary[itinerary.length - 1] ?? first;
  const summary =
    r.itinerary_summary?.trim() ||
    (first && last ? `${first.departure.airportCode} -> ${last.arrival.airportCode}` : '—');
  return {
    id: r.id,
    pnr: r.pnr_code,
    clientId: r.client_id,
    airlineCode: r.airline_code,
    ticketNumber: r.ticket_number ?? undefined,
    assignedStaffId: r.assigned_staff_id ?? undefined,
    itinerarySummary: summary,
    departureDate: r.departure_date,
    arrivalDate: r.arrival_date,
    itinerary,
    status: r.status as BookingRecord['status'],
    ticketingTimeLimit: r.time_to_limit,
    pricing: parseTicketingPricing(r.pricing),
    issuedAt: r.issued_at ?? undefined,
  };
}

/** Insert / full-row replace — omit issued_at so DBs without that column still accept inserts. */
export function bookingToInsert(
  b: BookingRecord
): Omit<TicketingBookingRow, 'created_at' | 'updated_at' | 'issued_at'> {
  return {
    id: b.id,
    client_id: b.clientId,
    assigned_staff_id: b.assignedStaffId ?? null,
    pnr_code: b.pnr,
    airline_code: b.airlineCode,
    ticket_number: b.ticketNumber ?? null,
    itinerary_summary: b.itinerarySummary,
    departure_date: b.departureDate,
    arrival_date: b.arrivalDate,
    time_to_limit: b.ticketingTimeLimit,
    status: b.status,
    pricing: b.pricing,
    itinerary: b.itinerary,
  };
}

export function cashLogFromRow(r: CashLogRow): CashLogEntry {
  return {
    id: r.id,
    amount: Number(r.amount),
    currency: r.currency,
    transactionType: r.transaction_type,
    accountSource: r.account_source,
    counterpartyName: r.counterparty_name ?? undefined,
    purpose: r.purpose ?? undefined,
    linkedClientId: r.linked_client_id ?? undefined,
    recordedBy: r.recorded_by,
    description: r.description,
    quickTags: Array.isArray(r.quick_tags) ? r.quick_tags : [],
    isFormalAccountingReady: r.is_formal_accounting_ready,
    dueDate: r.due_date ?? undefined,
    reminderEnabled: r.reminder_enabled,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function cashLogToInsert(e: CashLogEntry): CashLogRow {
  return {
    id: e.id,
    amount: e.amount,
    currency: e.currency,
    transaction_type: e.transactionType,
    account_source: e.accountSource,
    counterparty_name: e.counterpartyName ?? null,
    purpose: e.purpose ?? null,
    linked_client_id: e.linkedClientId ?? null,
    recorded_by: e.recordedBy,
    description: e.description,
    quick_tags: e.quickTags,
    is_formal_accounting_ready: e.isFormalAccountingReady,
    due_date: e.dueDate ?? null,
    reminder_enabled: e.reminderEnabled,
    created_at: e.createdAt,
    updated_at: e.updatedAt ?? e.createdAt,
  };
}
