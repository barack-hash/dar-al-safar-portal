import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, FileText } from 'lucide-react';
import { Invoice, InvoiceItem, Client } from '../types';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  addInvoice: (invoice: Omit<Invoice, 'id'>) => void;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({ isOpen, onClose, clients, addInvoice }) => {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: crypto.randomUUID(), description: '', amount: 0 }]);
  const [dueDate, setDueDate] = useState('');

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId),
  [clients, selectedClientId]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const conciergeFee = subtotal * 0.05;
    const total = subtotal + conciergeFee;
    return { subtotal, conciergeFee, total };
  }, [items]);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), description: '', amount: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof Omit<InvoiceItem, 'id'>, value: string | number) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    const newInvoice: Omit<Invoice, 'id'> = {
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      passportID: selectedClient.passportID,
      contact: selectedClient.contact,
      date: new Date().toISOString().split('T')[0],
      dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      items: items,
      subtotal: totals.subtotal,
      conciergeFee: totals.conciergeFee,
      total: totals.total,
      currency: 'USD'
    };

    addInvoice(newInvoice);
    onClose();
    setSelectedClientId('');
    setItems([{ id: crypto.randomUUID(), description: '', amount: 0 }]);
    setDueDate('');
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Create New Invoice</h3>
              <p className="text-sm text-slate-500 mt-1">Generate a professional billing statement.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client Information</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Select Client</label>
                  <select
                    required
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all appearance-none"
                  >
                    <option value="">Choose a client...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Line Items</label>
                <button type="button" onClick={handleAddItem} className="text-xs font-bold text-active-green hover:underline flex items-center gap-1">
                  <Plus size={14} /> Add Item
                </button>
              </div>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 group">
                    <input
                      type="text"
                      placeholder="Description"
                      required
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      className="flex-1 px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                    <input
                      type="number"
                      placeholder="0.00"
                      required
                      min="0"
                      step="0.01"
                      value={item.amount || ''}
                      onChange={(e) => handleItemChange(item.id, 'amount', parseFloat(e.target.value))}
                      className="w-32 px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal</span>
                <span className="font-bold">${totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Concierge Fee (5%)</span>
                <span className="font-bold text-active-gold">+${totals.conciergeFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-end">
                <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Total Amount</span>
                <span className="text-3xl font-bold text-white">${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </form>

          <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all">Cancel</button>
            <button onClick={handleSubmit} className="flex-2 px-12 py-4 bg-active-green text-white rounded-2xl font-bold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all">Generate Invoice</button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
