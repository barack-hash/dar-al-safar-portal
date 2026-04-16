import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Client, Invoice, InvoiceStatus } from '../types';
import { useLocalStorage } from './useLocalStorage';

const MOCK_CLIENTS: Client[] = [
  {
    id: '1',
    name: 'Sarah Al-Farsi',
    email: 'sarah.farsi@example.com',
    passportID: 'SA1234567',
    nationality: 'Saudi Arabia',
    expiryDate: '2026-09-15',
    contact: '+966 50 123 4567',
    source: 'Referral',
    notes: 'Prefers luxury suites in AlUla.'
  },
  {
    id: '2',
    name: 'Johnathan Vance',
    email: 'j.vance@global.com',
    passportID: 'US9876543',
    nationality: 'United States',
    expiryDate: '2025-12-01',
    contact: '+1 212 555 0198',
    source: 'Website',
    notes: 'Frequent business traveler.'
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    email: 'elena.r@madrid.es',
    passportID: 'ES4567890',
    nationality: 'Spain',
    expiryDate: '2028-05-20',
    contact: '+34 91 123 4567',
    source: 'Instagram',
    notes: 'Interested in cultural tours.'
  }
];

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'INV-001',
    clientId: '1',
    clientName: 'Sarah Al-Farsi',
    passportID: 'SA1234567',
    contact: '+966 50 123 4567',
    date: '2026-03-20',
    dueDate: '2026-04-20',
    status: 'Paid',
    items: [
      { id: '1', description: 'Luxury Suite - AlUla (3 Nights)', amount: 3500 },
      { id: '2', description: 'Private Desert Tour', amount: 500 }
    ],
    subtotal: 4000,
    conciergeFee: 200,
    total: 4200,
    currency: 'USD'
  },
  {
    id: 'INV-002',
    clientId: '2',
    clientName: 'Johnathan Vance',
    passportID: 'US9876543',
    contact: '+1 212 555 0198',
    date: '2026-03-22',
    dueDate: '2026-04-05',
    status: 'Pending',
    items: [
      { id: '1', description: 'Business Class Flight - NYC to Riyadh', amount: 3666.67 }
    ],
    subtotal: 3666.67,
    conciergeFee: 183.33,
    total: 3850,
    currency: 'USD'
  }
];

export function useClients() {
  const [clients, setClients] = useLocalStorage<Client[]>('dasa_clients', MOCK_CLIENTS);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('dasa_invoices', MOCK_INVOICES);

  const addClient = useCallback((newClient: Omit<Client, 'id'>) => {
    const clientWithId = {
      ...newClient,
      id: Math.random().toString(36).substr(2, 9)
    };
    setClients(prev => [clientWithId, ...prev]);
    toast.success('Client Added', {
      description: `${newClient.name} has been successfully registered.`
    });
    return clientWithId;
  }, [setClients]);

  const updateClient = useCallback((id: string, updatedClient: Partial<Client>) => {
    setClients(prev => prev.map(client => 
      client.id === id ? { ...client, ...updatedClient } : client
    ));
    toast.info('Client Updated', {
      description: 'The client information has been updated.'
    });
  }, [setClients]);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => prev.filter(client => client.id !== id));
    toast.error('Client Deleted', {
      description: 'The client has been removed from the database.'
    });
  }, [setClients]);

  const addInvoice = useCallback((newInvoice: Omit<Invoice, 'id'>) => {
    const invoiceWithId = {
      ...newInvoice,
      id: `INV-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setInvoices(prev => [invoiceWithId, ...prev]);
    toast.success('Invoice Created', {
      description: `Invoice ${invoiceWithId.id} has been generated.`
    });
  }, [setInvoices]);

  const updateInvoiceStatus = useCallback((id: string, status: InvoiceStatus) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === id ? { ...inv, status } : inv
    ));
    toast.info('Invoice Updated', {
      description: `Status changed to ${status}.`
    });
  }, [setInvoices]);

  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.error('Invoice Deleted', {
      description: 'The invoice has been removed.'
    });
  }, [setInvoices]);

  useEffect(() => {
    const checkExpiringPassports = () => {
      const currentDate = new Date('2026-03-24');
      const threeMonthsFromNow = new Date(currentDate);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const sixMonthsFromNow = new Date(currentDate);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      clients.forEach(client => {
        const expiry = new Date(client.expiryDate);
        if (expiry >= currentDate && expiry <= threeMonthsFromNow) {
          toast.warning(`Critical: Passport Expiring Soon`, {
            description: `${client.name}'s passport expires in less than 3 months (${client.expiryDate}).`,
            duration: 8000,
          });
        } else if (expiry > threeMonthsFromNow && expiry <= sixMonthsFromNow) {
          toast.info(`Passport Renewal Reminder`, {
            description: `${client.name}'s passport expires in less than 6 months (${client.expiryDate}).`,
            duration: 6000,
          });
        }
      });
    };

    checkExpiringPassports();
    // Only run on mount to avoid spamming toasts when updating client notes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    clients,
    addClient,
    updateClient,
    deleteClient,
    invoices,
    addInvoice,
    updateInvoiceStatus,
    deleteInvoice
  };
}
