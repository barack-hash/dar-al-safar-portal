import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext, useUI } from '../contexts/AppContext';
import { Currency } from '../types';
import { 
  LayoutGrid, 
  Plane, 
  Users, 
  Wallet, 
  Star, 
  BarChart3, 
  Settings,
  Search,
  Bell,
  ChevronDown,
  Menu,
  X,
  ClipboardList
} from 'lucide-react';

export type Tab = 'dashboard' | 'ticketing' | 'clients' | 'accounting' | 'staff' | 'visa' | 'insights' | 'cashlog' | 'settings';

interface SidebarProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOpen, onClose }) => {
  const navItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutGrid },
    { id: 'ticketing' as Tab, label: 'Ticketing', icon: Plane },
    { id: 'clients' as Tab, label: 'Clients', icon: Users },
    { id: 'staff' as Tab, label: 'Staff', icon: Users },
    { id: 'accounting' as Tab, label: 'Accounting', icon: Wallet },
    { id: 'cashlog' as Tab, label: 'Cash Log', icon: ClipboardList },
    { id: 'visa' as Tab, label: 'Visa/Events', icon: Star },
    { id: 'insights' as Tab, label: 'Insights', icon: BarChart3 },
    { id: 'settings' as Tab, label: 'Settings', icon: Settings },
  ];

  return (
    <motion.aside 
      initial={false}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-64 h-screen glass-sidebar flex flex-col fixed left-0 top-0 z-50 shadow-2xl"
    >
      <div className="p-8 mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-active-green tracking-tight">Dar Al Safar</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mt-1">Travel Concierge</p>
        </div>
        <button onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group ${
                isActive 
                  ? 'bg-white text-active-green shadow-sm' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`}
            >
              {isActive && <div className="active-indicator" />}
              <Icon size={20} className={isActive ? 'text-active-gold' : 'text-slate-400 group-hover:text-slate-600'} />
              <span className={`text-sm font-medium ${isActive ? 'text-slate-900' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-black/5">
        <div className="bg-white/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-active-green flex items-center justify-center text-white font-bold">
            D
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">DASA Admin</p>
            <p className="text-xs text-slate-500 truncate">Premium Account</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export const TopNav: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { searchQuery, setSearchQuery, currency, setCurrency } = useUI();

  const currencies: Currency[] = ['ETB', 'USD', 'SAR'];

  return (
    <header className="h-20 flex items-center justify-between px-4 md:px-8 bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
        
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, clients, or invoices..."
              className="w-full pl-12 pr-4 py-2.5 bg-slate-100/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {currencies.map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                currency === curr 
                  ? 'bg-white text-active-green shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        <button className="p-2 md:p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block" />

        <button className="flex items-center gap-3 pl-2 group">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-slate-200 transition-all overflow-hidden">
            <img 
              src="https://picsum.photos/seed/dasa/100/100" 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="text-left hidden lg:block">
            <p className="text-sm font-semibold text-slate-900">DASA Profile</p>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Manager</p>
          </div>
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-all hidden sm:block" />
        </button>
      </div>
    </header>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; currentTab: Tab; setTab: (tab: Tab) => void }> = ({ children, currentTab, setTab }) => {
  const { isSidebarOpen, toggleSidebar } = useUI();

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-x-hidden">
      <Sidebar 
        currentTab={currentTab} 
        setTab={setTab} 
        isOpen={isSidebarOpen}
        onClose={() => toggleSidebar(false)}
      />
      
      {/* Click-Outside Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => toggleSidebar(false)}
          />
        )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
        <TopNav onMenuClick={() => toggleSidebar()} />
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
