import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Client,
  Currency,
  Invoice,
  InvoiceStatus,
  Transaction,
  Employee,
  BookingRecord,
  VisaDocumentStatus,
  Investor,
  CapitalInjection,
  BankAccount,
  type PersistedAppSettings,
} from '../types';
import { useClients } from '../hooks/useClients';
import { useAccounting } from '../hooks/useAccounting';
import { useStaff } from '../hooks/useStaff';
import { useTicketing } from '../hooks/useTicketing';
import { useConcierge } from '../hooks/useConcierge';
import { useCashLog } from '../hooks/useCashLog';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Tab } from '../components/Layout';
import { calculatePayroll } from '../lib/payrollEngine';
import { toast } from 'sonner';
import { VisaApplication, EventBooking, VisaStatus, EventStatus, CashLogEntry } from '../types';
import { getDefaultPersistedAppSettings, normalizePersistedAppSettings } from '../lib/appSettings';
import {
  FALLBACK_EXCHANGE_RATES,
  fetchLiveExchangeRates,
  convertCurrency,
  computeAccountingStatsDisplay,
  computeMonthlyReportDisplay,
  computeExpectedMarkupDisplay,
  type ExchangeRates,
  type ExchangeRatesSource,
} from '../lib/currencyService';

interface UIContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  exchangeRatesSource: ExchangeRatesSource;
  convertForDisplay: (amount: number, sourceCurrency: Currency) => number;
  debouncedSearchQuery: string;
  currentTab: Tab;
  setCurrentTab: (tab: Tab) => void;
  isAddClientModalOpen: boolean;
  setIsAddClientModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddBookingModalOpen: boolean;
  setIsAddBookingModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isAddVisaModalOpen: boolean;
  setIsAddVisaModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isLogCashEntryModalOpen: boolean;
  setIsLogCashEntryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Closes other global modals, then opens Add Client (works from any tab, including Dashboard). */
  openAddClientModal: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: (isOpen?: boolean) => void;
  appSettings: PersistedAppSettings;
  setAppSettings: React.Dispatch<React.SetStateAction<PersistedAppSettings>>;
}

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, updatedClient: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;
  deleteInvoice: (id: string) => void;
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, 'id' | 'taxDetails'>) => void;
  accountingStats: {
    totalRevenue: number;
    totalExpenses: number;
    totalCashOutflow: number;
    netProfit: number;
    vatLiability: number;
    whtLiability: number;
  };
  investors: Investor[];
  addInvestor: (investor: Omit<Investor, 'id'>) => Investor;
  updateInvestor: (id: string, updatedInvestor: Partial<Investor>) => void;
  capitalInjections: CapitalInjection[];
  recordCapitalInjection: (injection: Omit<CapitalInjection, 'id'>) => CapitalInjection;
  totalCapitalRaised: number;
  totalPersonalHolding: number;
  bankAccounts: BankAccount[];
  addBankAccount: (bankAccount: Omit<BankAccount, 'id'>) => BankAccount;
  updateBankAccount: (id: string, data: Partial<BankAccount>) => void;
  deleteBankAccount: (id: string) => void;
  accountBalances: (BankAccount & { currentBalance: number })[];
  employees: Employee[];
  addEmployee: (employee: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, data: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  generatePayroll: (hourlyHours?: Record<string, number>) => void;
  voidTransaction: (id: string) => void;
  generateMonthlyReport: (month: number, year: number) => {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    vatCollected: number;
    vatPaid: number;
    whtDeducted: number;
    transactionCount: number;
    transactions: Transaction[];
  };
  bookings: BookingRecord[];
  createBooking: (booking: Omit<BookingRecord, 'id'>) => BookingRecord;
  issueTicket: (id: string) => void;
  cancelBooking: (id: string) => void;
  expiringHolds: BookingRecord[];
  ticketingStats: {
    activeHolds: number;
    ticketsIssuedThisMonth: number;
    expectedMarkup: number;
  };
  visas: VisaApplication[];
  events: EventBooking[];
  addVisa: (visa: Omit<VisaApplication, 'id'>) => Promise<VisaApplication>;
  updateVisa: (id: string, updates: Partial<VisaApplication>) => void;
  updateVisaStatus: (id: string, status: VisaStatus) => void;
  updateVisaDocument: (visaId: string, docId: string, status: VisaDocumentStatus, verifiedAt?: string, verifiedBy?: string) => void;
  addEvent: (event: Omit<EventBooking, 'id'>) => Promise<EventBooking>;
  updateEventStatus: (id: string, status: EventStatus) => Promise<void>;
  urgentVisas: VisaApplication[];
  cashLog: CashLogEntry[];
  addCashLogEntry: (entry: Omit<CashLogEntry, 'id'>) => Promise<CashLogEntry>;
  updateCashLogEntry: (id: string, updates: Partial<CashLogEntry>) => void;
  deleteCashLogEntry: (id: string) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);
