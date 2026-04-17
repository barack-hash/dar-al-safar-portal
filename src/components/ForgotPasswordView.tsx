import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const ForgotPasswordView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

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
    if (!isSupabaseConfigured()) {
      toast.error('Supabase is not configured', {
        description: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env and restart the dev server.',
      });
      return;
    }
    if (!email.trim()) {
      toast.error('Enter your email');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        if (hasExpiredOrInvalidLinkMessage(error.message)) {
          toast.error('Could not send reset email', {
            description: 'This link has expired or is invalid. Please request a new one.',
          });
          return;
        }
        toast.error('Could not send reset email', { description: error.message });
        return;
      }
      toast.success('Check your email for the reset link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[var(--app-shell-bg)]">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[45%] h-[45%] rounded-full bg-teal-400/15 blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-panel rounded-3xl border-white/30 shadow-2xl p-8 sm:p-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mt-2">
              Enter your account email
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="forgot-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/40 bg-white/50 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/25 hover:bg-emerald-600 disabled:opacity-60 disabled:pointer-events-none transition-colors"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/login')}
            disabled={isSubmitting}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/40 bg-white/40 text-sm font-semibold text-slate-700 hover:bg-white/60 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
};
