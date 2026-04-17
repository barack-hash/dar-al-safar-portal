import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '../lib/supabaseClient';

type Props = {
  isOpen: boolean;
  onSuccess: () => void;
};

export const UpdatePasswordModal: React.FC<Props> = ({ isOpen, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExpiredOrInvalidLinkMessage = (message: string): boolean => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes('expired') ||
      normalized.includes('invalid') ||
      normalized.includes('otp') ||
      normalized.includes('token') ||
      normalized.includes('recovery') ||
      normalized.includes('invite')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password too short', {
        description: 'Use at least 8 characters for better account security.',
      });
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match', {
        description: 'Re-enter both fields so they are identical.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await getSupabase().auth.updateUser({ password });
      if (error) {
        if (hasExpiredOrInvalidLinkMessage(error.message)) {
          toast.error('Could not update password', {
            description: 'This link has expired or is invalid. Please request a new one.',
          });
          return;
        }
        toast.error('Could not update password', { description: error.message });
        return;
      }
      toast.success('Password updated successfully');
      setPassword('');
      setConfirmPassword('');
      onSuccess();
    } finally {
      setIsSubmitting(false);
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
            className="fixed inset-0 z-[190] bg-slate-900/45 backdrop-blur-sm"
            aria-hidden
          />
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[191] flex items-center justify-center p-6"
          >
            <div className="w-full max-w-md glass-panel rounded-3xl border-white/30 shadow-2xl p-8 sm:p-10">
              <div className="text-center mb-6">
                <div className="mx-auto mb-3 inline-flex p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Set Your Password</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  Choose a secure password before entering the portal.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="new-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/40 bg-white/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/40 bg-white/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      placeholder="Re-enter password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
};
