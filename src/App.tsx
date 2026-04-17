import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext, useUI, useClientsContext } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { LoginView } from './components/LoginView';
import { ForgotPasswordView } from './components/ForgotPasswordView';
import { UpdatePasswordModal } from './components/UpdatePasswordModal';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { PRIMARY_TAB_ORDER } from './lib/appSettings';
import { Layout, Tab } from './components/Layout';
import { ClientPortfolio } from './components/ClientPortfolio';
import { InsightsView } from './components/InsightsView';
import { AccountingView } from './components/AccountingView';
import { StaffView } from './components/StaffView';
import { TicketingView } from './components/TicketingView';
import { VisaEventsView } from './components/VisaEventsView';
import { CashLogView } from './components/CashLogView';
import { SettingsView } from './components/SettingsView';
import { AddClientModal } from './components/AddClientModal';
import { CommandPalette } from './components/CommandPalette';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BriefcaseBusiness,
  AlertTriangle,
  Activity,
  type LucideIcon,
  FileStack,
  UserPlus,
  Wallet,
  ChevronRight,
  FileText,
  TrendingUp,
  Sparkles,
  Inbox
} from 'lucide-react';

const DashboardView = () => {
  const { currency, convertForDisplay, openAddClientModal, setIsLogCashEntryModalOpen, setCurrentTab, isLogCashEntryModalOpen } = useAppContext();
  const { 
    clients, 
    expiringHolds, 
    visas, 
    investors,
    capitalInjections,
    generateFormalPeriodReport
  } = useClientsContext();
  
  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'ETB': return 'Br';
      case 'SAR': return 'SR';
      default: return '$';
    }
  };

  const symbol = getCurrencySymbol(currency);

  // 1. Urgent Action Calculations
  const now = Date.now();
  const currentDate = new Date();
  
  const urgentHolds = useMemo(() => 
    expiringHolds.filter(hold => {
      const ttl = new Date(hold.ticketingTimeLimit).getTime();
      return ttl - now < 12 * 60 * 60 * 1000;
    }), [expiringHolds, now]);

  const priorityVisaAlerts = useMemo(() =>
    visas
      .filter(v => v.status !== 'APPROVED' && v.status !== 'REJECTED')
      .filter(v => {
        const deadline = new Date(v.documentDeadline).getTime();
        return deadline >= now && deadline - now <= 48 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.documentDeadline).getTime() - new Date(b.documentDeadline).getTime()),
    [visas, now]
  );

  const passportWarnings = useMemo(() => 
    clients.filter(c => {
      const expiry = new Date(c.expiryDate).getTime();
      return expiry - now < 6 * 30 * 24 * 60 * 60 * 1000;
    }), [clients, now]);

  const currentMonthReport = useMemo(
    () => generateFormalPeriodReport(currentDate.getMonth(), currentDate.getFullYear()),
    [generateFormalPeriodReport, currentDate]
  );

  const totalAUM = useMemo(
    () =>
      capitalInjections.reduce(
        (sum, injection) => sum + convertForDisplay(injection.amount, 'USD'),
        0
      ),
    [capitalInjections, convertForDisplay]
  );

  interface DashboardKpi {
    label: string;
    value: string;
    helper: string;
    icon: LucideIcon;
    iconClass: string;
  }

  const stats: DashboardKpi[] = useMemo(() => [
    {
      label: 'Active Visa Cases',
      value: visas.filter(v => v.status !== 'APPROVED' && v.status !== 'REJECTED').length.toString(),
      helper: 'Open processing pipeline',
      icon: FileStack,
      iconClass: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      label: 'Total AUM',
      value: `${symbol}${totalAUM.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      helper: `${investors.length} investors`,
      icon: BriefcaseBusiness,
      iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    },
    {
      label: 'Monthly Revenue',
      value: `${symbol}${currentMonthReport.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      helper: `${new Date().toLocaleString('default', { month: 'long' })} · verified formal ledger`,
      icon: Wallet,
      iconClass: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
      label: 'Urgent Alerts',
      value: priorityVisaAlerts.length.toString(),
      helper: 'Deadlines within 48 hours',
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-600 border-amber-100'
    }
  ], [visas, symbol, totalAUM, investors.length, currentMonthReport.totalRevenue, priorityVisaAlerts.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-20 relative"
    >
      {/* 1. Urgent Action Ribbon — or calm “all clear” state */}
      <div className="relative overflow-hidden">
        {urgentHolds.length > 0 || priorityVisaAlerts.length > 0 || passportWarnings.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar snap-x">
            {urgentHolds.map(hold => (
              <div key={hold.id} className="flex-shrink-0 snap-start glass-panel border-rose-200/40 px-4 py-3 rounded-2xl flex items-center gap-3 interactive-tap">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-bold text-rose-800">PNR {hold.pnr} expiring soon</span>
              </div>
            ))}
            {priorityVisaAlerts.map(visa => (
              <div key={visa.id} className="flex-shrink-0 snap-start glass-panel border-amber-200/40 px-4 py-3 rounded-2xl flex items-center gap-3 interactive-tap">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-amber-800">Visa deadline: {visa.destinationCountry}</span>
              </div>
            ))}
            {passportWarnings.map(client => (
              <div key={client.id} className="flex-shrink-0 snap-start glass-panel border-indigo-200/40 px-4 py-3 rounded-2xl flex items-center gap-3 interactive-tap">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-xs font-bold text-indigo-800">Passport expiry: {client.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-3xl px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 border-emerald-100/40">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 w-fit">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">You&apos;re all caught up</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">No urgent holds, visa deadlines in the next 48 hours, or passport warnings. Excellent work keeping the desk clear.</p>
            </div>
          </div>
        )}
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">Command Center</h2>
          <p className="text-slate-500 mt-1.5 font-medium text-sm md:text-base">Real-time intelligence for Dar Al Safar operations.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const urgentPulse = stat.label === 'Urgent Alerts' && Number(stat.value) > 0;
          return (
          <motion.div 
            key={i}
            variants={itemVariants}
            className={`glass-card p-6 border-white/25 shadow-lg group ${urgentPulse ? 'pulse-urgent-kpi ring-2 ring-amber-400/30' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl border ${stat.iconClass} transition-transform duration-300 group-hover:scale-105`}>
                <stat.icon size={20} />
              </div>
              <ChevronRight className="text-slate-300 group-hover:text-emerald-500 transition-colors duration-300" size={16} />
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
            <p className="text-xs text-slate-500 mt-2 font-medium">{stat.helper}</p>
          </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Financial Snapshot & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            variants={itemVariants}
            className="glass-card p-8 md:p-10 border-white/25 shadow-xl"
          >
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Financial Performance</h3>
                <p className="text-sm text-slate-500 font-medium">Revenue vs. Operating Expenses</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Revenue</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Expenses</span>
                </div>
              </div>
            </div>
            
            {/* Simple CSS Bar Chart */}
            <div className="h-48 flex items-end gap-8 px-4">
              {/* Mocking some monthly data based on current stats */}
              {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex gap-1 items-end h-full">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 100}%` }}
                      className="flex-1 bg-emerald-500/80 rounded-t-lg group-hover:bg-emerald-500 transition-colors"
                    />
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${val * 40}%` }}
                      className="flex-1 bg-rose-500/80 rounded-t-lg group-hover:bg-rose-500 transition-colors"
                    />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            className="glass-card p-8 md:p-10 border-white/25 shadow-xl"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">Recent Bookings</h3>
              <button 
                onClick={() => setCurrentTab('ticketing')}
                className="text-xs font-black text-active-green uppercase tracking-widest hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-4">
              {priorityVisaAlerts.slice(0, 4).map((visa) => {
                const client = clients.find(c => c.id === visa.clientId);
                return (
                  <div key={visa.id} className="flex items-center justify-between p-5 rounded-3xl hover:bg-white/60 transition-all duration-300 cursor-pointer group border border-transparent hover:border-white/40 interactive-tap">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-active-green/10 group-hover:text-active-green transition-all text-xl">
                        {client?.name[0] || 'V'}
                      </div>
                      <div>
                        <p className="text-base font-black text-slate-900">{client?.name || 'Unknown Client'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-bold">
                          <FileText size={12} />
                          <span>{visa.visaType}</span>
                          <span className="mx-1">•</span>
                          <span>{visa.destinationCountry}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-slate-900">{new Date(visa.documentDeadline).toLocaleDateString()}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-md ${
                        visa.status === 'GATHERING_DOCS' ? 'bg-amber-500/10 text-amber-600' :
                        visa.status === 'READY_TO_SUBMIT' ? 'bg-sky-500/10 text-sky-600' :
                        visa.status === 'IN_PROCESSING' ? 'bg-indigo-500/10 text-indigo-600' :
                        visa.status === 'ACTION_REQUIRED' ? 'bg-rose-500/10 text-rose-600' :
                        visa.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600' :
                        visa.status === 'REJECTED' ? 'bg-rose-700/10 text-rose-700' : 'text-slate-400'
                      }`}>
                        {visa.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
              {priorityVisaAlerts.length === 0 && (
                <div className="p-10 text-center glass-panel rounded-3xl border-dashed border-white/40">
                  <Inbox className="mx-auto text-emerald-500/50 mb-4" size={36} strokeWidth={1.25} />
                  <p className="text-sm font-bold text-slate-800">No pending visas in this lane</p>
                  <p className="text-xs text-slate-500 mt-2 font-medium max-w-sm mx-auto">Nothing due in the next 48 hours — great job. Open the Visa desk anytime to get ahead on new filings.</p>
                  <button
                    type="button"
                    onClick={() => setCurrentTab('visa')}
                    className="mt-6 text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 interactive-tap"
                  >
                    Go to Visa Desk
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* 3. Today's Concierge List */}
        <motion.div 
          variants={itemVariants}
          className="glass-card p-8 md:p-10 h-fit border-white/25 shadow-xl"
        >
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900">Priority Visa Alerts</h3>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl border border-amber-200">
              <AlertTriangle size={18} />
            </div>
          </div>
          
          <div className="space-y-8">
            {priorityVisaAlerts.length > 0 ? priorityVisaAlerts.map((visa) => {
              const client = clients.find(c => c.id === visa.clientId);
              return (
                <div key={visa.id} className="relative pl-8 border-l-2 border-slate-100 pb-2">
                  <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-amber-500" />
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                        Due {new Date(visa.documentDeadline).toLocaleDateString()}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {visa.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900">{visa.destinationCountry} • {visa.visaType}</p>
                    <p className="text-xs text-slate-400 font-bold">{client?.name}</p>
                    <button
                      onClick={() => setCurrentTab('visa')}
                      className="mt-3 flex items-center gap-1 text-[10px] font-black text-active-green uppercase tracking-widest hover:gap-2 transition-all"
                    >
                      Open Visa Desk <ChevronRight size={10} />
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="text-center py-12 px-4 glass-panel rounded-3xl border-white/30">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600">
                  <FileStack size={28} />
                </div>
                <p className="text-sm font-bold text-slate-800">No pending visas — great job!</p>
                <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">Your concierge queue is quiet. Use the time for proactive outreach or prep the next luxury itinerary.</p>
              </div>
            )}
          </div>

          <div className="mt-10 p-8 glass-panel rounded-3xl border-emerald-200/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp size={64} />
            </div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Intelligence Tip</p>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {priorityVisaAlerts.length > 0
                ? `${priorityVisaAlerts.length} visa cases require immediate document follow-up before deadline.`
                : 'No urgent visa escalations detected. Team can focus on proactive client outreach and upsell opportunities.'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* 4. Quick Action Palette */}
      <div className="glass-card p-8 border-white/25">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-slate-900">Quick Actions</h3>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Most used</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            type="button"
            onClick={() => setCurrentTab('visa')}
            className="flex items-center justify-between px-5 py-4 rounded-3xl glass-panel border-white/30 interactive-tap"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <FileText size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">New Visa</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isLogCashEntryModalOpen) setIsLogCashEntryModalOpen(true);
              setCurrentTab('cashlog');
            }}
            className="flex items-center justify-between px-5 py-4 rounded-3xl glass-panel border-white/30 interactive-tap"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Activity size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">Log Cash Entry</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => openAddClientModal()}
            className="flex items-center justify-between px-5 py-4 rounded-3xl glass-panel border-white/30 interactive-tap"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <UserPlus size={18} />
              </div>
              <span className="text-sm font-bold text-slate-900">Add Client</span>
            </div>
            <ChevronRight size={16} className="text-slate-400" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const ViewPlaceholder = ({ title }: { title: string }) => (
  <div className="h-full flex flex-col items-center justify-center text-center py-20">
    <div className="w-24 h-24 bg-active-green/5 rounded-full flex items-center justify-center mb-6">
      <Activity size={40} className="text-active-green/20" />
    </div>
    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
    <p className="text-slate-500 mt-2 max-w-sm">This module is currently being optimized for the Dar Al Safar travel concierge experience.</p>
    <button className="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-semibold hover:bg-slate-800 transition-all">
      Back to Dashboard
    </button>
  </div>
);

function AppContent() {
  const location = useLocation();
  const { currentTab, setCurrentTab, isAddClientModalOpen, setIsAddClientModalOpen } = useAppContext();
  const { hasPermission } = useUser();

  useEffect(() => {
    const path = (location.pathname.replace(/\/$/, '') || '/').toLowerCase();
    if (path === '/settings') {
      setCurrentTab('settings');
    }
  }, [location.pathname, setCurrentTab]);

  useEffect(() => {
    if (!hasPermission(currentTab, 'view')) {
      const next = PRIMARY_TAB_ORDER.find((t) => hasPermission(t, 'view'));
      if (next) setCurrentTab(next);
    }
  }, [currentTab, hasPermission, setCurrentTab]);

  const renderView = () => {
    switch (currentTab) {
      case 'dashboard': return <DashboardView />;
      case 'ticketing': return <TicketingView />;
      case 'clients': return <ClientPortfolio />;
      case 'accounting': return <AccountingView />;
      case 'staff': return <StaffView />;
      case 'visa': return <VisaEventsView />;
      case 'insights': return <InsightsView />;
      case 'cashlog': return <CashLogView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <>
      <Layout currentTab={currentTab} setTab={setCurrentTab}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <AddClientModal
        isOpen={isAddClientModalOpen}
        onClose={() => setIsAddClientModalOpen(() => false)}
      />
    </>
  );
}

function SupabaseConfigScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--app-shell-bg)]">
      <div className="glass-panel max-w-md rounded-2xl p-8 text-center text-slate-600 text-sm shadow-xl border-white/30">
        {message}
      </div>
    </div>
  );
}

function LoginRoute() {
  const { session, loading } = useAuth();
  if (!isSupabaseConfigured()) {
    return (
      <SupabaseConfigScreen message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server." />
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--app-shell-bg)]">
        <div className="glass-panel rounded-2xl px-8 py-6 text-slate-600 text-sm font-medium border-white/30">
          Checking session…
        </div>
      </div>
    );
  }
  if (session) {
    return <Navigate to="/" replace />;
  }
  return <LoginView />;
}

function ForgotPasswordRoute() {
  const { session, loading } = useAuth();
  if (!isSupabaseConfigured()) {
    return (
      <SupabaseConfigScreen message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server." />
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--app-shell-bg)]">
        <div className="glass-panel rounded-2xl px-8 py-6 text-slate-600 text-sm font-medium border-white/30">
          Checking session…
        </div>
      </div>
    );
  }
  if (session) {
    return <Navigate to="/" replace />;
  }
  return <ForgotPasswordView />;
}

function ProtectedApp() {
  const { session, loading, requiresPasswordUpdate, clearPasswordUpdateRequirement } = useAuth();
  if (!isSupabaseConfigured()) {
    return (
      <SupabaseConfigScreen message="Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env, then restart the dev server." />
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--app-shell-bg)]">
        <div className="glass-panel rounded-2xl px-8 py-6 text-slate-600 text-sm font-medium border-white/30">
          Signing in…
        </div>
      </div>
    );
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <AppProvider>
      <UserProvider session={session}>
        <CommandPalette />
        <AppContent />
        <UpdatePasswordModal
          isOpen={requiresPasswordUpdate}
          onSuccess={clearPasswordUpdateRequirement}
        />
      </UserProvider>
    </AppProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/forgot-password" element={<ForgotPasswordRoute />} />
          <Route path="/*" element={<ProtectedApp />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
