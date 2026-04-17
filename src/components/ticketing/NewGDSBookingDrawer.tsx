import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Search, Plane } from 'lucide-react';
import { toast } from 'sonner';
import type { BookingRecord, Client, Currency, FlightSegment } from '../../types';
import { GlassSelect } from '../ui/GlassSelect';
import type { StaffOption } from '../visa/NewVisaApplicationDrawer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  staffOptions: StaffOption[];
  createBooking: (booking: Omit<BookingRecord, 'id'>) => Promise<BookingRecord>;
};

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'USD', label: 'USD' },
  { value: 'SAR', label: 'SAR' },
  { value: 'ETB', label: 'ETB' },
];

export const NewGDSBookingDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  clients,
  staffOptions,
  createBooking,
}) => {
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [pnr, setPnr] = useState('');
  const [airlineCode, setAirlineCode] = useState('');
  const [originCode, setOriginCode] = useState('');
  const [destCode, setDestCode] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [timeToLimit, setTimeToLimit] = useState('');
  const [netFare, setNetFare] = useState(0);
  const [markupAmount, setMarkupAmount] = useState(0);
  const [taxes, setTaxes] = useState(0);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [assignedStaffUserId, setAssignedStaffUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const ttl = new Date();
    ttl.setHours(ttl.getHours() + 24);
    const dep = new Date();
    const arr = new Date();
    arr.setDate(arr.getDate() + 1);
    setClientQuery('');
    setSelectedClientId('');
    setPnr('');
    setAirlineCode('ET');
    setOriginCode('ADD');
    setDestCode('CDG');
    setDepartureDate(dep.toISOString().split('T')[0]);
    setArrivalDate(arr.toISOString().split('T')[0]);
    setTimeToLimit(ttl.toISOString().slice(0, 16));
    setNetFare(0);
    setMarkupAmount(0);
    setTaxes(0);
    setCurrency('USD');
    setAssignedStaffUserId('');
  }, [isOpen]);

  const filteredClients = React.useMemo(() => {
    const q = clientQuery.trim().toLowerCase();
    if (!q) return clients.slice(0, 50);
    return clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.passportID.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [clients, clientQuery]);

  const staffSelectOptions: { value: string; label: string }[] = [
    { value: '', label: 'Unassigned' },
    ...staffOptions.map((s) => ({ value: s.userId, label: s.name })),
  ];

  const itinerarySummary = `${originCode.trim().toUpperCase() || '?'} -> ${destCode.trim().toUpperCase() || '?'}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Select a client');
      return;
    }
    if (!pnr.trim()) {
      toast.error('Enter PNR');
      return;
    }
    if (!airlineCode.trim()) {
      toast.error('Enter airline code');
      return;
    }
    if (!departureDate || !arrivalDate || new Date(arrivalDate) < new Date(departureDate)) {
      toast.error('Invalid travel dates');
      return;
    }
    if (!timeToLimit) {
      toast.error('Set ticketing time limit');
      return;
    }

    const ttlIso = new Date(timeToLimit).toISOString();
    const depAt = `${departureDate}T12:00:00`;
    const arrAt = `${arrivalDate}T14:00:00`;
    const segment: FlightSegment = {
      id: crypto.randomUUID(),
      flightNumber: 'TBD',
      airline: airlineCode.trim().toUpperCase(),
      departure: { airportCode: originCode.trim().toUpperCase(), at: depAt },
      arrival: { airportCode: destCode.trim().toUpperCase(), at: arrAt },
      cabinClass: 'Economy',
    };
    const grossTotal = netFare + taxes + markupAmount;

    setIsSubmitting(true);
    try {
      await createBooking({
        clientId: selectedClientId,
        pnr: pnr.trim().toUpperCase(),
        airlineCode: airlineCode.trim().toUpperCase(),
        itinerarySummary,
        departureDate,
        arrivalDate,
        itinerary: [segment],
        status: 'ON_HOLD',
        ticketingTimeLimit: ttlIso,
        assignedStaffId: assignedStaffUserId || undefined,
        pricing: {
          netFare,
          taxes,
          markup: markupAmount,
          grossTotal,
          currency,
        },
      });
      toast.success('PNR saved');
      onClose();
    } catch (err) {
      toast.error('Could not create booking', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-slate-900/45 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[151] h-full w-full max-w-lg border-l border-white/25 shadow-2xl"
          >
            <div className="glass-panel h-full rounded-none border-0 flex flex-col">
              <div className="p-5 border-b border-white/20 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600">
                    <Plane size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">New GDS Booking</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Manual PNR / hold entry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="flex-1 overflow-y-auto p-5 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Find client
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="search"
                      value={clientQuery}
                      onChange={(e) => setClientQuery(e.target.value)}
                      placeholder="Search name, email, passport…"
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto rounded-xl border border-white/30 bg-white/40">
                    {filteredClients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedClientId(c.id)}
                        disabled={isSubmitting}
                        className={`w-full text-left px-3 py-2 text-sm border-b border-white/20 last:border-0 hover:bg-emerald-500/10 ${
                          selectedClientId === c.id ? 'bg-emerald-500/15 font-semibold' : ''
                        }`}
                      >
                        {c.name}
                        <span className="block text-[10px] text-slate-500">{c.passportID}</span>
                      </button>
                    ))}
                    {filteredClients.length === 0 && (
                      <p className="px-3 py-4 text-xs text-slate-500 text-center">No clients match.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      PNR
                    </label>
                    <input
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value.toUpperCase())}
                      placeholder="ETX78Q"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Airline code
                    </label>
                    <input
                      value={airlineCode}
                      onChange={(e) => setAirlineCode(e.target.value.toUpperCase())}
                      placeholder="ET"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      From
                    </label>
                    <input
                      value={originCode}
                      onChange={(e) => setOriginCode(e.target.value.toUpperCase())}
                      placeholder="ADD"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      To
                    </label>
                    <input
                      value={destCode}
                      onChange={(e) => setDestCode(e.target.value.toUpperCase())}
                      placeholder="CDG"
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <p className="text-[11px] font-medium text-slate-600 px-1">
                  Route: <span className="font-bold text-emerald-700">{itinerarySummary}</span>
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Departure date
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Arrival date
                    </label>
                    <input
                      type="date"
                      value={arrivalDate}
                      onChange={(e) => setArrivalDate(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Ticketing time limit (TTL)
                  </label>
                  <input
                    type="datetime-local"
                    value={timeToLimit}
                    onChange={(e) => setTimeToLimit(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Net
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={netFare || ''}
                      onChange={(e) => setNetFare(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Taxes
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={taxes || ''}
                      onChange={(e) => setTaxes(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Markup
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={markupAmount || ''}
                      onChange={(e) => setMarkupAmount(Number(e.target.value))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Currency
                  </label>
                  <GlassSelect<Currency>
                    value={currency}
                    onChange={setCurrency}
                    options={CURRENCY_OPTIONS}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Assign staff
                  </label>
                  <GlassSelect
                    value={assignedStaffUserId}
                    onChange={setAssignedStaffUserId}
                    options={staffSelectOptions}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl border border-white/40 bg-white/50 text-slate-700 text-sm font-semibold hover:bg-white/70 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Saving…' : 'Create PNR'}
                  </button>
                </div>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
