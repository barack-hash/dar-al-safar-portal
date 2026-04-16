import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { BankAccount, Currency } from '../types';
import { toast } from 'sonner';

interface LinkBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  addBankAccount: (data: Omit<BankAccount, 'id'>) => void;
}

export const LinkBankAccountModal: React.FC<LinkBankAccountModalProps> = ({ isOpen, onClose, addBankAccount }) => {
  const [form, setForm] = useState({
    bankName: '',
    accountNumber: '',
    currency: 'USD' as Currency,
    initialBalance: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.accountNumber.length !== 4) {
      toast.error('Account number must be the last 4 digits');
      return;
    }
    addBankAccount(form);
    onClose();
    setForm({
      bankName: '',
      accountNumber: '',
      currency: 'USD',
      initialBalance: 0
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
            <h3 className="text-2xl font-bold text-slate-900">Link Bank Account</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Bank Name</label>
              <input
                required
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                placeholder="e.g., Commercial Bank of Ethiopia"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Last 4 Digits</label>
                <input
                  required
                  type="text"
                  maxLength={4}
                  value={form.accountNumber}
                  onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                  placeholder="1234"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value as Currency })}
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                >
                  <option value="USD">USD</option>
                  <option value="ETB">ETB</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Initial Balance</label>
              <input
                required
                type="number"
                value={form.initialBalance || ''}
                onChange={(e) => setForm({ ...form, initialBalance: parseFloat(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                placeholder="0.00"
              />
            </div>

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
                Link Account
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
