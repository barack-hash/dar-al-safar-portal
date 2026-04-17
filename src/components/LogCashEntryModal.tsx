import React from 'react';
import { useAppContext } from '../contexts/AppContext';
import { QuickCashEntryDrawer } from './cash/QuickCashEntryDrawer';

interface LogCashEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Backward-compatible wrapper while older call sites still use modal naming.
 */
export const LogCashEntryModal: React.FC<LogCashEntryModalProps> = ({ isOpen, onClose }) => {
  const { clients, addCashLogEntry } = useAppContext();
  return (
    <QuickCashEntryDrawer
      isOpen={isOpen}
      onClose={onClose}
      clients={clients}
      addCashLogEntry={addCashLogEntry}
    />
  );
};
