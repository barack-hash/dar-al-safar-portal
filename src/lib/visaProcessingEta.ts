import { COUNTRIES } from '../constants/countries';

/** YYYY-MM-DD in UTC calendar (local noon avoids DST edge cases). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

/**
 * Add N business days starting from startDateIso (exclusive of start; first step is next calendar day).
 * Skips Saturday/Sunday only.
 */
export function addBusinessDaysSkippingWeekends(startDateIso: string, businessDays: number): string {
  const d = new Date(`${startDateIso}T12:00:00`);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    if (isWeekend(d)) continue;
    added += 1;
  }
  return toDateKey(d);
}

export type NagerHolidayEntry = { date: string; localName: string; name: string };

/**
 * Fetch public holidays for a country/year from Nager.Date (free, no API key).
 * https://date.nager.at
 */
export async function fetchNagerPublicHolidays(countryCode: string, year: number): Promise<Set<string>> {
  const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`);
  if (!res.ok) {
    throw new Error(`Nager.Date failed: ${res.status}`);
  }
  const data = (await res.json()) as NagerHolidayEntry[];
  return new Set(data.map((h) => h.date));
}

/** Resolve destination display name (e.g. "France") to ISO 3166-1 alpha-2 for Nager. */
export function destinationCountryToIsoCode(destinationName: string): string | null {
  const trimmed = destinationName.trim();
  const hit = COUNTRIES.find((c) => c.name === trimmed);
  return hit?.code ?? null;
}

/**
 * Add N business days; skips weekends and dates in holidaySet (YYYY-MM-DD keys).
 */
export function addBusinessDaysSkippingWeekendsAndHolidays(
  startDateIso: string,
  businessDays: number,
  holidaySet: Set<string>
): string {
  const d = new Date(`${startDateIso}T12:00:00`);
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const key = toDateKey(d);
    if (isWeekend(d) || holidaySet.has(key)) continue;
    added += 1;
  }
  return toDateKey(d);
}

export type ComputeEtaParams = {
  submissionDate: string;
  destinationCountry: string;
  /** Working days to add after submission (SLA). */
  businessDays?: number;
};

/**
 * Expected approval date using weekends + destination public holidays (Nager.Date).
 * Falls back to weekend-only if country code unknown or API fails.
 */
export async function computeExpectedApprovalDateAsync(params: ComputeEtaParams): Promise<string> {
  const { submissionDate, destinationCountry, businessDays = 15 } = params;
  const code = destinationCountryToIsoCode(destinationCountry);
  if (!code) {
    return addBusinessDaysSkippingWeekends(submissionDate, businessDays);
  }
  const startYear = new Date(`${submissionDate}T12:00:00`).getFullYear();
  try {
    const holidays = new Set<string>();
    for (const y of [startYear, startYear + 1]) {
      const h = await fetchNagerPublicHolidays(code, y);
      h.forEach((d) => holidays.add(d));
    }
    return addBusinessDaysSkippingWeekendsAndHolidays(submissionDate, businessDays, holidays);
  } catch {
    return addBusinessDaysSkippingWeekends(submissionDate, businessDays);
  }
}
