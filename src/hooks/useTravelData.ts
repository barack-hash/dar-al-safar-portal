import { useState, useEffect, useCallback } from 'react';

export interface TrendingTravelDestination {
  id: string;
  name: string;
  country: string;
  region: string;
  /** 0–100 relative interest score from provider (or heuristic when using fallback). */
  trendScore: number;
  avgStayNights: number;
  source: 'live' | 'fallback';
}

const FALLBACK_TRENDING: TrendingTravelDestination[] = [
  { id: 'dxb', name: 'Dubai', country: 'UAE', region: 'Middle East', trendScore: 92, avgStayNights: 5, source: 'fallback' },
  { id: 'ruh', name: 'Riyadh', country: 'Saudi Arabia', region: 'Middle East', trendScore: 88, avgStayNights: 4, source: 'fallback' },
  { id: 'cdg', name: 'Paris', country: 'France', region: 'Europe', trendScore: 85, avgStayNights: 6, source: 'fallback' },
  { id: 'add', name: 'Addis Ababa', country: 'Ethiopia', region: 'Africa', trendScore: 78, avgStayNights: 7, source: 'fallback' },
  { id: 'nbo', name: 'Nairobi', country: 'Kenya', region: 'Africa', trendScore: 74, avgStayNights: 5, source: 'fallback' },
  { id: 'zrh', name: 'Zürich', country: 'Switzerland', region: 'Europe', trendScore: 71, avgStayNights: 4, source: 'fallback' },
];

/**
 * Placeholder integration for a real travel-intel API (Amadeus, Skyscanner insights, etc.).
 * Replace `PLACEHOLDER_ENDPOINT` and response mapping when credentials are available.
 */
export async function fetchTrendingTravelDestinations(): Promise<TrendingTravelDestination[]> {
  const endpoint =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_TRAVEL_TRENDING_ENDPOINT
      ? String(import.meta.env.VITE_TRAVEL_TRENDING_ENDPOINT)
      : '';

  if (!endpoint) {
    return FALLBACK_TRENDING.map((d) => ({ ...d, source: 'fallback' as const }));
  }

  const res = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`Travel data request failed: ${res.status}`);
  }

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) {
    throw new Error('Unexpected travel API shape');
  }

  return (data as Record<string, unknown>[]).map((row, i) => ({
    id: String(row.id ?? row.code ?? `dest-${i}`),
    name: String(row.name ?? row.city ?? 'Unknown'),
    country: String(row.country ?? ''),
    region: String(row.region ?? ''),
    trendScore: Number(row.trendScore ?? row.score ?? 0),
    avgStayNights: Number(row.avgStayNights ?? row.nights ?? 4),
    source: 'live' as const,
  }));
}

export function useTravelData() {
  const [destinations, setDestinations] = useState<TrendingTravelDestination[]>(FALLBACK_TRENDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setDestinations(FALLBACK_TRENDING.map((d) => ({ ...d, source: 'fallback' })));
        setError('Offline — showing cached destinations.');
        return;
      }
      const next = await fetchTrendingTravelDestinations();
      setDestinations(next.length ? next : FALLBACK_TRENDING.map((d) => ({ ...d, source: 'fallback' })));
    } catch (e) {
      setDestinations(FALLBACK_TRENDING.map((d) => ({ ...d, source: 'fallback' })));
      setError(e instanceof Error ? e.message : 'Travel data unavailable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { destinations, loading, error, refresh };
}
