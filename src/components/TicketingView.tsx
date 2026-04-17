import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plane, 
  Clock, 
  CheckCircle2, 
  Search, 
  Filter, 
  Download, 
  Plus,
  MoreHorizontal,
  ArrowRight,
  ShieldCheck,
  X,
  Trash2,
  User,
  Printer,
  FileText,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useClientsContext, useUI } from '../contexts/AppContext';
import { BookingRecord, TicketStatus, FlightSegment, CabinClass, Currency } from '../types';
import { toast } from 'sonner';
import { getHoldUrgency, formatHoldCountdown } from '../lib/pnrHoldTtl';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { StaffOption } from './visa/NewVisaApplicationDrawer';
import { NewGDSBookingDrawer } from './ticketing/NewGDSBookingDrawer';

interface ETicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
  convertForDisplay: (amount: number, sourceCurrency: Currency) => number;
}

const ETicketModal: React.FC<ETicketModalProps> = ({ isOpen, onClose, booking, convertForDisplay }) => {
  const { clients } = useClientsContext();
  const { currency } = useUI();

  if (!isOpen || !booking) return null;

  const client = clients.find(c => c.id === booking.clientId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm no-print"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          id="eticket-modal"
          className="relative w-full max-w-4xl bg-white md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col h-full md:h-auto max-h-screen"
        >
          {/* Modal Header - Hidden on Print */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between no-print">
            <h3 className="text-lg font-bold text-slate-900">Electronic Ticket Itinerary</h3>
            <div className="flex items-center gap-3">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all active:scale-95"
              >
                <Printer size={18} />
                Print Document
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
          </div>

          {/* Ticket Content */}
          <div className="flex-1 overflow-y-auto p-8 md:p-12 bg-white">
            {/* Branding & Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 border-b-2 border-slate-900 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-active-green rounded-xl flex items-center justify-center">
                    <Plane className="text-white" size={28} />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Dar Al Safar</h1>
                    <p className="text-[10px] font-bold text-active-green uppercase tracking-[0.2em]">Travel & Tourism Agency</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-slate-500">
                  <p>Addis Ababa, Ethiopia</p>
                  <p>Bole International Airport, Terminal 2</p>
                  <p>support@daralsafar.com | +251 11 661 0000</p>
                </div>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-slate-900 mb-2">E-TICKET</h2>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">PNR: <span className="font-mono text-lg">{booking.pnr}</span></p>
                  <p className="text-xs text-slate-500">Issued Date: {new Date(booking.issuedAt || Date.now()).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-500">Status: <span className="text-emerald-600 font-bold">CONFIRMED</span></p>
                </div>
              </div>
            </div>

            {/* Passenger Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Passenger Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Passenger Name</p>
                      <p className="font-bold text-slate-900 uppercase">{client?.name || '---'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Ticket Number</p>
                      <p className="font-bold text-slate-900 font-mono">{booking.ticketNumber ?? '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Agency Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-active-green" />
                    <div>
                      <p className="text-xs text-slate-500">Issuing Agent</p>
                      <p className="font-bold text-slate-900">Dar Al Safar GDS Terminal</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={18} className="text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">IATA Code</p>
                      <p className="font-bold text-slate-900">71-2 1234 5</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Itinerary */}
            <div className="mb-12">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Flight Itinerary</h4>
              <div className="space-y-6">
                {booking.itinerary.map((segment) => (
                  <div key={segment.id} className="relative p-8 border-2 border-slate-100 rounded-3xl overflow-hidden">
                    <div className="absolute top-0 right-0 px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-2xl">
                      {segment.cabinClass}
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex-1 flex items-center gap-6">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                          <Plane size={32} className="text-slate-300" />
                        </div>
                        <div>
                          <p className="text-xl font-black text-slate-900">{segment.airline}</p>
                          <p className="text-sm font-bold text-slate-500">Flight {segment.flightNumber}</p>
                        </div>
                      </div>

                      <div className="flex-[2] flex items-center justify-between gap-4 w-full">
                        <div className="text-center md:text-left">
                          <h5 className="text-3xl font-black text-slate-900">{segment.departure.airportCode}</h5>
                          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Departure</p>
                          <p className="text-sm font-bold text-slate-900 mt-2">
                            {new Date(segment.departure.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(segment.departure.at).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex-1 flex flex-col items-center px-4">
                          <div className="w-full h-[2px] bg-slate-200 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center">
                              <Plane size={14} className="text-slate-400" />
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-4 tracking-widest">Non-Stop</p>
                        </div>

                        <div className="text-center md:text-right">
                          <h5 className="text-3xl font-black text-slate-900">{segment.arrival.airportCode}</h5>
                          <p className="text-xs font-bold text-slate-500 uppercase mt-1">Arrival</p>
                          <p className="text-sm font-bold text-slate-900 mt-2">
                            {new Date(segment.arrival.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(segment.arrival.at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-50 flex flex-wrap items-center gap-8">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-active-green" />
                        <span className="text-xs font-bold text-slate-700">Baggage Allowance: <span className="text-active-green">2PC</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-700">Check-in: 3 Hours Before</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer / Terms */}
            <div className="pt-8 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Important Information</h4>
                  <ul className="text-[10px] text-slate-500 space-y-2 list-disc pl-4">
                    <li>Please present this itinerary and your valid passport at the check-in counter.</li>
                    <li>For international flights, check-in closes 60 minutes before departure.</li>
                    <li>Ensure you have all necessary visas and health documents for your destination.</li>
                    <li>Tickets are non-transferable and subject to airline terms and conditions.</li>
                  </ul>
                </div>
                <div className="flex flex-col items-end justify-end">
                  <div className="text-right mb-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
                    <p className="text-2xl font-black text-slate-900">{currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}{convertForDisplay(booking.pricing.grossTotal, booking.pricing.currency).toLocaleString()}</p>
                  </div>
                  <div className="w-32 h-32 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200">
                    <p className="text-[8px] font-bold text-slate-400 text-center px-4 uppercase">GDS Verified QR Code Placeholder</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export const TicketingView: React.FC = () => {
  const { bookings, issueTicket, cancelBooking, ticketingStats, clients, createBooking } = useClientsContext();
  const {
    currency,
    convertForDisplay,
    isAddBookingModalOpen,
    setIsAddBookingModalOpen,
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
  } = useUI();
  const [selectedTicket, setSelectedTicket] = useState<BookingRecord | null>(null);
  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [tickNow, setTickNow] = useState(() => new Date());
  const [issueForBooking, setIssueForBooking] = useState<BookingRecord | null>(null);
  const [issueTicketNumber, setIssueTicketNumber] = useState('');
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setTickNow(new Date()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStaffOptions([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const sb = getSupabase();
        const { data, error } = await sb.from('profiles').select('user_id, full_name, email');
        if (error) throw error;
        if (cancelled || !data) return;
        const opts: StaffOption[] = [];
        for (const row of data as { user_id: string | null; full_name: string | null; email: string }[]) {
          if (!row.user_id) continue;
          opts.push({
            userId: row.user_id,
            name: (row.full_name?.trim() || row.email || 'Staff').trim(),
          });
        }
        opts.sort((a, b) => a.name.localeCompare(b.name));
        setStaffOptions(opts);
      } catch {
        if (!cancelled) setStaffOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (activeDropdownId) {
        if (!(event.target as HTMLElement).closest('.row-dropdown-trigger')) {
          setActiveDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  const getClientName = (clientId: string) => {
    return clients.find((c) => c.id === clientId)?.name || 'Unknown Client';
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'TICKETED':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'ON_HOLD':
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'VOIDED':
        return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default:
        return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const q = debouncedSearchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.pnr.toLowerCase().includes(q) ||
      b.airlineCode.toLowerCase().includes(q) ||
      getClientName(b.clientId).toLowerCase().includes(q) ||
      b.itinerarySummary.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportTicketingCSV = () => {
    const headers = ['PNR', 'Client', 'Route', 'Status', 'Net Fare', 'Markup'];
    const rows = filteredBookings.map((b) => [
      b.pnr,
      getClientName(b.clientId),
      b.itinerarySummary ||
      `${b.itinerary[0]?.departure.airportCode} -> ${b.itinerary[b.itinerary.length - 1]?.arrival.airportCode}`,
      b.status,
      b.pricing.netFare,
      b.pricing.markup,
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ticketing_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export Successful', { description: 'CSV file has been downloaded.' });
  };

  const stats = [
    { 
      label: 'Active Holds', 
      value: ticketingStats.activeHolds, 
      icon: Clock, 
      accent: 'text-amber-600',
      iconBg: 'bg-amber-500/15',
    },
    { 
      label: 'Tickets Issued (Month)', 
      value: ticketingStats.ticketsIssuedThisMonth, 
      icon: CheckCircle2, 
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-500/15',
    },
    { 
      label: 'Expected Markup', 
      value: `${currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}${ticketingStats.expectedMarkup.toLocaleString()}`, 
      icon: ShieldCheck, 
      accent: 'text-emerald-600',
      iconBg: 'bg-emerald-500/15',
    },
  ];

  const confirmIssueTicket = async () => {
    if (!issueForBooking) return;
    const num = issueTicketNumber.trim();
    if (!num) {
      toast.error('Enter the ticket number');
      return;
    }
    await issueTicket(issueForBooking.id, { ticketNumber: num });
    setIssueForBooking(null);
    setIssueTicketNumber('');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ticketing Command Center</h2>
          <p className="text-slate-500 mt-1">Enterprise GDS Interface & PNR Management.</p>
        </div>
        <div className="flex gap-3">
          <button 
            type="button"
            onClick={() => setIsAddBookingModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 transition-all active:scale-95"
          >
            <Plus size={20} />
            New GDS Booking
          </button>
        </div>
      </header>

      <NewGDSBookingDrawer
        isOpen={isAddBookingModalOpen} 
        onClose={() => setIsAddBookingModalOpen(false)} 
        clients={clients}
        staffOptions={staffOptions}
        createBooking={createBooking}
      />

      <ETicketModal 
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        booking={selectedTicket}
        convertForDisplay={convertForDisplay}
      />

      <AnimatePresence>
        {issueForBooking && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
              onClick={() => {
                setIssueForBooking(null);
                setIssueTicketNumber('');
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative glass-panel max-w-md w-full p-6 rounded-2xl border border-white/25 shadow-2xl"
            >
              <h3 className="text-lg font-bold text-slate-900">Issue ticket</h3>
              <p className="text-sm text-slate-500 mt-1">
                PNR <span className="font-mono font-bold text-slate-800">{issueForBooking.pnr}</span> — enter the airline ticket number.
              </p>
              <input
                autoFocus
                value={issueTicketNumber}
                onChange={(e) => setIssueTicketNumber(e.target.value)}
                placeholder="e.g. 071-1234567890"
                className="mt-4 w-full px-4 py-3 rounded-xl border border-white/40 bg-white/70 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIssueForBooking(null);
                    setIssueTicketNumber('');
                  }}
                  className="flex-1 py-3 rounded-xl border border-white/40 text-slate-700 text-sm font-semibold hover:bg-white/50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmIssueTicket()}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600"
                >
                  Confirm issue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-panel p-6 rounded-[2rem] border border-white/25 shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.iconBg} ${stat.accent}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel rounded-[2.5rem] border border-white/25 shadow-xl overflow-hidden">
        <div className="p-6 md:p-8 border-b border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">PNR Management</h3>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search PNR, client, route…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-2.5 glass-panel border border-white/25 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/25 transition-all w-64"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <button 
                type="button"
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`p-2.5 rounded-xl transition-all glass-panel border border-white/25 ${
                  isFilterMenuOpen ? 'ring-2 ring-emerald-500/40 text-emerald-700' : 'text-slate-600'
                }`}
              >
                <Filter size={20} />
              </button>
              
              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl border border-white/25 p-2 z-50 shadow-xl"
                  >
                    {(['ALL', 'TICKETED', 'ON_HOLD', 'VOIDED', 'CANCELLED'] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStatusFilter(status);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          statusFilter === status 
                            ? 'bg-emerald-500/15 text-emerald-700'
                            : 'text-slate-600 hover:bg-white/40'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button 
              type="button"
              onClick={exportTicketingCSV}
              className="p-2.5 glass-panel border border-white/25 text-slate-600 rounded-xl hover:bg-white/30 transition-all"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8">
          {filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-slate-400 py-16">
              <Plane size={48} className="mb-4 opacity-20 text-emerald-600" />
              <p className="text-sm font-medium">No bookings match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredBookings.map((booking) => {
                const urgency = getHoldUrgency(booking.ticketingTimeLimit, tickNow, booking.status);
                const isCritical = booking.status === 'ON_HOLD' && urgency.level === 'critical';
                const countdownLabel = formatHoldCountdown(urgency.remainingMs);

                return (
                  <motion.div
                    key={booking.id} 
                    layout
                    className={`glass-panel rounded-2xl border p-5 flex flex-col gap-4 transition-shadow ${
                      booking.status === 'CANCELLED' ? 'opacity-60 grayscale-[0.3]' : ''
                    } ${
                      isCritical
                        ? 'border-rose-500/50 shadow-[0_0_24px_-4px_rgba(244,63,94,0.55)] animate-pulse'
                        : 'border-white/25 shadow-lg'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PNR</p>
                        <p className="text-lg font-black text-slate-900 font-mono tracking-wide">{booking.pnr}</p>
                        <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                          {booking.airlineCode} · {booking.itinerarySummary}
                        </p>
                    </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(booking.status)}`}
                      >
                        {booking.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <span>{getClientName(booking.clientId)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ArrowRight size={14} className="text-emerald-500 shrink-0" />
                      <span className="font-semibold">
                        {booking.itinerary[0]?.departure.airportCode} →{' '}
                        {booking.itinerary[booking.itinerary.length - 1]?.arrival.airportCode}
                    </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock
                        size={16}
                        className={
                          isCritical || urgency.level === 'expired' ? 'text-rose-500' : 'text-slate-400'
                        }
                      />
                      <span
                        className={`text-xs font-bold ${
                          isCritical || urgency.level === 'expired' ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        TTL: {countdownLabel}
                      </span>
                      {isCritical && (
                        <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-500/15 px-2 py-0.5 rounded-md">
                          Critical
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/20">
                          {booking.status === 'ON_HOLD' && (
                            <button 
                          type="button"
                          onClick={() => {
                            setIssueForBooking(booking);
                            setIssueTicketNumber('');
                          }}
                          className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-500/35 hover:bg-emerald-600 transition-all order-first"
                            >
                              Issue Ticket
                            </button>
                          )}
                          {booking.status === 'TICKETED' && (
                            <button 
                          type="button"
                              onClick={() => {
                                setSelectedTicket(booking);
                                setIsETicketModalOpen(true);
                              }}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all"
                            >
                              <Printer size={14} />
                              E-Ticket
                            </button>
                          )}
                      <div className="relative ml-auto">
                            <button 
                          type="button"
                              onClick={() => setActiveDropdownId(activeDropdownId === booking.id ? null : booking.id)}
                          className={`p-2 rounded-xl transition-all row-dropdown-trigger glass-panel border border-white/20 ${
                            activeDropdownId === booking.id ? 'text-slate-900' : 'text-slate-400'
                          }`}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            <AnimatePresence>
                              {activeDropdownId === booking.id && (
                                <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 10 }}
                              className="absolute right-0 mt-2 w-48 glass-panel rounded-2xl border border-white/25 p-2 z-50 shadow-xl"
                                >
                                  {(booking.status === 'ON_HOLD' || booking.status === 'TICKETED') && (
                                    <button 
                                  type="button"
                                      onClick={() => {
                                    void cancelBooking(booking.id);
                                        setActiveDropdownId(null);
                                      }}
                                  className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                                    >
                                      <Trash2 size={14} />
                                      Cancel Booking
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                  </motion.div>
              );
            })}
                    </div>
              )}
        </div>
      </div>
    </div>
  );
};
