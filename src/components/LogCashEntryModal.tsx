import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, DollarSign, ArrowUpRight, ArrowDownRight, UserPlus, Check } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { CashLogEntry, CashLogMethod, CashLogCategory, CashLogStatus, Currency } from '../types';
import { toast } from 'sonner';

interface LogCashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CashEntryFormState = {
  date: string;
  clientEntity: string;
  service: string;
  description: string;
  amount: number;
  currency: Currency;
  method: CashLogMethod;
  staff: string;
  notes: string;
  category: CashLogCategory;
  status: CashLogStatus;
};

const emptyCashForm = (): CashEntryFormState => ({
  date: new Date().toISOString().split('T')[0],
  clientEntity: '',
  service: '',
  description: '',
  amount: 0,
  currency: 'USD',
  method: 'Cash',
  staff: '',
  notes: '',
  category: 'Income',
  status: 'Cleared',
});

export const LogCashEntryModal: React.FC<LogCashEntryModalProps> = ({ isOpen, onClose }) => {
  const { addCashLogEntry, employees } = useAppContext();
  const [receivedMenuOpen, setReceivedMenuOpen] = useState(false);
  const [receivedInput, setReceivedInput] = useState('');
  const receivedWrapRef = useRef<HTMLDivElement>(null);
  const wasModalOpen = useRef(false);

  const [formData, setFormData] = useState<CashEntryFormState>(() => emptyCashForm());

  useEffect(() => {
    if (isOpen && !wasModalOpen.current) {
      setFormData(emptyCashForm());
      setReceivedInput('');
      setReceivedMenuOpen(false);
    }
    wasModalOpen.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (!receivedMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (receivedWrapRef.current && !receivedWrapRef.current.contains(e.target as Node)) {
        setReceivedMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [receivedMenuOpen]);

  const filteredStaff = employees
    .filter((emp) => emp.name.toLowerCase().includes(receivedInput.trim().toLowerCase()))
    .slice(0, 8);

  const trimmedReceived = receivedInput.trim();
  const exactStaffMatch = employees.some(
    (e) => e.name.toLowerCase() === trimmedReceived.toLowerCase()
  );
  const showCreateOption = trimmedReceived.length > 0 && !exactStaffMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.staff?.trim()) {
      toast.error('Please enter who funds were received from (staff or one-time name).');
      return;
    }

    const entry: Omit<CashLogEntry, 'id'> = {
      date: formData.date,
      clientEntity: formData.clientEntity,
      service: formData.service,
      description: formData.description,
      moneyIn: formData.category === 'Income' ? formData.amount : 0,
      moneyOut: formData.category === 'Expense' ? formData.amount : 0,
      currency: formData.currency,
      method: formData.method,
      staff: formData.staff,
      notes: formData.notes,
      status: formData.status,
      category: formData.category,
    };

    try {
      await addCashLogEntry(entry);
      toast.success('Cash entry logged successfully');
      onClose();
      setFormData(emptyCashForm());
      setReceivedInput('');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err && typeof (err as { message: unknown }).message === 'string'
            ? (err as { message: string }).message
            : 'Save failed — check the browser console for Supabase (RLS / table / auth).';
      toast.error('Cash entry did not save', {
        description: message,
        duration: 10_000,
      });
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Log Cash Entry</h3>
              <p className="text-sm text-slate-500 mt-1 font-medium">Rapid entry for financial transactions.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {/* Category Toggle */}
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'Income' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  formData.category === 'Income' 
                    ? 'bg-white text-emerald-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowUpRight size={18} /> Income
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, category: 'Expense' })}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                  formData.category === 'Expense' 
                    ? 'bg-white text-rose-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ArrowDownRight size={18} /> Expense
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Received From</label>
                <p className="text-[11px] text-slate-500 font-medium -mt-0.5 mb-1">Staff directory or type a one-off name for this entry.</p>
                <div ref={receivedWrapRef} className="relative">
                  <input
                    type="text"
                    required
                    autoComplete="off"
                    placeholder="Search staff or type a name…"
                    value={receivedInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setReceivedInput(v);
                      setFormData((f) => ({ ...f, staff: v }));
                      setReceivedMenuOpen(true);
                    }}
                    onFocus={() => setReceivedMenuOpen(true)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500/25 transition-all"
                  />
                  {receivedMenuOpen && (filteredStaff.length > 0 || showCreateOption) && (
                    <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-auto rounded-2xl bg-white/80 backdrop-blur-md border border-white/30 shadow-xl py-1">
                      {filteredStaff.map((emp) => (
                        <li key={emp.id}>
                          <button
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              setFormData((f) => ({ ...f, staff: emp.name }));
                              setReceivedInput(emp.name);
                              setReceivedMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm font-medium text-slate-800 hover:bg-emerald-500/10"
                          >
                            {emp.name}
                            {formData.staff === emp.name && <Check size={16} className="text-emerald-600 shrink-0" />}
                          </button>
                        </li>
                      ))}
                      {showCreateOption && (
                        <li>
                          <button
                            type="button"
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => {
                              setFormData((f) => ({ ...f, staff: trimmedReceived }));
                              setReceivedInput(trimmedReceived);
                              setReceivedMenuOpen(false);
                            }}
                            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-500/10"
                          >
                            <UserPlus size={16} className="shrink-0" />
                            Create &quot;{trimmedReceived}&quot;
                          </button>
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Client / Entity</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ethiopian Airlines"
                  value={formData.clientEntity}
                  onChange={(e) => setFormData({ ...formData, clientEntity: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Service / Category</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Visa Processing"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Description</label>
                <input
                  type="text"
                  required
                  placeholder="Brief description of the transaction"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Currency</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="ETB">ETB - Ethiopian Birr</option>
                  <option value="SAR">SAR - Saudi Riyal</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Payment Method</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value as CashLogMethod })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CashLogStatus })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                >
                  <option value="Cleared">Cleared</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all resize-none"
                />
              </div>
            </div>
          </form>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit} 
              className={`flex-2 px-12 py-4 text-white rounded-2xl font-bold shadow-lg transition-all ${
                formData.category === 'Income' 
                  ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' 
                  : 'bg-rose-500 shadow-rose-500/20 hover:bg-rose-600'
              }`}
            >
              Log Entry
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
