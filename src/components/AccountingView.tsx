import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  CreditCard,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  ArrowUpRight,
  Briefcase,
  Trash2,
  User,
  Users,
  MoreVertical,
  Pencil,
  FileText as FileIcon
} from 'lucide-react';
import { useUI, useClientsContext } from '../contexts/AppContext';
import { InvestorReportModal } from './InvestorReportModal';
import { RecordCapitalModal } from './RecordCapitalModal';
import { RecordTransactionModal } from './RecordTransactionModal';
import { CreateInvoiceModal } from './CreateInvoiceModal';
import { LinkBankAccountModal } from './LinkBankAccountModal';
import { 
  Invoice, 
  InvoiceItem, 
  InvoiceStatus, 
  Client, 
  Transaction, 
  TransactionType,
  Investor,
  CapitalInjection,
  CapitalInjectionType,
  FundSource,
  KYCStatus,
  BankAccount,
  Currency,
  FormalLedgerEntry,
} from '../types';
import { COUNTRIES } from '../constants/countries';
import { toast } from 'sonner';

interface FormalLedgerTableProps {
  entries: FormalLedgerEntry[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currency: Currency;
  convertForDisplay: (amount: number, sourceCurrency: Currency) => number;
}

interface MetricStat {
  label: string;
  value: number;
  icon: React.ComponentType<{ size?: number }>;
  color: string;
  bg: string;
  trend: string;
  isCurrency?: boolean;
}

function currencySymbol(c: Currency): string {
  return c === 'USD' ? '$' : c === 'SAR' ? 'SR' : 'Br';
}

const FormalLedgerTable: React.FC<FormalLedgerTableProps> = ({
  entries,
  searchQuery,
  setSearchQuery,
  currency,
  convertForDisplay,
}) => {
  const [pageSize, setPageSize] = useState(20);

  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.sourceType.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [entries, searchQuery]
  );

  const visibleEntries = useMemo(() => filteredEntries.slice(0, pageSize), [filteredEntries, pageSize]);

