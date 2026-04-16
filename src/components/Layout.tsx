import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUI, useClientsContext } from '../contexts/AppContext';
import { useUser } from '../contexts/UserContext';
import { Currency, type AppSectionId } from '../types';
import { toast } from 'sonner';
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
  ClipboardList,
  User,
  LogOut,
  CircleDollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const SEEN_ACTIVITY_KEY = 'dasa_activity_seen';

function currencyButtonLabel(c: Currency): string {
  const sym = c === 'ETB' ? 'Br' : c === 'SAR' ? 'SR' : '$';
  return `${sym} ${c}`;
}

type ActivityRow = {
  id: string;
  priority: 'high' | 'normal';
  title: string;
  subtitle: string;
  tab?: AppSectionId;
};

export type Tab = AppSectionId;

interface SidebarProps {
  currentTab: Tab;
  setTab: (tab: Tab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab, isOpen, onClose }) => {
  const { hasPermission, currentUser, effectiveAccessRole, roleLabel } = useUser();
  const navItems = useMemo(
    () =>
      [
        { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutGrid },
        { id: 'ticketing' as Tab, label: 'Ticketing', icon: Plane },
        { id: 'clients' as Tab, label: 'Clients', icon: Users },
        { id: 'staff' as Tab, label: 'Staff', icon: Users },
        { id: 'accounting' as Tab, label: 'Accounting', icon: Wallet },
        { id: 'cashlog' as Tab, label: 'Cash Log', icon: ClipboardList },
        { id: 'visa' as Tab, label: 'Visa/Events', icon: Star },
        { id: 'insights' as Tab, label: 'Insights', icon: BarChart3 },
        { id: 'settings' as Tab, label: 'Settings', icon: Settings },
      ].filter(
        (item) =>
          effectiveAccessRole === 'SUPERADMIN' ||
          hasPermission(item.id, 'view')
      ),
    [hasPermission, effectiveAccessRole]
  );

  return (
    <motion.aside 
      initial={false}
      animate={{ x: isOpen ? 0 : '-100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-56 h-screen glass-sidebar flex flex-col fixed left-0 top-0 z-50 shadow-2xl"
    >
      <div className="px-5 pt-7 pb-5 mb-1 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Dar Al <span className="text-emerald-500">Safar</span>
          </h1>
          <p className="text-[9px] uppercase tracking-[0.28em] text-slate-500 font-semibold mt-1.5">Concierge</p>
        </div>
        <button type="button" onClick={onClose} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 interactive-tap rounded-lg">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-xl transition-all duration-300 relative group interactive-tap ${
                isActive 
                  ? 'glass-panel text-emerald-700 shadow-md border-emerald-200/40' 
                  : 'text-slate-600 hover:bg-white/45 hover:text-slate-900 border border-transparent'
              }`}
            >
              {isActive && <div className="active-indicator" />}
              <Icon size={17} strokeWidth={2} className={isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'} />
              <span className={`text-[13px] font-semibold tracking-tight ${isActive ? 'text-slate-900' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/20">
        <div className="glass-panel rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0 ring-2 ring-white/60">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              currentUser.name.charAt(0)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 truncate">{roleLabel}</p>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export const TopNav: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { searchQuery, setSearchQuery, currency, setCurrency, setCurrentTab } = useUI();
  const { visas, clients, expiringHolds } = useClientsContext();
  const { currentUser, roleLabel, logout } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [seenActivityIds, setSeenActivityIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(SEEN_ACTIVITY_KEY) || '[]') as string[];
    } catch {
      return [];
    }
  });

  const profileRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const currencies: Currency[] = ['USD', 'ETB', 'SAR'];

  const recentActivity = useMemo((): ActivityRow[] => {
    const now = Date.now();
    const rows: ActivityRow[] = [];
    const push = (r: ActivityRow) => {
      if (!rows.some((x) => x.id === r.id)) rows.push(r);
    };

    for (const visa of visas) {
      if (visa.status === 'APPROVED' || visa.status === 'REJECTED') continue;
      const client = clients.find((c) => c.id === visa.clientId);
      const name = client?.name ?? 'Client';
      const deadline = new Date(visa.documentDeadline).getTime();
      const hoursLeft = (deadline - now) / (1000 * 60 * 60);
      const isUrgent = deadline >= now && hoursLeft <= 48 && hoursLeft > 0;
      if (isUrgent) {
        push({
          id: `visa-${visa.id}`,
          priority: 'high',
          title: `High priority: deadline in ${Math.max(1, Math.ceil(hoursLeft))}h`,
          subtitle: `${visa.visaType} · ${visa.destinationCountry} · ${name}`,
          tab: 'visa',
        });
      } else {
        push({
          id: `visa-${visa.id}`,
          priority: 'normal',
          title: `New visa application for ${name}`,
          subtitle: `${visa.destinationCountry} — ${visa.status.replace(/_/g, ' ')}`,
          tab: 'visa',
        });
      }
    }

    for (const hold of expiringHolds) {
      const ttl = new Date(hold.ticketingTimeLimit).getTime();
      const hLeft = (ttl - now) / (1000 * 60 * 60);
      if (hLeft > 0 && hLeft <= 24) {
        const client = clients.find((c) => c.id === hold.clientId);
        push({
          id: `hold-${hold.id}`,
          priority: 'high',
          title: `PNR ${hold.pnr}: hold expiring in ${Math.max(1, Math.ceil(hLeft))}h`,
          subtitle: client?.name ?? 'Ticketing desk',
          tab: 'ticketing',
        });
      }
    }

    rows.sort((a, b) => (a.priority === 'high' ? 0 : 1) - (b.priority === 'high' ? 0 : 1));
    return rows.slice(0, 12);
  }, [visas, clients, expiringHolds]);

  const hasUnreadPriority = useMemo(() => {
    const highIds = recentActivity.filter((a) => a.priority === 'high').map((a) => a.id);
    return highIds.some((id) => !seenActivityIds.includes(id));
  }, [recentActivity, seenActivityIds]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const t = e.target as Node;
      if (currencyRef.current && !currencyRef.current.contains(t)) setCurrencyOpen(false);
      if (notifRef.current && !notifRef.current.contains(t)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    if (!notifOpen) return;
    const highIds = recentActivity.filter((a) => a.priority === 'high').map((a) => a.id);
    if (highIds.length === 0) return;
    setSeenActivityIds((prev) => {
      const next = [...new Set([...prev, ...highIds])];
      try {
        localStorage.setItem(SEEN_ACTIVITY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, [notifOpen, recentActivity]);

  return (
    <header className="h-[4.5rem] flex items-center justify-between px-4 md:px-8 glass-panel border-b border-white/25 sticky top-0 z-40 rounded-b-2xl mx-2 md:mx-4 mt-2 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button 
          type="button"
          onClick={onMenuClick}
          className="p-2.5 text-slate-600 hover:bg-white/50 rounded-xl interactive-tap shrink-0"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookings, clients, or invoices..."
              className="w-full pl-11 pr-4 py-2.5 glass-panel border-white/30 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/25 transition-all duration-300 shadow-sm backdrop-blur-md"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        <div className="relative" ref={currencyRef}>
          <button
            type="button"
            onClick={() => {
              setCurrencyOpen((o) => !o);
              setNotifOpen(false);
            }}
            aria-expanded={currencyOpen}
            aria-haspopup="listbox"
            className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-2xl bg-white/70 backdrop-blur-md border border-white/20 shadow-md text-sm font-semibold text-slate-800 hover:bg-white/85 transition-all duration-300 interactive-tap min-w-[7.5rem]"
          >
            <CircleDollarSign size={18} className="text-emerald-600 shrink-0" />
            <span className="truncate">{currencyButtonLabel(currency)}</span>
            <ChevronDown size={15} className={`text-slate-400 shrink-0 transition-transform ${currencyOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {currencyOpen && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                role="listbox"
                className="absolute right-0 top-full mt-2 min-w-[11rem] z-[70] py-1 bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl overflow-hidden"
              >
                {currencies.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c === currency}
                      onClick={() => {
                        setCurrency(c);
                        setCurrencyOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                        c === currency ? 'bg-emerald-500/15 text-emerald-800' : 'text-slate-800 hover:bg-emerald-500/10'
                      }`}
                    >
                      {currencyButtonLabel(c)}
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setCurrencyOpen(false);
            }}
            aria-expanded={notifOpen}
            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-white/50 rounded-2xl interactive-tap relative border border-white/15 bg-white/40 backdrop-blur-md transition-all duration-300"
          >
            <Bell size={19} />
            {hasUnreadPriority && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white/90" aria-hidden />
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.99 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] max-h-[min(24rem,70vh)] overflow-hidden flex flex-col z-[70] bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl"
              >
                <div className="px-4 py-3 border-b border-white/25 shrink-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Recent activity</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">Priority items match your dashboard signals.</p>
                </div>
                <div className="overflow-y-auto py-2 flex-1">
                  {recentActivity.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-slate-500 font-medium">No recent activity to show.</p>
                  ) : (
                    recentActivity.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (item.tab) setCurrentTab(item.tab);
                          setNotifOpen(false);
                        }}
                        className="flex w-full gap-3 px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors border-b border-white/10 last:border-0"
                      >
                        <div
                          className={`mt-0.5 shrink-0 p-2 rounded-xl ${
                            item.priority === 'high' ? 'bg-amber-500/15 text-amber-700' : 'bg-slate-100/80 text-slate-600'
                          }`}
                        >
                          {item.priority === 'high' ? <AlertTriangle size={16} /> : <FileText size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold leading-snug ${item.priority === 'high' ? 'text-amber-900' : 'text-slate-900'}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.subtitle}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-7 w-px bg-slate-200/80 hidden sm:block" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 md:gap-3 pl-1 pr-2 py-1.5 rounded-2xl hover:bg-white/35 transition-all duration-300 interactive-tap border border-transparent hover:border-white/25"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl ring-2 ring-white/50 overflow-hidden shadow-md">
              <img 
                src={currentUser.avatar || 'https://picsum.photos/seed/dasa/100/100'} 
                alt="" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left hidden lg:block min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate max-w-[120px]">{currentUser.name}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{roleLabel}</p>
            </div>
            <ChevronDown size={16} className={`text-slate-400 hidden sm:block transition-transform duration-300 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 glass-panel rounded-2xl py-1 shadow-2xl z-[70] border-white/30 overflow-hidden backdrop-blur-md"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-emerald-500/10 transition-colors"
                  onClick={() => {
                    setProfileOpen(false);
                    toast.message('Profile', { description: 'Personal profile preferences will open here in a future release.' });
                  }}
                >
                  <User size={17} className="text-slate-500" />
                  My Profile
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:bg-emerald-500/10 transition-colors"
                  onClick={() => {
                    setProfileOpen(false);
                    setCurrentTab('settings');
                  }}
                >
                  <Settings size={17} className="text-slate-500" />
                  Settings
                </button>
                <div className="my-1 h-px bg-white/30 mx-2" />
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-rose-700 hover:bg-rose-500/10 transition-colors"
                  onClick={() => {
                    setProfileOpen(false);
                    void logout().then(() => {
                      toast.success('Signed out');
                    });
                  }}
                >
                  <LogOut size={17} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export const Layout: React.FC<{ children: React.ReactNode; currentTab: Tab; setTab: (tab: Tab) => void }> = ({ children, currentTab, setTab }) => {
  const { isSidebarOpen, toggleSidebar } = useUI();

  return (
    <div className="min-h-screen flex overflow-x-hidden bg-[var(--app-shell-bg,#f9fafb)]">
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

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-56' : 'lg:ml-0'}`}>
        <TopNav onMenuClick={() => toggleSidebar()} />
        <main className="p-4 md:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
