import type { Currency, FormalLedgerEntry } from '../types';
import { convertCurrency, type ExchangeRates } from './currencyService';

/**
 * Filter formal ledger rows whose created_at falls in the local calendar month.
 * Uses the same month index convention as JS Date (0–11).
 */
export function filterFormalLedgerByCalendarMonth(
  entries: FormalLedgerEntry[],
  month: number,
  year: number
): FormalLedgerEntry[] {
  return entries.filter((e) => {
    const d = new Date(e.createdAt);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export type FormalPeriodReportDisplay = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  vatCollected: number;
  vatPaid: number;
  whtDeducted: number;
  entryCount: number;
  entries: FormalLedgerEntry[];
};

/**
 * P&amp;L rollup for a period slice. Only **VERIFIED** rows contribute to totals.
 * Operating revenue uses **net** amounts on Income rows. Expenses and Tax use net amounts.
 * Transfer rows are excluded from revenue and expense lines.
 */
export function computeFormalPeriodReportDisplay(
  periodEntries: FormalLedgerEntry[],
  displayCurrency: Currency,
  rates: ExchangeRates
): FormalPeriodReportDisplay {
  const verified = periodEntries.filter((e) => e.status === 'VERIFIED');

  const acc = verified.reduce(
    (a, e) => {
      const net = convertCurrency(e.netAmount, e.currency, displayCurrency, rates);
      const vat = convertCurrency(e.vatAmount, e.currency, displayCurrency, rates);
      const wht = convertCurrency(e.whtAmount, e.currency, displayCurrency, rates);

      if (e.category === 'Income') {
        a.totalRevenue += net;
        a.vatCollected += vat;
      } else if (e.category === 'Expense') {
        a.totalExpenses += net;
        a.vatPaid += vat;
        a.whtDeducted += wht;
      } else if (e.category === 'Tax') {
        a.totalExpenses += net;
        a.vatPaid += vat;
        a.whtDeducted += wht;
      }

      return a;
    },
    {
      totalRevenue: 0,
      totalExpenses: 0,
      vatCollected: 0,
      vatPaid: 0,
      whtDeducted: 0,
    }
  );

  return {
    ...acc,
    netIncome: acc.totalRevenue - acc.totalExpenses,
    entryCount: verified.length,
    entries: verified,
  };
}
