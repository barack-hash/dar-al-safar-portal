import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, User, Globe, Upload, ShieldCheck } from 'lucide-react';
import { 
  Investor, 
  CapitalInjection, 
  CapitalInjectionType, 
  FundSource, 
  BankAccount 
} from '../types';
import { COUNTRIES } from '../constants/countries';
import { useAccounting } from '../hooks/useAccounting';
import { toast } from 'sonner';

const COMMON_COUNTRIES = [
  { name: 'Ethiopia', code: 'ET' },
  { name: 'Saudi Arabia', code: 'SA' },
  { name: 'United Arab Emirates', code: 'AE' },
  { name: 'United States', code: 'US' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Oman', code: 'OM' },
  { name: 'Qatar', code: 'QA' },
  { name: 'Bahrain', code: 'BH' },
  { name: 'Kuwait', code: 'KW' },
  { name: 'Egypt', code: 'EG' }
];

interface RecordCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordCapitalModal: React.FC<RecordCapitalModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { investors, recordCapitalInjection, addInvestor, bankAccounts } = useAccounting();
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [showFullCountryList, setShowFullCountryList] = useState(false);
  const [formData, setFormData] = useState<Omit<CapitalInjection, 'id'>>({
    investorId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'EQUITY',
    fundSource: 'COMPANY_BANK',
    allocationPurpose: '',
    expectedYieldPercentage: 0,
    bankAccountId: ''
  });

  const [newInvestor, setNewInvestor] = useState<Omit<Investor, 'id'>>({
    name: '',
    contact: '',
    equityPercentage: 0,
    nationality: '',
    sourceOfFunds: 'Business Revenue',
    kycStatus: 'PENDING',
    documents: []
  });

  useEffect(() => {
    if (investors.length > 0 && !formData.investorId) {
      setFormData(prev => ({ ...prev, investorId: investors[0].id }));
    }
  }, [investors, formData.investorId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.investorId) {
      toast.error('Please select an investor');
      return;
    }
    recordCapitalInjection(formData);
    onClose();
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvestor.name || !newInvestor.nationality) {
      toast.error('Please fill in all required KYC fields');
      return;
    }

    const mockDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Passport_Copy.pdf',
      status: 'UPLOADED' as const,
      fileUrl: '#'
    };

    const investorToSave = {
      ...newInvestor,
      documents: [mockDoc]
    };

    const savedInvestor = addInvestor(investorToSave);
    if (savedInvestor) {
      setFormData(prev => ({ ...prev, investorId: (savedInvestor as any).id }));
    }
    
    setIsQuickAdding(false);
    toast.success('Investor added and KYC pending verification');
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {isQuickAdding ? 'Quick-Add New Investor' : 'Record Capital Injection'}
              </h3>
              <p className="text-slate-500 text-sm">
                {isQuickAdding ? 'Complete KYC/AML details for the new partner.' : 'Post new funding to the general ledger.'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
              <X size={24} className="text-slate-400" />
            </button>
          </div>

          <div className="relative">
            {!isQuickAdding ? (
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investor</label>
                      <button 
                        type="button"
                        onClick={() => setIsQuickAdding(true)}
                        className="text-[10px] font-bold text-active-green hover:underline flex items-center gap-1"
                      >
                        <Plus size={12} /> Quick-Add New
                      </button>
                    </div>
                    <select
                      value={formData.investorId}
                      onChange={(e) => setFormData({ ...formData, investorId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                      required
                    >
                      <option value="">Select Investor</option>
                      {investors.map(inv => (
                        <option key={inv.id} value={inv.id}>{inv.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount (USD)</label>
                    <input
                      type="number"
                      value={formData.amount || ''}
                      onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Injection Type</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      {(['EQUITY', 'DEBT/LOAN'] as CapitalInjectionType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, type })}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            formData.type === type ? 'bg-white text-active-green shadow-sm' : 'text-slate-400'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fund Source</label>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      {(['COMPANY_BANK', 'DIRECTOR_PERSONAL_ACCOUNT'] as FundSource[]).map((source) => (
                        <button
                          key={source}
                          type="button"
                          onClick={() => setFormData({ ...formData, fundSource: source })}
                          className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            formData.fundSource === source ? 'bg-white text-active-green shadow-sm' : 'text-slate-400'
                          }`}
                        >
                          {source === 'COMPANY_BANK' ? 'Bank' : 'Personal'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {formData.fundSource === 'COMPANY_BANK' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Bank Account</label>
                    <select
                      value={formData.bankAccountId}
                      onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                      required
                    >
                      <option value="">Select Bank Account</option>
                      {bankAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.bankName} (****{acc.accountNumber})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation Purpose</label>
                  <input
                    type="text"
                    value={formData.allocationPurpose}
                    onChange={(e) => setFormData({ ...formData, allocationPurpose: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                    placeholder="e.g. Working Capital, Vehicle Purchase"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
                  <button type="submit" className="flex-2 px-12 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all">Post to Ledger</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleQuickAdd} className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        required
                        type="text"
                        value={newInvestor.name}
                        onChange={(e) => setNewInvestor({ ...newInvestor, name: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                        placeholder="Legal Name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contact (Email/Phone)</label>
                    <input
                      required
                      type="text"
                      value={newInvestor.contact}
                      onChange={(e) => setNewInvestor({ ...newInvestor, contact: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nationality</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <select
                        required
                        value={newInvestor.nationality}
                        onChange={(e) => {
                          if (e.target.value === 'OTHER') {
                            setShowFullCountryList(true);
                          } else {
                            setNewInvestor({ ...newInvestor, nationality: e.target.value });
                          }
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                      >
                        <option value="">Select Country</option>
                        {COMMON_COUNTRIES.map(country => (
                          <option key={country.code} value={country.name}>{country.name}</option>
                        ))}
                        {!showFullCountryList && <option value="OTHER">Other...</option>}
                        {showFullCountryList && COUNTRIES.filter(c => !COMMON_COUNTRIES.some(cc => cc.name === c.name)).map(country => (
                          <option key={country.code} value={country.name}>{country.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source of Funds</label>
                    <select
                      required
                      value={newInvestor.sourceOfFunds}
                      onChange={(e) => setNewInvestor({ ...newInvestor, sourceOfFunds: e.target.value as any })}
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                    >
                      <option value="Business Revenue">Business Revenue</option>
                      <option value="Real Estate">Real Estate</option>
                      <option value="Personal Savings">Personal Savings</option>
                      <option value="Investment Exit">Investment Exit</option>
                    </select>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                        <Upload size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">Government ID / Passport</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Required for AML Compliance</p>
                      </div>
                    </div>
                    <button type="button" className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      Browse Files
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl text-emerald-700">
                  <ShieldCheck size={20} />
                  <p className="text-xs font-medium">
                    KYC status will be set to <strong>PENDING</strong> until documents are verified by compliance.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsQuickAdding(false)} 
                    className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
                  >
                    Back
                  </button>
                  <button type="submit" className="flex-2 px-12 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all">Complete KYC</button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
