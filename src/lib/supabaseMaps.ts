import type { Client, FrequentFlyerNumber, Invoice, InvoiceItem, VisaApplication } from '../types';
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
}

export interface CashTransactionRow {
  id: string;
  date: string;
  client_entity: string;
  service: string;
  description: string;
  money_in: number;
  money_out: number;
  currency: string;
  method: string;
  staff: string;
  notes: string;
  status: string;
  category: string;
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
  };
}

export function cashEntryFromRow(r: CashTransactionRow): CashLogEntry {
  return {
    id: r.id,
    date: r.date,
    clientEntity: r.client_entity,
    service: r.service,
    description: r.description,
    moneyIn: Number(r.money_in),
    moneyOut: Number(r.money_out),
    currency: r.currency as CashLogEntry['currency'],
    method: r.method as CashLogEntry['method'],
    staff: r.staff,
    notes: r.notes,
    status: r.status as CashLogEntry['status'],
    category: r.category as CashLogEntry['category'],
  };
}

export function cashEntryToRow(e: CashLogEntry): CashTransactionRow {
  return {
    id: e.id,
    date: e.date,
    client_entity: e.clientEntity,
    service: e.service,
    description: e.description,
    money_in: e.moneyIn,
    money_out: e.moneyOut,
    currency: e.currency,
    method: e.method,
    staff: e.staff,
    notes: e.notes,
    status: e.status,
    category: e.category,
  };
}
