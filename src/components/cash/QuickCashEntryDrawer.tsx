import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CashLogCurrency, CashLogEntry, CashLogTransactionType, Client } from '../../types';
import { getSupabase, isSupabaseConfigured } from '../../lib/supabaseClient';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  addCashLogEntry: (entry: Omit<CashLogEntry, 'id'>) => Promise<CashLogEntry>;
};

const QUICK_TAGS = [
  '#Rent',
  '#LoanIn',
  '#LoanOut',
  '#Salary',
  '#SalaryAdvance',
  '#Personal',
  '#Emergency',
  '#Office',
] as const;
const PURPOSE_OPTIONS = [
  'Personal Withdrawal',
  'Emergency Float',
  'Office Supplies',
  'Visa Deposit',
  'Salary Advance',
  'Loan Settlement',
  'Other',
] as const;

export const QuickCashEntryDrawer: React.FC<Props> = ({ isOpen, onClose, clients, addCashLogEntry }) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<CashLogCurrency>('ETB');
  const [transactionType, setTransactionType] = useState<CashLogTransactionType>('INCOME');
  const [accountSource, setAccountSource] = useState('Cash in Hand');
  const [counterpartyName, setCounterpartyName] = useState('');
  const [purpose, setPurpose] = useState<(typeof PURPOSE_OPTIONS)[number]>('Personal Withdrawal');
  const [linkedClientId, setLinkedClientId] = useState('');
  const [description, setDescription] = useState('');
  const [quickTags, setQuickTags] = useState<string[]>([]);
  const [isFormalAccountingReady, setIsFormalAccountingReady] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedClientName = useMemo(
    () => clients.find((c) => c.id === linkedClientId)?.name ?? '',
    [clients, linkedClientId]
  );

  const reset = () => {
    setAmount('');
    setCurrency('ETB');
    setTransactionType('INCOME');
    setAccountSource('Cash in Hand');
    setCounterpartyName('');
    setPurpose('Personal Withdrawal');
    setLinkedClientId('');
    setDescription('');
    setQuickTags([]);
    setIsFormalAccountingReady(false);
    setDueDate('');
    setReminderEnabled(false);
  };

  const toggleTag = (tag: string) => {
    setQuickTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (!accountSource.trim()) {
      toast.error('Account source is required');
      return;
    }

    setSaving(true);
    try {
      let recordedBy = 'local-user';
      if (isSupabaseConfigured()) {
        const sb = getSupabase();
        const { data, error } = await sb.auth.getUser();
        if (error) throw error;
        recordedBy = data.user?.id ?? '';
        if (!recordedBy) {
          toast.error('Could not resolve current staff account');
          return;
        }
      }

      await addCashLogEntry({
        amount: parsedAmount,
        currency,
        transactionType,
        accountSource: accountSource.trim(),
        counterpartyName: counterpartyName.trim() || undefined,
        purpose,
        linkedClientId: linkedClientId || undefined,
        recordedBy,
        description:
          selectedClientName && description.trim()
            ? `${selectedClientName}: ${description.trim()}`
            : description.trim(),
        quickTags,
        isFormalAccountingReady,
        dueDate: dueDate || undefined,
        reminderEnabled,
        createdAt: new Date().toISOString(),
      });

      toast.success('Cash entry logged');
      reset();
      onClose();
    } catch (error) {
      toast.error('Could not save cash entry', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-slate-900/45 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[141] h-full w-full max-w-xl border-l border-white/25 shadow-2xl"
          >
            <div className="glass-panel h-full rounded-none border-0 flex flex-col">
              <div className="p-6 border-b border-white/20 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Quick Cash Entry</h3>
                  <p className="text-xs text-slate-500 mt-1">Log informal income, expense, and repayment in seconds.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</label>
                  <input
                    autoFocus
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full px-4 py-3 rounded-xl border border-white/40 bg-white/70 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/35"
                    placeholder="0.00"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CashLogCurrency)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                    >
                      <option value="ETB">ETB</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type</label>
                    <select
                      value={transactionType}
                      onChange={(e) => setTransactionType(e.target.value as CashLogTransactionType)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                    >
                      <option value="INCOME">Income</option>
                      <option value="EXPENSE">Expense</option>
                      <option value="LOAN_REPAYMENT">Loan Repayment</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account Source</label>
                  <input
                    value={accountSource}
                    onChange={(e) => setAccountSource(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                    placeholder="Cash in Hand / Personal CBE"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Counterparty / Lender</label>
                  <input
                    value={counterpartyName}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                    placeholder="Uncle Ibrahim / Abyssinia Bank"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Purpose</label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as (typeof PURPOSE_OPTIONS)[number])}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                  >
                    {PURPOSE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Linked Client (optional)</label>
                  <select
                    value={linkedClientId}
                    onChange={(e) => setLinkedClientId(e.target.value)}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                  >
                    <option value="">No client link</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm resize-none"
                    placeholder="Describe the movement"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Tags</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => {
                      const active = quickTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-700 border border-emerald-500/30'
                              : 'bg-white/70 text-slate-600 border border-white/50'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/70 text-sm"
                    />
                  </div>
                  <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => setReminderEnabled(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Enable repayment reminder
                  </label>
                </div>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={isFormalAccountingReady}
                    onChange={(e) => setIsFormalAccountingReady(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Formal Accounting Ready
                </label>
              </div>

              <div className="p-6 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 disabled:pointer-events-none transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
