import React from 'react';
import { useUI, useClientsContext } from '../contexts/AppContext';
import { 
  UserPlus, 
  Download, 
  MoreVertical, 
  AlertCircle, 
  AlertTriangle,
  Mail,
  Phone,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { motion } from 'motion/react';

import { Client } from '../types';
import { ClientProfileDrawer } from './ClientProfileDrawer';


interface ClientRowProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onViewProfile: (client: Client) => void;
  currentDate: Date;
  isActive: boolean;
  onToggleDropdown: (id: string | null) => void;
}

const ClientRow: React.FC<ClientRowProps> = React.memo(({ client, onEdit, onDelete, onViewProfile, currentDate, isActive, onToggleDropdown }) => {
  const getPassportStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - currentDate.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

    if (diffTime < 0) {
      return {
        status: 'expired',
        icon: <AlertCircle size={16} className="text-red-500" />,
        label: 'Expired'
      };
    } else if (diffMonths < 6) {
      return {
        status: 'warning',
        icon: <AlertTriangle size={16} className="text-amber-500" />,
        label: 'Expiring Soon'
      };
    }
    return null;
  };

  const passportStatus = getPassportStatus(client.expiryDate);

  return (
    <motion.tr 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="hover:bg-active-green/[0.03] transition-colors group"
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-active-green/5 flex items-center justify-center text-active-green font-bold text-sm">
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{client.name}</span>
              {passportStatus?.status === 'expired' && passportStatus.icon}
            </div>
            <span className="text-xs text-slate-400">{client.email}</span>
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate-700">{client.passportID}</p>
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              passportStatus?.status === 'expired' ? 'text-red-500' : 
              passportStatus?.status === 'warning' ? 'text-amber-500' : 'text-slate-400'
            }`}>
              Expires: {client.expiryDate}
            </span>
            {passportStatus?.status === 'warning' && passportStatus.icon}
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone size={12} className="text-slate-400" />
            {client.contact}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Mail size={12} className="text-slate-400" />
            {client.email}
          </div>
        </div>
      </td>
      <td className="px-6 py-5">
        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
          {client.source}
        </span>
      </td>
      <td className="px-6 py-5">
        <p className="text-xs text-slate-500 max-w-[200px] truncate" title={client.notes}>
          {client.notes}
        </p>
      </td>
      <td className="px-6 py-5 text-right relative">
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => onToggleDropdown(isActive ? null : client.id)}
            className={`p-2 rounded-lg transition-all ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'}`}
          >
            <MoreVertical size={16} />
          </button>

          {isActive && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => onToggleDropdown(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-6 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20"
              >
                <button
                  onClick={() => {
                    onViewProfile(client);
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Eye size={14} className="text-emerald-500" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    onEdit(client);
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 size={14} className="text-slate-400" />
                  Edit Client
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                      onDelete(client.id);
                    }
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} className="text-red-400" />
                  Delete Client
                </button>
              </motion.div>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
});

const ClientCard: React.FC<ClientRowProps> = React.memo(({ client, onEdit, onDelete, onViewProfile, currentDate, isActive, onToggleDropdown }) => {
  const getPassportStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - currentDate.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);

    if (diffTime < 0) {
      return {
        status: 'expired',
        icon: <AlertCircle size={16} className="text-red-500" />,
        label: 'Expired'
      };
    } else if (diffMonths < 6) {
      return {
        status: 'warning',
        icon: <AlertTriangle size={16} className="text-amber-500" />,
        label: 'Expiring Soon'
      };
    }
    return null;
  };

  const passportStatus = getPassportStatus(client.expiryDate);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-active-green/5 flex items-center justify-center text-active-green font-bold text-sm">
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">{client.name}</span>
              {passportStatus?.status === 'expired' && passportStatus.icon}
            </div>
            <span className="text-xs text-slate-400">{client.email}</span>
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => onToggleDropdown(isActive ? null : client.id)}
            className={`p-2 rounded-lg transition-all ${isActive ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}
          >
            <MoreVertical size={18} />
          </button>

          {isActive && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => onToggleDropdown(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-20"
              >
                <button
                  onClick={() => {
                    onViewProfile(client);
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2"
                >
                  <Eye size={14} className="text-emerald-500" />
                  View Profile
                </button>
                <button
                  onClick={() => {
                    onEdit(client);
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Edit2 size={14} className="text-slate-400" />
                  Edit Client
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete ${client.name}?`)) {
                      onDelete(client.id);
                    }
                    onToggleDropdown(null);
                  }}
                  className="w-full px-4 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 size={14} className="text-red-400" />
                  Delete Client
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Passport</p>
          <p className="text-xs font-medium text-slate-700">{client.passportID}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-bold ${
              passportStatus?.status === 'expired' ? 'text-red-500' : 
              passportStatus?.status === 'warning' ? 'text-amber-500' : 'text-slate-400'
            }`}>
              {client.expiryDate}
            </span>
            {passportStatus?.status === 'warning' && passportStatus.icon}
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Source</p>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {client.source}
          </span>
        </div>
      </div>

      <div className="pt-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Contact</p>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Phone size={12} className="text-slate-400" />
            {client.contact}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={() => onViewProfile(client)}
          className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all"
        >
          Profile
        </button>
        <button 
          onClick={() => onDelete(client.id)}
          className="flex-1 py-2 bg-red-50 text-red-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition-all"
        >
          Delete
        </button>
      </div>
    </div>
  );
});

export const ClientPortfolio: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    debouncedSearchQuery,
    currency,
    openAddClientModal,
    clientsSourceFilter,
    setClientsSourceFilter,
  } = useUI();
  const { clients, deleteClient, updateClient, cashLog } = useClientsContext();
  const [activeDropdownId, setActiveDropdownId] = React.useState<string | null>(null);
  const [profileClient, setProfileClient] = React.useState<Client | null>(null);
  const currentDate = new Date('2026-03-24');

  const filteredClients = clients.filter((client) => {
    if (clientsSourceFilter !== null && client.source !== clientsSourceFilter) {
      return false;
    }
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      client.name.toLowerCase().includes(q) ||
      client.email.toLowerCase().includes(q) ||
      client.passportID.toLowerCase().includes(q) ||
      client.contact.toLowerCase().includes(q) ||
      client.source.toLowerCase().includes(q) ||
      client.notes.toLowerCase().includes(q)
    );
  });

  const getCurrencySymbol = (curr: string) => {
    switch (curr) {
      case 'ETB': return 'Br';
      case 'SAR': return 'SR';
      default: return '$';
    }
  };

  const exportClientsCSV = () => {
    const headers = ['Name', 'Email', 'Passport ID', 'Expiry Date', 'Contact', 'Source', 'Notes'];
    const rows = filteredClients.map(client => [
      client.name,
      client.email,
      client.passportID,
      client.expiryDate,
      client.contact,
      client.source,
      client.notes
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DASA_Clients_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Client Portfolio</h2>
          <p className="text-slate-500 mt-1">Manage and monitor your global traveler database.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={exportClientsCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            <Download size={18} />
            Export CSV
          </button>
          <button 
            type="button"
            onClick={() => openAddClientModal()}
            className="flex items-center gap-2 px-6 py-2.5 bg-active-green text-white rounded-2xl text-sm font-semibold shadow-lg shadow-active-green/20 hover:bg-active-green/90 transition-all"
          >
            <UserPlus size={18} />
            Add New Client
          </button>
        </div>
      </header>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email or passport..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-2 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-active-green/20 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {clientsSourceFilter !== null && (
              <button
                type="button"
                onClick={() => setClientsSourceFilter(null)}
                className="flex items-center gap-2 px-4 py-2 text-rose-700 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold hover:bg-rose-100/80 transition-colors"
              >
                Clear Filter
              </button>
            )}
            <button type="button" className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Client Name</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Passport Info</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Contact</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Source</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100">Notes</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.map((client) => (
                <ClientRow 
                  key={client.id} 
                  client={client} 
                  onEdit={(c) => {
                    // Placeholder for edit functionality
                    console.log('Edit client:', c);
                  }}
                  onViewProfile={setProfileClient}
                  onDelete={deleteClient} 
                  currentDate={currentDate} 
                  isActive={activeDropdownId === client.id}
                  onToggleDropdown={setActiveDropdownId}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredClients.map((client) => (
            <ClientCard 
              key={client.id} 
              client={client} 
              onEdit={(c) => {
                // Placeholder for edit functionality
                console.log('Edit client:', c);
              }}
              onViewProfile={setProfileClient}
              onDelete={deleteClient} 
              currentDate={currentDate} 
              isActive={activeDropdownId === client.id}
              onToggleDropdown={setActiveDropdownId}
            />
          ))}
        </div>

        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Showing {filteredClients.length} of {clients.length} clients
            {clientsSourceFilter !== null ? ` · Source: ${clientsSourceFilter}` : ''}
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-bold uppercase tracking-widest disabled:opacity-50" disabled>Previous</button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-900 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Next</button>
          </div>
        </div>
      </div>
      <ClientProfileDrawer
        isOpen={Boolean(profileClient)}
        client={profileClient}
        relatedClients={
          profileClient?.familyGroupId
            ? clients.filter((c) => c.familyGroupId === profileClient.familyGroupId && c.id !== profileClient.id)
            : []
        }
        onUpdateClient={updateClient}
        informalHistory={
          profileClient
            ? cashLog.filter((entry) => entry.linkedClientId === profileClient.id)
            : []
        }
        onClientUpdated={(updated) =>
          setProfileClient((prev) => (prev ? { ...prev, ...updated } : prev))
        }
        onClose={() => setProfileClient(null)}
      />
    </div>
  );
};
