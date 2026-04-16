import React from 'react';
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  Settings, 
  LogOut, 
  Compass,
  BookOpen,
  Calendar,
  Edit3,
  ListTodo,
  ShieldCheck,
  Activity,
  X
} from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { motion } from 'motion/react';

const NavItem: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
    active 
      ? 'bg-sand-gold text-charcoal font-medium' 
      : 'text-off-white/60 hover:bg-white/5 hover:text-off-white'
  }`}>
    {icon}
    <span className="text-sm tracking-wide">{label}</span>
  </button>
);

export const Sidebar: React.FC<{ currentView: string; setView: (view: any) => void; onClose?: () => void }> = ({ currentView, setView, onClose }) => {
  const { logout, isAdmin, isViewer, effectiveAccessRole } = useUser();

  return (
    <div className="w-72 h-screen glass-dark flex flex-col p-6 sticky top-0">
      <div className="mb-12 px-2 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light tracking-[0.2em] text-off-white">DASA</h2>
          <div className="h-px w-12 bg-sand-gold mt-2" />
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-off-white/60 hover:text-off-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-2">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={currentView === 'dashboard'} onClick={() => setView('dashboard')} />
        <NavItem icon={<Compass size={20} />} label="Destinations" />
        
        {!isViewer && (
          <NavItem icon={<Edit3 size={20} />} label="Workspace" active={currentView === 'workspace'} onClick={() => setView('workspace')} />
        )}
        
        <NavItem icon={<BookOpen size={20} />} label="Editorial" active={currentView === 'editorial'} onClick={() => setView('editorial')} />
        
        {effectiveAccessRole === 'AGENT' && !isAdmin && (
          <NavItem icon={<ListTodo size={20} />} label="My Assignments" active={currentView === 'assignments'} onClick={() => setView('assignments')} />
        )}
        
        <NavItem icon={<Calendar size={20} />} label="Bookings" />
        
        {isAdmin && (
          <>
            <div className="pt-8 pb-2 px-4 text-[10px] uppercase tracking-[0.2em] text-off-white/30">Management</div>
            <NavItem icon={<Users size={20} />} label="User Management" active={currentView === 'users'} onClick={() => setView('users')} />
            <NavItem icon={<Activity size={20} />} label="System Logs" active={currentView === 'logs'} onClick={() => setView('logs')} />
            <NavItem icon={<Settings size={20} />} label="System Settings" />
          </>
        )}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/10">
        <button 
          onClick={() => void logout()}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
        >
          <LogOut size={20} />
          <span className="text-sm tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
};
