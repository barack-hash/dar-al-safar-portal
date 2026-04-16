import React, { useState } from 'react';
import { Bell, Search, Menu, AlertCircle, Clock } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { ACCESS_ROLE_LABEL } from '../lib/appSettings';
import { useClientsContext } from '../contexts/AppContext';
import { motion, AnimatePresence } from 'motion/react';

export const TopNav: React.FC = () => {
  const { user, effectiveAccessRole } = useUser();
  const { expiringHolds, urgentVisas, clients } = useClientsContext();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const totalNotifications = expiringHolds.length + urgentVisas.length;

  return (
    <div className="h-20 flex items-center justify-between flex-1 bg-transparent">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
          <input 
            type="text" 
            placeholder="Search itineraries, clients, or destinations..."
            className="w-full pl-10 pr-4 py-2 bg-charcoal/5 border-none rounded-full text-sm focus:ring-1 focus:ring-sand-gold transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-full transition-all ${isNotificationsOpen ? 'bg-sand-gold/10 text-sand-gold' : 'text-charcoal/60 hover:text-charcoal hover:bg-charcoal/5'}`}
          >
            <Bell size={20} />
            {totalNotifications > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-sand-gold rounded-full border-2 border-off-white" />
            )}
          </button>

          <AnimatePresence>
            {isNotificationsOpen && (
              <>
                <div 
                  className="fixed inset-0 z-[60]" 
                  onClick={() => setIsNotificationsOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-slate-100 py-4 z-[70] overflow-hidden"
                >
                  <div className="px-6 pb-3 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Notifications</h3>
                    <span className="px-2 py-0.5 bg-sand-gold/10 text-sand-gold rounded-full text-[10px] font-bold">
                      {totalNotifications} New
                    </span>
                  </div>

                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {totalNotifications > 0 ? (
                      <div className="divide-y divide-slate-50">
                        {expiringHolds.map((hold) => {
                          const client = clients.find(c => c.id === hold.clientId);
                          const hoursRemaining = Math.max(0, Math.round((new Date(hold.ticketingTimeLimit).getTime() - new Date().getTime()) / (1000 * 60 * 60)));
                          
                          return (
                            <div key={hold.id} className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                              <div className="flex gap-3">
                                <div className="p-2 bg-amber-50 text-amber-500 rounded-xl group-hover:bg-amber-100 transition-colors">
                                  <Clock size={16} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-900">Hold Expiring Soon</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    PNR <span className="font-bold text-slate-700">{hold.pnr}</span> for {client?.name || 'Unknown Client'} expires in {hoursRemaining}h.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {urgentVisas.map((visa) => {
                          const client = clients.find(c => c.id === visa.clientId);
                          return (
                            <div key={visa.id} className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                              <div className="flex gap-3">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-xl group-hover:bg-blue-100 transition-colors">
                                  <AlertCircle size={16} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs font-bold text-slate-900">Visa Action Required</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">
                                    {visa.destinationCountry} {visa.visaType} for {client?.name || 'Unknown Client'} is in <span className="font-bold text-slate-700">{visa.status.replace('_', ' ')}</span>.
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                          <Bell size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-900">All caught up!</p>
                        <p className="text-xs text-slate-400 mt-1">No new notifications at the moment.</p>
                      </div>
                    )}
                  </div>

                  <div className="px-6 pt-3 border-t border-slate-50">
                    <button className="w-full py-2 text-xs font-bold text-slate-400 hover:text-sand-gold transition-colors uppercase tracking-widest">
                      View All Alerts
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
        
        <div className="h-8 w-px bg-charcoal/10" />

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-charcoal">{user.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-sand-gold font-semibold">
              {ACCESS_ROLE_LABEL[effectiveAccessRole]}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-sand-gold/30 p-0.5">
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
