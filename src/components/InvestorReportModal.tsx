import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Printer, ShieldCheck, Briefcase, Globe } from 'lucide-react';
import { Investor, CapitalInjection, Currency } from '../types';

interface InvestorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: Investor;
  injections: CapitalInjection[];
  currency: Currency;
  convertForDisplay: (amount: number, sourceCurrency: Currency) => number;
}

const INJECTION_BOOK_CURRENCY: Currency = 'USD';

export const InvestorReportModal: React.FC<InvestorReportModalProps> = ({
  isOpen,
  onClose,
  investor,
  injections,
  currency,
  convertForDisplay
}) => {
  if (!isOpen) return null;

  const totalInjected = injections.reduce(
    (sum, ci) => sum + convertForDisplay(ci.amount, INJECTION_BOOK_CURRENCY),
    0
  );
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-md print:bg-white print:p-0">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white w-full h-full md:w-[210mm] md:h-[297mm] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col print:shadow-none print:rounded-none print:w-full print:h-auto print:static"
        >
          {/* Header - Hidden on Print */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white print:hidden">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-active-green/10 text-active-green rounded-xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Investor Digital Agreement</h3>
                <p className="text-xs text-slate-500">Official Capital Ledger & Equity Statement</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
              >
                <Printer size={18} />
                Print / PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Document Content */}
          <div className="flex-1 overflow-y-auto p-12 md:p-20 space-y-12 print:overflow-visible print:p-12 print:text-black print:bg-white">
            {/* Logo & Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-active-green tracking-tight">Dar Al Safar</h1>
                <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold mt-1">Travel Concierge</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document ID</p>
                <p className="text-sm font-mono font-bold text-slate-900">DASA-INV-{investor.id}-{new Date().getFullYear()}</p>
              </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Investor Info */}
            <div className="grid grid-cols-2 gap-12">
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Investor Details</p>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-slate-900">{investor.name}</h2>
                  <p className="text-slate-500">{investor.contact}</p>
                  <p className="text-slate-500">{investor.nationality}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Equity Position</p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl font-bold text-active-green">{investor.equityPercentage}%</span>
                  <span className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Ownership</span>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-6">
              <div className="p-6 bg-slate-50 rounded-3xl space-y-2 print:border print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Injected</p>
                <p className="text-2xl font-bold text-slate-900">
                  {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                  {totalInjected.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl space-y-2 print:border print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">KYC Status</p>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${investor.kycStatus === 'VERIFIED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">{investor.kycStatus}</p>
                </div>
              </div>
              <div className="p-6 bg-slate-50 rounded-3xl space-y-2 print:border print:border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source of Funds</p>
                <p className="text-sm font-bold text-slate-900">{investor.sourceOfFunds}</p>
              </div>
            </div>

            {/* Mini Ledger */}
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Capital Injection History</h4>
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                    <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Purpose</th>
                    <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</th>
                    <th className="py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {injections.map((ci) => (
                    <tr key={ci.id}>
                      <td className="py-4 text-sm font-medium text-slate-600">{ci.date}</td>
                      <td className="py-4 text-sm font-bold text-slate-900">{ci.allocationPurpose}</td>
                      <td className="py-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ci.type}</span>
                      </td>
                      <td className="py-4 text-sm font-bold text-slate-900 text-right">
                        {currency === 'USD' ? '$' : currency === 'SAR' ? 'SR' : 'Br'}
                        {convertForDisplay(ci.amount, INJECTION_BOOK_CURRENCY).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="pt-20 space-y-12">
              <div className="grid grid-cols-2 gap-20">
                <div className="space-y-8">
                  <div className="h-px bg-slate-300 w-full" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Investor Signature</p>
                </div>
                <div className="space-y-8">
                  <div className="h-px bg-slate-300 w-full" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Dar Al Safar Compliance</p>
                </div>
              </div>

              <div className="text-center space-y-2 pt-12">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Official Capital Ledger as of {currentDate}</p>
                <p className="text-[9px] text-slate-300 max-w-md mx-auto">
                  This document is a digital representation of the equity holdings within Dar Al Safar Travel Concierge. 
                  It is subject to the terms and conditions of the primary Partnership Agreement.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body > *:not(.print-container) {
            display: none !important;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
          }
          @page {
            size: A4;
            margin: 0;
          }
          .print-hidden {
            display: none !important;
          }
        }
      `}} />
    </AnimatePresence>
  );
};
