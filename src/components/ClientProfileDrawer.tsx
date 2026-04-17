import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Calendar, CreditCard, Eye, FileText, Phone, Shield, User, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Client, FrequentFlyerNumber } from '../types';
import { getSignedClientDocumentUrl, uploadClientDocument, validateE164 } from '../lib/clientDocuments';

type Props = {
  isOpen: boolean;
  client: Client | null;
  relatedClients: Client[];
  onUpdateClient: (id: string, updatedClient: Partial<Client>) => void;
  onClientUpdated: (updatedClient: Partial<Client>) => void;
  onClose: () => void;
};

export const ClientProfileDrawer: React.FC<Props> = ({
  isOpen,
  client,
  relatedClients,
  onUpdateClient,
  onClientUpdated,
  onClose,
}) => {
  const [openingDoc, setOpeningDoc] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [phoneE164, setPhoneE164] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [ethiopianNationalID, setEthiopianNationalID] = useState('');
  const [frequentFlyerNumbers, setFrequentFlyerNumbers] = useState<FrequentFlyerNumber[]>([]);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [nationalIdFile, setNationalIdFile] = useState<File | null>(null);
  const [birthCertificateFile, setBirthCertificateFile] = useState<File | null>(null);

  useEffect(() => {
    if (!client) return;
    setPhoneE164(client.phoneE164 || '');
    setDateOfBirth(client.dateOfBirth || '');
    setEthiopianNationalID(client.ethiopianNationalID || '');
    setFrequentFlyerNumbers(
      client.frequentFlyerNumbers && client.frequentFlyerNumbers.length > 0
        ? client.frequentFlyerNumbers
        : [{ airline: '', number: '' }]
    );
    setPassportFile(null);
    setNationalIdFile(null);
    setBirthCertificateFile(null);
    setIsEditing(false);
  }, [client?.id]);

  const passportWarning = useMemo(() => {
    if (!client?.expiryDate) return null;
    const expiry = new Date(client.expiryDate);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.44);
    if (Number.isNaN(diffMs)) return null;
    if (diffMs < 0) return 'Passport expired';
    if (diffMonths < 6) return 'Passport expires in less than 6 months';
    return null;
  }, [client?.expiryDate]);

  const handleOpenDocument = async (label: string, path: string | undefined) => {
    if (!path?.trim()) {
      toast.error('Document not uploaded');
      return;
    }
    setOpeningDoc(label);
    try {
      const signed = await getSignedClientDocumentUrl(path.trim());
      window.open(signed, '_blank', 'noopener,noreferrer');
    } catch (error) {
      toast.error('Could not open document', {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setOpeningDoc(null);
    }
  };

  const documentRows: Array<{ key: string; label: string; path: string | undefined }> = [
    { key: 'passport', label: 'Passport Scan', path: client?.passportScanUrl },
    { key: 'national', label: 'National ID Scan', path: client?.nationalIdScanUrl },
    { key: 'birth', label: 'Birth Certificate', path: client?.birthCertificateUrl },
  ];

  const handleSave = async () => {
    if (!client) return;
    if (!validateE164(phoneE164)) {
      toast.error('Invalid phone format', { description: 'Use E.164 format, e.g. +251912345678.' });
      return;
    }

    setIsSaving(true);
    try {
      const next: Partial<Client> = {
        phoneE164: phoneE164.trim(),
        dateOfBirth: dateOfBirth || '',
        ethiopianNationalID: ethiopianNationalID.trim(),
        frequentFlyerNumbers: frequentFlyerNumbers.filter((ff) => ff.airline.trim() && ff.number.trim()),
      };

      if (passportFile) {
        next.passportScanUrl = await uploadClientDocument({
          clientId: client.id,
          docType: 'passport',
          file: passportFile,
        });
      }
      if (nationalIdFile) {
        next.nationalIdScanUrl = await uploadClientDocument({
          clientId: client.id,
          docType: 'national-id',
          file: nationalIdFile,
        });
      }
      if (birthCertificateFile) {
        next.birthCertificateUrl = await uploadClientDocument({
          clientId: client.id,
          docType: 'birth-certificate',
          file: birthCertificateFile,
        });
      }

      await onUpdateClient(client.id, next);
      onClientUpdated(next);
      setIsEditing(false);
      setPassportFile(null);
      setNationalIdFile(null);
      setBirthCertificateFile(null);
      toast.success('Client profile updated');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && client && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[140] bg-slate-900/45 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[141] h-full w-full max-w-xl border-l border-white/25 shadow-2xl"
          >
            <div className="glass-panel h-full rounded-none border-0 flex flex-col">
              <div className="p-6 border-b border-white/20 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Client Profile</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{client.name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing((prev) => !prev)}
                    className="px-3 py-2 rounded-xl glass-panel border-white/40 text-slate-700 text-xs font-semibold hover:bg-white/80 transition-colors"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-700 transition-colors"
                    aria-label="Close profile"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {passportWarning && (
                  <div className="glass-panel rounded-2xl border-amber-200/50 p-4 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 mt-0.5" size={18} />
                    <div>
                      <p className="text-sm font-bold text-amber-700">Passport Alert</p>
                      <p className="text-xs text-amber-700/80 mt-1">{passportWarning}</p>
                    </div>
                  </div>
                )}

                <section className="glass-panel rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black tracking-widest text-emerald-600 uppercase">Core Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User size={14} className="text-slate-400" />
                      <span>{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone size={14} className="text-slate-400" />
                      {isEditing ? (
                        <input
                          value={phoneE164}
                          onChange={(e) => setPhoneE164(e.target.value)}
                          disabled={isSaving}
                          placeholder="+251912345678"
                          className="w-full px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      ) : (
                        <span>{client.phoneE164 || client.contact || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CreditCard size={14} className="text-slate-400" />
                      <span>{client.passportID || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Shield size={14} className="text-slate-400" />
                      {isEditing ? (
                        <input
                          value={ethiopianNationalID}
                          onChange={(e) => setEthiopianNationalID(e.target.value)}
                          disabled={isSaving}
                          placeholder="National ID"
                          className="w-full px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      ) : (
                        <span>{client.ethiopianNationalID || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      {isEditing ? (
                        <input
                          type="date"
                          value={dateOfBirth}
                          onChange={(e) => setDateOfBirth(e.target.value)}
                          disabled={isSaving}
                          className="w-full px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      ) : (
                        <span>DOB: {client.dateOfBirth || '—'}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar size={14} className="text-slate-400" />
                      <span>Passport Expiry: {client.expiryDate || '—'}</span>
                    </div>
                  </div>
                </section>

                <section className="glass-panel rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black tracking-widest text-emerald-600 uppercase">Travel Documents</h3>
                  <div className="space-y-2">
                    {documentRows.map((doc) => (
                      <div key={doc.key} className="flex items-center justify-between rounded-xl bg-white/50 border border-white/40 px-3 py-2">
                        <div className="flex items-center gap-2 text-sm text-slate-700 w-full">
                          <FileText size={14} className="text-slate-400 shrink-0" />
                          <span className="min-w-[120px]">{doc.label}</span>
                          {isEditing && (
                            <input
                              type="file"
                              accept=".pdf,image/jpeg,image/png,image/webp"
                              disabled={isSaving}
                              onChange={(e) => {
                                const f = e.target.files?.[0] ?? null;
                                if (doc.key === 'passport') setPassportFile(f);
                                if (doc.key === 'national') setNationalIdFile(f);
                                if (doc.key === 'birth') setBirthCertificateFile(f);
                              }}
                              className="ml-2 w-full px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleOpenDocument(doc.label, doc.path)}
                          disabled={!doc.path || openingDoc === doc.label}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        >
                          <Eye size={12} />
                          {openingDoc === doc.label ? 'Opening...' : 'View'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass-panel rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black tracking-widest text-emerald-600 uppercase">Family & Loyalty</h3>
                  <p className="text-xs text-slate-500">Family Group: {client.familyGroupId || '—'}</p>
                  {relatedClients.length > 0 && (
                    <div className="space-y-1">
                      {relatedClients.map((member) => (
                        <p key={member.id} className="text-xs text-slate-700">
                          {member.name}
                        </p>
                      ))}
                    </div>
                  )}
                  <div className="space-y-1">
                    {isEditing ? (
                      <div className="space-y-2">
                        {frequentFlyerNumbers.map((ff, idx) => (
                          <div key={`${idx}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                            <input
                              value={ff.airline}
                              onChange={(e) =>
                                setFrequentFlyerNumbers((prev) =>
                                  prev.map((row, i) => (i === idx ? { ...row, airline: e.target.value } : row))
                                )
                              }
                              disabled={isSaving}
                              placeholder="Airline"
                              className="px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                            <input
                              value={ff.number}
                              onChange={(e) =>
                                setFrequentFlyerNumbers((prev) =>
                                  prev.map((row, i) => (i === idx ? { ...row, number: e.target.value } : row))
                                )
                              }
                              disabled={isSaving}
                              placeholder="Number"
                              className="px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            />
                            <button
                              type="button"
                              disabled={isSaving || frequentFlyerNumbers.length === 1}
                              onClick={() =>
                                setFrequentFlyerNumbers((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="px-2 py-1 rounded-lg border border-white/40 bg-white/60 text-slate-500 hover:text-red-600 disabled:opacity-50"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            setFrequentFlyerNumbers((prev) => [...prev, { airline: '', number: '' }])
                          }
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"
                        >
                          <Plus size={12} />
                          Add Frequent Flyer
                        </button>
                      </div>
                    ) : (client.frequentFlyerNumbers ?? []).length > 0 ? (
                      (client.frequentFlyerNumbers ?? []).map((ff, idx) => (
                        <p key={`${ff.airline}-${ff.number}-${idx}`} className="text-xs text-slate-700">
                          {ff.airline}: {ff.number}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No frequent flyer numbers saved.</p>
                    )}
                  </div>
                </section>
              </div>
              {isEditing && (
                <div className="border-t border-white/20 p-4">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
