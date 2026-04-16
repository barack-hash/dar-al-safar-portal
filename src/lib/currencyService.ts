import type { BookingRecord, Currency, Transaction } from '../types';

/**
 * Units of each currency per 1 USD (matches ExchangeRate-API `rates` / `conversion_rates`).
 */
export type ExchangeRates = Record<Currency, number>;

export type ExchangeRatesSource = 'live' | 'fallback';

/** Static fallback when offline, request fails, or pairs are missing. */
export const FALLBACK_EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  ETB: 56.5,
  SAR: 3.75,
};

function normalizeRates(raw: Record<string, number>): ExchangeRates {
  const etb = raw.ETB;
  const sar = raw.SAR;
  if (typeof etb !== 'number' || typeof sar !== 'number' || !Number.isFinite(etb) || !Number.isFinite(sar)) {
    throw new Error('Missing ETB/SAR in rate response');
  }
  return { USD: 1, ETB: etb, SAR: sar };
}

/**
 * Fetches USD-based rates for USD, ETB, SAR.
 * - With `VITE_EXCHANGERATE_API_KEY`: v6 authenticated endpoint.
 * - Without key: v4 public `latest/USD` (free tier; subject to provider limits).
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRates> {
  const apiKey = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EXCHANGERATE_API_KEY
    ? String(import.meta.env.VITE_EXCHANGERATE_API_KEY)
    : '';

  const url = apiKey
    ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    : 'https://api.exchangerate-api.com/v4/latest/USD';

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rate request failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    rates?: Record<string, number>;
    conversion_rates?: Record<string, number>;
  };

  const table = data.conversion_rates ?? data.rates;
  if (!table) {
    throw new Error('Invalid exchange rate payload');
  }

  return normalizeRates(table);
}

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  rates: ExchangeRates
): number {
  if (from === to) return amount;
  const unitsPerUsdFrom = rates[from] ?? FALLBACK_EXCHANGE_RATES[from];
  const unitsPerUsdTo = rates[to] ?? FALLBACK_EXCHANGE_RATES[to];
  if (!unitsPerUsdFrom || unitsPerUsdFrom === 0) return amount;
  const inUsd = amount / unitsPerUsdFrom;
  return inUsd * unitsPerUsdTo;
}

export function getCurrencySymbol(c: Currency): string {
  switch (c) {
    case 'ETB':
      return 'Br';
    case 'SAR':
      return 'SR';
    default:
      return '$';
  }
}

export function computeAccountingStatsDisplay(
  transactions: Transaction[],
  displayCurrency: Currency,
  rates: ExchangeRates
) {
  return transactions.reduce(
    (acc, tx) => {
      const amt = convertCurrency(tx.amount, tx.currency, displayCurrency, rates);
      const vat = convertCurrency(tx.taxDetails.vat, tx.currency, displayCurrency, rates);
      const wht = convertCurrency(tx.taxDetails.wht, tx.currency, displayCurrency, rates);

      if (tx.type === 'INCOME') {
        acc.totalRevenue += amt;
        acc.vatLiability += vat;
        acc.whtLiability += wht;
      } else if (tx.type === 'EXPENSE') {
        acc.totalExpenses += amt;
        acc.whtLiability += wht;
        acc.totalCashOutflow += amt - wht;
      }

      acc.netProfit = acc.totalRevenue - acc.totalExpenses;
      return acc;
    },
    {
      totalRevenue: 0,
      totalExpenses: 0,
      totalCashOutflow: 0,
      netProfit: 0,
      vatLiability: 0,
      whtLiability: 0,
    }
  );
}

export type MonthlyReportDisplay = {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  vatCollected: number;
  vatPaid: number;
  whtDeducted: number;
  transactionCount: number;
  transactions: Transaction[];
};

export function computeExpectedMarkupDisplay(
  bookings: BookingRecord[],
  displayCurrency: Currency,
  rates: ExchangeRates
): number {
  return bookings
    .filter((b) => b.status === 'TICKETED' || b.status === 'ON_HOLD')
    .reduce(
      (sum, b) => sum + convertCurrency(b.pricing.markup, b.pricing.currency, displayCurrency, rates),
      0
    );
}

export function computeMonthlyReportDisplay(
  transactions: Transaction[],
  month: number,
  year: number,
  displayCurrency: Currency,
  rates: ExchangeRates
): MonthlyReportDisplay {
  const filtered = transactions.filter((tx) => {
    const date = new Date(tx.date);
    return date.getMonth() === month && date.getFullYear() === year;
  });

  return filtered.reduce(
    (acc, tx) => {
      const amt = convertCurrency(tx.amount, tx.currency, displayCurrency, rates);
      const vat = convertCurrency(tx.taxDetails.vat, tx.currency, displayCurrency, rates);
      const wht = convertCurrency(tx.taxDetails.wht, tx.currency, displayCurrency, rates);

      if (tx.type === 'INCOME') {
        acc.totalRevenue += amt;
        acc.vatCollected += vat;
      } else if (tx.type === 'EXPENSE') {
        acc.totalExpenses += amt;
        acc.vatPaid += vat;
        acc.whtDeducted += wht;
      }

      acc.netIncome = acc.totalRevenue - acc.totalExpenses;
      return acc;
    },
    {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      vatCollected: 0,
      vatPaid: 0,
      whtDeducted: 0,
      transactionCount: filtered.length,
      transactions: filtered,
    }
  );
}
