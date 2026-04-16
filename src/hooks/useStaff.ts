import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Employee } from '../types';
import { toast } from 'sonner';

const MOCK_STAFF: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Abebe Bikila',
    role: 'Operations Manager',
    baseSalary: 15000,
    tinNumber: '1234567890',
    startDate: '2024-01-01',
    paymentFrequency: 'MONTHLY',
    applyPension: true,
    applyIncomeTax: true
  },
  {
    id: 'EMP-002',
    name: 'Tigist Assefa',
    role: 'Travel Consultant',
    baseSalary: 8500,
    tinNumber: '0987654321',
    startDate: '2024-06-15',
    paymentFrequency: 'MONTHLY',
    applyPension: true,
    applyIncomeTax: true
  },
  {
    id: 'EMP-003',
    name: 'Mulugeta Tesfaye',
    role: 'Concierge',
    baseSalary: 6200,
    tinNumber: '1122334455',
    startDate: '2025-01-10',
    paymentFrequency: 'MONTHLY',
    applyPension: true,
    applyIncomeTax: true
  }
];

export function useStaff() {
  const [employees, setEmployees] = useLocalStorage<Employee[]>('dasa_staff', MOCK_STAFF);

  const addEmployee = useCallback((data: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...data,
      id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setEmployees(prev => [...prev, newEmployee]);
    toast.success('Employee Added', {
      description: `${data.name} has been added to the staff registry.`
    });
  }, [setEmployees]);

  const deleteEmployee = useCallback((id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    toast.info('Employee Removed');
  }, [setEmployees]);

  const updateEmployee = useCallback((id: string, data: Partial<Employee>) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, ...data } : emp));
    toast.success('Employee Updated');
  }, [setEmployees]);

  return {
    employees,
    addEmployee,
    deleteEmployee,
    updateEmployee
  };
}
