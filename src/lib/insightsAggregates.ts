import type { BookingRecord, Client, Currency, FormalLedgerEntry, VisaApplication } from '../types';
import { convertCurrency, type ExchangeRates } from './currencyService';

export type MonthTrendPoint = {
  label: string;
  monthIndex: number;
  year: number;
  income: number;
  expenses: number;
  netProfit: number;
};

/** Last 6 calendar months ending at anchor month (inclusive). VERIFIED formal rows only. */
export function buildSixMonthFormalTrend(
  entries: FormalLedgerEntry[],
  displayCurrency: Currency,
  rates: ExchangeRates,
  anchorDate: Date = new Date()
): MonthTrendPoint[] {
  const verified = entries.filter((e) => e.status === 'VERIFIED');
  const result: MonthTrendPoint[] = [];

  for (let offset = 5; offset >= 0; offset--) {
    const d = new Date(anchorDate.getFullYear(), anchorDate.getMonth() - offset, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    let income = 0;
    let expenses = 0;

    for (const e of verified) {
      const ed = new Date(e.createdAt);
      if (ed.getFullYear() !== y || ed.getMonth() !== m) continue;
      const net = convertCurrency(e.netAmount, e.currency, displayCurrency, rates);
      if (e.category === 'Income') {
        income += net;
      } else if (e.category === 'Expense' || e.category === 'Tax') {
        expenses += net;
      }
    }

    result.push({
      label: d.toLocaleString('default', { month: 'short', year: 'numeric' }),
      monthIndex: m,
      year: y,
      income,
      expenses,
      netProfit: income - expenses,
    });
  }

  return result;
}

export type VisaPipelineChartRow = {
  name: string;
  value: number;
  fill: string;
};

const COLOR_APPROVED = '#10b981';
const COLOR_REJECTED = '#f43f5e';
const COLOR_PENDING = '#f59e0b';

export function buildVisaPipelineDistribution(visas: VisaApplication[]): VisaPipelineChartRow[] {
  let pending = 0;
  let approved = 0;
  let rejected = 0;

  for (const v of visas) {
    if (v.status === 'APPROVED') approved += 1;
    else if (v.status === 'REJECTED') rejected += 1;
    else pending += 1;
  }

  const rows: VisaPipelineChartRow[] = [];
  if (pending > 0) rows.push({ name: 'Pending', value: pending, fill: COLOR_PENDING });
  if (approved > 0) rows.push({ name: 'Approved', value: approved, fill: COLOR_APPROVED });
  if (rejected > 0) rows.push({ name: 'Rejected', value: rejected, fill: COLOR_REJECTED });
  return rows;
}

export type TopFormalClientRow = {
  clientId: string;
  name: string;
  totalNet: number;
  entryCount: number;
};

/** Top clients by summed net on VERIFIED Income rows with TICKETING source linked to bookings. */
export function topClientsFromFormalTicketing(
  formalLedger: FormalLedgerEntry[],
  bookings: BookingRecord[],
  clients: Client[],
  displayCurrency: Currency,
  rates: ExchangeRates,
  limit = 3
): TopFormalClientRow[] {
  const byClient: Record<string, { totalNet: number; entryCount: number }> = {};
  const bookingById = new Map(bookings.map((b) => [b.id, b]));

  for (const e of formalLedger) {
    if (e.status !== 'VERIFIED' || e.category !== 'Income' || e.sourceType !== 'TICKETING' || !e.sourceId) {
      continue;
    }
    const booking = bookingById.get(e.sourceId);
    if (!booking) continue;
    const clientId = booking.clientId;
    if (!byClient[clientId]) {
      byClient[clientId] = { totalNet: 0, entryCount: 0 };
    }
    byClient[clientId].totalNet += convertCurrency(e.netAmount, e.currency, displayCurrency, rates);
    byClient[clientId].entryCount += 1;
  }

  return Object.entries(byClient)
    .map(([clientId, agg]) => ({
      clientId,
      name: clients.find((c) => c.id === clientId)?.name ?? 'Unknown client',
      totalNet: agg.totalNet,
      entryCount: agg.entryCount,
    }))
    .sort((a, b) => b.totalNet - a.totalNet)
    .slice(0, limit);
}

function ticketedBookingTimestamp(b: BookingRecord): number {
  if (b.issuedAt) return new Date(b.issuedAt).getTime();
  return new Date(b.departureDate).getTime();
}

/** First day of the month, 6 months before anchor's month (7-month span start). */
function sixMonthWindowStart(anchor: Date): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() - 5, 1, 0, 0, 0, 0);
}

export type TopStaffTicketRow = {
  assignedStaffId: string;
  ticketCount: number;
};

/** Most TICKETED bookings in trailing 6 calendar months (from start of month M-5 through end of anchor month). */
export function topStaffByTicketedBookings(
  bookings: BookingRecord[],
  anchorDate: Date = new Date()
): TopStaffTicketRow | null {
  const start = sixMonthWindowStart(anchorDate);
  const end = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + 1, 0, 23, 59, 59, 999);

  const counts: Record<string, number> = {};
  for (const b of bookings) {
    if (b.status !== 'TICKETED' || !b.assignedStaffId) continue;
    const t = ticketedBookingTimestamp(b);
    if (t < start.getTime() || t > end.getTime()) continue;
    counts[b.assignedStaffId] = (counts[b.assignedStaffId] ?? 0) + 1;
  }

  let bestId: string | null = null;
  let best = 0;
  for (const [id, c] of Object.entries(counts)) {
    if (c > best) {
      best = c;
      bestId = id;
    }
  }
  if (!bestId || best === 0) return null;
  return { assignedStaffId: bestId, ticketCount: best };
}
