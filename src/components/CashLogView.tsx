import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  MoreVertical, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { CashLogEntry, CashLogStatus, Currency } from '../types';
import { LogCashEntryModal } from './LogCashEntryModal';

export const CashLogView: React.FC = () => {
  const { 
    cashLog, 
    isLogCashEntryModalOpen, 
    setIsLogCashEntryModalOpen,
    searchQuery,
    currency,
    convertForDisplay
  } = useAppContext();

  const filteredLog = useMemo(() => {
    return cashLog.filter(entry => 
      entry.clientEntity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.staff.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.service.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [cashLog, searchQuery]);

  const stats = useMemo(() => {
    const totalIn = filteredLog.reduce(
      (sum, entry) => sum + convertForDisplay(entry.moneyIn, entry.currency),
      0
    );
    const totalOut = filteredLog.reduce(
      (sum, entry) => sum + convertForDisplay(entry.moneyOut, entry.currency),
      0
    );
    const pending = filteredLog.filter(e => e.status === 'Pending').length;
    return { totalIn, totalOut, pending };
  }, [filteredLog, convertForDisplay]);

  const sym = currency === 'ETB' ? 'Br' : currency === 'SAR' ? 'SR' : '$';

  const getStatusIcon = (status: CashLogStatus) => {
    switch (status) {
      case 'Cleared': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'Pending': return <Clock size={14} className="text-amber-500" />;
      case 'Overdue': return <AlertCircle size={14} className="text-rose-500" />;
    }
  };

  const getStatusStyle = (status: CashLogStatus) => {
    switch (status) {
      case 'Cleared': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Pending': return 'bg-amber-50 text-amber-700 border-amber-100';
      case 'Overdue': return 'bg-rose-50 text-rose-700 border-rose-100';
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cash Log</h2>
          <p className="text-slate-500 mt-1 font-medium">Internal ledger for rapid transaction tracking.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <Download size={20} />
          </button>
          <button 
            onClick={() => setIsLogCashEntryModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
          >
            <Plus size={20} />
            Log Cash Entry
          </button>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Money In</p>
            <p className="text-2xl font-bold text-slate-900">{sym}{stats.totalIn.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Money Out</p>
            <p className="text-2xl font-bold text-slate-900">{sym}{stats.totalOut.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Entries</p>
            <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date & ID</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client / Entity</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Service & Description</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Money In</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Money Out</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Method</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Staff</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLog.length > 0 ? filteredLog.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900">{entry.date}</span>
                      <span className="text-[10px] font-medium text-slate-400 font-mono">{entry.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-700">{entry.clientEntity}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col max-w-xs">
                      <span className="text-sm font-bold text-slate-900 truncate">{entry.service}</span>
                      <span className="text-xs text-slate-500 truncate">{entry.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {entry.moneyIn > 0 ? (
                      <span className="text-sm font-bold text-emerald-600">
                        +{convertForDisplay(entry.moneyIn, entry.currency).toLocaleString()} <span className="text-[10px] opacity-60">{sym}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {entry.moneyOut > 0 ? (
                      <span className="text-sm font-bold text-rose-600">
                        -{convertForDisplay(entry.moneyOut, entry.currency).toLocaleString()} <span className="text-[10px] opacity-60">{sym}</span>
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                      {entry.method}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-medium text-slate-600">{entry.staff}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(entry.status)}`}>
                      {getStatusIcon(entry.status)}
                      {entry.status}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Calendar size={32} />
                      </div>
                      <p className="text-slate-500 font-medium">No cash entries found.</p>
                      <button 
                        onClick={() => setIsLogCashEntryModalOpen(true)}
                        className="text-sm font-bold text-active-green hover:underline"
                      >
                        Log your first entry
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal rendered at bottom */}
      <LogCashEntryModal 
        isOpen={isLogCashEntryModalOpen} 
        onClose={() => setIsLogCashEntryModalOpen(false)} 
      />
    </div>
  );
};
