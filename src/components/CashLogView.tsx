import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Download, ArrowUpRight, ArrowDownRight, Calendar, BellRing, BookMarked } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { getRunningBalance } from '../hooks/useCashLog';
import { QuickCashEntryDrawer } from './cash/QuickCashEntryDrawer';

export const CashLogView: React.FC = () => {
  const {
    cashLog,
    clients,
    addCashLogEntry,
    isLogCashEntryModalOpen,
    setIsLogCashEntryModalOpen,
    currency,
    formalLedger,
    promoteCashLogEntry,
  } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [promotingId, setPromotingId] = useState<string | null>(null);

  const promotedCashLogIds = useMemo(() => {
    const s = new Set<string>();
    for (const e of formalLedger) {
      if (e.sourceType === 'CASH_LOG' && e.sourceId) s.add(e.sourceId);
    }
    return s;
  }, [formalLedger]);

  const filteredLog = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cashLog.filter((entry) =>
      !q
      || entry.description.toLowerCase().includes(q)
      || entry.accountSource.toLowerCase().includes(q)
      || (entry.counterpartyName ?? '').toLowerCase().includes(q)
      || (entry.purpose ?? '').toLowerCase().includes(q)
      || entry.recordedBy.toLowerCase().includes(q)
      || entry.quickTags.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [cashLog, searchQuery]);

  const balances = useMemo(() => getRunningBalance(filteredLog), [filteredLog]);
  const stats = useMemo(() => {
    const incoming = filteredLog
      .filter((e) => e.transactionType === 'INCOME' || e.transactionType === 'LOAN_REPAYMENT')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const outgoing = filteredLog
      .filter((e) => e.transactionType === 'EXPENSE')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const reminders = filteredLog.filter((e) => Boolean(e.dueDate && e.reminderEnabled)).length;
    return { incoming, outgoing, reminders };
  }, [filteredLog]);

  const sym = currency === 'ETB' ? 'Br' : currency === 'SAR' ? 'SR' : '$';

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cash Log</h2>
          <p className="text-slate-500 mt-1 font-medium">Internal ledger for rapid transaction tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="p-3 glass-panel border border-white/40 text-slate-600 rounded-2xl hover:bg-white/40 transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button
            type="button"
            onClick={() => setIsLogCashEntryModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Plus size={20} />
            Quick Entry
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-[2rem] border border-white/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inflow</p>
            <p className="text-2xl font-bold text-slate-900">{sym}{stats.incoming.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] border border-white/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outflow</p>
            <p className="text-2xl font-bold text-slate-900">{sym}{stats.outgoing.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] border border-white/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900/10 text-slate-700 flex items-center justify-center">
            <span className="text-sm font-black">ETB</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Running Balance</p>
            <p className="text-2xl font-bold text-slate-900">Br {balances.total.ETB.toLocaleString()}</p>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-[2rem] border border-white/30 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
            <BellRing size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repayment Reminders</p>
            <p className="text-2xl font-bold text-slate-900">{stats.reminders}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-white/25 shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/20 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Informal Ledger</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search source, tags, description..."
              
              className="pl-10 pr-3 py-2 rounded-xl glass-panel border border-white/40 text-sm text-slate-700"
            />
          </div>
        </div>
        <div className="p-6 md:p-8">
          {filteredLog.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Calendar size={32} className="mx-auto mb-3 text-slate-300" />
              <p>No cash entries found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredLog.map((entry) => {
                const positive = entry.transactionType !== 'EXPENSE';
                const canPromote =
                  entry.isFormalAccountingReady && !promotedCashLogIds.has(entry.id);
                return (
                  <motion.div
                    key={entry.id}
                    className={`glass-panel rounded-2xl border p-5 space-y-3 ${
                      positive ? 'border-emerald-500/25' : 'border-rose-500/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleDateString()}</p>
                      <span
                        className={`px-2 py-1 rounded-full text-[10px] font-black tracking-widest ${
                          positive ? 'bg-emerald-500/15 text-emerald-700' : 'bg-rose-500/15 text-rose-700'
                        }`}
                      >
                        {entry.transactionType.replace('_', ' ')}
                      </span>
                    </div>
                    <p className={`text-2xl font-black ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {positive ? '+' : '-'} {entry.currency === 'ETB' ? 'Br' : '$'} {entry.amount.toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">{entry.accountSource}</p>
                    <div className="space-y-1">
                      <p
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium ${
                          positive
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : 'bg-rose-500/10 text-rose-700'
                        }`}
                      >
                        From/To: {entry.counterpartyName?.trim() || '—'}
                      </p>
                      <p className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-500/10 text-slate-700">
                        Purpose: {entry.purpose?.trim() || '—'}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600">{entry.description || 'No description'}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.quickTags.map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-full bg-white/70 text-[11px] text-slate-600 border border-white/40">
                          {tag}
                        </span>
                      ))}
                    </div>
                    {entry.dueDate && (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 text-[11px] font-semibold">
                        <BellRing size={12} />
                        Repayment Reminder: {entry.dueDate}
                      </div>
                    )}
                    {canPromote && (
                      <button
                        type="button"
                        disabled={promotingId === entry.id}
                        onClick={async () => {
                          setPromotingId(entry.id);
                          try {
                            await promoteCashLogEntry(entry.id);
                          } finally {
                            setPromotingId(null);
                          }
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900/90 text-white text-xs font-bold hover:bg-slate-900 disabled:opacity-60 transition-all"
                      >
                        <BookMarked size={16} />
                        {promotingId === entry.id ? 'Promoting…' : 'Promote to Ledger'}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <QuickCashEntryDrawer
        isOpen={isLogCashEntryModalOpen}
        onClose={() => setIsLogCashEntryModalOpen(false)}
        clients={clients}
        addCashLogEntry={addCashLogEntry}
      />
    </div>
  );
};