const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currency, setCurrency] = useLocalStorage<Currency>('dasa_currency', 'USD');
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isAddBookingModalOpen, setIsAddBookingModalOpen] = useState(false);
  const [isAddVisaModalOpen, setIsAddVisaModalOpen] = useState(false);
  const [isLogCashEntryModalOpen, setIsLogCashEntryModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(FALLBACK_EXCHANGE_RATES);
  const [exchangeRatesSource, setExchangeRatesSource] = useState<ExchangeRatesSource>('fallback');
  const [appSettingsStored, setAppSettingsStored] = useLocalStorage<PersistedAppSettings>(
    'dasa_app_settings',
    getDefaultPersistedAppSettings()
  );
  const settingsMigrated = useRef(false);

  const appSettings = useMemo(() => normalizePersistedAppSettings(appSettingsStored), [appSettingsStored]);

  const setAppSettings = useCallback<React.Dispatch<React.SetStateAction<PersistedAppSettings>>>(
    (action) => {
      setAppSettingsStored((prev) => {
        const base = normalizePersistedAppSettings(prev);
        const next = typeof action === 'function' ? (action as (b: PersistedAppSettings) => PersistedAppSettings)(base) : action;
        return normalizePersistedAppSettings(next);
      });
    },
    [setAppSettingsStored]
  );

  useEffect(() => {
    if (settingsMigrated.current) return;
    settingsMigrated.current = true;
    const n = normalizePersistedAppSettings(appSettingsStored);
    if (JSON.stringify(n) !== JSON.stringify(appSettingsStored)) {
      setAppSettingsStored(n);
    }
  }, [appSettingsStored, setAppSettingsStored]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', appSettings.theme);
  }, [appSettings.theme]);

  const toggleSidebar = useCallback((open?: boolean) => {
    setIsSidebarOpen(prev => open !== undefined ? open : !prev);
  }, []);

  const openAddClientModal = useCallback(() => {
    setIsAddBookingModalOpen(false);
    setIsAddVisaModalOpen(false);
    setIsLogCashEntryModalOpen(false);
    setIsAddClientModalOpen(() => true);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRates = async () => {
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        setExchangeRates(FALLBACK_EXCHANGE_RATES);
        setExchangeRatesSource('fallback');
        return;
      }
      try {
        const live = await fetchLiveExchangeRates();
        if (!cancelled) {
          setExchangeRates(live);
          setExchangeRatesSource('live');
        }
      } catch {
        if (!cancelled) {
          setExchangeRates(FALLBACK_EXCHANGE_RATES);
          setExchangeRatesSource('fallback');
        }
      }
    };
    void loadRates();
    return () => {
      cancelled = true;
    };
  }, []);

  const { 
    clients, addClient, updateClient, deleteClient,
    invoices, addInvoice, updateInvoiceStatus, deleteInvoice
  } = useClients();
  const { 
    transactions, 
    addTransaction, 
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
    accountBalances
  } = useAccounting();
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useStaff();
  const { 
    bookings, createBooking, issueTicket: originalIssueTicket, cancelBooking: originalCancelBooking, 
    expiringHolds, ticketingStats 
  } = useTicketing();

  const convertForDisplay = useCallback(
    (amount: number, sourceCurrency: Currency) =>
      convertCurrency(amount, sourceCurrency, currency, exchangeRates),
    [currency, exchangeRates]
  );

  const accountingStats = useMemo(
    () => computeAccountingStatsDisplay(transactions, currency, exchangeRates),
    [transactions, currency, exchangeRates]
  );

  const generateMonthlyReport = useCallback(
    (month: number, year: number) =>
      computeMonthlyReportDisplay(transactions, month, year, currency, exchangeRates),
    [transactions, currency, exchangeRates]
  );

  const ticketingStatsDisplay = useMemo(
    () => ({
      ...ticketingStats,
      expectedMarkup: computeExpectedMarkupDisplay(bookings, currency, exchangeRates),
    }),
    [ticketingStats, bookings, currency, exchangeRates]
  );

  const totalCapitalRaisedDisplay = useMemo(
    () => convertCurrency(totalCapitalRaised, 'USD', currency, exchangeRates),
    [totalCapitalRaised, currency, exchangeRates]
  );

  const totalPersonalHoldingDisplay = useMemo(
    () => convertCurrency(totalPersonalHolding, 'USD', currency, exchangeRates),
    [totalPersonalHolding, currency, exchangeRates]
  );
  const {
    visas, events, addVisa, updateVisa, updateVisaStatus, updateVisaDocument, addEvent, updateEventStatus, urgentVisas
  } = useConcierge();
  const { cashLog, addCashLogEntry, updateCashLogEntry, deleteCashLogEntry } = useCashLog();

  const issueTicket = useCallback((id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    originalIssueTicket(id);

    // Financial Sync: Record the markup as income
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Ticket Issued: PNR ${booking.pnr}`,
      amount: booking.pricing.markup,
      currency: booking.pricing.currency,
      type: 'INCOME',
      category: 'Flight Sales Markup',
      isTaxable: true
    });

    toast.success('Ticket Issued', {
      description: 'Markup recorded in Accounting Ledger.'
    });
  }, [bookings, originalIssueTicket, addTransaction]);

  const cancelBooking = useCallback((id: string) => {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;

    if (booking.status === 'TICKETED') {
      // Financial Sync: Create a negative entry in the General Ledger
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `Booking Cancellation Refund: PNR ${booking.pnr}`,
        amount: booking.pricing.markup, // Reversing the markup
        currency: booking.pricing.currency,
        type: 'EXPENSE',
        category: 'Refunds/Cancellations',
        isTaxable: false
      });
    }

    originalCancelBooking(id);
    toast.success('Booking Cancelled', {
      description: 'Accounting Ledger automatically updated.'
    });
  }, [bookings, originalCancelBooking, addTransaction]);

  const voidTransaction = useCallback((id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    // Create a reversal transaction
    const reversal: Omit<Transaction, 'id' | 'taxDetails'> = {
      date: new Date().toISOString().split('T')[0],
      description: `VOID: ${transaction.description}`,
      amount: -transaction.amount,
      currency: transaction.currency,
      type: transaction.type === 'INCOME' ? 'EXPENSE' : 'INCOME',
      category: 'Voided Transactions',
      isTaxable: transaction.isTaxable
    };

    addTransaction(reversal);
    toast.success('Transaction Voided', {
      description: 'A reversal entry has been added to the ledger.'
    });
  }, [transactions, addTransaction]);

  const generatePayroll = useCallback((hourlyHours?: Record<string, number>) => {
    if (employees.length === 0) {
      toast.error('No employees found to generate payroll.');
      return;
    }

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    
    // Check if payroll has already been generated for this month
    const alreadyGenerated = transactions.some(tx => 
      tx.category === 'Tax & Pension' && 
      tx.description.includes(currentMonth) &&
      tx.date.startsWith(currentYear.toString())
    );

    if (alreadyGenerated) {
      toast.error(`Payroll for ${currentMonth} ${currentYear} has already been generated.`);
      return;
    }

    let totalTaxPensionLiability = 0;

    employees.forEach(emp => {
      const hours = emp.paymentFrequency === 'HOURLY' ? (hourlyHours?.[emp.id] || 0) : undefined;
      const payroll = calculatePayroll(emp, hours);
      totalTaxPensionLiability += (payroll.incomeTax + payroll.employeePension + payroll.employerPension);

      // Record individual net salary expense
      addTransaction({
        date: new Date().toISOString().split('T')[0],
        description: `Salary Payment: ${emp.name} (${currentMonth})`,
        amount: payroll.netSalary,
        currency: 'ETB',
        type: 'EXPENSE',
        category: 'Payroll',
        isTaxable: false
      });
    });

    // Record total liability for tax and pension
    addTransaction({
      date: new Date().toISOString().split('T')[0],
      description: `Payroll Tax & Pension Liability (${currentMonth})`,
      amount: totalTaxPensionLiability,
      currency: 'ETB',
      type: 'LIABILITY',
      category: 'Tax & Pension',
      isTaxable: false
    });

    toast.success('Payroll Generated', {
      description: `Ledger updated with salary expenses and tax liabilities for ${employees.length} employees.`
    });
  }, [employees, transactions, addTransaction]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const uiValue = useMemo(() => ({
    searchQuery,
    setSearchQuery,
    currency,
    setCurrency,
    exchangeRates,
    exchangeRatesSource,
    convertForDisplay,
    debouncedSearchQuery,
    currentTab,
    setCurrentTab,
    isAddClientModalOpen,
    setIsAddClientModalOpen,
    isAddBookingModalOpen,
    setIsAddBookingModalOpen,
    isAddVisaModalOpen,
    setIsAddVisaModalOpen,
    isLogCashEntryModalOpen,
    setIsLogCashEntryModalOpen,
    isSidebarOpen,
    toggleSidebar,
    appSettings,
    setAppSettings,
    openAddClientModal,
  }), [
    searchQuery,
    currency,
    setCurrency,
    exchangeRates,
    exchangeRatesSource,
    convertForDisplay,
    debouncedSearchQuery,
    currentTab,
    isAddClientModalOpen,
    isAddBookingModalOpen,
    isAddVisaModalOpen,
    isLogCashEntryModalOpen,
    isSidebarOpen,
    toggleSidebar,
    appSettings,
    setAppSettings,
    openAddClientModal,
  ]);

  const clientsValue = useMemo(() => ({
    clients,
    addClient,
    updateClient,
    deleteClient,
    invoices,
    addInvoice,
    updateInvoiceStatus,
    deleteInvoice,
    transactions,
    addTransaction,
    voidTransaction,
    accountingStats,
    investors,
    addInvestor,
    updateInvestor,
    capitalInjections,
    recordCapitalInjection,
    totalCapitalRaised: totalCapitalRaisedDisplay,
    totalPersonalHolding: totalPersonalHoldingDisplay,
    bankAccounts,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    accountBalances,
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    generatePayroll,
    generateMonthlyReport,
    bookings,
    createBooking,
    issueTicket,
    cancelBooking,
    expiringHolds,
    ticketingStats: ticketingStatsDisplay,
    visas,
    events,
    addVisa,
    updateVisa,
    updateVisaStatus,
    updateVisaDocument,
    addEvent,
    updateEventStatus,
    urgentVisas,
    cashLog,
    addCashLogEntry,
    updateCashLogEntry,
    deleteCashLogEntry
  }), [
    clients, addClient, updateClient, deleteClient,
    invoices, addInvoice, updateInvoiceStatus, deleteInvoice,
    transactions, addTransaction, voidTransaction, accountingStats,
    investors, addInvestor, updateInvestor, capitalInjections, recordCapitalInjection, totalCapitalRaisedDisplay, totalPersonalHoldingDisplay,
    bankAccounts, addBankAccount, updateBankAccount, deleteBankAccount, accountBalances,
    employees, addEmployee, updateEmployee, deleteEmployee, generatePayroll, generateMonthlyReport,
    bookings, createBooking, issueTicket, cancelBooking, expiringHolds, ticketingStatsDisplay,
    visas, events, addVisa, updateVisa, updateVisaStatus, updateVisaDocument, addEvent, updateEventStatus, urgentVisas,
    cashLog, addCashLogEntry, updateCashLogEntry, deleteCashLogEntry
  ]);

  return (
    <UIContext.Provider value={uiValue}>
      <ClientsContext.Provider value={clientsValue}>
        {children}
      </ClientsContext.Provider>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within an AppProvider');
  }
  return context;
};

export const useClientsContext = () => {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error('useClientsContext must be used within an AppProvider');
  }
  return context;
};

// For backward compatibility and convenience
export const useAppContext = () => {
  return { ...useUI(), ...useClientsContext() };
};
