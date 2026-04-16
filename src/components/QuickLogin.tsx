import React from 'react';
import { motion } from 'motion/react';
import { LogIn, User as UserIcon, Shield, Briefcase } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { MOCK_USERS, User } from '../types';

export const QuickLogin: React.FC = () => {
  const { login } = useUser();

  const getIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return <Shield className="w-5 h-5" />;
      case 'AGENT': return <Briefcase className="w-5 h-5" />;
      default: return <UserIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sand-gold/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-sand-gold/5 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark p-12 rounded-3xl w-full max-w-md text-center relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-light tracking-widest text-off-white mb-2">DAR AL SAFAR</h1>
          <p className="text-sand-gold text-sm uppercase tracking-widest">Editorial Concierge Portal</p>
        </div>

        <div className="space-y-4">
          <p className="text-off-white/60 text-xs uppercase tracking-widest mb-6">Select Access Role</p>
          {MOCK_USERS.map((user: User) => (
            <button
              key={user.id}
              onClick={() => login(user)}
              className="w-full group flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-sand-gold/20 border border-white/10 hover:border-sand-gold/50 transition-all duration-300 text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                  <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-off-white font-medium">{user.name}</p>
                  <p className="text-off-white/40 text-xs">{user.role}</p>
                </div>
              </div>
              <div className="text-sand-gold opacity-0 group-hover:opacity-100 transition-opacity">
                {getIcon(user.role)}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 text-off-white/20 text-[10px] uppercase tracking-[0.2em]">
          Desert Modern Design System v1.0
        </div>
      </motion.div>
    </div>
  );
};