  return (
    <div className="glass-panel bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/25 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-900">Formal General Ledger</h3>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search ledger..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-2.5 bg-white/80 border border-white/40 rounded-xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
            />
          </div>
          <button
            type="button"
            className="p-2.5 bg-white/80 border border-white/40 rounded-xl text-slate-600 hover:bg-white transition-all"
          >
            <Filter size={20} />
          </button>
          <button
            type="button"
            className="p-2.5 bg-white/80 border border-white/40 rounded-xl text-slate-600 hover:bg-white transition-all"
          >
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Category</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Gross</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">VAT</th>
              <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Net</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {visibleEntries.map((e) => {
              const dateStr = e.createdAt.includes('T') ? e.createdAt.split('T')[0] : e.createdAt.slice(0, 10);
              return (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5 text-sm font-medium text-slate-500 whitespace-nowrap">{dateStr}</td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900">{e.description}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                        e.category === 'Income'
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : e.category === 'Expense'
                            ? 'bg-rose-500/10 text-rose-600'
                            : e.category === 'Tax'
                              ? 'bg-amber-500/10 text-amber-700'
                              : 'bg-slate-500/10 text-slate-600'
                      }`}
                    >
                      {e.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        e.status === 'VERIFIED'
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-amber-500/15 text-amber-800'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {e.sourceType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                    {currencySymbol(currency)}
                    {convertForDisplay(e.grossAmount, e.currency).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-amber-600 text-right whitespace-nowrap">
                    {currencySymbol(currency)}
                    {convertForDisplay(e.vatAmount, e.currency).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right whitespace-nowrap">
                    {currencySymbol(currency)}
                    {convertForDisplay(e.netAmount, e.currency).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredEntries.length > pageSize && (
        <div className="p-8 border-t border-black/5 flex justify-center">
          <button
            type="button"
            onClick={() => setPageSize((prev) => prev + 20)}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
};

const EditBankAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  account: BankAccount;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => void;
}> = ({ isOpen, onClose, account, updateBankAccount }) => {
  const [formData, setFormData] = useState({
    bankName: account.bankName,
    accountNumber: account.accountNumber
  });

  const handleSave = () => {
    updateBankAccount(account.id, formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Edit Bank Account</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bank Name</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Account Number (Last 4 digits)</label>
              <input
                type="text"
                maxLength={4}
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/\D/g, '') })}
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="flex-1 px-6 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const DeleteBankConfirmationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  bankName: string;
}> = ({ isOpen, onClose, onConfirm, bankName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Remove Bank Account?</h3>
              <p className="text-sm text-slate-500 mt-2">
                Are you sure you want to remove <span className="font-bold text-slate-900">{bankName}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-4 pt-4">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const AccountingView: React.FC = () => {
  const { currency, convertForDisplay } = useUI();
  const { 
    clients, 
    addInvoice, 
    addTransaction, 
    generateMonthlyReport,
    investors,
    addInvestor,
    updateInvestor,
    capitalInjections,
    recordCapitalInjection,
    totalCapitalRaised,
    totalPersonalHolding,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    accountBalances,
    formalLedger,
  } = useClientsContext();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isCapitalModalOpen, setIsCapitalModalOpen] = useState(false);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [deletingBank, setDeletingBank] = useState<BankAccount | null>(null);
  const [activeBankDropdown, setActiveBankDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ledger' | 'reports' | 'capital'>('ledger');
  const [reportDate, setReportDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear()
  });

  useEffect(() => {
    const handleClickOutside = () => setActiveBankDropdown(null);
    if (activeBankDropdown) {
      window.addEventListener('click', handleClickOutside);
    }
    return () => window.removeEventListener('click', handleClickOutside);
  }, [activeBankDropdown]);

  const monthlyReport = useMemo(() => 
    generateMonthlyReport(reportDate.month, reportDate.year),
  [generateMonthlyReport, reportDate]);

  const verifiedFormal = useMemo(
    () => formalLedger.filter((e) => e.status === 'VERIFIED'),
    [formalLedger]
  );

  const formalDisplayStats = useMemo(() => {
    let netProfit = 0;
    let operatingExpenses = 0;
    let vatPayable = 0;
    let whtPayable = 0;
    const treasury: Record<Currency, number> = { ETB: 0, USD: 0, SAR: 0 };

    for (const e of verifiedFormal) {
      vatPayable += convertForDisplay(e.vatAmount, e.currency);
      whtPayable += convertForDisplay(e.whtAmount, e.currency);
      const netConv = convertForDisplay(e.netAmount, e.currency);

      if (e.category === 'Income') {
        netProfit += netConv;
        treasury[e.currency] += e.netAmount;
      } else if (e.category === 'Expense') {
        netProfit -= netConv;
        operatingExpenses += netConv;
        treasury[e.currency] -= e.netAmount;
      } else if (e.category === 'Tax') {
        netProfit -= netConv;
        treasury[e.currency] -= e.netAmount;
      }
    }

    return { netProfit, operatingExpenses, vatPayable, whtPayable, treasury };
  }, [verifiedFormal, convertForDisplay]);

  const exportToCSV = () => {
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'VAT', 'WHT'];
    const rows = monthlyReport.transactions.map((tx: Transaction) => [
      tx.date,
      tx.description,
      tx.type,
      tx.category,
      convertForDisplay(tx.amount, tx.currency),
      convertForDisplay(tx.taxDetails.vat, tx.currency),
      convertForDisplay(tx.taxDetails.wht, tx.currency)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: Array<string | number>) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DASA_Ledger_${reportDate.year}_${reportDate.month + 1}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const stats: MetricStat[] = [
    {
      label: 'Net Profit',
      value: formalDisplayStats.netProfit,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      trend: 'Verified formal ledger',
    },
    {
      label: 'Operating Expenses',
      value: formalDisplayStats.operatingExpenses,
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-500/10',
      trend: 'Verified expenses',
    },
    {
      label: 'VAT (accrued)',
      value: formalDisplayStats.vatPayable,
      icon: PieChart,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      trend: 'From verified posts',
    },
    {
      label: 'WHT (accrued)',
      value: formalDisplayStats.whtPayable,
      icon: CreditCard,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      trend: 'From verified posts',
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">General Ledger</h2>
          <p className="text-slate-500 mt-1">Ethiopian Tax Compliant Financial Controller Dashboard.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsBankModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            <CreditCard size={20} />
            Link Bank Account
          </button>
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mr-4">
            <button 
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'ledger' ? 'bg-white text-active-green shadow-sm' : 'text-slate-400'}`}
            >
              Ledger
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'reports' ? 'bg-white text-active-green shadow-sm' : 'text-slate-400'}`}
            >
              Reports
            </button>
            <button 
              onClick={() => setActiveTab('capital')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'capital' ? 'bg-white text-active-green shadow-sm' : 'text-slate-400'}`}
            >
              Capital & Investors
            </button>
          </div>
          {activeTab === 'capital' ? (
            <button 
              onClick={() => setIsCapitalModalOpen(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all active:scale-95"
            >
              <Plus size={20} />
              Record Capital Injection
            </button>
          ) : (
            <>
              <button 
                onClick={() => setIsTransactionModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl font-bold hover:bg-slate-50 transition-all active:scale-95"
              >
                <Plus size={20} />
                Record Transaction
              </button>
              <button 
                onClick={() => setIsInvoiceModalOpen(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all active:scale-95"
              >
                <FileText size={20} />
                Create Invoice
              </button>
            </>
          )}
        </div>
      </header>

      {/* Treasury: net book position from verified formal ledger (per currency) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Briefcase size={20} className="text-active-green" />
            Treasury (formal ledger)
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Verified net by currency
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['ETB', 'USD', 'SAR'] as const).map((cur, i) => (
            <motion.div
              key={cur}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel p-6 rounded-[2rem] border border-white/30 shadow-sm"
            >
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{cur} book balance</p>
              <p className={`text-2xl font-black ${formalDisplayStats.treasury[cur] >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {currencySymbol(cur)}
                {formalDisplayStats.treasury[cur].toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500 mt-3 leading-snug">
                Sum of verified net amounts (income adds, expenses and tax posts reduce) in {cur}.
              </p>
            </motion.div>
          ))}
        </div>

        {accountBalances.length > 0 && (
          <div className="glass-panel rounded-[2rem] border border-white/25 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-800">Linked bank accounts</h4>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(true)}
                className="text-xs font-bold text-active-green hover:underline"
              >
                Add account
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accountBalances.map((account) => (
                <div
                  key={account.id}
                  className="relative flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/50 border border-white/30"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{account.bankName}</p>
                    <p className="text-[10px] text-slate-500">**** {account.accountNumber}</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">
                      {currencySymbol(currency)}
                      {convertForDisplay(account.currentBalance, account.currency).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBankDropdown(activeBankDropdown === account.id ? null : account.id);
                      }}
                      className="p-2 rounded-xl text-slate-500 hover:bg-white/80"
                    >
                      <MoreVertical size={16} />
                    </button>
                    <AnimatePresence>
                      {activeBankDropdown === account.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setActiveBankDropdown(null)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20 overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBank(account);
                                setActiveBankDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeletingBank(account);
                                setActiveBankDropdown(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 size={14} />
                              Remove
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activeTab === 'capital' ? (
          <>
            {([
              { 
                label: 'Total Capital Raised', 
                value: totalCapitalRaised, 
                icon: DollarSign, 
                color: 'text-active-green', 
                bg: 'bg-active-green/10',
                trend: 'Lifetime'
              },
              { 
                label: 'Active Investors', 
                value: investors.length, 
                icon: User, 
                color: 'text-indigo-500', 
                bg: 'bg-indigo-500/10',
                trend: 'Equity Holders',
                isCurrency: false
              },
              { 
                label: 'Pending Yield/Dividends', 
                value: 0, 
                icon: ArrowUpRight, 
                color: 'text-amber-500', 
                bg: 'bg-amber-500/10',
                trend: 'Next Payout: TBD'
              },
              { 
                label: 'Personal Holding', 
                value: totalPersonalHolding, 
                icon: Briefcase, 
                color: 'text-slate-500', 
                bg: 'bg-slate-500/10',
                trend: 'Due from Director'
              }
            ] as MetricStat[]).map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                    {stat.trend}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    {stat.isCurrency !== false && (currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br')}
                    {stat.isCurrency !== false 
                      ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : stat.value.toLocaleString()
                    }
                  </h3>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${stat.bg} ${stat.color}`}>
                  {stat.trend}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                  {stat.isCurrency !== false && (currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br')}
                  {stat.isCurrency !== false 
                    ? stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
                    : stat.value.toLocaleString()
                  }
                </h3>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'capital' ? (
        <CapitalInvestorsView 
          investors={investors}
          capitalInjections={capitalInjections}
          currency={currency}
          convertForDisplay={convertForDisplay}
          totalCapitalRaised={totalCapitalRaised}
          totalPersonalHolding={totalPersonalHolding}
          updateInvestor={updateInvestor}
        />
      ) : activeTab === 'ledger' ? (
        <>
          <FormalLedgerTable
            entries={formalLedger}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currency={currency}
            convertForDisplay={convertForDisplay}
          />

          {editingBank && (
            <EditBankAccountModal
              isOpen={!!editingBank}
              onClose={() => setEditingBank(null)}
              account={editingBank}
              updateBankAccount={updateBankAccount}
            />
          )}

          {deletingBank && (
            <DeleteBankConfirmationModal
              isOpen={!!deletingBank}
              onClose={() => setDeletingBank(null)}
              onConfirm={() => deleteBankAccount(deletingBank.id)}
              bankName={deletingBank.bankName}
            />
          )}
        </>
      ) : (
        <div className="space-y-8">
          {/* Report Controls */}
          <div className="glass-card p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting Period</label>
                <div className="flex gap-2">
                  <select 
                    value={reportDate.month}
                    onChange={(e) => setReportDate({ ...reportDate, month: parseInt(e.target.value) })}
                    className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                  >
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select 
                    value={reportDate.year}
                    onChange={(e) => setReportDate({ ...reportDate, year: parseInt(e.target.value) })}
                    className="px-4 py-2 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 transition-all"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button 
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
            >
              <Download size={20} />
              Export CSV for Accountant
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profit & Loss Statement */}
            <div className="glass-card p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <h3 className="text-xl font-bold text-slate-900">Profit & Loss Statement</h3>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(reportDate.year, reportDate.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Operating Revenue</span>
                    <span className="font-bold text-slate-900">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {monthlyReport.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Cost of Services</span>
                    <span className="font-bold text-rose-500">
                      ({currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {monthlyReport.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                    </span>
                  </div>
                </div>

                <div className="h-px bg-black/5" />

                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-slate-900">Net Monthly Income</span>
                  <span className={`text-2xl font-bold ${monthlyReport.netIncome >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                    {monthlyReport.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Note</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  This statement is auto-generated based on recorded ledger entries for the selected period.
                </p>
              </div>
            </div>

            {/* Tax Declaration Summary */}
            <div className="glass-card p-8 space-y-8">
              <div className="flex items-center justify-between border-b border-black/5 pb-4">
                <h3 className="text-xl font-bold text-slate-900">Tax Declaration Summary</h3>
                <div className="flex items-center gap-2 text-active-green">
                  <CheckCircle2 size={18} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Compliance Ready</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">VAT Collected (Output)</p>
                    <p className="text-xl font-bold text-slate-900">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {monthlyReport.vatCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">VAT Paid (Input)</p>
                    <p className="text-xl font-bold text-slate-900">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {monthlyReport.vatPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Net VAT Payable</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                        {(monthlyReport.vatCollected - monthlyReport.vatPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">WHT Deducted</p>
                      <p className="text-lg font-bold text-slate-600">
                        {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                        {monthlyReport.whtDeducted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-slate-900 text-white rounded-2xl">
                  <AlertCircle size={20} className="text-active-gold" />
                  <p className="text-xs font-medium">
                    VAT declarations are due by the 30th of the following month in Ethiopia.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <RecordCapitalModal
        isOpen={isCapitalModalOpen}
        onClose={() => setIsCapitalModalOpen(false)}
      />

      <CreateInvoiceModal 
        isOpen={isInvoiceModalOpen} 
        onClose={() => setIsInvoiceModalOpen(false)} 
        clients={clients}
        addInvoice={addInvoice}
      />

      <RecordTransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        addTransaction={addTransaction}
        bankAccounts={bankAccounts}
      />

      <LinkBankAccountModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        addBankAccount={addBankAccount}
      />
    </div>
  );
};

const EditInvestorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  allInvestors: Investor[];
  updateInvestor: (id: string, data: Partial<Investor>) => void;
}> = ({ isOpen, onClose, investor, allInvestors, updateInvestor }) => {
  const [equity, setEquity] = useState(investor.equityPercentage);
  
  const otherInvestorsEquity = allInvestors
    .filter(inv => inv.id !== investor.id)
    .reduce((sum, inv) => sum + inv.equityPercentage, 0);
  
  const totalEquity = otherInvestorsEquity + equity;
  const isOverLimit = totalEquity > 100;

  const handleSave = () => {
    if (isOverLimit) return;
    updateInvestor(investor.id, { equityPercentage: equity });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-900">Edit Equity: {investor.name}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={20} />
            </button>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equity Percentage (%)</label>
              <input
                type="number"
                value={equity}
                onChange={(e) => setEquity(parseFloat(e.target.value) || 0)}
                className={`w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-lg font-bold focus:ring-2 transition-all ${
                  isOverLimit ? 'focus:ring-red-500/20 text-red-600' : 'focus:ring-active-green/20 text-slate-900'
                }`}
              />
              {isOverLimit && (
                <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Total equity cannot exceed 100% (Current: {totalEquity}%)
                </p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isOverLimit}
                className={`flex-1 px-6 py-4 rounded-2xl font-bold transition-all ${
                  isOverLimit 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                    : 'bg-active-green text-white shadow-lg shadow-active-green/20 hover:bg-active-green/90'
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const CapitalInvestorsView: React.FC<{ 
  investors: Investor[]; 
  capitalInjections: CapitalInjection[];
  currency: Currency;
  convertForDisplay: (amount: number, sourceCurrency: Currency) => number;
  totalCapitalRaised: number;
  totalPersonalHolding: number;
  updateInvestor: (id: string, data: Partial<Investor>) => void;
}> = ({ investors, capitalInjections, currency, convertForDisplay, totalCapitalRaised, totalPersonalHolding, updateInvestor }) => {
  const injectionSourceCurrency: Currency = 'USD';
  const [selectedInvestorForEdit, setSelectedInvestorForEdit] = useState<Investor | null>(null);
  const [selectedInvestorForReport, setSelectedInvestorForReport] = useState<Investor | null>(null);

  return (
    <div className="space-y-8">
      <div className="glass-card p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-active-green" size={24} />
            Cap Table & Equity Structure
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Ownership Distribution
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investor</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equity %</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Total Injected</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Fund Source</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">KYC Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {investors.map((investor) => {
                const investorInjections = capitalInjections.filter(ci => ci.investorId === investor.id);
                const totalInjected = investorInjections.reduce(
                  (sum, ci) => sum + convertForDisplay(ci.amount, injectionSourceCurrency),
                  0
                );
                
                const primarySource = investorInjections[0]?.fundSource || 'N/A';

                return (
                  <tr key={investor.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{investor.name}</span>
                          {investor.nationality && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">
                              {investor.nationality}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">{investor.contact}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-active-green" 
                            style={{ width: `${investor.equityPercentage || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-900">{investor.equityPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-900 text-right">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {totalInjected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        primarySource === 'COMPANY_BANK' ? 'text-emerald-600' : 'text-indigo-600'
                      }`}>
                        {primarySource.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                        investor.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-600' :
                        investor.kycStatus === 'REJECTED' ? 'bg-rose-500/10 text-rose-600' :
                        'bg-amber-500/10 text-amber-600'
                      }`}>
                        {investor.kycStatus}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedInvestorForReport(investor)}
                          className="p-2 text-slate-400 hover:text-active-green hover:bg-active-green/5 rounded-xl transition-all"
                          title="Generate Digital Agreement"
                        >
                          <FileIcon size={18} />
                        </button>
                        <button
                          onClick={() => setSelectedInvestorForEdit(investor)}
                          className="p-2 text-slate-400 hover:text-active-gold hover:bg-active-gold/5 rounded-xl transition-all"
                          title="Edit Equity"
                        >
                          <Pencil size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedInvestorForEdit && (
        <EditInvestorModal
          isOpen={!!selectedInvestorForEdit}
          onClose={() => setSelectedInvestorForEdit(null)}
          investor={selectedInvestorForEdit}
          allInvestors={investors}
          updateInvestor={updateInvestor}
        />
      )}

      {selectedInvestorForReport && (
        <InvestorReportModal
          isOpen={!!selectedInvestorForReport}
          onClose={() => setSelectedInvestorForReport(null)}
          investor={selectedInvestorForReport}
          injections={capitalInjections.filter(ci => ci.investorId === selectedInvestorForReport.id)}
          currency={currency}
          convertForDisplay={convertForDisplay}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Recent Capital Events</h3>
          <div className="space-y-4">
            {capitalInjections.slice(0, 5).map((ci) => {
              const investor = investors.find(i => i.id === ci.investorId);
              return (
                <div key={ci.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${ci.type === 'EQUITY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                      <Briefcase size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{investor?.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ci.allocationPurpose}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                      {convertForDisplay(ci.amount, injectionSourceCurrency).toLocaleString()}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ci.date}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-lg font-bold text-slate-900">Yield & Dividend Tracking</h3>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="p-4 bg-amber-500/10 text-amber-600 rounded-full">
              <Clock size={32} />
            </div>
            <div>
              <p className="text-slate-900 font-bold">No Pending Payouts</p>
              <p className="text-sm text-slate-500 max-w-[240px] mx-auto mt-1">
                Yield calculations will appear here once the next fiscal quarter closes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// RecordCapitalInjectionModal has been moved to src/components/RecordCapitalModal.tsx for performance isolation.
