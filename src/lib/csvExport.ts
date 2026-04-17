import type { FormalLedgerEntry } from '../types';

/** RFC 4180-style CSV cell escaping. */
export function escapeCsvCell(value: string | number): string {
  const s = typeof value === 'number' ? String(value) : value;
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function formalDateOnly(createdAt: string): string {
  if (createdAt.includes('T')) return createdAt.split('T')[0] ?? createdAt.slice(0, 10);
  return createdAt.slice(0, 10);
}

function sourceColumn(e: FormalLedgerEntry): string {
  if (e.sourceId) return `${e.sourceType}:${e.sourceId}`;
  return e.sourceType;
}

const FORMAL_CSV_HEADERS = [
  'Date',
  'Description',
  'Category',
  'Currency',
  'Gross Amount',
  'VAT Amount',
  'WHT Amount',
  'Net Amount',
  'Status',
  'Source',
] as const;

/**
 * Build CSV for formal ledger rows. Amounts are in each row's native currency.
 */
export function formalLedgerRowsToCsv(entries: FormalLedgerEntry[]): string {
  const lines: string[] = [FORMAL_CSV_HEADERS.map(escapeCsvCell).join(',')];

  for (const e of entries) {
    const row = [
      formalDateOnly(e.createdAt),
      e.description,
      e.category,
      e.currency,
      e.grossAmount,
      e.vatAmount,
      e.whtAmount,
      e.netAmount,
      e.status,
      sourceColumn(e),
    ];
    lines.push(row.map(escapeCsvCell).join(','));
  }

  return lines.join('\n');
}

export function downloadCsvBlob(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
