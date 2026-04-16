import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Command, 
  LayoutGrid, 
  Plane, 
  Users, 
  Wallet, 
  Star, 
  BarChart3, 
  Settings,
  UserPlus,
  ArrowRight,
  Ticket,
  FileText,
  ClipboardList,
  Contact,
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useUser } from '../contexts/UserContext';
import { Tab } from './Layout';

type SearchResult = {
  id: string;
  type: 'navigation' | 'client' | 'booking' | 'visa' | 'action';
  label: string;
  subLabel?: string;
  icon: any;
  action: () => void;
};

export const CommandPalette: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { 
    setCurrentTab, 
    openAddClientModal,
    setIsAddBookingModalOpen, 
    setIsAddVisaModalOpen,
    clients,
    bookings,
    visas
  } = useAppContext();
  const { hasPermission } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setSelectedIndex(0);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const navigationItems: SearchResult[] = useMemo(() => {
    const defs: { tab: Tab; id: string; label: string; icon: typeof LayoutGrid }[] = [
      { tab: 'dashboard', id: 'nav-dashboard', label: 'Dashboard', icon: LayoutGrid },
      { tab: 'ticketing', id: 'nav-ticketing', label: 'Ticketing & PNR', icon: Plane },
      { tab: 'clients', id: 'nav-clients', label: 'Client Portfolio', icon: Users },
      { tab: 'staff', id: 'nav-staff', label: 'Staff & Payroll', icon: Contact },
      { tab: 'accounting', id: 'nav-accounting', label: 'Accounting & Finance', icon: Wallet },
      { tab: 'cashlog', id: 'nav-cashlog', label: 'Cash Log', icon: ClipboardList },
      { tab: 'visa', id: 'nav-visa', label: 'Visa & Concierge', icon: Star },
      { tab: 'insights', id: 'nav-insights', label: 'Business Insights', icon: BarChart3 },
      { tab: 'settings', id: 'nav-settings', label: 'System Settings', icon: Settings },
    ];
    return defs
      .filter((d) => hasPermission(d.tab, 'view'))
      .map((d) => ({
        id: d.id,
        type: 'navigation' as const,
        label: d.label,
        icon: d.icon,
        action: () => setCurrentTab(d.tab),
      }));
  }, [hasPermission, setCurrentTab]);

  const quickActions: SearchResult[] = useMemo(
    () => [
      { id: 'act-client', type: 'action' as const, label: 'Add New Client', subLabel: 'Create a traveler profile', icon: UserPlus, action: () => openAddClientModal() },
      { id: 'act-booking', type: 'action' as const, label: 'New PNR Booking', subLabel: 'Create flight reservation', icon: Ticket, action: () => setIsAddBookingModalOpen(true) },
      { id: 'act-visa', type: 'action' as const, label: 'New Visa Application', subLabel: 'Start visa process', icon: FileText, action: () => setIsAddVisaModalOpen(true) },
    ],
    [openAddClientModal, setIsAddBookingModalOpen, setIsAddVisaModalOpen]
  );

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    let allResults: SearchResult[] = [];

    // 1. Navigation
    const filteredNav = navigationItems.filter(item => 
      item.label.toLowerCase().includes(q)
    );
    if (filteredNav.length > 0) allResults = [...allResults, ...filteredNav];

    // 2. Quick Actions
    const filteredActions = quickActions.filter(item => 
      item.label.toLowerCase().includes(q) || (q.length > 2 && 'new add create'.includes(q))
    );
    if (filteredActions.length > 0) allResults = [...allResults, ...filteredActions];

    // 3. Clients
    if (q.length > 1) {
      const filteredClients: SearchResult[] = clients
        .filter(c => c.name.toLowerCase().includes(q) || c.passportID.toLowerCase().includes(q))
        .slice(0, 5)
        .map(c => ({
          id: `client-${c.id}`,
          type: 'client',
          label: c.name,
          subLabel: `Passport: ${c.passportID} • ${c.nationality}`,
          icon: Users,
          action: () => {
            setCurrentTab('clients');
            // Logic to select client could go here
          }
        }));
      if (filteredClients.length > 0) allResults = [...allResults, ...filteredClients];
    }

    // 4. Bookings (PNR)
    if (q.length > 1) {
      const filteredBookings: SearchResult[] = bookings
        .filter(b => b.pnr.toLowerCase().includes(q))
        .slice(0, 5)
        .map(b => ({
          id: `booking-${b.id}`,
          type: 'booking',
          label: `PNR: ${b.pnr}`,
          subLabel: `${b.itinerary[0]?.airline} • ${b.status}`,
          icon: Plane,
          action: () => setCurrentTab('ticketing')
        }));
      if (filteredBookings.length > 0) allResults = [...allResults, ...filteredBookings];
    }

    // 5. Visas
    if (q.length > 1) {
      const filteredVisas: SearchResult[] = visas
        .filter(v => v.destinationCountry.toLowerCase().includes(q))
        .slice(0, 5)
        .map(v => ({
          id: `visa-${v.id}`,
          type: 'visa',
          label: `Visa: ${v.destinationCountry}`,
          subLabel: `${v.visaType} • ${v.status}`,
          icon: Star,
          action: () => setCurrentTab('visa')
        }));
      if (filteredVisas.length > 0) allResults = [...allResults, ...filteredVisas];
    }

    return allResults;
  }, [query, clients, bookings, visas, navigationItems, quickActions]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleAction(results[selectedIndex].action);
      }
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const selectedElement = resultsRef.current?.children[selectedIndex] as HTMLElement;
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setIsOpen(false)}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col"
          >
            <div className="p-8 border-b border-black/5 relative">
              <Search className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type to search clients, PNRs, or actions..."
                className="w-full pl-16 pr-4 py-4 bg-transparent border-none focus:ring-0 text-xl text-slate-900 placeholder:text-slate-400 font-medium"
              />
              <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200">
                <Command size={12} />
                <span>K</span>
              </div>
            </div>

            <div 
              ref={resultsRef}
              className="max-h-[60vh] overflow-y-auto p-4 space-y-1 custom-scrollbar"
            >
              {results.length > 0 ? (
                results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleAction(result.action)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      index === selectedIndex ? 'bg-active-green text-white shadow-lg shadow-active-green/20' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-xl transition-colors ${
                        index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-active-green'
                      }`}>
                        <result.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-black ${index === selectedIndex ? 'text-white' : 'text-slate-900'}`}>
                          {result.label}
                        </p>
                        {result.subLabel && (
                          <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                            index === selectedIndex ? 'text-white/70' : 'text-slate-400'
                          }`}>
                            {result.subLabel}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${
                        index === selectedIndex ? 'text-white/50 opacity-100' : 'text-slate-300 opacity-0 group-hover:opacity-100'
                      }`}>
                        {result.type === 'navigation' ? 'Jump to' : result.type === 'action' ? 'Execute' : 'View'}
                      </span>
                      <ArrowRight size={16} className={`transition-all ${
                        index === selectedIndex ? 'text-white translate-x-1' : 'text-slate-300 group-hover:text-active-green group-hover:translate-x-1'
                      }`} />
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                    <Search size={40} />
                  </div>
                  <p className="text-slate-400 text-sm font-bold">
                    {query ? `No results found for "${query}"` : "Start typing to search across Dar Al Safar..."}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-black/5 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="px-2 py-1 bg-white border border-black/5 rounded-lg shadow-sm">↑</span>
                    <span className="px-2 py-1 bg-white border border-black/5 rounded-lg shadow-sm">↓</span>
                  </div>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-white border border-black/5 rounded-lg shadow-sm">Enter</span>
                  <span>Select</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-white border border-black/5 rounded-lg shadow-sm">Esc</span>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
