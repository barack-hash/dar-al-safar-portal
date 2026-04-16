import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Plane, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Plus,
  MoreHorizontal,
  ArrowRight,
  ShieldCheck,
  Calendar,
  X,
  ChevronRight,
  ChevronLeft,
  Trash2,
  User,
  Printer,
  FileText,
  MapPin,
  Briefcase
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useClientsContext, useUI } from '../contexts/AppContext';
import { BookingRecord, TicketStatus, FlightSegment, CabinClass, Currency } from '../types';
import { toast } from 'sonner';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewBookingModal: React.FC<NewBookingModalProps> = ({ isOpen, onClose }) => {
  const { clients, createBooking } = useClientsContext();
  const { currency } = useUI();
  const [step, setStep] = useState(1);
  
  const [formData, setFormData] = useState<{
    clientId: string;
    itinerary: FlightSegment[];
    pricing: {
      netFare: number;
      markup: number;
      currency: any;
    };
    ticketingTimeLimit: string;
  }>({
    clientId: '',
    itinerary: [{
      id: crypto.randomUUID(),
      flightNumber: '',
      airline: '',
      departure: { airportCode: '', at: '' },
      arrival: { airportCode: '', at: '' },
      cabinClass: 'Economy'
    }],
    pricing: {
      netFare: 0,
      markup: 10,
      currency: currency
    },
    ticketingTimeLimit: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const selectedClient = clients.find(c => c.id === formData.clientId);
  const grossTotal = formData.pricing.netFare * (1 + formData.pricing.markup / 100);

  const handleAddSegment = () => {
    setFormData(prev => ({
      ...prev,
      itinerary: [...prev.itinerary, {
        id: crypto.randomUUID(),
        flightNumber: '',
        airline: '',
        departure: { airportCode: '', at: '' },
        arrival: { airportCode: '', at: '' },
        cabinClass: 'Economy'
      }]
    }));
  };

  const handleRemoveSegment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itinerary: prev.itinerary.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSegment = (index: number, field: string, value: any) => {
    const newItinerary = [...formData.itinerary];
    const segment = { ...newItinerary[index] };
    
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      (segment as any)[parent] = { ...(segment as any)[parent], [child]: value };
    } else {
      (segment as any)[field] = value;
    }
    
    newItinerary[index] = segment;
    setFormData(prev => ({ ...prev, itinerary: newItinerary }));
  };

  const handleSave = () => {
    if (!formData.clientId) {
      toast.error('Please select a passenger');
      return;
    }
    if (formData.itinerary.some(s => !s.flightNumber || !s.departure.airportCode || !s.arrival.airportCode)) {
      toast.error('Please complete all flight segments');
      return;
    }

    const pnr = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    createBooking({
      pnr,
      clientId: formData.clientId,
      itinerary: formData.itinerary,
      status: 'ON_HOLD',
      ticketingTimeLimit: new Date(formData.ticketingTimeLimit).toISOString(),
      pricing: {
        netFare: formData.pricing.netFare,
        taxes: formData.pricing.netFare * 0.15, // Mock taxes
        markup: formData.pricing.netFare * (formData.pricing.markup / 100),
        grossTotal: grossTotal + (formData.pricing.netFare * 0.15),
        currency: formData.pricing.currency
      }
    });

    toast.success(`PNR ${pnr} created successfully`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]"
        >
          {/* Left Side: Data Entry */}
          <div className="flex-1 flex flex-col border-r border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">New GDS Booking</h3>
                <div className="flex items-center gap-2 mt-1">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all ${
                        step === i ? 'w-8 bg-active-green' : 'w-4 bg-slate-100'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {step === 1 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Passenger</label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        value={formData.clientId}
                        onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 appearance-none"
                      >
                        <option value="">Search clients...</option>
                        {clients.map(client => (
                          <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {selectedClient && (
                    <div className="p-6 bg-active-green/5 rounded-3xl border border-active-green/10 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-active-green text-white flex items-center justify-center font-bold text-lg">
                        {selectedClient.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{selectedClient.name}</p>
                        <p className="text-xs text-slate-500">{selectedClient.email}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  {formData.itinerary.map((segment, index) => (
                    <div key={segment.id} className="p-6 bg-slate-50 rounded-[2rem] relative group/segment">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Segment {index + 1}</h4>
                        {formData.itinerary.length > 1 && (
                          <button 
                            onClick={() => handleRemoveSegment(index)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Airline</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Ethiopian Airlines"
                            value={segment.airline}
                            onChange={(e) => handleUpdateSegment(index, 'airline', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flight No.</label>
                          <input 
                            type="text" 
                            placeholder="e.g. ET704"
                            value={segment.flightNumber}
                            onChange={(e) => handleUpdateSegment(index, 'flightNumber', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departure (Code)</label>
                          <input 
                            type="text" 
                            placeholder="ADD"
                            value={segment.departure.airportCode}
                            onChange={(e) => handleUpdateSegment(index, 'departure.airportCode', e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arrival (Code)</label>
                          <input 
                            type="text" 
                            placeholder="CDG"
                            value={segment.arrival.airportCode}
                            onChange={(e) => handleUpdateSegment(index, 'arrival.airportCode', e.target.value.toUpperCase())}
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departure Date/Time</label>
                          <input 
                            type="datetime-local" 
                            value={segment.departure.at}
                            onChange={(e) => handleUpdateSegment(index, 'departure.at', e.target.value)}
                            className="w-full px-4 py-3 bg-white border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={handleAddSegment}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2rem] text-slate-400 hover:border-active-green hover:text-active-green transition-all flex items-center justify-center gap-2 font-bold text-sm"
                  >
                    <Plus size={18} />
                    Add Flight Segment
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Fare (Cost)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                        <input 
                          type="number" 
                          value={formData.pricing.netFare}
                          onChange={(e) => setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, netFare: Number(e.target.value) } }))}
                          className="w-full pl-8 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DASA Markup (%)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={formData.pricing.markup}
                          onChange={(e) => setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, markup: Number(e.target.value) } }))}
                          className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20 text-right"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticketing Time Limit (TTL)</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date" 
                        value={formData.ticketingTimeLimit}
                        onChange={(e) => setFormData(prev => ({ ...prev, ticketingTimeLimit: e.target.value }))}
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-active-green/20"
                      />
                    </div>
                    {formData.ticketingTimeLimit === new Date().toISOString().split('T')[0] && (
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1 mt-2">
                        <AlertCircle size={12} />
                        Urgent: TTL set for today
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 flex items-center justify-between">
              <button 
                onClick={() => setStep(s => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex items-center gap-2 px-6 py-3 text-slate-500 font-bold hover:text-slate-900 transition-all disabled:opacity-0"
              >
                <ChevronLeft size={20} />
                Back
              </button>
              
              {step < 3 ? (
                <button 
                  onClick={() => setStep(s => Math.min(3, s + 1))}
                  className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                >
                  Continue
                  <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-2 px-10 py-3 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all active:scale-95"
                >
                  Create PNR
                  <CheckCircle2 size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Ticket Preview */}
          <div className="w-full md:w-[400px] bg-slate-900 p-8 flex flex-col">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Live GDS Preview</h4>
            
            <div className="flex-1 space-y-6">
              <div className="bg-white/5 rounded-3xl p-6 border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Passenger</p>
                    <p className="text-lg font-bold text-white mt-1">{selectedClient?.name || '---'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PNR Status</p>
                    <p className="text-xs font-bold text-amber-500 mt-1">HOLDING</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.itinerary.map((seg) => (
                    <div key={seg.id} className="flex items-center justify-between py-3 border-t border-white/5 first:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                          <Plane size={14} className="text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{seg.departure.airportCode || '---'} → {seg.arrival.airportCode || '---'}</p>
                          <p className="text-[10px] text-slate-500">{seg.airline || '---'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">{seg.flightNumber || '---'}</p>
                        <p className="text-[10px] text-slate-500">{seg.departure.at ? new Date(seg.departure.at).toLocaleDateString() : '---'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-active-green/10 rounded-3xl p-6 border border-active-green/20">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-slate-400">Net Fare</p>
                  <p className="text-sm font-bold text-white">${formData.pricing.netFare.toLocaleString()}</p>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-xs font-bold text-slate-400">Markup ({formData.pricing.markup}%)</p>
                  <p className="text-sm font-bold text-active-green">+${(formData.pricing.netFare * (formData.pricing.markup / 100)).toLocaleString()}</p>
                </div>
                <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                  <p className="text-sm font-bold text-white">Total Quote</p>
                  <p className="text-xl font-black text-active-green">${grossTotal.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
              <ShieldCheck size={20} className="text-active-green" />
              <p className="text-[10px] text-slate-400 leading-tight">
                Enterprise-grade encryption active. This booking will be held in the GDS queue until TTL expiration.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

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
                      <p className="font-bold text-slate-900 font-mono">ET-{(Math.random() * 1000000000000).toFixed(0)}</p>
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
  const { 
    bookings, 
    issueTicket, 
    cancelBooking, 
    ticketingStats,
    clients 
  } = useClientsContext();
  const { currency, convertForDisplay, isAddBookingModalOpen, setIsAddBookingModalOpen } = useUI();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<BookingRecord | null>(null);
  const [isETicketModalOpen, setIsETicketModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (activeDropdownId) {
        // We'll handle row dropdowns similarly or with a simple state reset
        // For simplicity, clicking anywhere else closes all dropdowns
        if (!(event.target as HTMLElement).closest('.row-dropdown-trigger')) {
          setActiveDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'TICKETED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'ON_HOLD': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'CANCELLED': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'REFUNDED': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
    }
  };

  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const getTimeRemaining = (ttl: string) => {
    const now = new Date();
    const expiry = new Date(ttl);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) return `${Math.floor(hours / 24)}d remaining`;
    return `${hours}h ${minutes}m remaining`;
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.pnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(b.clientId).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportTicketingCSV = () => {
    const headers = ['PNR', 'Client', 'Route', 'Status', 'Net Fare', 'Markup'];
    const rows = filteredBookings.map(b => [
      b.pnr,
      getClientName(b.clientId),
      `${b.itinerary[0]?.departure.airportCode} -> ${b.itinerary[b.itinerary.length - 1]?.arrival.airportCode}`,
      b.status,
      b.pricing.netFare,
      b.pricing.markup
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `ticketing_export_${new Date().toISOString().split('T')[0]}.csv`);
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
      color: 'text-amber-500', 
      bg: 'bg-amber-50' 
    },
    { 
      label: 'Tickets Issued (Month)', 
      value: ticketingStats.ticketsIssuedThisMonth, 
      icon: CheckCircle2, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-50' 
    },
    { 
      label: 'Expected Markup', 
      value: `${currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}${ticketingStats.expectedMarkup.toLocaleString()}`, 
      icon: ShieldCheck, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-50' 
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Ticketing Command Center</h2>
          <p className="text-slate-500 mt-1">Enterprise GDS Interface & PNR Management.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddBookingModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all active:scale-95"
          >
            <Plus size={20} />
            New GDS Booking
          </button>
        </div>
      </header>

      <NewBookingModal 
        isOpen={isAddBookingModalOpen} 
        onClose={() => setIsAddBookingModalOpen(false)} 
      />

      <ETicketModal 
        isOpen={isETicketModalOpen}
        onClose={() => setIsETicketModalOpen(false)}
        booking={selectedTicket}
        convertForDisplay={convertForDisplay}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl ${stat.bg} ${stat.color}`}>
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

      {/* PNR Management Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-slate-900">PNR Management</h3>
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search PNR or Client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all w-64"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                className={`p-2.5 rounded-xl transition-all ${isFilterMenuOpen ? 'bg-active-green text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
              >
                <Filter size={20} />
              </button>
              
              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                  >
                    {['ALL', 'TICKETED', 'ON_HOLD', 'CANCELLED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setStatusFilter(status as any);
                          setIsFilterMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                          statusFilter === status 
                            ? 'bg-active-green/10 text-active-green' 
                            : 'text-slate-600 hover:bg-slate-50'
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
              onClick={exportTicketingCSV}
              className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">PNR</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">TTL Countdown</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBookings.map((booking) => {
                const urgent = isToday(booking.ticketingTimeLimit) && booking.status === 'ON_HOLD';
                return (
                  <tr 
                    key={booking.id} 
                    className={`hover:bg-slate-50/30 transition-all group ${urgent ? 'pulse-red bg-rose-50/30' : ''} ${booking.status === 'CANCELLED' ? 'opacity-50 grayscale-[0.5]' : ''}`}
                  >
                    <td className="px-8 py-5">
                      <span className="text-sm font-black text-slate-900 font-mono tracking-wider">{booking.pnr}</span>
                    </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{getClientName(booking.clientId)}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Premium Member</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                      <span>{booking.itinerary[0]?.departure.airportCode}</span>
                      <ArrowRight size={14} className="text-slate-300" />
                      <span>{booking.itinerary[booking.itinerary.length - 1]?.arrival.airportCode}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={new Date(booking.ticketingTimeLimit) < new Date(Date.now() + 24*60*60*1000) ? 'text-rose-500' : 'text-slate-400'} />
                      <span className={`text-xs font-bold ${new Date(booking.ticketingTimeLimit) < new Date(Date.now() + 24*60*60*1000) ? 'text-rose-600' : 'text-slate-600'}`}>
                        {getTimeRemaining(booking.ticketingTimeLimit)}
                      </span>
                    </div>
                  </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 relative">
                          {booking.status === 'ON_HOLD' && (
                            <button 
                              onClick={() => issueTicket(booking.id)}
                              className="px-4 py-1.5 bg-active-green text-white text-xs font-bold rounded-lg hover:bg-active-green/90 transition-all"
                            >
                              Issue Ticket
                            </button>
                          )}
                          {booking.status === 'TICKETED' && (
                            <button 
                              onClick={() => {
                                setSelectedTicket(booking);
                                setIsETicketModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all"
                            >
                              <Printer size={14} />
                              E-Ticket
                            </button>
                          )}
                          
                          <div className="relative">
                            <button 
                              onClick={() => setActiveDropdownId(activeDropdownId === booking.id ? null : booking.id)}
                              className={`p-2 rounded-lg transition-all row-dropdown-trigger ${activeDropdownId === booking.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                            
                            <AnimatePresence>
                              {activeDropdownId === booking.id && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, x: 10 }}
                                  animate={{ opacity: 1, scale: 1, x: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, x: 10 }}
                                  className="absolute right-full mr-2 top-0 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50"
                                >
                                  {(booking.status === 'ON_HOLD' || booking.status === 'TICKETED') && (
                                    <button 
                                      onClick={() => {
                                        cancelBooking(booking.id);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-2"
                                    >
                                      <Trash2 size={14} />
                                      Cancel Booking
                                    </button>
                                  )}
                                  <button className="w-full text-left px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                                    <FileText size={14} />
                                    View Details
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </td>
                </tr>
              );
            })}
            {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Plane size={48} className="mb-4 opacity-10" />
                      <p className="text-sm font-medium">No active bookings found in GDS.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
