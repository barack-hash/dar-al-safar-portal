import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Mail, CreditCard, Calendar, Phone, Globe, FileText, Shield, Users, Plus, Trash2 } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { uploadClientDocument, validateE164 } from '../lib/clientDocuments';
import type { FrequentFlyerNumber } from '../types';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose }) => {
  const { addClient, updateClient } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    passportID: '',
    nationality: '',
    expiryDate: '',
    contact: '',
    source: 'Direct',
    notes: '',
    dateOfBirth: '',
    phoneE164: '',
    ethiopianNationalID: '',
    familyGroupId: '',
  });
  const [frequentFlyerNumbers, setFrequentFlyerNumbers] = useState<FrequentFlyerNumber[]>([
    { airline: '', number: '' },
  ]);
  const [passportScan, setPassportScan] = useState<File | null>(null);
  const [nationalIdScan, setNationalIdScan] = useState<File | null>(null);
  const [birthCertificateScan, setBirthCertificateScan] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!formData.name || !formData.passportID || !formData.expiryDate || !formData.nationality) {
      setError('Name, Passport ID, Nationality, and Expiry Date are required.');
      return;
    }
    if (!validateE164(formData.phoneE164)) {
      setError('Phone must be in E.164 format, e.g. +251912345678.');
      return;
    }
    try {
      setIsSubmitting(true);
      const filteredFf = frequentFlyerNumbers.filter((ff) => ff.airline.trim() && ff.number.trim());
      const created = await addClient({
        ...formData,
        phoneE164: formData.phoneE164.trim(),
        dateOfBirth: formData.dateOfBirth || '',
        ethiopianNationalID: formData.ethiopianNationalID.trim(),
        familyGroupId: formData.familyGroupId.trim(),
        frequentFlyerNumbers: filteredFf,
      });

      const documentUpdates: Record<string, string> = {};
      if (passportScan) {
        documentUpdates.passportScanUrl = await uploadClientDocument({
          clientId: created.id,
          docType: 'passport',
          file: passportScan,
        });
      }
      if (nationalIdScan) {
        documentUpdates.nationalIdScanUrl = await uploadClientDocument({
          clientId: created.id,
          docType: 'national-id',
          file: nationalIdScan,
        });
      }
      if (birthCertificateScan) {
        documentUpdates.birthCertificateUrl = await uploadClientDocument({
          clientId: created.id,
          docType: 'birth-certificate',
          file: birthCertificateScan,
        });
      }
      if (Object.keys(documentUpdates).length > 0) {
        await updateClient(created.id, documentUpdates);
      }
      setFormData({
        name: '',
        email: '',
        passportID: '',
        nationality: '',
        expiryDate: '',
        contact: '',
        source: 'Direct',
        notes: '',
        dateOfBirth: '',
        phoneE164: '',
        ethiopianNationalID: '',
        familyGroupId: '',
      });
      setFrequentFlyerNumbers([{ airline: '', number: '' }]);
      setPassportScan(null);
      setNationalIdScan(null);
      setBirthCertificateScan(null);
      setError('');
      onClose();
    } catch {
      /* toast from hook */
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
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
            className="relative w-full max-w-3xl glass-panel rounded-3xl border-white/30 shadow-2xl overflow-hidden max-h-[92vh]"
          >
            <div className="p-6 border-b border-white/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Add New Client</h3>
                <p className="text-xs text-slate-500 mt-1">Register a new traveler to the DASA database.</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-white/60 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[78vh]">
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
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
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all appearance-none"
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Date of Birth</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Phone (E.164)</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.phoneE164}
                      onChange={(e) => setFormData({ ...formData, phoneE164: e.target.value })}
                      placeholder="+251912345678"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Ethiopian National ID</label>
                  <div className="relative">
                    <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.ethiopianNationalID}
                      onChange={(e) => setFormData({ ...formData, ethiopianNationalID: e.target.value })}
                      placeholder="Fayda / National ID"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Family Group ID</label>
                  <div className="relative">
                    <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={formData.familyGroupId}
                      onChange={(e) => setFormData({ ...formData, familyGroupId: e.target.value })}
                      placeholder="UUID (optional)"
                      disabled={isSubmitting}
                      className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Frequent Flyer Numbers</label>
                  <button
                    type="button"
                    onClick={() => setFrequentFlyerNumbers((prev) => [...prev, { airline: '', number: '' }])}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {frequentFlyerNumbers.map((ff, idx) => (
                    <div key={`${idx}-${ff.airline}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                      <input
                        type="text"
                        placeholder="Airline (e.g. ET)"
                        value={ff.airline}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFrequentFlyerNumbers((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, airline: e.target.value } : row))
                          )
                        }
                        className="px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <input
                        type="text"
                        placeholder="Membership number"
                        value={ff.number}
                        disabled={isSubmitting}
                        onChange={(e) =>
                          setFrequentFlyerNumbers((prev) =>
                            prev.map((row, i) => (i === idx ? { ...row, number: e.target.value } : row))
                          )
                        }
                        className="px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <button
                        type="button"
                        disabled={isSubmitting || frequentFlyerNumbers.length === 1}
                        onClick={() =>
                          setFrequentFlyerNumbers((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="px-2 py-2 rounded-xl bg-white/50 border border-white/40 text-slate-500 hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Passport Scan</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    onChange={(e) => setPassportScan(e.target.files?.[0] ?? null)}
                    className="w-full px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">National ID Scan</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    onChange={(e) => setNationalIdScan(e.target.files?.[0] ?? null)}
                    className="w-full px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-widest font-bold text-slate-400 ml-1">Birth Certificate</label>
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    disabled={isSubmitting}
                    onChange={(e) => setBirthCertificateScan(e.target.files?.[0] ?? null)}
                    className="w-full px-3 py-2 bg-white/60 border border-white/40 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
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
                    disabled={isSubmitting}
                    className="w-full pl-11 pr-4 py-3 bg-white/60 border border-white/40 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-white/60 text-slate-600 rounded-2xl text-sm font-bold uppercase tracking-widest border border-white/40 hover:bg-white/80 transition-all disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] py-3.5 bg-emerald-500 text-white rounded-2xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-60 disabled:pointer-events-none"
                >
                  {isSubmitting ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
