import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

export const DashboardLayout: React.FC<{ children: React.ReactNode; currentView: string; setView: (view: any) => void }> = ({ children, currentView, setView }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-off-white relative overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-500 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          currentView={currentView} 
          setView={(v) => { setView(v); setIsSidebarOpen(false); }} 
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-off-white/80 backdrop-blur-md border-b border-charcoal/5">
          <div className="flex items-center px-4 lg:px-8">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 lg:hidden text-charcoal/60 hover:text-charcoal"
            >
              <Menu size={24} />
            </button>
            <TopNav />
          </div>
        </header>

        <main className="p-4 lg:p-8 flex-1 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
