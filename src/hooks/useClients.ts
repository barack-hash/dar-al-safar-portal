import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Client, Invoice, InvoiceStatus } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { getSupabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  clientFromRow,
  clientToInsert,
  invoiceFromRow,
  invoiceToInsert,
  type ClientRow,
  type InvoiceRow,
} from '../lib/supabaseMaps';

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
    notes: 'Prefers luxury suites in AlUla.',
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
    notes: 'Frequent business traveler.',
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
    notes: 'Interested in cultural tours.',
  },
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
      { id: '2', description: 'Private Desert Tour', amount: 500 },
    ],
    subtotal: 4000,
    conciergeFee: 200,
    total: 4200,
    currency: 'USD',
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
    items: [{ id: '1', description: 'Business Class Flight - NYC to Riyadh', amount: 3666.67 }],
    subtotal: 3666.67,
    conciergeFee: 183.33,
    total: 3850,
    currency: 'USD',
  },
];

export function useClients() {
  const supabaseMode = isSupabaseConfigured();

  const [clientsLocal, setClientsLocal] = useLocalStorage<Client[]>('dasa_clients', MOCK_CLIENTS);
  const [invoicesLocal, setInvoicesLocal] = useLocalStorage<Invoice[]>('dasa_invoices', MOCK_INVOICES);

  const [clientsRemote, setClientsRemote] = useState<Client[]>([]);
  const [invoicesRemote, setInvoicesRemote] = useState<Invoice[]>([]);

  const clients = supabaseMode ? clientsRemote : clientsLocal;
  const invoices = supabaseMode ? invoicesRemote : invoicesLocal;

  useEffect(() => {
    if (!supabaseMode) return;
    let cancelled = false;
    void (async () => {
      try {
        const sb = getSupabase();
        const [{ data: cRows, error: cErr }, { data: iRows, error: iErr }] = await Promise.all([
          sb.from('clients').select('*').returns<ClientRow[]>(),
          sb.from('invoices').select('*').returns<InvoiceRow[]>(),
        ]);
        if (cancelled) return;
        if (cErr) throw cErr;
        if (iErr) throw iErr;
        setClientsRemote((cRows ?? []).map(clientFromRow));
        setInvoicesRemote((iRows ?? []).map(invoiceFromRow));
      } catch (e) {
        console.error(e);
        toast.error('Could not load clients from Supabase', {
          description: e instanceof Error ? e.message : 'Check schema, RLS, and network.',
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabaseMode]);

  const addClient = useCallback(
    async (newClient: Omit<Client, 'id'>): Promise<Client> => {
      const clientWithId: Client = {
        ...newClient,
        id: Math.random().toString(36).substring(2, 11),
      };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('clients').insert(clientToInsert(clientWithId));
          if (error) throw error;
          setClientsRemote((prev) => [clientWithId, ...prev]);
        } catch (e) {
          console.error(e);
          toast.error('Could not add client', { description: e instanceof Error ? e.message : undefined });
          throw e;
        }
      } else {
        setClientsLocal((prev) => [clientWithId, ...prev]);
      }
      toast.success('Client Added', {
        description: `${newClient.name} has been successfully registered.`,
      });
      return clientWithId;
    },
    [supabaseMode, setClientsLocal]
  );

  const updateClient = useCallback(
    async (id: string, updatedClient: Partial<Client>) => {
      const next = clients.find((c) => c.id === id);
      if (!next) return;
      const merged: Client = { ...next, ...updatedClient };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('clients').update(clientToInsert(merged)).eq('id', id);
          if (error) throw error;
          setClientsRemote((prev) => prev.map((c) => (c.id === id ? merged : c)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update client', { description: e instanceof Error ? e.message : undefined });
          return;
        }
      } else {
        setClientsLocal((prev) => prev.map((client) => (client.id === id ? merged : client)));
      }
      toast.info('Client Updated', {
        description: 'The client information has been updated.',
      });
    },
    [supabaseMode, clients, setClientsLocal]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('clients').delete().eq('id', id);
          if (error) throw error;
          setClientsRemote((prev) => prev.filter((client) => client.id !== id));
          setInvoicesRemote((prev) => prev.filter((inv) => inv.clientId !== id));
        } catch (e) {
          console.error(e);
          toast.error('Could not delete client', { description: e instanceof Error ? e.message : undefined });
          return;
        }
      } else {
        setClientsLocal((prev) => prev.filter((client) => client.id !== id));
      }
      toast.error('Client Deleted', {
        description: 'The client has been removed from the database.',
      });
    },
    [supabaseMode, setClientsLocal]
  );

  const addInvoice = useCallback(
    async (newInvoice: Omit<Invoice, 'id'>) => {
      const invoiceWithId: Invoice = {
        ...newInvoice,
        id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('invoices').insert(invoiceToInsert(invoiceWithId));
          if (error) throw error;
          setInvoicesRemote((prev) => [invoiceWithId, ...prev]);
        } catch (e) {
          console.error(e);
          toast.error('Could not create invoice', { description: e instanceof Error ? e.message : undefined });
          return;
        }
      } else {
        setInvoicesLocal((prev) => [invoiceWithId, ...prev]);
      }
      toast.success('Invoice Created', {
        description: `Invoice ${invoiceWithId.id} has been generated.`,
      });
    },
    [supabaseMode, setInvoicesLocal]
  );

  const updateInvoiceStatus = useCallback(
    async (id: string, status: InvoiceStatus) => {
      const inv = invoices.find((i) => i.id === id);
      if (!inv) return;
      const updated: Invoice = { ...inv, status };
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('invoices').update({ status }).eq('id', id);
          if (error) throw error;
          setInvoicesRemote((prev) => prev.map((i) => (i.id === id ? updated : i)));
        } catch (e) {
          console.error(e);
          toast.error('Could not update invoice', { description: e instanceof Error ? e.message : undefined });
          return;
        }
      } else {
        setInvoicesLocal((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
      toast.info('Invoice Updated', {
        description: `Status changed to ${status}.`,
      });
    },
    [supabaseMode, invoices, setInvoicesLocal]
  );

  const deleteInvoice = useCallback(
    async (id: string) => {
      if (supabaseMode) {
        try {
          const sb = getSupabase();
          const { error } = await sb.from('invoices').delete().eq('id', id);
          if (error) throw error;
          setInvoicesRemote((prev) => prev.filter((inv) => inv.id !== id));
        } catch (e) {
          console.error(e);
          toast.error('Could not delete invoice', { description: e instanceof Error ? e.message : undefined });
          return;
        }
      } else {
        setInvoicesLocal((prev) => prev.filter((inv) => inv.id !== id));
      }
      toast.error('Invoice Deleted', {
        description: 'The invoice has been removed.',
      });
    },
    [supabaseMode, setInvoicesLocal]
  );

  useEffect(() => {
    const checkExpiringPassports = () => {
      const currentDate = new Date('2026-03-24');
      const threeMonthsFromNow = new Date(currentDate);
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      const sixMonthsFromNow = new Date(currentDate);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

      clients.forEach((client) => {
        if (!client.expiryDate?.trim()) return;
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
    deleteInvoice,
  };
}
