import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Search, Star } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, EventBooking, EventCategory } from '../../types';
import { GlassSelect } from '../ui/GlassSelect';
import type { StaffOption } from '../visa/NewVisaApplicationDrawer';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  staffOptions: StaffOption[];
  addEvent: (event: Omit<EventBooking, 'id'>) => Promise<EventBooking>;
};

const CATEGORY_OPTIONS: { value: EventCategory; label: string }[] = [
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'TOUR', label: 'Tour' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'FLIGHT', label: 'Flight' },
  { value: 'VIP_ACCESS', label: 'VIP Access' },
];

export const NewArrangementDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  clients,
  staffOptions,
  addEvent,
}) => {
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<EventCategory>('HOTEL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedStaffUserId, setAssignedStaffUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 2);
    setClientQuery('');
    setSelectedClientId('');
    setTitle('');
    setCategory('HOTEL');
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Select a client');
      return;
    }
    if (!title.trim()) {
      toast.error('Enter a title');
      return;
    }
    if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
      toast.error('Invalid date range');
      return;
    }

    setIsSubmitting(true);
    try {
      await addEvent({
        clientId: selectedClientId,
        title: title.trim(),
        category,
        startDate,
        endDate,
        status: 'PLANNING',
        assignedStaffId: assignedStaffUserId || undefined,
      });
      toast.success('Arrangement created');
      onClose();
    } catch (err) {
      toast.error('Could not create arrangement', {
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
                    <Star size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Arrangement</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Luxury booking for your client.</p>
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
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-white/30 bg-white/40">
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Lalibela Private Tour"
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <GlassSelect<EventCategory>
                    value={category}
                    onChange={setCategory}
                    options={CATEGORY_OPTIONS}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Start date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      End date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
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
                    {isSubmitting ? 'Saving…' : 'Create arrangement'}
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
