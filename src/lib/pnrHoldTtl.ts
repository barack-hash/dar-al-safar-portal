import type { TicketStatus } from '../types';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export type HoldUrgencyLevel = 'ok' | 'critical' | 'expired';

export function getHoldRemainingMs(timeToLimitIso: string, now: Date = new Date()): number {
  return new Date(timeToLimitIso).getTime() - now.getTime();
}

/**
 * For ON_HOLD PNRs: "critical" when TTL is under 2 hours but not yet expired (pulsing red UI).
 */
export function getHoldUrgency(
  timeToLimitIso: string,
  now: Date = new Date(),
  status: TicketStatus = 'ON_HOLD'
): { level: HoldUrgencyLevel; remainingMs: number } {
  if (status !== 'ON_HOLD') {
    return { level: 'ok', remainingMs: Math.max(0, getHoldRemainingMs(timeToLimitIso, now)) };
  }
  const remainingMs = getHoldRemainingMs(timeToLimitIso, now);
  if (remainingMs <= 0) return { level: 'expired', remainingMs: 0 };
  if (remainingMs < TWO_HOURS_MS) return { level: 'critical', remainingMs };
  return { level: 'ok', remainingMs };
}

export function formatHoldCountdown(remainingMs: number): string {
  if (remainingMs <= 0) return 'Expired';
  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) return `${Math.floor(hours / 24)}d remaining`;
  return `${hours}h ${minutes}m remaining`;
}
