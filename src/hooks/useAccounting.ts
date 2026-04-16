import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Transaction, TaxConfig, TransactionType, Currency, Investor, CapitalInjection, BankAccount } from '../types';
import { toast } from 'sonner';

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'TX-001',
    date: '2026-03-20',
    description: 'Client Invoice: Sarah Al-Farsi',
    amount: 4200,
    currency: 'USD',
    type: 'INCOME',
    category: 'Concierge Services',
    taxDetails: { vat: 547.83, wht: 109.57 },
    referenceId: 'INV-001',
    isTaxable: true
  },
  {
    id: 'TX-002',
    date: '2026-03-21',
    description: 'Office Rent - Addis Ababa HQ',
    amount: 1500,
    currency: 'USD',
    type: 'EXPENSE',
    category: 'Rent',
    taxDetails: { vat: 195.65, wht: 39.13 },
    isTaxable: true
  },
  {
    id: 'TX-003',
    date: '2026-03-22',
    description: 'Flight Booking: Johnathan Vance',
    amount: 3850,
    currency: 'USD',
    type: 'INCOME',
    category: 'Flight Sales',
    taxDetails: { vat: 502.17, wht: 100.43 },
    referenceId: 'INV-002',
    isTaxable: true
  }
];

const MOCK_INVESTORS: Investor[] = [
  { 
    id: 'INV-001', 
    name: 'Amira Al-Farsi', 
    equityPercentage: 60, 
    contact: 'amira@darsafar.com',
    nationality: 'Saudi Arabia',
    sourceOfFunds: 'Business Revenue',
    kycStatus: 'VERIFIED',
    documents: []
  },
  { 
    id: 'INV-002', 
    name: 'Zaid Al-Harbi', 
    equityPercentage: 40, 
    contact: 'zaid@darsafar.com',
    nationality: 'Oman',
    sourceOfFunds: 'Personal Savings',
    kycStatus: 'VERIFIED',
    documents: []
  }
];

const MOCK_INJECTIONS: CapitalInjection[] = [
  {
    id: 'CI-001',
    investorId: 'INV-001',
    amount: 50000,
    date: '2026-01-15',
    type: 'EQUITY',
    fundSource: 'COMPANY_BANK',
    allocationPurpose: 'Initial Working Capital'
  }
];

const MOCK_BANKS: BankAccount[] = [
  {
    id: 'BANK-001',
    bankName: 'Commercial Bank of Ethiopia',
    accountNumber: '4321',
    currency: 'ETB',
    initialBalance: 250000
  },
  {
    id: 'BANK-002',
    bankName: 'Bank of America',
    accountNumber: '8899',
    currency: 'USD',
    initialBalance: 15000
  }
];

