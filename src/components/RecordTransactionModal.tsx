import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { Transaction, TransactionType, BankAccount } from '../types';

const EXPENSE_CATEGORIES = [
  'Office Rent',
  'Marketing',
  'Agent Commission',
  'Travel Tech Subscription',
  'Utilities'
];

interface RecordTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  addTransaction: (data: Omit<Transaction, 'id' | 'taxDetails'>) => void;
  bankAccounts: BankAccount[];
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({ isOpen, onClose, addTransaction, bankAccounts }) => {
  const [form, setForm] = useState({
    description: '',
    amount: 0,
    type: 'INCOME' as TransactionType,
    category: '',
    isTaxable: true,
    includeVAT: true,
    applyWHT: true,
    date: new Date().toISOString().split('T')[0],
    bankAccountId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({
      ...form,
      currency: 'USD'
    });
    onClose();
    setForm({
      description: '',
      amount: 0,
      type: 'INCOME',
      category: '',
      isTaxable: true,
      includeVAT: true,
      applyWHT: true,
      date: new Date().toISOString().split('T')[0],
      bankAccountId: ''
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-slate-900">Record Transaction</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <input
                required
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                placeholder="e.g., Office Rent, Flight Sale"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Amount (Gross)</label>
                <input
                  required
                  type="number"
                  value={form.amount || ''}
                  onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as TransactionType })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Category</label>
                {form.type === 'EXPENSE' ? (
                  <select
                    required
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                  >
                    <option value="">Select Category</option>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    required
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    placeholder="e.g., Sales, Investment"
                  />
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Date</label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Bank Account / Fund Source</label>
              <select
                value={form.bankAccountId}
                onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
              >
                <option value="">Select Account (Optional)</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.bankName} (****{acc.accountNumber})</option>
                ))}
              </select>
            </div>

            {form.type === 'EXPENSE' ? (
              <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between">
                  <label htmlFor="includeVAT" className="text-sm font-medium text-slate-700">Include 15% VAT</label>
                  <input
                    type="checkbox"
                    id="includeVAT"
                    checked={form.includeVAT}
                    onChange={(e) => setForm({ ...form, includeVAT: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-active-green focus:ring-active-green"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label htmlFor="applyWHT" className="text-sm font-medium text-slate-700">Apply 3% Withholding</label>
                  <input
                    type="checkbox"
                    id="applyWHT"
                    checked={form.applyWHT}
                    onChange={(e) => setForm({ ...form, applyWHT: e.target.checked })}
                    className="w-5 h-5 rounded border-slate-300 text-active-green focus:ring-active-green"
                  />
                </div>
                {form.applyWHT && (
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[10px] text-slate-500 italic">
                      * 3% will be deducted from payment and moved to WHT Payable ledger.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                <input
                  type="checkbox"
                  id="isTaxable"
                  checked={form.isTaxable}
                  onChange={(e) => setForm({ ...form, isTaxable: e.target.checked })}
                  className="w-5 h-5 rounded border-slate-300 text-active-green focus:ring-active-green"
                />
                <label htmlFor="isTaxable" className="text-sm font-medium text-slate-700">
                  Apply Ethiopian Tax (15% VAT, 3% WHT)
                </label>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-1 px-6 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
              >
                Save Entry
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
