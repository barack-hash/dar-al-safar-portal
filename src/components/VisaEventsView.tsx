import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  MoreVertical,
  ChevronRight,
  MapPin,
  Hotel,
  Compass,
  Car,
  ShieldCheck,
  X,
  Star,
  Upload,
  Check,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useClientsContext, useAppContext } from '../contexts/AppContext';
import { VisaApplication, EventBooking, VisaStatus, EventCategory, EventStatus, VisaDocument, VisaDocumentStatus } from '../types';
import { toast } from 'sonner';
import { COUNTRIES } from '../constants/countries';

const VISA_STATUS_CONFIG: Record<VisaStatus, { label: string; progress: number; color: string; icon: LucideIcon }> = {
  'COLLECTING_DOCS': { label: 'Collecting Docs', progress: 20, color: 'bg-amber-500', icon: FileText },
  'APPOINTMENT_BOOKED': { label: 'Appointment', progress: 40, color: 'bg-blue-500', icon: Calendar },
  'PROCESSING': { label: 'Processing', progress: 70, color: 'bg-indigo-500', icon: Clock },
  'APPROVED': { label: 'Approved', progress: 100, color: 'bg-emerald-500', icon: CheckCircle2 },
  'REJECTED': { label: 'Rejected', progress: 100, color: 'bg-rose-500', icon: AlertCircle },
};

const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label: string; color: string; icon: LucideIcon }> = {
  'HOTEL': { label: 'Hotel', color: 'bg-emerald-100 text-emerald-700', icon: Hotel },
  'TOUR': { label: 'Tour', color: 'bg-amber-100 text-amber-700', icon: Compass },
  'TRANSFER': { label: 'Transfer', color: 'bg-slate-100 text-slate-700', icon: Car },
  'VIP_ACCESS': { label: 'VIP Access', color: 'bg-purple-100 text-purple-700', icon: ShieldCheck },
};

