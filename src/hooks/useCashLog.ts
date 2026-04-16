import { useState, useCallback } from 'react';
import { CashLogEntry } from '../types';
import { useLocalStorage } from './useLocalStorage';

export const useCashLog = () => {
  const [cashLog, setCashLog] = useLocalStorage<CashLogEntry[]>('dasa_cash_log', []);

  const addCashLogEntry = useCallback((entry: Omit<CashLogEntry, 'id'>) => {
    const newEntry: CashLogEntry = {
      ...entry,
      id: `CL-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
    setCashLog(prev => [newEntry, ...prev]);
    return newEntry;
  }, [setCashLog]);

  const updateCashLogEntry = useCallback((id: string, updates: Partial<CashLogEntry>) => {
    setCashLog(prev => prev.map(entry => entry.id === id ? { ...entry, ...updates } : entry));
  }, [setCashLog]);

  const deleteCashLogEntry = useCallback((id: string) => {
    setCashLog(prev => prev.filter(entry => entry.id !== id));
  }, [setCashLog]);

  return {
    cashLog,
    addCashLogEntry,
    updateCashLogEntry,
    deleteCashLogEntry
  };
};
