import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, User, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { inviteTeamMemberViaApi } from '../lib/staffInviteApi';
import type { PortalInviteRole } from '../lib/portalPermissions';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const AddTeamMemberModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [portalRole, setPortalRole] = useState<PortalInviteRole>('agent');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFullName('');
    setEmail('');
    setPortalRole('agent');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      toast.error('Enter full name and email');
      return;
    }
    setSubmitting(true);
    try {
      const result = await inviteTeamMemberViaApi({
        fullName: fullName.trim(),
        email: email.trim(),
        portalRole,
      });
      if (result.message) {
        toast.success('Profile saved', { description: result.message, duration: 12_000 });
      } else if (result.invited) {
        toast.success('Invitation sent', {
          description: `${email.trim()} will receive an email to set their password.`,
        });
      } else {
        toast.success('Team member added', {
          description: 'Profile updated and linked to their account.',
        });
      }
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Could not add team member', {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] bg-slate-900/45 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 z-[131] h-full w-full max-w-md shadow-2xl flex flex-col border-l border-white/25"
          >
            <div className="glass-panel flex-1 flex flex-col rounded-none border-0 overflow-hidden">
              <div className="p-6 border-b border-white/20 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 tracking-tight">Add team member</h2>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Portal access, role, and permissions (Supabase)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-white/50 hover:text-slate-700 transition-colors"
                  aria-label="Close"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-6 gap-5 overflow-y-auto">
                <div className="space-y-1.5">
                  <label htmlFor="tm-name" className="text-xs font-semibold text-slate-600">
                    Full name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="tm-name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/35 bg-white/55 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="Jane Doe"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tm-email" className="text-xs font-semibold text-slate-600">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="tm-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/35 bg-white/55 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="colleague@company.com"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="tm-role" className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Role
                  </label>
                  <select
                    id="tm-role"
                    value={portalRole}
                    onChange={(e) => setPortalRole(e.target.value as PortalInviteRole)}
                    className="w-full px-4 py-3 rounded-xl border border-white/35 bg-white/55 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Permissions are set automatically from this choice (dashboard, clients, visa, and staff where
                    applicable).
                  </p>
                </div>

                <div className="mt-auto pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-3 rounded-xl border border-white/40 bg-white/40 text-sm font-semibold text-slate-700 hover:bg-white/60 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                  >
                    {submitting ? 'Saving…' : 'Send invite & save profile'}
                  </button>
                </div>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};
