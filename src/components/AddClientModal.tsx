import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, CreditCard, Calendar, Phone, Globe, FileText } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const { addClient } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passportID: '',
    nationality: '',
    expiryDate: '',
    contact: '',
    source: 'Direct',
    notes: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.passportID || !formData.expiryDate || !formData.nationality) {
      setError('Name, Passport ID, Nationality, and Expiry Date are required.');
      return;
    }
    
    addClient(formData);
    setFormData({
      name: '',
      email: '',
      passportID: '',
      nationality: '',
      expiryDate: '',
      contact: '',
      source: 'Direct',
      notes: ''
    });
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Client</h3>
                <p className="text-xs text-slate-500 mt-1">Register a new traveler to the DASA database.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                <div className="p-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Ahmed Ali"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ahmed@example.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Passport ID</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.passportID}
                      onChange={(e) => setFormData({ ...formData, passportID: e.target.value })}
                      placeholder="e.g. EP123456"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Nationality</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="e.g. Ethiopian"
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Passport Expiry</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="tel"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="+251 ..."
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Lead Source</label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                    >
                      <option>Direct</option>
                      <option>Referral</option>
                      <option>Website</option>
                      <option>Instagram</option>
                      <option>Facebook</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Internal Notes</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-slate-400" size={16} />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add specific travel preferences or VIP status..."
                    rows={3}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-3.5 bg-active-green text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
                >
                  Save Client
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
