import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Search, FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, VisaApplication, VisaDocument, VisaDocumentStatus } from '../../types';
import { COUNTRIES } from '../../constants/countries';
import { GlassSelect } from '../ui/GlassSelect';
import { computeExpectedApprovalDateAsync } from '../../lib/visaProcessingEta';

export type StaffOption = { userId: string; name: string };

type ProcessingCenter = '' | 'VFS' | 'TLS' | 'EMBASSY' | 'OTHER';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  staffOptions: StaffOption[];
  addVisa: (visa: Omit<VisaApplication, 'id'>) => Promise<VisaApplication>;
};

function buildDefaultDocuments(visaType: string, yellowFever: boolean): VisaDocument[] {
  const docs: VisaDocument[] = [
    { id: 'd1', name: 'Recent Passport-size photo', status: 'MISSING' as VisaDocumentStatus },
    { id: 'd2', name: 'Passport Bio-page (valid >6 months)', status: 'MISSING' as VisaDocumentStatus },
  ];
  if (visaType.includes('(BRV)')) {
    docs.push(
      { id: 'd3', name: 'Support Letter from Sending Co', status: 'MISSING' },
      { id: 'd4', name: 'Invitation Letter from Ethiopia', status: 'MISSING' },
      { id: 'd5', name: 'Business License of Inviting Co', status: 'MISSING' }
    );
  } else if (visaType.includes('(IV)')) {
    docs.push(
      { id: 'd3', name: 'Investment Permit', status: 'MISSING' },
      { id: 'd4', name: 'Support Letter from Investment Commission', status: 'MISSING' }
    );
  } else {
    docs.push({ id: 'd3', name: 'Bank Statement', status: 'MISSING' });
  }
  if (yellowFever) {
    docs.push({ id: `d${docs.length + 1}`, name: 'Yellow Fever Certificate', status: 'MISSING' });
  }
  return docs;
}

export const NewVisaApplicationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  clients,
  staffOptions,
  addVisa,
}) => {
  const [clientQuery, setClientQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [visaType, setVisaType] = useState('Schengen - Tourist');
  const [processingCenter, setProcessingCenter] = useState<ProcessingCenter>('');
  const [externalTrackingId, setExternalTrackingId] = useState('');
  const [assignedStaffUserId, setAssignedStaffUserId] = useState('');
  const [documentDeadline, setDocumentDeadline] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    setDocumentDeadline(d.toISOString().split('T')[0]);
    setClientQuery('');
    setSelectedClientId('');
    setDestinationCountry('');
    setVisaType('Schengen - Tourist');
    setProcessingCenter('');
    setExternalTrackingId('');
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

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const yellowFever =
    selectedClient &&
    [
      'Brazil',
      'Angola',
      'Ethiopia',
      'Kenya',
      'Nigeria',
      'Ghana',
      'Uganda',
      'United Republic of Tanzania',
    ].includes(selectedClient.nationality);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Select a client');
      return;
    }
    if (!destinationCountry.trim()) {
      toast.error('Select a destination');
      return;
    }
    if (!documentDeadline) {
      toast.error('Set a document deadline');
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionDate = new Date().toISOString().split('T')[0];
      const expectedApprovalDate = await computeExpectedApprovalDateAsync({
        submissionDate,
        destinationCountry: destinationCountry.trim(),
      });

      await addVisa({
        clientId: selectedClientId,
        destinationCountry: destinationCountry.trim(),
        visaType: visaType.trim(),
        status: 'GATHERING_DOCS',
        submissionDate,
        documentDeadline,
        passportRequired: true,
        pointOfEntry: 'Addis Ababa Bole International Airport',
        yellowFeverRequired: Boolean(yellowFever),
        documents: buildDefaultDocuments(visaType, Boolean(yellowFever)),
        assignedStaffId: assignedStaffUserId || undefined,
        externalTrackingId: externalTrackingId.trim() || undefined,
        processingCenter: processingCenter || undefined,
        expectedApprovalDate,
      });
      toast.success('Visa application created');
      onClose();
    } catch (err) {
      toast.error('Could not create application', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const countryOptions = COUNTRIES.map((c) => ({ value: c.name, label: c.name }));

  const staffSelectOptions: { value: string; label: string }[] = [
    { value: '', label: 'Unassigned' },
    ...staffOptions.map((s) => ({ value: s.userId, label: s.name })),
  ];

  const centerOptions: { value: ProcessingCenter; label: string }[] = [
    { value: '', label: 'Not specified' },
    { value: 'VFS', label: 'VFS' },
    { value: 'TLS', label: 'TLS' },
    { value: 'EMBASSY', label: 'Embassy' },
    { value: 'OTHER', label: 'Other' },
  ];

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
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">New Visa Application</h2>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Link CRM client, destination, and tracking.</p>
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
                    Destination
                  </label>
                  <GlassSelect
                    value={destinationCountry}
                    onChange={setDestinationCountry}
                    options={countryOptions}
                    placeholder="Select country"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Application type
                  </label>
                  <input
                    value={visaType}
                    onChange={(e) => setVisaType(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Document deadline
                  </label>
                  <input
                    type="date"
                    value={documentDeadline}
                    onChange={(e) => setDocumentDeadline(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Processing center
                  </label>
                  <GlassSelect<ProcessingCenter>
                    value={processingCenter}
                    onChange={setProcessingCenter}
                    options={centerOptions}
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    External tracking ID
                  </label>
                  <input
                    value={externalTrackingId}
                    onChange={(e) => setExternalTrackingId(e.target.value)}
                    placeholder="VFS / TLS reference (optional)"
                    disabled={isSubmitting}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                    {isSubmitting ? 'Saving…' : 'Create application'}
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