export function useAccounting() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>('dasa_ledger', MOCK_TRANSACTIONS);
  const [investors, setInvestors] = useLocalStorage<Investor[]>('dasa_investors', MOCK_INVESTORS);
  const [capitalInjections, setCapitalInjections] = useLocalStorage<CapitalInjection[]>('dasa_injections', MOCK_INJECTIONS);
  const [bankAccounts, setBankAccounts] = useLocalStorage<BankAccount[]>('dasa_bank_accounts', MOCK_BANKS);

  const addTransaction = useCallback((data: Omit<Transaction, 'id' | 'taxDetails'>) => {
    let vat = 0;
    let wht = 0;

    // Use explicit flags or fall back to general isTaxable
    const shouldVAT = data.includeVAT ?? data.isTaxable;
    const shouldWHT = data.applyWHT ?? data.isTaxable;

    if (shouldVAT || shouldWHT) {
      // Assuming the amount is gross (inclusive of VAT if applicable)
      // Net = Gross / (1 + VAT_RATE)
      const netAmount = shouldVAT ? (data.amount / (1 + TaxConfig.VAT)) : data.amount;
      vat = shouldVAT ? (data.amount - netAmount) : 0;
      wht = shouldWHT ? (netAmount * TaxConfig.WHT_DOMESTIC) : 0;
    }

    const newTransaction: Transaction = {
      ...data,
      id: `TX-${Math.floor(1000 + Math.random() * 9000)}`,
      taxDetails: { vat, wht }
    };

    setTransactions(prev => [newTransaction, ...prev]);
    return newTransaction;
  }, [setTransactions]);

  const addInvestor = useCallback((data: Omit<Investor, 'id'>) => {
    const newInvestor: Investor = {
      ...data,
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setInvestors(prev => [...prev, newInvestor]);
    toast.success('Investor Added');
    return newInvestor;
  }, [setInvestors]);

  const updateInvestor = useCallback((id: string, data: Partial<Investor>) => {
    setInvestors(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv));
    toast.success('Investor Updated');
  }, [setInvestors]);

  const recordCapitalInjection = useCallback((data: Omit<CapitalInjection, 'id'>) => {
    const newInjection: CapitalInjection = {
      ...data,
      id: `CI-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setCapitalInjections(prev => [newInjection, ...prev]);

    // Double-Entry Logic
    const investor = investors.find(i => i.id === data.investorId);
    const investorName = investor?.name || 'Unknown Investor';
    
    let description = '';
    let category = '';
    
    if (data.fundSource === 'COMPANY_BANK') {
      const bank = bankAccounts.find(b => b.id === data.bankAccountId);
      description = `Capital Injection - ${investorName} (${bank?.bankName || 'Official Account'})`;
      category = 'Cash Asset';
    } else {
      description = `Capital Injection - ${investorName} (Due from Director / Personal Account)`;
      category = 'Due from Director / Personal Holding';
    }

    addTransaction({
      date: data.date,
      description,
      amount: data.amount,
      currency: 'USD',
      type: 'EQUITY',
      category,
      isTaxable: false,
      bankAccountId: data.bankAccountId
    });

    toast.success('Capital Injection Recorded');
    return newInjection;
  }, [investors, bankAccounts, setCapitalInjections, addTransaction]);

  const addBankAccount = useCallback((data: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      ...data,
      id: `BANK-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setBankAccounts(prev => [...prev, newAccount]);
    toast.success('Bank Account Linked');
    return newAccount;
  }, [setBankAccounts]);

  const updateBankAccount = useCallback((id: string, data: Partial<BankAccount>) => {
    setBankAccounts(prev => prev.map(acc => acc.id === id ? { ...acc, ...data } : acc));
    toast.success('Bank Account Updated');
  }, [setBankAccounts]);

  const deleteBankAccount = useCallback((id: string) => {
    const hasHistory = transactions.some(tx => tx.bankAccountId === id);
    if (hasHistory) {
      toast.error('Cannot delete: Account has active ledger history.');
      return;
    }
    setBankAccounts(prev => prev.filter(acc => acc.id !== id));
    toast.success('Bank Account Removed');
  }, [transactions, setBankAccounts]);

  const accountBalances = useMemo(() => {
    return bankAccounts.map(account => {
      const accountTransactions = transactions.filter(tx => tx.bankAccountId === account.id);
      
      const balance = accountTransactions.reduce((acc, tx) => {
        if (tx.type === 'INCOME' || tx.type === 'EQUITY') {
          return acc + tx.amount;
        } else if (tx.type === 'EXPENSE' || tx.type === 'DIVIDEND_PAYOUT') {
          return acc - tx.amount;
        }
        return acc;
      }, account.initialBalance);

      return {
        ...account,
        currentBalance: balance
      };
    });
  }, [bankAccounts, transactions]);

  const totalCapitalRaised = useMemo(() => {
    return capitalInjections.reduce((sum, ci) => sum + ci.amount, 0);
  }, [capitalInjections]);

  const totalPersonalHolding = useMemo(() => {
    return capitalInjections
      .filter(ci => ci.fundSource === 'DIRECTOR_PERSONAL_ACCOUNT')
      .reduce((sum, ci) => sum + ci.amount, 0);
  }, [capitalInjections]);

  const stats = useMemo(() => {
    return transactions.reduce((acc, tx) => {
      if (tx.type === 'INCOME') {
        acc.totalRevenue += tx.amount;
        acc.vatLiability += tx.taxDetails.vat;
        acc.whtLiability += tx.taxDetails.wht;
      } else if (tx.type === 'EXPENSE') {
        acc.totalExpenses += tx.amount;
        // For expenses, WHT is deducted from payment and becomes a liability
        acc.whtLiability += tx.taxDetails.wht;
        acc.totalCashOutflow += (tx.amount - tx.taxDetails.wht);
      }
      
      acc.netProfit = acc.totalRevenue - acc.totalExpenses;
      return acc;
    }, {
      totalRevenue: 0,
      totalExpenses: 0,
      totalCashOutflow: 0,
      netProfit: 0,
      vatLiability: 0,
      whtLiability: 0
    });
  }, [transactions]);

  const generateMonthlyReport = useCallback((month: number, year: number) => {
    const filtered = transactions.filter(tx => {
      const date = new Date(tx.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    return filtered.reduce((acc, tx) => {
      if (tx.type === 'INCOME') {
        acc.totalRevenue += tx.amount;
        acc.vatCollected += tx.taxDetails.vat;
      } else if (tx.type === 'EXPENSE') {
        acc.totalExpenses += tx.amount;
        acc.vatPaid += tx.taxDetails.vat;
        acc.whtDeducted += tx.taxDetails.wht;
      }
      
      acc.netIncome = acc.totalRevenue - acc.totalExpenses;
      return acc;
    }, {
      totalRevenue: 0,
      totalExpenses: 0,
      netIncome: 0,
      vatCollected: 0, // Liability
      vatPaid: 0,      // Asset/Input VAT
      whtDeducted: 0,
      transactionCount: filtered.length,
      transactions: filtered
    });
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    investors,
    addInvestor,
    updateInvestor,
    capitalInjections,
    recordCapitalInjection,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    accountBalances,
    totalCapitalRaised,
    totalPersonalHolding,
    stats,
    generateMonthlyReport
  };
}
