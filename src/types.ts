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
  dateOfBirth?: string;
  phoneE164?: string;
  ethiopianNationalID?: string;
  passportScanUrl?: string;
  nationalIdScanUrl?: string;
  birthCertificateUrl?: string;
  familyGroupId?: string;
  frequentFlyerNumbers?: FrequentFlyerNumber[];
}

export interface FrequentFlyerNumber {
  airline: string;
  number: string;
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

/** Primary navigation / permission sections (matches app tabs). */
export type AppSectionId =
  | 'dashboard'
  | 'ticketing'
  | 'clients'
  | 'staff'
  | 'accounting'
  | 'cashlog'
  | 'visa'
  | 'insights'
  | 'settings';

export type AppAccessRole = 'SUPERADMIN' | 'MANAGER' | 'AGENT';

export type AppTheme = 'classic' | 'modern' | 'dark';

export interface SectionAccess {
  view: boolean;
  edit: boolean;
}

export type PermissionsByRole = Record<AppAccessRole, Record<AppSectionId, SectionAccess>>;

export interface AgencyProfile {
  displayName: string;
  legalName: string;
  tradeLicense: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  iataCode: string;
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number;
  requireMfa: boolean;
  logAuditTrail: boolean;
}

export interface StaffAccessEntry {
  role: AppAccessRole;
  active: boolean;
}

export type StaffAccessMap = Record<string, StaffAccessEntry>;

export interface PersistedAppSettings {
  theme: AppTheme;
  agencyProfile: AgencyProfile;
  security: SecuritySettings;
  permissionsByRole: PermissionsByRole;
  staffAccess: StaffAccessMap;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  accessRole: AppAccessRole;
  avatar: string;
  /** Derived from role matrix; e.g. `dashboard:view`, `accounting:edit`. */
  permissions: string[];
  /** Preserved when signing in via legacy `User` for editorial features. */
  legacyRole?: UserRole;
  /**
   * When set (from Supabase `profiles.permissions`), `hasPermission` uses this list
   * instead of the role matrix. Empty array in DB means fall back to matrix.
   */
  profilePermissions?: string[];
}

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

export type TicketStatus = 'ON_HOLD' | 'TICKETED' | 'VOIDED' | 'CANCELLED';

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
  airlineCode: string;
  ticketNumber?: string;
  /** profiles.user_id of assigned staff */
  assignedStaffId?: string;
  itinerarySummary: string;
  departureDate: string;
  arrivalDate: string;
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

export type VisaStatus =
  | 'GATHERING_DOCS'
  | 'READY_TO_SUBMIT'
  | 'IN_PROCESSING'
  | 'ACTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

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
  /** profiles.user_id of assigned staff */
  assignedStaffId?: string;
  externalTrackingId?: string;
  processingCenter?: string;
  expectedApprovalDate?: string;
}

export type EventCategory = 'HOTEL' | 'TOUR' | 'TRANSFER' | 'FLIGHT' | 'VIP_ACCESS';
export type EventStatus =
  | 'PLANNING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface EventBooking {
  id: string;
  clientId: string;
  title: string;
  category: EventCategory;
  startDate: string;
  endDate: string;
  status: EventStatus;
  /** profiles.user_id of assigned staff */
  assignedStaffId?: string;
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

export type CashLogCurrency = Extract<Currency, 'ETB' | 'USD'>;
export type CashLogTransactionType = 'INCOME' | 'EXPENSE' | 'LOAN_REPAYMENT';

export interface CashLogEntry {
  id: string;
  amount: number;
  currency: CashLogCurrency;
  transactionType: CashLogTransactionType;
  accountSource: string;
  counterpartyName?: string;
  purpose?: string;
  linkedClientId?: string;
  recordedBy: string;
  description: string;
  quickTags: string[];
  isFormalAccountingReady: boolean;
  dueDate?: string;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt?: string;
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
