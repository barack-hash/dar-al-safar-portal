export type Currency = 'ETB' | 'USD' | 'SAR';

export interface Client {
  id: string;
  name: string;
  email: string;
  passportID: string;
  nationality: string;
  expiryDate: string;
  contact: string;
  source: string;
  notes: string;
}

export type EditorialStatus = 'Draft' | 'Published' | 'Archived';
export type EditorialCategory = 'Article' | 'Itinerary' | 'Media';
export type BudgetLevel = 'Standard' | 'Premium' | 'Ultra-Luxury';
export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface EditorialItem {
  id: string;
  title: string;
  destination: string;
  author: string;
  status: EditorialStatus;
  category: EditorialCategory;
  lastModified: string;
  thumbnail: string;
  wordCount: number;
}

export interface WorkspaceState {
  title: string;
  content: string;
  destination: string;
  travelDates: string;
  budgetLevel: BudgetLevel;
  priority: Priority;
  category: EditorialCategory;
}

export type UserRole = 'ADMIN' | 'AGENT' | 'VIEWER';

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export interface InvoiceItem {
  id: string;
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  passportID: string;
  contact: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  subtotal: number;
  conciergeFee: number;
  total: number;
  currency: Currency;
}

export const TaxConfig = {
  VAT: 0.15,
  WHT_DOMESTIC: 0.03,
  CORP_TAX: 0.30
} as const;

export type TransactionType = 'INCOME' | 'EXPENSE' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'DIVIDEND_PAYOUT';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  type: TransactionType;
  category: string;
  taxDetails: {
    vat: number;
    wht: number;
  };
  referenceId?: string;
  isTaxable: boolean;
  includeVAT?: boolean;
  applyWHT?: boolean;
  bankAccountId?: string;
}

export type EmployeeRole = 'Concierge' | 'Travel Consultant' | 'Operations Manager' | 'Accountant' | 'Marketing Specialist';

export type TicketStatus = 'DRAFT' | 'ON_HOLD' | 'TICKETED' | 'CANCELLED' | 'REFUNDED';

export type CabinClass = 'Economy' | 'Cloud Nine/Business' | 'First';

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: string;
  departure: {
    airportCode: string;
    at: string;
  };
  arrival: {
    airportCode: string;
    at: string;
  };
  cabinClass: CabinClass;
}

export interface BookingRecord {
  id: string;
  pnr: string;
  clientId: string;
  itinerary: FlightSegment[];
  status: TicketStatus;
  ticketingTimeLimit: string;
  pricing: {
    netFare: number;
    taxes: number;
    markup: number;
    grossTotal: number;
    currency: Currency;
  };
  issuedAt?: string;
}

export type VisaStatus = 'COLLECTING_DOCS' | 'APPOINTMENT_BOOKED' | 'PROCESSING' | 'APPROVED' | 'REJECTED';

export type VisaDocumentStatus = 'MISSING' | 'UPLOADED' | 'VERIFIED';

export interface VisaDocument {
  id: string;
  name: string;
  status: VisaDocumentStatus;
  fileUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface VisaApplication {
  id: string;
  clientId: string;
  destinationCountry: string;
  visaType: string;
  status: VisaStatus;
  submissionDate: string;
  appointmentDate?: string;
  documentDeadline: string;
  passportRequired: boolean;
  documents: VisaDocument[];
  pointOfEntry: string;
  yellowFeverRequired: boolean;
  intendedEntryDate?: string;
}

export type EventCategory = 'HOTEL' | 'TOUR' | 'TRANSFER' | 'VIP_ACCESS';
export type EventStatus = 'PLANNING' | 'CONFIRMED' | 'COMPLETED';

export interface EventBooking {
  id: string;
  clientId: string;
  title: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  status: EventStatus;
}

export type PaymentFrequency = 'HOURLY' | 'BI_WEEKLY' | 'MONTHLY';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  baseSalary: number;
  tinNumber: string;
  startDate: string;
  paymentFrequency: PaymentFrequency;
  hourlyRate?: number;
  applyPension: boolean;
  applyIncomeTax: boolean;
}

export type KYCStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface InvestorDocument {
  id: string;
  name: string;
  status: VisaDocumentStatus;
  fileUrl?: string;
}

export interface Investor {
  id: string;
  name: string;
  equityPercentage?: number;
  contact: string;
  nationality: string;
  sourceOfFunds: string;
  kycStatus: KYCStatus;
  documents: InvestorDocument[];
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string; // last 4 digits
  currency: Currency;
  initialBalance: number;
}

export type CapitalInjectionType = 'EQUITY' | 'DEBT/LOAN';
export type FundSource = 'COMPANY_BANK' | 'DIRECTOR_PERSONAL_ACCOUNT';

export interface CapitalInjection {
  id: string;
  investorId: string;
  amount: number;
  date: string;
  type: CapitalInjectionType;
  fundSource: FundSource;
  allocationPurpose: string;
  expectedYieldPercentage?: number;
  bankAccountId?: string;
}

export type CashLogStatus = 'Cleared' | 'Pending' | 'Overdue';
export type CashLogMethod = 'Bank' | 'Cash';
export type CashLogCategory = 'Income' | 'Expense';

export interface CashLogEntry {
  id: string;
  date: string;
  clientEntity: string;
  service: string;
  description: string;
  moneyIn: number;
  moneyOut: number;
  currency: Currency;
  method: CashLogMethod;
  staff: string;
  notes: string;
  status: CashLogStatus;
  category: CashLogCategory;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Amira Al-Farsi',
    email: 'amira@darsafar.com',
    role: 'ADMIN',
    avatar: 'https://i.pravatar.cc/150?u=amira'
  },
  {
    id: '2',
    name: 'Zaid Al-Harbi',
    email: 'zaid@darsafar.com',
    role: 'AGENT',
    avatar: 'https://i.pravatar.cc/150?u=zaid'
  },
  {
    id: '3',
    name: 'Guest Traveler',
    email: 'guest@darsafar.com',
    role: 'VIEWER',
    avatar: 'https://i.pravatar.cc/150?u=guest'
  }
];

export const MOCK_EDITORIAL_ITEMS: EditorialItem[] = [
  {
    id: '1',
    title: 'The Hidden Oases of AlUla',
    destination: 'Saudi Arabia',
    author: 'Amira Al-Farsi',
    status: 'Published',
    category: 'Article',
    lastModified: '2026-03-20',
    thumbnail: 'https://picsum.photos/seed/alula/800/600',
    wordCount: 1240
  },
  {
    id: '2',
    title: '7 Days in the Empty Quarter',
    destination: 'Oman',
    author: 'Zaid Al-Harbi',
    status: 'Draft',
    category: 'Itinerary',
    lastModified: '2026-03-22',
    thumbnail: 'https://picsum.photos/seed/oman/800/600',
    wordCount: 850
  },
  {
    id: '3',
    title: 'Petra by Night: A Visual Journey',
    destination: 'Jordan',
    author: 'Amira Al-Farsi',
    status: 'Published',
    category: 'Media',
    lastModified: '2026-03-15',
    thumbnail: 'https://picsum.photos/seed/petra/800/600',
    wordCount: 0
  },
  {
    id: '4',
    title: 'The Artisans of Old Town AlUla',
    destination: 'Saudi Arabia',
    author: 'Zaid Al-Harbi',
    status: 'Archived',
    category: 'Article',
    lastModified: '2026-02-10',
    thumbnail: 'https://picsum.photos/seed/artisans/800/600',
    wordCount: 1100
  }
];
