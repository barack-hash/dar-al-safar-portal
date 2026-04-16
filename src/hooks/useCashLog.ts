import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { CashLogEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logSupabaseDataError } from '../lib/supabaseErrors';
import { cashEntryFromRow, cashEntryToRow, type CashTransactionRow } from '../lib/supabaseMaps';

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
        const { data, error } = await sb.from('transactions').select('*').returns<CashTransactionRow[]>();
        if (cancelled) return;
        if (error) {
          logSupabaseDataError('transactions.select (cash log load)', error);
          throw error;
        }
        setRemoteLog((data ?? []).map(cashEntryFromRow));
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
      const newEntry: CashLogEntry = {
        ...entry,
        id: `CL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      };
      if (supabaseMode) {
        const row = cashEntryToRow(newEntry);
        try {
          const sb = getSupabase();
          if (import.meta.env.DEV) {
            console.debug('[useCashLog] calling supabase.from("transactions").insert', { id: row.id });
          }
          const { data, error } = await sb.from('transactions').insert(row).select();
          if (error) {
            logSupabaseDataError('transactions.insert (cash log save)', error);
            throw error;
          }
          if (import.meta.env.DEV) {
            console.debug('[useCashLog] transactions.insert OK', { returnedRows: data?.length ?? 0 });
          }
          setRemoteLog((prev) => [newEntry, ...prev]);
        } catch (e) {
          logSupabaseDataError('transactions.insert (catch)', e);
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
      const merged: CashLogEntry = { ...row, ...updates };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('transactions').update(cashEntryToRow(merged)).eq('id', id);
          if (error) {
            logSupabaseDataError('transactions.update', error);
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
          const { error } = await sb.from('transactions').delete().eq('id', id);
          if (error) {
            logSupabaseDataError('transactions.delete', error);
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