export const VisaEventsView: React.FC = () => {
  const [activeSubView, setActiveSubView] = useState<'visa' | 'concierge'>('visa');
  const { visas, events, clients, updateVisa, updateVisaStatus, updateEventStatus, addEvent, addVisa, updateVisaDocument, addClient } = useClientsContext();
  const { isAddVisaModalOpen, setIsAddVisaModalOpen } = useAppContext();
  const [isNewEventModalOpen, setIsNewEventModalOpen] = useState(false);
  const [visaSearch, setVisaSearch] = useState('');
  const [selectedVisaForManagement, setSelectedVisaForManagement] = useState<VisaApplication | null>(null);
  const [isQuickAddingClient, setIsQuickAddingClient] = useState(false);
  const [quickAddData, setQuickAddData] = useState({
    firstName: '',
    lastName: '',
    passportID: '',
    nationality: ''
  });
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newVisaData, setNewVisaData] = useState({
    destinationCountry: '',
    visaType: 'Schengen - Tourist',
    documentDeadline: '',
    passportRequired: false,
    pointOfEntry: 'Addis Ababa Bole International Airport',
    yellowFeverRequired: false,
    intendedEntryDate: '',
    countrySearch: ''
  });

  const highRiskZones = ['Brazil', 'Angola', 'Benin', 'Burkina Faso', 'Burundi', 'Cameroon', 'Central African Republic', 'Chad', 'Congo', 'Cote d\'Ivoire', 'Democratic Republic of the Congo', 'Equatorial Guinea', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 'Kenya', 'Liberia', 'Mali', 'Mauritania', 'Niger', 'Nigeria', 'Senegal', 'Sierra Leone', 'South Sudan', 'Sudan', 'Togo', 'Uganda'];

  useEffect(() => {
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      if (client && highRiskZones.includes(client.nationality)) {
        setNewVisaData(prev => ({ ...prev, yellowFeverRequired: true }));
      } else {
        setNewVisaData(prev => ({ ...prev, yellowFeverRequired: false }));
      }
    }
  }, [selectedClientId, clients]);

  useEffect(() => {
    if (!selectedVisaForManagement) return;
    const refreshedVisa = visas.find(v => v.id === selectedVisaForManagement.id) || null;
    setSelectedVisaForManagement(refreshedVisa);
  }, [visas, selectedVisaForManagement?.id]);

  const filteredVisas = useMemo(() => {
    const query = visaSearch.trim().toLowerCase();
    if (!query) return visas;

    return visas.filter((visa) => {
      const client = clients.find(c => c.id === visa.clientId);
      return (
        visa.destinationCountry.toLowerCase().includes(query) ||
        visa.visaType.toLowerCase().includes(query) ||
        (client?.name.toLowerCase().includes(query) ?? false) ||
        (client?.passportID.toLowerCase().includes(query) ?? false)
      );
    });
  }, [visaSearch, visas, clients]);

  const isDeadlineUrgent = (deadline: string) => {
    const now = new Date().getTime();
    const deadlineTime = new Date(deadline).getTime();
    return deadlineTime - now < 48 * 60 * 60 * 1000;
  };

  const hasMissingDocs = (visa: VisaApplication) => {
    return visa.documents.some(d => d.status === 'MISSING');
  };

  const handleUpload = (docId: string) => {
    if (!selectedVisaForManagement) return;
    updateVisaDocument(selectedVisaForManagement.id, docId, 'UPLOADED');
    setSelectedVisaForManagement(prev => {
      if (!prev) return null;
      return {
        ...prev,
        documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'UPLOADED' } : d)
      };
    });
    toast.success('Document uploaded successfully');
  };

  const handleVerify = (docId: string) => {
    if (!selectedVisaForManagement) return;
    const adminName = 'Amira Al-Farsi'; // Mock current admin
    const timestamp = new Date().toISOString();
    
    updateVisaDocument(selectedVisaForManagement.id, docId, 'VERIFIED', timestamp, adminName);
    setSelectedVisaForManagement(prev => {
      if (!prev) return null;
      return {
        ...prev,
        documents: prev.documents.map(d => d.id === docId ? { ...d, status: 'VERIFIED', verifiedAt: timestamp, verifiedBy: adminName } : d)
      };
    });
    toast.success('Document verified successfully');
  };

  const handleStatusChange = (newStatus: VisaStatus) => {
    if (!selectedVisaForManagement) return;
    
    if (newStatus === 'PROCESSING') {
      const allVerified = selectedVisaForManagement.documents.every(d => d.status === 'VERIFIED');
      if (!allVerified) {
        toast.error('Compliance Error', {
          description: 'Cannot submit to embassy. 100% of required documents must be VERIFIED.'
        });
        return;
      }
    }
    
    updateVisaStatus(selectedVisaForManagement.id, newStatus);
    setSelectedVisaForManagement(prev => prev ? { ...prev, status: newStatus } : null);
    toast.success(`Status updated to ${newStatus}`);
  };

  const handleAppointmentDateChange = (date: string) => {
    if (!selectedVisaForManagement) return;
    updateVisa(selectedVisaForManagement.id, { appointmentDate: date });
    setSelectedVisaForManagement(prev => prev ? { ...prev, appointmentDate: date } : null);
    toast.success('Appointment date updated');
  };

  const handleQuickAdd = () => {
    if (!quickAddData.firstName || !quickAddData.lastName || !quickAddData.passportID) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newClient = addClient({
      name: `${quickAddData.firstName} ${quickAddData.lastName}`,
      email: '', // Optional for quick add
      passportID: quickAddData.passportID,
      nationality: quickAddData.nationality,
      expiryDate: '', // Could be added later
      contact: '',
      source: 'Visa Walk-in',
      notes: ''
    });

    if (newClient && newClient.id) {
      setSelectedClientId(newClient.id);
      setIsQuickAddingClient(false);
      setQuickAddData({ firstName: '', lastName: '', passportID: '', nationality: '' });
      toast.success('Client added and selected.');
    }
  };

  const handleCreateArrangement = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.currentTarget);
      const startDate = String(formData.get('startDate') || '');
      const endDate = String(formData.get('endDate') || '');

      if (!startDate || !endDate || new Date(endDate) < new Date(startDate)) {
        toast.error('Invalid date range for arrangement.');
        return;
      }

      addEvent({
        clientId: String(formData.get('clientId') || ''),
        title: String(formData.get('title') || ''),
        category: String(formData.get('category') || 'HOTEL') as EventCategory,
        startDate,
        endDate,
        status: 'PLANNING'
      });
      toast.success('Arrangement created successfully.');
      setIsNewEventModalOpen(false);
    } catch (error) {
      toast.error('Failed to create arrangement. Please try again.');
    }
  };

  const handleCreateVisaApplication = () => {
    try {
      if (!selectedClientId) {
        toast.error('Please select a client');
        return;
      }
      if (!newVisaData.destinationCountry || !newVisaData.documentDeadline) {
        toast.error('Please fill in all required fields');
        return;
      }

      const generateChecklist = () => {
        const docs = [
          { id: 'd1', name: 'Recent Passport-size photo', status: 'MISSING' as VisaDocumentStatus },
          { id: 'd2', name: 'Passport Bio-page (valid >6 months)', status: 'MISSING' as VisaDocumentStatus }
        ];

        if (newVisaData.visaType.includes('(BRV)')) {
          docs.push(
            { id: 'd3', name: 'Support Letter from Sending Co', status: 'MISSING' as VisaDocumentStatus },
            { id: 'd4', name: 'Invitation Letter from Ethiopia', status: 'MISSING' as VisaDocumentStatus },
            { id: 'd5', name: 'Business License of Inviting Co', status: 'MISSING' as VisaDocumentStatus }
          );
        } else if (newVisaData.visaType.includes('(IV)')) {
          docs.push(
            { id: 'd3', name: 'Investment Permit', status: 'MISSING' as VisaDocumentStatus },
            { id: 'd4', name: 'Support Letter from Investment Commission', status: 'MISSING' as VisaDocumentStatus }
          );
        } else {
          docs.push({ id: 'd3', name: 'Bank Statement', status: 'MISSING' as VisaDocumentStatus });
        }

        if (newVisaData.yellowFeverRequired) {
          docs.push({ id: `d${docs.length + 1}`, name: 'Yellow Fever Certificate', status: 'MISSING' as VisaDocumentStatus });
        }

        return docs;
      };

      addVisa({
        clientId: selectedClientId,
        destinationCountry: newVisaData.destinationCountry,
        visaType: newVisaData.visaType,
        status: 'COLLECTING_DOCS',
        submissionDate: new Date().toISOString().split('T')[0],
        documentDeadline: newVisaData.documentDeadline,
        passportRequired: newVisaData.passportRequired,
        pointOfEntry: newVisaData.pointOfEntry,
        yellowFeverRequired: newVisaData.yellowFeverRequired,
        intendedEntryDate: newVisaData.intendedEntryDate,
        documents: generateChecklist()
      });

      toast.success('Visa application enrolled successfully');
      setIsAddVisaModalOpen(false);
      setNewVisaData({
        destinationCountry: '',
        visaType: 'Schengen - Tourist',
        documentDeadline: '',
        passportRequired: false,
        pointOfEntry: 'Addis Ababa Bole International Airport',
        yellowFeverRequired: false,
        intendedEntryDate: '',
        countrySearch: ''
      });
      setSelectedClientId('');
      setIsQuickAddingClient(false);
    } catch (error) {
      toast.error('Failed to enroll visa application. Please try again.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Concierge & Visa Desk</h2>
          <p className="text-slate-500 mt-1">Manage luxury arrangements and travel documentation.</p>
        </div>

        {/* Pill Toggle */}
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center shadow-inner relative w-fit">
          <motion.div
            className="absolute bg-white rounded-xl shadow-sm h-[calc(100%-12px)]"
            initial={false}
            animate={{
              x: activeSubView === 'visa' ? 0 : '100%',
              width: activeSubView === 'visa' ? '120px' : '180px'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            onClick={() => setActiveSubView('visa')}
            className={`relative z-10 px-6 py-2 text-sm font-bold transition-colors w-[120px] ${
              activeSubView === 'visa' ? 'text-active-green' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Visa Desk
          </button>
          <button
            onClick={() => setActiveSubView('concierge')}
            className={`relative z-10 px-6 py-2 text-sm font-bold transition-colors w-[180px] ${
              activeSubView === 'concierge' ? 'text-active-green' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Concierge & Events
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSubView === 'visa' ? (
          <motion.div
            key="visa"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-active-green/10 text-active-green rounded-xl">
                    <FileText size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Active Applications</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsAddVisaModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-active-green text-white rounded-xl font-bold text-sm shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                  >
                    <Plus size={16} />
                    New Application
                  </button>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search visas..."
                      value={visaSearch}
                      onChange={(e) => setVisaSearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                    <Filter size={20} />
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Client</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Destination & Type</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Deadline</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">Progress Status</th>
                      <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredVisas.map((visa) => {
                      const client = clients.find(c => c.id === visa.clientId);
                      const config = VISA_STATUS_CONFIG[visa.status];
                      const StatusIcon = config.icon;
                      const isUrgent = isDeadlineUrgent(visa.documentDeadline) && hasMissingDocs(visa);

                      return (
                        <tr key={visa.id} className={`hover:bg-slate-50/50 transition-colors group ${isUrgent ? 'animate-pulse bg-rose-50/30' : ''}`}>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                {client?.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{client?.name}</p>
                                <p className="text-xs text-slate-500">ID: {client?.passportID}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                              <MapPin size={14} className="text-active-gold" />
                              {visa.destinationCountry}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{visa.visaType}</p>
                          </td>
                          <td className="px-8 py-5">
                            <div className={`flex items-center gap-2 text-sm font-bold ${isUrgent ? 'text-rose-600' : 'text-slate-600'}`}>
                              <Clock size={14} />
                              {new Date(visa.documentDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            {isUrgent && <p className="text-[10px] font-black text-rose-500 uppercase tracking-tighter mt-1">Urgent Action</p>}
                          </td>
                          <td className="px-8 py-5">
                            <div className="space-y-2 max-w-[200px]">
                              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                <span className={config.color.replace('bg-', 'text-')}>{config.label}</span>
                                <span className="text-slate-400">{config.progress}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                  className={`h-full ${config.color}`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${config.progress}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedVisaForManagement(visa)}
                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                              >
                                Manage
                                <ChevronRight size={14} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                                <MoreVertical size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredVisas.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-10 text-center text-sm text-slate-500">
                          No visa applications match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="concierge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-active-gold/10 text-active-gold rounded-xl">
                  <Star size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Luxury Arrangements</h3>
              </div>
              <button 
                onClick={() => setIsNewEventModalOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-active-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all hover:-translate-y-0.5"
              >
                <Plus size={18} />
                New Arrangement
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => {
                const client = clients.find(c => c.id === event.clientId);
                const config = EVENT_CATEGORY_CONFIG[event.category];
                const CategoryIcon = config.icon;

                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className={`p-3 rounded-2xl ${config.color}`}>
                        <CategoryIcon size={24} />
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        event.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' : 
                        event.status === 'COMPLETED' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {event.status}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</p>
                        <p className="text-sm font-bold text-slate-900">{client?.name}</p>
                      </div>

                      <div>
                        <h4 className="text-lg font-bold text-slate-900 group-hover:text-active-green transition-colors">{event.title}</h4>
                        <div className="flex items-center gap-2 text-slate-500 text-xs mt-2">
                          <Calendar size={14} />
                          {new Date(event.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${config.color.split(' ')[1]}`}>
                          {config.label}
                        </span>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Arrangement Modal */}
      <AnimatePresence>
        {isNewEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewEventModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">New Arrangement</h3>
                  <p className="text-sm text-slate-500 mt-1">Create a bespoke luxury booking.</p>
                </div>
                <button 
                  onClick={() => setIsNewEventModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form className="p-8 space-y-6" onSubmit={handleCreateArrangement}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Client</label>
                    <select 
                      name="clientId"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                    >
                      <option value="">Select a client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Arrangement Title</label>
                    <input 
                      name="title"
                      type="text" 
                      required
                      placeholder="e.g. Private Desert Dinner"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Category</label>
                      <select 
                        name="category"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                      >
                        <option value="HOTEL">Hotel</option>
                        <option value="TOUR">Tour</option>
                        <option value="TRANSFER">Transfer</option>
                        <option value="VIP_ACCESS">VIP Access</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Start Date</label>
                      <input 
                        name="startDate"
                        type="date" 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">End Date</label>
                    <input 
                      name="endDate"
                      type="date" 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsNewEventModalOpen(false)}
                    className="flex-1 py-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-active-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                  >
                    Create Arrangement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* New Visa Application Modal */}
      <AnimatePresence>
        {isAddVisaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddVisaModalOpen(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight">New Visa Application</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Enroll a client for visa processing</p>
                </div>
                <button 
                  onClick={() => {
                    setIsAddVisaModalOpen(false);
                    setIsQuickAddingClient(false);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-8">
                  {/* Section 1: Client Info */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        1. Client Info (Who is traveling?)
                      </label>
                      <button 
                        onClick={() => setIsQuickAddingClient(!isQuickAddingClient)}
                        className="text-xs font-bold text-active-green hover:underline flex items-center gap-1"
                      >
                        {isQuickAddingClient ? (
                          <>
                            <ArrowRight className="rotate-180" size={14} />
                            Back to Selection
                          </>
                        ) : (
                          <>
                            <UserPlus size={14} />
                            Quick-Add New Client
                          </>
                        )}
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {isQuickAddingClient ? (
                        <motion.div
                          key="quick-add-form"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-4 p-6 bg-slate-50 rounded-[24px] border border-slate-200"
                        >
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="First Name" 
                              value={quickAddData.firstName}
                              onChange={(e) => setQuickAddData({...quickAddData, firstName: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-active-green/20"
                            />
                            <input 
                              type="text" 
                              placeholder="Last Name" 
                              value={quickAddData.lastName}
                              onChange={(e) => setQuickAddData({...quickAddData, lastName: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-active-green/20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <input 
                              type="text" 
                              placeholder="Passport Number" 
                              value={quickAddData.passportID}
                              onChange={(e) => setQuickAddData({...quickAddData, passportID: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-active-green/20"
                            />
                            <input 
                              type="text" 
                              placeholder="Nationality" 
                              value={quickAddData.nationality}
                              onChange={(e) => setQuickAddData({...quickAddData, nationality: e.target.value})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-active-green/20"
                            />
                          </div>
                          <button 
                            onClick={handleQuickAdd}
                            className="w-full py-3 bg-active-green text-white rounded-xl font-bold text-sm shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                          >
                            Save & Select Client
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="client-select"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <select 
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all outline-none"
                          >
                            <option value="">Search existing clients...</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.name} ({c.passportID})</option>
                            ))}
                          </select>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </section>

                  {/* Section 2: Travel Info */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Travel Info (Where and When?)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Destination Country</label>
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder="Search country..."
                            value={newVisaData.countrySearch}
                            onChange={(e) => setNewVisaData({ ...newVisaData, countrySearch: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                          />
                          {newVisaData.countrySearch && newVisaData.destinationCountry !== newVisaData.countrySearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-40 overflow-y-auto custom-scrollbar">
                              {COUNTRIES.filter(c => c.name.toLowerCase().includes(newVisaData.countrySearch.toLowerCase())).map(country => (
                                <button
                                  key={country.code}
                                  onClick={() => setNewVisaData({ ...newVisaData, destinationCountry: country.name, countrySearch: country.name })}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 transition-colors flex items-center justify-between"
                                >
                                  <span>{country.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">{country.code}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Visa Type</label>
                        <select 
                          value={newVisaData.visaType}
                          onChange={(e) => setNewVisaData({ ...newVisaData, visaType: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                        >
                          <option>Schengen - Tourist</option>
                          <option>Schengen - Business</option>
                          <option>UK Standard Visitor</option>
                          <option>USA B1/B2</option>
                          <option>Ethiopia - Business (BRV)</option>
                          <option>Ethiopia - Investment (IV)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Intended Entry Date</label>
                        <input 
                          type="date"
                          value={newVisaData.intendedEntryDate}
                          onChange={(e) => setNewVisaData({ ...newVisaData, intendedEntryDate: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Point of Entry</label>
                        <input 
                          type="text"
                          value={newVisaData.pointOfEntry}
                          onChange={(e) => setNewVisaData({ ...newVisaData, pointOfEntry: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Section 3: Submission Tracking */}
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">3. Submission Tracking (Embassy & Deadlines)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Document Deadline</label>
                        <input 
                          type="date" 
                          value={newVisaData.documentDeadline}
                          onChange={(e) => setNewVisaData({ ...newVisaData, documentDeadline: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20" 
                        />
                      </div>
                      <div className="flex flex-col justify-end gap-2">
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <input 
                            type="checkbox" 
                            id="passportReq" 
                            checked={newVisaData.passportRequired}
                            onChange={(e) => setNewVisaData({ ...newVisaData, passportRequired: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-active-green focus:ring-active-green" 
                          />
                          <label htmlFor="passportReq" className="text-xs font-medium text-slate-700">Physical Passport Required</label>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <input 
                            type="checkbox" 
                            id="yellowFever" 
                            checked={newVisaData.yellowFeverRequired}
                            onChange={(e) => setNewVisaData({ ...newVisaData, yellowFeverRequired: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-active-green focus:ring-active-green" 
                          />
                          <label htmlFor="yellowFever" className="text-xs font-medium text-slate-700">Yellow Fever Cert Required</label>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              <div className="p-8 bg-slate-50/50 border-t border-slate-100">
                <button 
                  onClick={handleCreateVisaApplication}
                  className="w-full py-4 bg-active-green text-white rounded-2xl font-bold text-sm shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all flex items-center justify-center gap-2"
                >
                  Enroll Application
                  <Check size={18} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manage Application / Document Vault Modal */}
      <AnimatePresence>
        {selectedVisaForManagement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVisaForManagement(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-white rounded-2xl">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Document Vault</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {clients.find(c => c.id === selectedVisaForManagement.clientId)?.name} • {selectedVisaForManagement.destinationCountry}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVisaForManagement(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Required Documents</h4>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedVisaForManagement.documents.filter(d => d.status === 'VERIFIED').length} / {selectedVisaForManagement.documents.length} Verified
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedVisaForManagement.documents.map((doc) => (
                        <div 
                          key={doc.id}
                          className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                            doc.status === 'VERIFIED' ? 'bg-emerald-50/50 border-emerald-100' : 
                            doc.status === 'UPLOADED' ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${
                              doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-600' : 
                              doc.status === 'UPLOADED' ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {doc.status === 'VERIFIED' ? <Check size={16} /> : <FileText size={16} />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                                  doc.status === 'VERIFIED' ? 'text-emerald-600' : 
                                  doc.status === 'UPLOADED' ? 'text-blue-600' : 'text-slate-400'
                                }`}>
                                  {doc.status}
                                </p>
                                {doc.status === 'VERIFIED' && doc.verifiedAt && (
                                  <span className="text-[9px] text-slate-400">
                                    • Verified by {doc.verifiedBy} on {new Date(doc.verifiedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {doc.status === 'MISSING' && (
                              <button 
                                onClick={() => handleUpload(doc.id)}
                                className="p-2 bg-white text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                                title="Upload Document"
                              >
                                <Upload size={16} />
                              </button>
                            )}
                            {doc.status === 'UPLOADED' && (
                              <button 
                                onClick={() => handleVerify(doc.id)}
                                className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                title="Verify Document"
                              >
                                <Check size={16} />
                              </button>
                            )}
                            {doc.status === 'VERIFIED' && (
                              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                                <Check size={16} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Application Management</h4>
                      <div className="p-6 bg-slate-50 rounded-[24px] border border-slate-100 space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Application Status</label>
                          <select 
                            value={selectedVisaForManagement.status}
                            onChange={(e) => handleStatusChange(e.target.value as VisaStatus)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                          >
                            {Object.entries(VISA_STATUS_CONFIG).map(([key, config]) => (
                              <option key={key} value={key as VisaStatus}>{config.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Embassy Appointment Date</label>
                          <input 
                            type="date" 
                            value={selectedVisaForManagement.appointmentDate || ''}
                            onChange={(e) => handleAppointmentDateChange(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-active-green/20 transition-all"
                          />
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                          <div className={`p-2 rounded-lg ${selectedVisaForManagement.appointmentDate ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            <Calendar size={16} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry Point</p>
                            <p className="text-xs font-bold text-slate-900">
                              {selectedVisaForManagement.pointOfEntry}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="text-amber-600 mt-0.5" size={18} />
                        <div>
                          <p className="text-sm font-bold text-amber-900">Submission Reminder</p>
                          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                            All documents must be verified and the physical passport collected at least 24 hours before the appointment date.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-end">
                  <button 
                    onClick={() => setSelectedVisaForManagement(null)}
                    className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                  >
                    Close Vault
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
