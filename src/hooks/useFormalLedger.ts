import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import type { BookingRecord, CashLogEntry, Currency, FormalLedgerEntry } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { logSupabaseDataError } from '../lib/supabaseErrors';
import {
  cashLogFromRow,
  formalLedgerFromRow,
  formalLedgerToInsert,
  type CashLogRow,
  type FormalLedgerRow,
} from '../lib/supabaseMaps';

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function useFormalLedger() {
  const supabaseMode = isSupabaseConfigured();
  const [formalLedger, setFormalLedger] = useState<FormalLedgerEntry[]>([]);

  const refreshFormalLedger = useCallback(async () => {
    if (!supabaseMode) {
      setFormalLedger([]);
      return;
    }
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .from('formal_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<FormalLedgerRow[]>();
      if (error) {
        logSupabaseDataError('formal_ledger.select', error);
        throw error;
      }
      setFormalLedger((data ?? []).map(formalLedgerFromRow));
    } catch (e) {
      console.error(e);
      toast.error('Could not load formal ledger', {
        description: e instanceof Error ? e.message : undefined,
      });
    }
  }, [supabaseMode]);

  useEffect(() => {
    void refreshFormalLedger();
  }, [refreshFormalLedger]);

  const insertTicketingIncomePending = useCallback(
    async (booking: BookingRecord, ticketNumber: string): Promise<boolean> => {
      if (!supabaseMode) return true;
      const markup = booking.pricing.markup;
      const vatAmount = roundMoney(markup * 0.15);
      const netAmount = roundMoney(markup - vatAmount);
      const curRaw = booking.pricing.currency;
      const currency = (['ETB', 'USD', 'SAR'].includes(curRaw) ? curRaw : 'USD') as Currency;

      const payload = formalLedgerToInsert({
        description: `Ticket Issued: PNR ${booking.pnr} #${ticketNumber}`,
        category: 'Income',
        currency,
        grossAmount: markup,
        vatAmount,
        whtAmount: 0,
        netAmount,
        status: 'PENDING',
        sourceType: 'TICKETING',
        sourceId: booking.id,
      });

      try {
        const sb = getSupabase();
        const { data, error } = await sb
          .from('formal_ledger')
          .insert(payload)
          .select()
          .returns<FormalLedgerRow[]>();
        if (error) {
          logSupabaseDataError('formal_ledger.insert (ticketing)', error);
          throw error;
        }
        const row = data?.[0];
        if (row) {
          setFormalLedger((prev) => [formalLedgerFromRow(row), ...prev]);
        } else {
          await refreshFormalLedger();
        }
        return true;
      } catch (e) {
        console.error(e);
        toast.error('Could not post ticketing income to formal ledger', {
          description: e instanceof Error ? e.message : undefined,
        });
        return false;
      }
    },
    [supabaseMode, refreshFormalLedger]
  );

  const promoteCashLogEntry = useCallback(
    async (cashLogId: string) => {
      if (!supabaseMode) {
        toast.error('Supabase is not configured');
        return;
      }
      try {
        const sb = getSupabase();

        const { data: existing, error: exErr } = await sb
          .from('formal_ledger')
          .select('id')
          .eq('source_type', 'CASH_LOG')
          .eq('source_id', cashLogId)
          .maybeSingle();
        if (exErr) {
          logSupabaseDataError('formal_ledger.select (promote dedupe)', exErr);
          throw exErr;
        }
        if (existing) {
          toast.message('Already promoted', { description: 'This cash log entry is already in the formal ledger.' });
          return;
        }

        const { data: raw, error: fetchErr } = await sb
          .from('cash_log')
          .select('*')
          .eq('id', cashLogId)
          .maybeSingle();
        if (fetchErr) {
          logSupabaseDataError('cash_log.select (promote)', fetchErr);
          throw fetchErr;
        }
        if (!raw) {
          toast.error('Cash log entry not found');
          return;
        }

        const entry: CashLogEntry = cashLogFromRow(raw as CashLogRow);
        if (!entry.isFormalAccountingReady) {
          toast.error('Entry is not marked formal accounting ready');
          return;
        }

        const category: FormalLedgerEntry['category'] =
          entry.transactionType === 'EXPENSE' ? 'Expense' : 'Income';
        const gross = entry.amount;
        const net = entry.amount;

        const descParts = [
          entry.purpose,
          entry.counterpartyName ? `— ${entry.counterpartyName}` : '',
          entry.description?.trim(),
        ].filter(Boolean);
        const description = descParts.join(' ').trim() || `Cash log ${entry.id}`;

        const payload = formalLedgerToInsert({
          description,
          category,
          currency: entry.currency as Currency,
          grossAmount: gross,
          vatAmount: 0,
          whtAmount: 0,
          netAmount: net,
          status: 'VERIFIED',
          sourceType: 'CASH_LOG',
          sourceId: cashLogId,
        });

        const { data: inserted, error: insErr } = await sb
          .from('formal_ledger')
          .insert(payload)
          .select()
          .returns<FormalLedgerRow[]>();
        if (insErr) {
          logSupabaseDataError('formal_ledger.insert (promote)', insErr);
          throw insErr;
        }
        const row = inserted?.[0];
        if (row) {
          setFormalLedger((prev) => [formalLedgerFromRow(row), ...prev]);
        } else {
          await refreshFormalLedger();
        }
        toast.success('Promoted to formal ledger');
      } catch (e) {
        console.error(e);
        toast.error('Could not promote cash log entry', {
          description: e instanceof Error ? e.message : undefined,
        });
        throw e;
      }
    },
    [supabaseMode, refreshFormalLedger]
  );

  return {
    formalLedger,
    refreshFormalLedger,
    insertTicketingIncomePending,
    promoteCashLogEntry,
  };
}
