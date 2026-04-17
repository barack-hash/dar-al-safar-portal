import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { CashLogEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logSupabaseDataError } from '../lib/supabaseErrors';
import { cashLogFromRow, cashLogToInsert, type CashLogRow } from '../lib/supabaseMaps';

type RunningBalanceByCurrency = Record<'ETB' | 'USD', number>;
type RunningBalanceBySource = Record<string, RunningBalanceByCurrency>;

export function getRunningBalance(entries: CashLogEntry[]): {
  total: RunningBalanceByCurrency;
  bySource: RunningBalanceBySource;
} {
  const total: RunningBalanceByCurrency = { ETB: 0, USD: 0 };
  const bySource: RunningBalanceBySource = {};
  for (const entry of entries) {
    const sign = entry.transactionType === 'EXPENSE' ? -1 : 1;
    const signedAmount = sign * entry.amount;
    total[entry.currency] += signedAmount;
    if (!bySource[entry.accountSource]) {
      bySource[entry.accountSource] = { ETB: 0, USD: 0 };
    }
    bySource[entry.accountSource][entry.currency] += signedAmount;
  }
  return { total, bySource };
}

export const useCashLog = () => {
  const supabaseMode = isSupabaseConfigured();
  const [localLog, setLocalLog] = useLocalStorage<CashLogEntry[]>('dasa_cash_log', []);
  const [remoteLog, setRemoteLog] = useState<CashLogEntry[]>([]);
  const cashLog = supabaseMode ? remoteLog : localLog;

  useEffect(() => {
    if (!supabaseMode) return;
    let cancelled = false;
    void (async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from('cash_log')
          .select('*')
          .order('created_at', { ascending: false })
          .returns<CashLogRow[]>();
        if (cancelled) return;
        if (error) {
          logSupabaseDataError('cash_log.select (cash log load)', error);
          throw error;
        }
        setRemoteLog((data ?? []).map(cashLogFromRow));
      } catch (e) {
        console.error(e);
        toast.error('Could not load cash log from Supabase', {
          description: e instanceof Error ? e.message : undefined,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseMode]);

  const addCashLogEntry = useCallback(
    async (entry: Omit<CashLogEntry, 'id'>) => {
      const now = new Date().toISOString();
      const newEntry: CashLogEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: entry.createdAt || now,
        updatedAt: now,
      };
      if (supabaseMode) {
        const row = cashLogToInsert(newEntry);
        try {
          const sb = getSupabase();
          if (import.meta.env.DEV) {
            console.debug('[useCashLog] calling supabase.from("cash_log").insert', { id: row.id });
          }
          const { data, error } = await sb.from('cash_log').insert(row).select().returns<CashLogRow[]>();
          if (error) {
            logSupabaseDataError('cash_log.insert (cash log save)', error);
            throw error;
          }
          if (import.meta.env.DEV) {
            console.debug('[useCashLog] cash_log.insert OK', { returnedRows: data?.length ?? 0 });
          }
          const inserted = data?.[0] ? cashLogFromRow(data[0]) : newEntry;
          setRemoteLog((prev) => [inserted, ...prev]);
        } catch (e) {
          logSupabaseDataError('cash_log.insert (catch)', e);
          console.error('[useCashLog] addCashLogEntry failed:', e);
          throw e;
        }
      } else {
        setLocalLog((prev) => [newEntry, ...prev]);
      }
      return newEntry;
    },
    [supabaseMode, setLocalLog]
  );

  const updateCashLogEntry = useCallback(
    async (id: string, updates: Partial<CashLogEntry>) => {
      const row = cashLog.find((e) => e.id === id);
      if (!row) return;
      const merged: CashLogEntry = { ...row, ...updates, updatedAt: new Date().toISOString() };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('cash_log').update(cashLogToInsert(merged)).eq('id', id);
          if (error) {
            logSupabaseDataError('cash_log.update', error);
            throw error;
          }
          setRemoteLog((prev) => prev.map((entry) => (entry.id === id ? merged : entry)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update cash entry', { description: e instanceof Error ? e.message : undefined });
        }
      } else {
        setLocalLog((prev) => prev.map((entry) => (entry.id === id ? merged : entry)));
      }
    },
    [supabaseMode, cashLog, setLocalLog]
  );

  const deleteCashLogEntry = useCallback(
    async (id: string) => {
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('cash_log').delete().eq('id', id);
          if (error) {
            logSupabaseDataError('cash_log.delete', error);
            throw error;
          }
          setRemoteLog((prev) => prev.filter((entry) => entry.id !== id));
        } catch (e) {
          console.error(e);
          toast.error('Could not delete cash entry', { description: e instanceof Error ? e.message : undefined });
        }
      } else {
        setLocalLog((prev) => prev.filter((entry) => entry.id !== id));
      }
    },
    [supabaseMode, setLocalLog]
  );

  return {
    cashLog,
    addCashLogEntry,
    updateCashLogEntry,
    deleteCashLogEntry,
  };
};
